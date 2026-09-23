import { LESSONS, PROJECTS, SKILLS, SUBJECTS, TRACKS } from '@/data/curriculum';
import type {
  Lesson,
  LessonId,
  Project,
  Skill,
  Subject,
  SubjectId,
  Track,
  TrackId,
} from '@/lib/types';

/**
 * Read-only access layer over the compiled curriculum.
 *
 * All lookups are precomputed once at module load. On a low-end phone the cost
 * of building a Map over ~160 lessons is sub-millisecond and it removes every
 * linear scan from the UI path.
 */

const lessonById = new Map<LessonId, Lesson>();
const subjectById = new Map<SubjectId, Subject>();
const trackById = new Map<TrackId, Track>();
const skillById = new Map<string, Skill>();
const projectById = new Map<string, Project>();
const lessonsBySubject = new Map<SubjectId, Lesson[]>();
const subjectsByTrack = new Map<TrackId, Subject[]>();

for (const l of LESSONS) {
  if (lessonById.has(l.id)) throw new Error(`duplicate lesson id: ${l.id}`);
  lessonById.set(l.id, l);
}
for (const s of SUBJECTS) {
  if (subjectById.has(s.id)) throw new Error(`duplicate subject id: ${s.id}`);
  subjectById.set(s.id, s);
  lessonsBySubject.set(s.id, []);
}
for (const t of TRACKS) {
  if (trackById.has(t.id)) throw new Error(`duplicate track id: ${t.id}`);
  trackById.set(t.id, t);
  subjectsByTrack.set(t.id, []);
}
for (const l of LESSONS) {
  lessonsBySubject.get(l.subjectId)?.push(l);
}
for (const s of SUBJECTS) {
  subjectsByTrack.get(s.trackId)?.push(s);
}
for (const sk of SKILLS) skillById.set(sk.id, sk);
for (const p of PROJECTS) projectById.set(p.id, p);

// Deterministic ordering everywhere: track order, subject order, lesson order.
for (const list of lessonsBySubject.values()) {
  list.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
for (const list of subjectsByTrack.values()) {
  list.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function getLesson(id: LessonId): Lesson | undefined {
  return lessonById.get(id);
}

export function requireLesson(id: LessonId): Lesson {
  const l = lessonById.get(id);
  if (!l) throw new Error(`unknown lesson id: ${id}`);
  return l;
}

export function getSubject(id: SubjectId): Subject | undefined {
  return subjectById.get(id);
}

export function getTrack(id: TrackId): Track | undefined {
  return trackById.get(id);
}

export function getSkill(id: string): Skill | undefined {
  return skillById.get(id);
}

export function getProject(id: string): Project | undefined {
  return projectById.get(id);
}

export function allLessons(): Lesson[] {
  return LESSONS;
}

export function allSubjects(): Subject[] {
  return SUBJECTS;
}

export function allTracks(): Track[] {
  return TRACKS;
}

export function allSkills(): Skill[] {
  return SKILLS;
}

export function allProjects(): Project[] {
  return PROJECTS;
}

export function lessonsInSubject(subjectId: SubjectId): Lesson[] {
  return lessonsBySubject.get(subjectId) ?? [];
}

export function subjectsInTrack(trackId: TrackId): Subject[] {
  return subjectsByTrack.get(trackId) ?? [];
}

export function lessonsInTrack(trackId: TrackId): Lesson[] {
  const out: Lesson[] = [];
  for (const s of subjectsInTrack(trackId)) out.push(...lessonsInSubject(s.id));
  return out;
}

/* -------------------------------------------------------------------------- */
/* Dependency graph                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Topological order of all lessons by prerequisite edges.
 *
 * Uses Kahn's algorithm with a deterministic tie-break (track order, subject
 * order, lesson order) so the roadmap renders identically on every device and
 * every run - which also makes it testable.
 */
export function topologicalLessonOrder(): Lesson[] {
  const indegree = new Map<LessonId, number>();
  const dependents = new Map<LessonId, LessonId[]>();

  for (const l of LESSONS) {
    indegree.set(l.id, 0);
    dependents.set(l.id, []);
  }
  for (const l of LESSONS) {
    for (const p of l.prerequisites) {
      if (!lessonById.has(p) || p === l.id) continue;
      indegree.set(l.id, (indegree.get(l.id) ?? 0) + 1);
      dependents.get(p)?.push(l.id);
    }
  }

  const rank = new Map<LessonId, number>();
  for (const l of LESSONS) {
    const t = trackById.get(l.trackId);
    const s = subjectById.get(l.subjectId);
    rank.set(l.id, (t?.order ?? 99) * 1e6 + (s?.order ?? 99) * 1e3 + l.order);
  }

  const ready = LESSONS.filter((l) => (indegree.get(l.id) ?? 0) === 0)
    .map((l) => l.id)
    .sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));

  const out: Lesson[] = [];
  while (ready.length) {
    const id = ready.shift() as LessonId;
    const lesson = lessonById.get(id);
    if (lesson) out.push(lesson);
    for (const dep of dependents.get(id) ?? []) {
      const d = (indegree.get(dep) ?? 1) - 1;
      indegree.set(dep, d);
      if (d === 0) ready.push(dep);
    }
    ready.sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  }
  return out;
}

