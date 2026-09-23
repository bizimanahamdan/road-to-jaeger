import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LESSONS, SKILLS, TRACKS } from '@/data/curriculum';
import type { Lesson } from '@/lib/types';

/**
 * Keeps `src/data/curriculum/skills.ts` honest about the curriculum.
 *
 * The register is derived, not hand-maintained: every skill exists because some
 * lesson awards it, every awarding lesson is listed in `requiredLessons`, and no
 * stale skill survives the removal of the lesson that granted it. A skill that
 * nothing grants would let the app display progress the learner never earned,
 * which is the one thing this app must not do.
 *
 * The human-readable names are curated in `scripts/skill-names.json` so that
 * regeneration never reverts an edited name.
 *
 * To regenerate the file after authoring new lessons:
 *
 *     REGEN_SKILLS=1 npx vitest run tests/skills-sync.test.ts
 */

const PREFIX_LABEL: Record<string, string> = {
  math: '', madv: '', phys: '', mat: '', ee: '', mcu: 'MCU ', imu: 'IMU ',
  swe: 'Software ', py: 'Python ', dsa: '', tools: '', net: '', c: 'C ',
  cpp: 'C++ ', emb: '', es: '', mech: '', cad: '', ctl: '', rob: '',
  ros2: 'ROS 2 ', perc: '', nav: '', hum: '', sys: '', lrg: '',
};

const ACRONYMS = new Set([
  'adc', 'pwm', 'i2c', 'spi', 'uart', 'imu', 'pid', 'cad', 'cnc', 'dfm', 'dfam', 'api', 'rest',
  'http', 'json', 'ros', 'ros2', 'slam', 'ota', 'mqtt', 'wifi', 'ble', 'git', 'ssh', 'linux',
  'sql', 'raii', 'ode', 'pde', 'snr', 'enob', 'kvl', 'kcl', 'led', 'lcd', 'oled', 'esd', 'fet',
  'bjt', 'ic', 'pcb', 'bom', 'lqr', 'mpc', 'ekf', 'ukf', 'pcl', 'lidar', 'radar', 'gps', 'urdf',
  'tf2', 'nav2', 'gazebo', 'rviz', 'cpp', 'ai', 'ml', 'cnn', 'svm', 'pca', 'knn', 'sgd', 'fsm',
  'hmi', 'fmea', 'mtbf', 'mbse', 'foc', 'bldc', 'esc', 'lipo', 'plc', 'vhdl', 'fpga', 'rtos',
  'swd', 'jtag', 'hal', 'sdk', 'cli', 'csv', 'yaml', 'xml', 'tcp', 'udp', 'tls', 'dns', 'ntp',
  'gnss', 'rqt', 'rosbag', 'colcon', 'ament', 'si', '3d', '2d', 'dof', 'ac', 'dc', 'rms', 'mcu',
  'rc', 'stl', 'step', 'obj', 'dxf', '3mf', 'fea', 'gd', 't',
]);

const SPECIAL: Record<string, string> = {
  numpy: 'NumPy', opencv: 'OpenCV', ohms: 'Ohm', python: 'Python', javascript: 'JavaScript',
};

function loadCuratedNames(): Record<string, string> {
  try {
    return JSON.parse(readFileSync('scripts/skill-names.json', 'utf8')) as Record<string, string>;
  } catch {
    return {};
  }
}

const CURATED = loadCuratedNames();

function humanize(id: string): string {
  if (CURATED[id]) return CURATED[id];
  const parts = id.split('-');
  const first = parts[0];
  const hasPrefix =
    first !== undefined && Object.prototype.hasOwnProperty.call(PREFIX_LABEL, first) && parts.length > 1;
  const label = hasPrefix ? PREFIX_LABEL[first] : '';
  const rest = hasPrefix ? parts.slice(1) : parts;
  const body = rest
    .map((token, i) => {
      if (SPECIAL[token]) return SPECIAL[token];
      if (ACRONYMS.has(token.toLowerCase())) return token.toUpperCase();
      if (i === 0) return token.charAt(0).toUpperCase() + token.slice(1);
      return token;
    })
    .join(' ');
  return `${label}${body}`;
}

const sentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

interface Derived {
  id: string;
  trackId: string;
  lessons: Lesson[];
  objective: string;
}

/**
 * Derives the register from the curriculum. Skills are authored in objective
 * order within each lesson, so the i-th skill a lesson grants is evidenced by
 * its i-th objective - that keeps every description specific rather than a
 * generic restatement of the lesson title.
 */
