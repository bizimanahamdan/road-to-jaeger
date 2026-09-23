import { describe, expect, it } from 'vitest';
import {
  allLessons,
  allProjects,
  allSkills,
  allSubjects,
  allTracks,
  curriculumStats,
  downstreamLessons,
  lessonsInSubject,
  lessonsInTrack,
  topologicalLessonOrder,
  validateCurriculum,
} from '@/lib/curriculum';

/**
 * Curriculum integrity.
 *
 * These tests are the quality gate on authored content. A failure here means a
 * lesson could hand out progress it cannot justify (an unassessed objective),
 * the roadmap could deadlock (a prerequisite cycle), or a skill/project could
 * reference something that does not exist.
 */
describe('curriculum integrity', () => {
  const issues = validateCurriculum();
  const errors = issues.filter((i) => i.level === 'error');

  it('has no structural errors', () => {
    if (errors.length) {
      // Fail with the full list - a truncated message hides the real problem.
      throw new Error(`${errors.length} curriculum errors:\n${errors.map((e) => ` - ${e.message}`).join('\n')}`);
    }
    expect(errors).toHaveLength(0);
  });

  it('has every lesson id unique', () => {
    const ids = allLessons().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has every lesson attached to a real subject and track', () => {
    const subjects = new Set(allSubjects().map((s) => s.id));
    const tracks = new Set(allTracks().map((t) => t.id));
    for (const l of allLessons()) {
      expect(subjects.has(l.subjectId), `${l.id} subject ${l.subjectId}`).toBe(true);
      expect(tracks.has(l.trackId), `${l.id} track ${l.trackId}`).toBe(true);
    }
  });

  it('assesses every objective of every lesson', () => {
    for (const l of allLessons()) {
      for (const o of l.objectives) {
        const covered = l.assessment.questions.some((q) => q.objectiveId === o.id);
        expect(covered, `${l.id}: objective "${o.text}" is never assessed`).toBe(true);
      }
    }
  });

  it('requires a real passing bar on every assessment', () => {
    for (const l of allLessons()) {
      expect(l.assessment.passScore, `${l.id} passScore`).toBeGreaterThanOrEqual(70);
      expect(l.assessment.passScore).toBeLessThanOrEqual(100);
      expect(l.assessment.questions.length, `${l.id} question count`).toBeGreaterThanOrEqual(3);
    }
  });

  it('has at least one exercise per lesson and a sane required count', () => {
    for (const l of allLessons()) {
      expect(l.exercises.length, `${l.id} exercises`).toBeGreaterThan(0);
      expect(l.exercisesRequired).toBeGreaterThan(0);
      expect(l.exercisesRequired).toBeLessThanOrEqual(l.exercises.length);
    }
  });

  it('uses only http(s) resource URLs', () => {
    for (const l of allLessons()) {
      for (const r of l.resources) {
        expect(r.url, `${l.id}/${r.id}`).toMatch(/^https:\/\//);
      }
    }
  });

  it('has a resolvable, acyclic prerequisite graph covering every lesson', () => {
    const ordered = topologicalLessonOrder();
    expect(ordered.length).toBe(allLessons().length);
    const position = new Map(ordered.map((l, i) => [l.id, i] as const));
    for (const l of allLessons()) {
      for (const p of l.prerequisites) {
        expect(position.has(p), `${l.id} prereq ${p} exists`).toBe(true);
        expect(position.get(p)!).toBeLessThan(position.get(l.id)!);
      }
    }
  });

  it('has no lesson that is its own transitive prerequisite', () => {
    for (const l of allLessons()) {
      const down = downstreamLessons(l.id).map((d) => d.id);
      expect(down, `${l.id} appears downstream of itself`).not.toContain(l.id);
    }
  });

  it('gives every subject at least one lesson except intentionally empty ones', () => {
    const authored = allLessons().map((l) => l.subjectId);
    const empty = allSubjects().filter((s) => !authored.includes(s.id)).map((s) => s.id);
    // Tracked so content gaps are visible rather than silent.
    expect(empty).toEqual([]);
  });

  it('orders lessons within each subject by their order field', () => {
    for (const s of allSubjects()) {
      const list = lessonsInSubject(s.id);
      const orders = list.map((l) => l.order);
      expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    }
  });

  it('assigns every skill to a real track with real required lessons', () => {
    const tracks = new Set(allTracks().map((t) => t.id));
    const lessons = new Set(allLessons().map((l) => l.id));
    for (const s of allSkills()) {
      expect(tracks.has(s.trackId), `skill ${s.id} track`).toBe(true);
      expect(s.requiredLessons.length, `skill ${s.id} lessons`).toBeGreaterThan(0);
      for (const l of s.requiredLessons) expect(lessons.has(l), `skill ${s.id} -> ${l}`).toBe(true);
    }
  });

  it('assigns every project to real tracks and lessons', () => {
    const tracks = new Set(allTracks().map((t) => t.id));
    const lessons = new Set(allLessons().map((l) => l.id));
    for (const p of allProjects()) {
      for (const t of p.trackIds) expect(tracks.has(t), `project ${p.id} track ${t}`).toBe(true);
      for (const l of p.requiredSkills) expect(lessons.has(l), `project ${p.id} lesson ${l}`).toBe(true);
      expect(p.tasks.length).toBeGreaterThan(0);
      expect(p.milestones.length).toBeGreaterThan(0);
      expect(p.acceptanceCriteria.length).toBeGreaterThan(0);
    }
  });

  it('reports coherent curriculum statistics', () => {
    const stats = curriculumStats();
    expect(stats.tracks).toBe(allTracks().length);
    expect(stats.subjects).toBe(allSubjects().length);
    expect(stats.lessons).toBe(allLessons().length);
    expect(stats.questions).toBeGreaterThan(0);
    const perTrack = stats.byTrack.reduce((a, t) => a + t.lessons, 0);
    expect(perTrack).toBe(stats.lessons);
    const perTrackLessons = allTracks().reduce((a, t) => a + lessonsInTrack(t.id).length, 0);
    expect(perTrackLessons).toBe(stats.lessons);
  });

  it('marks frontier tracks with an explicit reality check', () => {
    const frontier = allTracks().filter((t) => t.maturity === 'frontier');
    expect(frontier.length).toBeGreaterThan(0);
    for (const t of frontier) {
      expect(t.realityCheck.length, `${t.id} realityCheck`).toBeGreaterThan(60);
      expect(/not promised|does not promise|cannot promise|is not a/i.test(t.realityCheck)).toBe(true);
    }
  });
});