/** Every lesson that (transitively) depends on `id`. */
export function downstreamLessons(id: LessonId): Lesson[] {
  const seen = new Set<LessonId>();
  const stack: LessonId[] = [id];
  while (stack.length) {
    const cur = stack.pop() as LessonId;
    for (const l of LESSONS) {
      if (l.prerequisites.includes(cur) && !seen.has(l.id)) {
        seen.add(l.id);
        stack.push(l.id);
      }
    }
  }
  return [...seen].map((x) => lessonById.get(x)).filter((x): x is Lesson => Boolean(x));
}

/* -------------------------------------------------------------------------- */
/* Curriculum integrity                                                       */
/* -------------------------------------------------------------------------- */

export interface CurriculumIssue {
  level: 'error' | 'warning';
  message: string;
}

/**
 * Structural validation of the authored curriculum.
 *
 * Run in tests (`tests/curriculum.test.ts`) and by `npm run curriculum:stats`.
 * The rules exist to guarantee the app can never hand out progress it has not
 * earned: every objective must be assessed, every prerequisite must exist and
 * be acyclic, every skill and project reference must resolve.
 */
export function validateCurriculum(): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];
  const error = (m: string) => issues.push({ level: 'error', message: m });
  const warn = (m: string) => issues.push({ level: 'warning', message: m });

  const ids = new Set<LessonId>();
  for (const l of LESSONS) {
    if (ids.has(l.id)) error(`duplicate lesson id "${l.id}"`);
    ids.add(l.id);
  }

  for (const l of LESSONS) {
    if (!subjectById.has(l.subjectId)) error(`${l.id}: unknown subject "${l.subjectId}"`);
    if (!trackById.has(l.trackId)) error(`${l.id}: unknown track "${l.trackId}"`);
    const subject = subjectById.get(l.subjectId);
    if (subject && subject.trackId !== l.trackId) {
      error(`${l.id}: track "${l.trackId}" does not match subject track "${subject.trackId}"`);
    }
    if (!l.title.trim()) error(`${l.id}: empty title`);
    if (!l.description.trim()) error(`${l.id}: empty description`);
    if (!l.whyItMatters.trim()) error(`${l.id}: empty whyItMatters`);
    if (l.estimatedMinutes < 5) warn(`${l.id}: estimatedMinutes ${l.estimatedMinutes} seems too small`);
    if (l.estimatedMinutes > 180) warn(`${l.id}: estimatedMinutes ${l.estimatedMinutes} is long for one sitting`);
    if (!l.objectives.length) error(`${l.id}: no objectives`);
    if (!l.learn.length) error(`${l.id}: no lesson body`);
    if (!l.resources.length) warn(`${l.id}: no resources`);
    if (!l.exercises.length) error(`${l.id}: no exercises`);
    if (l.exercisesRequired > l.exercises.length) {
      error(`${l.id}: exercisesRequired exceeds available exercises`);
    }
    if (!l.assessment.questions.length) error(`${l.id}: empty assessment`);
    if (l.assessment.passScore < 70) {
      error(`${l.id}: passScore ${l.assessment.passScore} is below the 70% floor`);
    }

    for (const o of l.objectives) {
      if (!o.text.trim()) error(`${l.id}: objective ${o.id} has empty text`);
      if (!l.assessment.questions.some((q) => q.objectiveId === o.id)) {
        error(`${l.id}: objective "${o.text}" is never assessed`);
      }
    }

    const questionIds = new Set<string>();
    for (const q of l.assessment.questions) {
      if (questionIds.has(q.id)) error(`${l.id}: duplicate question id ${q.id}`);
      questionIds.add(q.id);
      if (!q.explanation.trim()) error(`${l.id}/${q.id}: missing explanation`);
      if (q.type === 'mcq') {
        if (!q.choices || q.choices.length < 2) error(`${l.id}/${q.id}: mcq needs >= 2 choices`);
        if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.choices?.length ?? 0)) {
          error(`${l.id}/${q.id}: mcq answer index out of range`);
        }
        const unique = new Set(q.choices ?? []);
        if (unique.size !== (q.choices?.length ?? 0)) error(`${l.id}/${q.id}: duplicate choices`);
      }
      if (q.type === 'numeric' && typeof q.answer !== 'number') {
        error(`${l.id}/${q.id}: numeric answer must be a number`);
      }
      if (q.type === 'short' && (!q.answer || (Array.isArray(q.answer) && q.answer.length === 0))) {
        error(`${l.id}/${q.id}: short answer must list accepted answers`);
      }
    }

    const resourceIds = new Set<string>();
    for (const r of l.resources) {
      if (resourceIds.has(r.id)) error(`${l.id}: duplicate resource id ${r.id}`);
      resourceIds.add(r.id);
      if (!/^https?:\/\//i.test(r.url)) error(`${l.id}/${r.id}: resource URL must be http(s): "${r.url}"`);
      if (!r.title.trim()) error(`${l.id}/${r.id}: empty resource title`);
    }

    const exIds = new Set<string>();
    for (const x of l.exercises) {
      if (exIds.has(x.id)) error(`${l.id}: duplicate exercise id ${x.id}`);
      exIds.add(x.id);
      if (x.minutes <= 0) error(`${l.id}/${x.id}: exercise minutes must be positive`);
      if (!x.prompt.trim()) error(`${l.id}/${x.id}: empty exercise prompt`);
    }

    for (const p of l.prerequisites) {
      if (!ids.has(p)) error(`${l.id}: prerequisite "${p}" does not exist`);
      if (p === l.id) error(`${l.id}: lesson is its own prerequisite`);
    }
    for (const sk of l.grantsSkills ?? []) {
      if (!skillById.has(sk)) error(`${l.id}: grants unknown skill "${sk}"`);
    }
  }

  // Cycle detection across the whole prerequisite graph.
  const ordered = topologicalLessonOrder();
  if (ordered.length !== LESSONS.length) {
    const missing = LESSONS.filter((l) => !ordered.some((o) => o.id === l.id)).map((l) => l.id);
    error(`prerequisite cycle detected involving: ${missing.join(', ')}`);
  }

  // Subject prerequisites must reference real subjects and be acyclic at that level too.
  for (const s of SUBJECTS) {
    for (const p of s.prerequisites) {
      if (!subjectById.has(p)) error(`subject ${s.id}: unknown prerequisite subject "${p}"`);
    }
  }

  // Track membership consistency.
  for (const t of TRACKS) {
    for (const sid of t.subjectIds) {
      if (!subjectById.has(sid)) error(`track ${t.id}: unknown subject "${sid}"`);
    }
    const declared = new Set(t.subjectIds);
    for (const s of subjectsByTrack.get(t.id) ?? []) {
      if (!declared.has(s.id)) error(`track ${t.id}: subject ${s.id} not listed in subjectIds`);
    }
  }
  for (const s of SUBJECTS) {
    const t = trackById.get(s.trackId);
    if (t && !t.subjectIds.includes(s.id)) {
      error(`subject ${s.id}: not listed in track ${t.id}.subjectIds`);
    }
  }

  // Skills and projects must reference real lessons.
  for (const sk of SKILLS) {
    if (!sk.requiredLessons.length) error(`skill ${sk.id}: no required lessons`);
    for (const lid of sk.requiredLessons) {
      if (!ids.has(lid)) error(`skill ${sk.id}: unknown lesson "${lid}"`);
    }
    if (!trackById.has(sk.trackId)) error(`skill ${sk.id}: unknown track "${sk.trackId}"`);
  }
  for (const p of PROJECTS) {
    for (const lid of p.requiredSkills) {
      if (!ids.has(lid)) error(`project ${p.id}: unknown required lesson "${lid}"`);
    }
    for (const tid of p.trackIds) {
      if (!trackById.has(tid)) error(`project ${p.id}: unknown track "${tid}"`);
    }
    if (!p.tasks.length) error(`project ${p.id}: no tasks`);
    if (!p.milestones.length) error(`project ${p.id}: no milestones`);
    if (!p.acceptanceCriteria.length) error(`project ${p.id}: no acceptance criteria`);
    const taskIds = new Set(p.tasks.map((t) => t.id));
    for (const m of p.milestones) {
      if (!m.taskIds.length) warn(`project ${p.id}/milestone ${m.id}: no tasks`);
      for (const tid of m.taskIds) {
        if (!taskIds.has(tid)) error(`project ${p.id}/milestone ${m.id}: unknown task "${tid}"`);
      }
    }
    for (const t of p.tasks) {
      if (t.milestoneId && !p.milestones.some((m) => m.id === t.milestoneId)) {
        error(`project ${p.id}/task ${t.id}: unknown milestone "${t.milestoneId}"`);
      }
    }
  }

  return issues;
}