function derive(): Map<string, Derived> {
  const meta = new Map<string, Derived>();
  for (const l of LESSONS) {
    (l.grantsSkills ?? []).forEach((sid, i) => {
      const obj = l.objectives[Math.min(i, l.objectives.length - 1)];
      const existing = meta.get(sid);
      if (existing) {
        existing.lessons.push(l);
        return;
      }
      meta.set(sid, {
        id: sid,
        trackId: l.trackId,
        lessons: [l],
        objective: obj ? obj.text : l.title,
      });
    });
  }
  return meta;
}

function render(meta: Map<string, Derived>): string {
  const byTrack = new Map<string, string[]>();
  for (const sid of meta.keys()) {
    const t = meta.get(sid)!.trackId;
    byTrack.set(t, [...(byTrack.get(t) ?? []), sid]);
  }
  const out: string[] = [];
  out.push("import type { Skill } from '@/lib/types';");
  out.push('');
  out.push('/**');
  out.push(' * The skill register - derived from the curriculum, not hand-maintained.');
  out.push(' *');
  out.push(' * A skill is not a badge for finishing a lesson. It unlocks only when every');
  out.push(' * lesson in `requiredLessons` reaches MASTERED, and MASTERED itself requires a');
  out.push(' * passed assessment, the required exercises and a written reflection. Each');
  out.push(' * description is the capability the learner must demonstrate, taken from the');
  out.push(' * objectives of the granting lesson, so a skill always states something');
  out.push(' * checkable rather than something decorative.');
  out.push(' *');
  out.push(' * Regenerate after authoring lessons with:');
  out.push(' *   REGEN_SKILLS=1 npx vitest run tests/skills-sync.test.ts');
  out.push(' *');
  out.push(` * ${meta.size} skills across ${byTrack.size} tracks.`);
  out.push(' */');
  out.push('export const SKILLS: Skill[] = [');
  for (const track of TRACKS) {
    const ids = byTrack.get(track.id);
    if (!ids || !ids.length) continue;
    out.push(`  // ${track.name}`);
    for (const sid of ids) {
      const m = meta.get(sid)!;
      out.push('  {');
      out.push(`    id: '${sid}',`);
      out.push(`    name: '${esc(humanize(sid))}',`);
      out.push(`    trackId: '${m.trackId}',`);
      out.push(`    description: '${esc(sentence(m.objective))}',`);
      out.push(`    requiredLessons: [${m.lessons.map((l) => `'${l.id}'`).join(', ')}],`);
      out.push('  },');
    }
    out.push('');
  }
  out.push('];');
  out.push('');
  return out.join('\n');
}

describe('skill register', () => {
  const meta = derive();

  it('registers every skill a lesson grants', () => {
    const missing = [...meta.keys()].filter((id) => !SKILLS.some((s) => s.id === id));
    expect(missing, `unregistered skills: ${missing.join(', ')}`).toEqual([]);
  });

  it('contains no skill that no lesson grants', () => {
    const stale = SKILLS.map((s) => s.id).filter((id) => !meta.has(id));
    expect(stale, `stale skills: ${stale.join(', ')}`).toEqual([]);
  });

  it('lists exactly the lessons that grant each skill', () => {
    for (const s of SKILLS) {
      const expected = meta.get(s.id)?.lessons.map((l) => l.id).sort() ?? [];
      expect([...s.requiredLessons].sort(), `skill ${s.id}`).toEqual(expected);
    }
  });

  it('places each skill on the track of the lessons that grant it', () => {
    for (const s of SKILLS) {
      expect(s.trackId, `skill ${s.id}`).toBe(meta.get(s.id)?.trackId);
    }
  });

  it('gives every skill a non-empty name and description', () => {
    for (const s of SKILLS) {
      expect(s.name.trim().length, `skill ${s.id} name`).toBeGreaterThan(0);
      expect(s.description.trim().length, `skill ${s.id} description`).toBeGreaterThan(10);
    }
  });

  it('is up to date with the curriculum (REGEN_SKILLS=1 to rewrite)', () => {
    const expected = render(meta);
    if (process.env.REGEN_SKILLS === '1') {
      writeFileSync('src/data/curriculum/skills.ts', expected, 'utf8');
      for (const id of meta.keys()) {
        if (!CURATED[id]) CURATED[id] = humanize(id);
      }
      writeFileSync('scripts/skill-names.json', `${JSON.stringify(CURATED, null, 2)}\n`, 'utf8');
      return;
    }
    const actual = readFileSync('src/data/curriculum/skills.ts', 'utf8');
    expect(actual, 'skills.ts is stale - run REGEN_SKILLS=1 npx vitest run tests/skills-sync.test.ts').toBe(expected);
  });
});