/** Curriculum size summary, used by the Progress screen and by CI reporting. */
export function curriculumStats() {
  const byTrack = TRACKS.map((t) => ({
    track: t.id,
    subjects: subjectsByTrack.get(t.id)?.length ?? 0,
    lessons: lessonsInTrack(t.id).length,
    minutes: lessonsInTrack(t.id).reduce((a, l) => a + l.estimatedMinutes, 0),
    questions: lessonsInTrack(t.id).reduce((a, l) => a + l.assessment.questions.length, 0),
    exercises: lessonsInTrack(t.id).reduce((a, l) => a + l.exercises.length, 0),
  }));
  return {
    tracks: TRACKS.length,
    subjects: SUBJECTS.length,
    lessons: LESSONS.length,
    skills: SKILLS.length,
    projects: PROJECTS.length,
    resources: LESSONS.reduce((a, l) => a + l.resources.length, 0),
    exercises: LESSONS.reduce((a, l) => a + l.exercises.length, 0),
    questions: LESSONS.reduce((a, l) => a + l.assessment.questions.length, 0),
    objectives: LESSONS.reduce((a, l) => a + l.objectives.length, 0),
    estimatedHours: Math.round(LESSONS.reduce((a, l) => a + l.estimatedMinutes, 0) / 60),
    byTrack,
  };
}
