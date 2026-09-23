import { describe, expect, it } from 'vitest';

import { allLessons, allSkills, allTracks, getLesson, requireLesson } from '@/lib/curriculum';
import {
  gradeAssessment,
  gradeNumeric,
  gradeShort,
  mergeObjectiveCoverage,
  type AnswerValue,
} from '@/lib/engine/assessment';
import {
  availableLessons,
  isUnlocked,
  missingPrerequisites,
  roadmapPosition,
  unlockedSkills,
} from '@/lib/engine/graph';
import {
  applyGradedAttempt,
  applyReview,
  deriveStatus,
  effectivePassScore,
  masteryBreakdown,
  masteryGate,
  markContentRead,
  markOpened,
  refreshProgress,
  requiredExerciseIds,
  setExerciseState,
  setReflection,
} from '@/lib/engine/mastery';
import {
  FIRST_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  TARGET_RETENTION,
  isDue,
  isOverdue,
  retentionOf,
  reviewSrs,
  seedAfterPass,
  stabilityDays,
} from '@/lib/engine/srs';
import { addDays, emptyLessonProgress, emptySrs, localDateKey } from '@/lib/engine/state';
import type { AssessmentQuestion, Lesson, LessonId, LessonProgress } from '@/lib/types';

/**
 * Engine tests.
 *
 * The important ones here are negative: they assert what the app refuses to do.
 * A mastery system that can be satisfied by reading, or by a single lucky
 * attempt, is a vanity metric, and these tests are what keeps it that way.
 */

const FLOOR = 80;
const T0 = new Date('2026-03-02T08:00:00.000Z');

function freshProgressMap(now: Date): Map<LessonId, LessonProgress> {
  const map = new Map<LessonId, LessonProgress>();
  for (const lesson of allLessons()) map.set(lesson.id, emptyLessonProgress(lesson.id, now));
  return map;
}

function get(map: Map<LessonId, LessonProgress>, id: LessonId): LessonProgress {
  const p = map.get(id);
  if (!p) throw new Error(`no progress for ${id}`);
  return p;
}

/** Answers every question correctly, in the form the grader expects. */
function allCorrect(lesson: Lesson): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  for (const q of lesson.assessment.questions) {
    if (q.type === 'mcq') out[q.id] = q.answer as number;
    else if (q.type === 'numeric') out[q.id] = q.answer as number;
    else out[q.id] = Array.isArray(q.answer) ? q.answer[0] ?? String(q.answer) : String(q.answer);
  }
  return out;
}

function allWrong(lesson: Lesson): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  for (const q of lesson.assessment.questions) {
    if (q.type === 'mcq') {
      const choices = q.choices ?? [];
      const wrong = ((q.answer as number) + 1) % Math.max(2, choices.length);
      out[q.id] = wrong;
    } else if (q.type === 'numeric') {
      out[q.id] = (q.answer as number) * 3 + 7;
    } else {
      out[q.id] = 'definitely not the answer';
    }
  }
  return out;
}

function attempt(
  lesson: Lesson,
  answers: Record<string, AnswerValue>,
  now: Date,
  map: Map<LessonId, LessonProgress>,
): LessonProgress {
  const graded = gradeAssessment(
    lesson,
    answers,
    { durationSeconds: 420, passScore: effectivePassScore(lesson, FLOOR) },
    now,
  );
  return applyGradedAttempt(lesson, get(map, lesson.id), graded, now, FLOOR);
}

/** Everything mastery legitimately requires, in order. */
function masterLesson(
  lesson: Lesson,
  map: Map<LessonId, LessonProgress>,
  now: Date,
): { at: Date; progress: LessonProgress } {
  let progress = markOpened(get(map, lesson.id), now);
  progress = markContentRead(progress, now);
  for (const id of requiredExerciseIds(lesson)) {
    progress = setExerciseState(lesson, progress, id, true, now, FLOOR);
  }
  progress = attempt(lesson, allCorrect(lesson), now, mapWith(map, lesson.id, progress));
  progress = setReflection(
    progress,
    'The part I would still get wrong under pressure is the sign of the error term.',
    now,
  );
  const reviewAt = addDays(now, FIRST_INTERVAL_DAYS);
  progress = applyReview(lesson, progress, 'good', reviewAt, FLOOR);
  map.set(lesson.id, progress);
  return { at: reviewAt, progress };
}

function mapWith(
  map: Map<LessonId, LessonProgress>,
  id: LessonId,
  progress: LessonProgress,
): Map<LessonId, LessonProgress> {
  const next = new Map(map);
  next.set(id, progress);
  return next;
}

/** A lesson with prerequisites, chosen deterministically from the curriculum. */
function aDependentLesson(): Lesson {
  const found = allLessons().find((l) => l.prerequisites.length > 0);
  if (!found) throw new Error('curriculum has no prerequisite edges');
  return found;
}

describe('grading', () => {
  const numericQuestion: AssessmentQuestion = {
    id: 'n1',
    objectiveId: 'o1',
    type: 'numeric',
    prompt: 'p',
    answer: 200,
    tolerance: 0.02,
    explanation: 'e',
  };

  it('accepts numeric answers inside the authored tolerance and rejects those outside', () => {
    expect(gradeNumeric(numericQuestion, 200)).toBe(true);
    expect(gradeNumeric(numericQuestion, 203.9)).toBe(true); // +1.95%
    expect(gradeNumeric(numericQuestion, 205)).toBe(false); // +2.5%
    expect(gradeNumeric(numericQuestion, 195)).toBe(false); // -2.5%
    expect(gradeNumeric(numericQuestion, '201 N m')).toBe(true); // units tolerated
    expect(gradeNumeric(numericQuestion, null)).toBe(false);
  });

  it('falls back to an absolute epsilon when the expected answer is zero', () => {
    const zero: AssessmentQuestion = { ...numericQuestion, answer: 0 };
    expect(gradeNumeric(zero, 0)).toBe(true);
    expect(gradeNumeric(zero, 0.5)).toBe(false);
  });

  it('does not let a learner pass by leaving questions blank', () => {
    const lesson = requireLesson('math-01');
    const graded = gradeAssessment(
      lesson,
      {},
      { durationSeconds: 5, passScore: effectivePassScore(lesson, FLOOR) },
      T0,
    );
    expect(graded.score).toBe(0);
    expect(graded.passed).toBe(false);
    expect(graded.questions.every((q) => !q.correct && !q.answered)).toBe(true);
  });

  it('normalises short answers without becoming fuzzy', () => {
    const q: AssessmentQuestion = {
      id: 's1',
      objectiveId: 'o1',
      type: 'short',
      prompt: 'p',
      answer: ["Ohm's law", 'V = IR'],
      explanation: 'e',
    };
    expect(gradeShort(q, "  OHM'S LAW ")).toBe(true);
    expect(gradeShort(q, 'v=ir')).toBe(true);
    expect(gradeShort(q, 'Kirchhoff')).toBe(false);
    expect(gradeShort(q, '')).toBe(false);
  });

  it('grades a full assessment and reports per-question detail', () => {
    const lesson = requireLesson('math-01');
    const graded = gradeAssessment(
      lesson,
      allCorrect(lesson),
      { durationSeconds: 300, passScore: effectivePassScore(lesson, FLOOR) },
      T0,
    );
    expect(graded.score).toBe(100);
    expect(graded.correct).toBe(lesson.assessment.questions.length);
    expect(graded.passed).toBe(true);
    expect(graded.questions.every((q) => q.correct)).toBe(true);
    // Every explanation ships with the result: feedback is part of the teaching.
    expect(graded.questions.every((q) => q.explanation.length > 10)).toBe(true);
  });

  it('never downgrades objective coverage', () => {
    const lesson = requireLesson('math-01');
    const first = gradeAssessment(
      lesson,
      allCorrect(lesson),
      { durationSeconds: 10, passScore: 85 },
      T0,
    );
    const coverage = mergeObjectiveCoverage({}, first.questions);
    const second = gradeAssessment(
      lesson,
      allWrong(lesson),
      { durationSeconds: 10, passScore: 85 },
      T0,
    );
    const merged = mergeObjectiveCoverage(coverage, second.questions);
    for (const o of lesson.objectives) {
      expect(merged[o.id]).toBe('correct');
    }
  });
});

describe('mastery cannot be faked', () => {
  const lesson = requireLesson('math-01');

  it('starts at zero and NOT_STARTED', () => {
    const map = freshProgressMap(T0);
    const p = get(map, lesson.id);
    expect(p.status).toBe('NOT_STARTED');
    expect(p.masteryScore).toBe(0);
    expect(masteryGate(lesson, p, T0, FLOOR).mastered).toBe(false);
  });

  it('moves LEARNING -> PRACTICING on real work only', () => {
    const map = freshProgressMap(T0);
    const opened = markOpened(get(map, lesson.id), T0);
    expect(deriveStatus(lesson, opened, T0, FLOOR)).toBe('LEARNING');

    const firstExercise = requiredExerciseIds(lesson)[0];
    if (!firstExercise) throw new Error('lesson has no required exercises');
    const exercised = setExerciseState(lesson, opened, firstExercise, true, T0, FLOOR);
    expect(exercised.status).toBe('PRACTICING');
  });

  it('does not pass on a failed attempt, and schedules no review', () => {
    const map = freshProgressMap(T0);
    const p = attempt(lesson, allWrong(lesson), T0, map);
    expect(p.passedAt).toBeNull();
    expect(p.status).toBe('PRACTICING');
    expect(p.srs.dueAt).toBeNull();
    expect(p.bestScore).toBe(0);
    expect(isDue(p.srs, addDays(T0, 3))).toBe(false);
  });

  it('refuses MASTERED after a perfect first attempt', () => {
    const map = freshProgressMap(T0);
    let p = get(map, lesson.id);
    for (const id of requiredExerciseIds(lesson)) {
      p = setExerciseState(lesson, p, id, true, T0, FLOOR);
    }
    p = attempt(lesson, allCorrect(lesson), T0, mapWith(map, lesson.id, p));
    p = setReflection(p, 'I can do the arithmetic but not yet explain why it works.', T0);

    expect(p.bestScore).toBe(100);
    expect(p.passedAt).not.toBeNull();
    // Passing is not mastering.
    expect(p.status).toBe('REVIEW');
    const gate = masteryGate(lesson, p, T0, FLOOR);
    expect(gate.mastered).toBe(false);
    expect(gate.blockers.join(' ')).toMatch(/review/i);
    // Retention is 0 because passing an assessment is not the same as reviewing.
    expect(masteryBreakdown(lesson, p, T0, FLOOR).retention).toBe(0);
    expect(p.masteryScore).toBe(90);
  });

  it('withholds mastery while an objective has no correct answer, whatever the score', () => {
    const map = freshProgressMap(T0);
    const target = lesson.objectives[0];
    if (!target) throw new Error('lesson has no objectives');
    const answers = allCorrect(lesson);
    for (const q of lesson.assessment.questions) {
      if (q.objectiveId === target.id) {
        answers[q.id] = q.type === 'mcq' ? ((q.answer as number) + 1) % 2 : 'wrong on purpose';
      }
    }
    let p = get(map, lesson.id);
    for (const id of requiredExerciseIds(lesson)) {
      p = setExerciseState(lesson, p, id, true, T0, FLOOR);
    }
    p = attempt(lesson, answers, T0, mapWith(map, lesson.id, p));
    p = setReflection(p, 'Still shaky on the first objective, which is the point of this test.', T0);
    p = applyReview(lesson, p, 'good', addDays(T0, 1), FLOOR);

    const gate = masteryGate(lesson, p, addDays(T0, 1), FLOOR);
    expect(gate.mastered).toBe(false);
    expect(gate.blockers.join(' ')).toMatch(/objective/i);
    expect(p.status).not.toBe('MASTERED');
  });

  it('awards MASTERED only after a real post-pass review', () => {
    const map = freshProgressMap(T0);
    const { progress, at } = masterLesson(lesson, map, T0);
    expect(progress.status).toBe('MASTERED');
    expect(progress.masteredAt).not.toBeNull();
    expect(progress.srs.successesSincePass).toBeGreaterThanOrEqual(1);
    expect(progress.masteryScore).toBe(100);
    expect(masteryGate(lesson, progress, at, FLOOR).mastered).toBe(true);
  });

  it('demotes MASTERED when retention decays', () => {
    const map = freshProgressMap(T0);
    const { progress, at } = masterLesson(lesson, map, T0);
    expect(progress.status).toBe('MASTERED');

    // Three days past a one-day interval: predicted recall has fallen below the gate.
    const later = addDays(at, 3);
    const decayed = refreshProgress(lesson, progress, later, FLOOR);
    expect(retentionOf(decayed.srs, later)).toBeLessThan(0.8);
    expect(decayed.status).toBe('REVIEW');
    expect(decayed.masteredAt).toBeNull();
    expect(decayed.masteryScore).toBeLessThan(100);
    expect(masteryGate(lesson, decayed, later, FLOOR).blockers.join(' ')).toMatch(/retention/i);
  });

  it('demotes MASTERED when a review lapses', () => {
    const map = freshProgressMap(T0);
    const { progress, at } = masterLesson(lesson, map, T0);
    const lapsed = applyReview(lesson, progress, 'again', addDays(at, 1), FLOOR);
    expect(lapsed.srs.lapses).toBe(progress.srs.lapses + 1);
    expect(lapsed.srs.successesSincePass).toBe(0);
    expect(lapsed.status).toBe('REVIEW');
  });

  it('honours the user pass-score floor', () => {
    expect(effectivePassScore(lesson, FLOOR)).toBeGreaterThanOrEqual(FLOOR);
    expect(effectivePassScore(lesson, 95)).toBe(95);
  });

  it('refreshProgress is a no-op when nothing changed', () => {
    const map = freshProgressMap(T0);
    const clean: LessonProgress = { ...get(map, lesson.id), dirty: false };
    const refreshed = refreshProgress(lesson, clean, T0, FLOOR);
    expect(refreshed).toBe(clean);
    expect(refreshed.dirty).toBe(false);
    expect(refreshed.masteryScore).toBe(0);
  });
});

describe('spaced repetition', () => {
  it('schedules the first review one day after passing, with no retention credit', () => {
    const seeded = seedAfterPass(emptySrs(), T0);
    expect(seeded.intervalDays).toBe(FIRST_INTERVAL_DAYS);
    expect(seeded.dueAt).toBe(addDays(T0, 1).toISOString());
    expect(seeded.lastReviewedAt).toBeNull();
    expect(retentionOf(seeded, T0)).toBe(0);
    expect(isDue(seeded, T0)).toBe(false);
    expect(isDue(seeded, addDays(T0, 1))).toBe(true);
    expect(isOverdue(seeded, addDays(T0, 1))).toBe(false);
    expect(isOverdue(seeded, addDays(T0, 3))).toBe(true);
  });

  it('is calibrated so a card is due at 90% predicted recall', () => {
    const reviewed = reviewSrs(seedAfterPass(emptySrs(), T0), 'good', addDays(T0, 1));
    const due = addDays(addDays(T0, 1), reviewed.intervalDays);
    expect(retentionOf(reviewed, due)).toBeCloseTo(TARGET_RETENTION, 6);
    expect(stabilityDays(reviewed.intervalDays)).toBeCloseTo(
      reviewed.intervalDays / -Math.log(TARGET_RETENTION),
      6,
    );
    // Build a longer interval, then check the middle of it: recall should still
    // be comfortably above the mastery gate halfway to the due date.
    const t2 = addDays(addDays(T0, 1), reviewed.intervalDays);
    const longer = reviewSrs(reviewed, 'good', t2);
    expect(longer.intervalDays).toBeGreaterThan(reviewed.intervalDays);
    const halfway = addDays(t2, Math.floor(longer.intervalDays / 2));
    expect(retentionOf(longer, halfway)).toBeGreaterThan(TARGET_RETENTION);
    expect(retentionOf(longer, addDays(t2, longer.intervalDays))).toBeCloseTo(TARGET_RETENTION, 6);
  });

  it('grows intervals on success and is deterministic', () => {
    let srs = seedAfterPass(emptySrs(), T0);
    const intervals: number[] = [];
    let now = T0;
    for (let i = 0; i < 6; i += 1) {
      now = addDays(now, Math.max(1, srs.intervalDays));
      srs = reviewSrs(srs, 'good', now);
      intervals.push(srs.intervalDays);
    }
    for (let i = 1; i < intervals.length; i += 1) {
      const previous = intervals[i - 1];
      const current = intervals[i];
      if (previous === undefined || current === undefined) throw new Error('interval list too short');
      expect(current).toBeGreaterThan(previous);
    }
    expect(intervals.every((d) => d <= MAX_INTERVAL_DAYS)).toBe(true);

    // Same rating sequence, same result - no randomness anywhere.
    let again = seedAfterPass(emptySrs(), T0);
    let cursor = T0;
    const replay: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      cursor = addDays(cursor, Math.max(1, again.intervalDays));
      again = reviewSrs(again, 'good', cursor);
      replay.push(again.intervalDays);
    }
    expect(replay).toEqual(intervals);
  });

  it('caps interval growth at the configured maximum', () => {
    let srs = seedAfterPass(emptySrs(), T0);
    let now = T0;
    for (let i = 0; i < 40; i += 1) {
      now = addDays(now, Math.max(1, srs.intervalDays));
      srs = reviewSrs(srs, 'easy', now);
    }
    expect(srs.intervalDays).toBe(MAX_INTERVAL_DAYS);
  });

  it('resets repetitions and shortens the wait on a lapse', () => {
    let srs = seedAfterPass(emptySrs(), T0);
    srs = reviewSrs(srs, 'good', addDays(T0, 1));
    srs = reviewSrs(srs, 'good', addDays(T0, 5));
    expect(srs.repetitions).toBe(2);
    const lapsed = reviewSrs(srs, 'again', addDays(T0, 20));
    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.lapses).toBe(srs.lapses + 1);
    expect(lapsed.successesSincePass).toBe(0);
    expect(lapsed.intervalDays).toBe(0);
    // Comes back inside the same sitting, not tomorrow.
    const dueTime = lapsed.dueAt ? Date.parse(lapsed.dueAt) : Number.NaN;
    expect(dueTime - addDays(T0, 20).getTime()).toBeLessThanOrEqual(10 * 60_000);
  });

  it('never lets ease fall below the floor', () => {
    let srs = seedAfterPass(emptySrs(), T0);
    for (let i = 0; i < 20; i += 1) srs = reviewSrs(srs, 'again', addDays(T0, i));
    expect(srs.ease).toBeGreaterThanOrEqual(MIN_EASE);
  });
});

describe('the dependency graph', () => {
  it('unlocks lessons with no prerequisites and locks the rest', () => {
    const map = freshProgressMap(T0);
    const root = requireLesson('math-01');
    expect(root.prerequisites).toEqual([]);
    expect(isUnlocked(root, map, FLOOR)).toBe(true);

    const dependent = aDependentLesson();
    expect(isUnlocked(dependent, map, FLOOR)).toBe(false);
    const missing = missingPrerequisites(dependent, map, FLOOR);
    expect(missing.length).toBe(dependent.prerequisites.length);
    expect(missing.every((m) => m.status === 'NOT_STARTED')).toBe(true);
  });

  it('unlocks a dependent the moment its prerequisites are passed', () => {
    const map = freshProgressMap(T0);
    const dependent = aDependentLesson();
    for (const prereqId of dependent.prerequisites) {
      const prereq = requireLesson(prereqId);
      const passed = attempt(prereq, allCorrect(prereq), T0, map);
      expect(passed.passedAt).not.toBeNull();
      map.set(prereqId, passed);
    }
    expect(isUnlocked(dependent, map, FLOOR)).toBe(true);
    expect(missingPrerequisites(dependent, map, FLOOR)).toEqual([]);
  });

  it('keeps passed lessons out of the available pool', () => {
    const map = freshProgressMap(T0);
    const before = availableLessons(map, FLOOR).map((l) => l.id);
    expect(before).toContain('math-01');

    const passed = attempt(lessonById('math-01'), allCorrect(lessonById('math-01')), T0, map);
    map.set('math-01', passed);
    const after = availableLessons(map, FLOOR).map((l) => l.id);
    expect(after).not.toContain('math-01');
    // Passing a root lesson unlocks the lessons that depend on it.
    const unlockedByPassing = allLessons().filter(
      (l) => l.prerequisites.length > 0 && l.prerequisites.every((p) => p === 'math-01'),
    );
    expect(unlockedByPassing.length).toBeGreaterThan(0);
    for (const l of unlockedByPassing) {
      expect(before).not.toContain(l.id);
      expect(after).toContain(l.id);
    }
  });

  it('unlocks a skill only when every granting lesson is MASTERED', () => {
    const map = freshProgressMap(T0);
    expect(unlockedSkills(map)).toEqual([]);

    const single = allSkills().find((s) => s.requiredLessons.length === 1);
    if (!single) throw new Error('no single-lesson skill in the register');
    const target = requireLesson(single.requiredLessons[0] ?? '');
    const { progress } = masterLesson(target, map, T0);
    map.set(target.id, progress);

    expect(unlockedSkills(map).map((s) => s.id)).toContain(single.id);
  });

  it('describes the roadmap position honestly at both ends', () => {
    const map = freshProgressMap(T0);
    const start = roadmapPosition(map, FLOOR);
    expect(start.lessonId).toBeNull();
    expect(start.description).toMatch(/not started/i);

    const root = requireLesson('math-01');
    const passed = attempt(root, allCorrect(root), T0, map);
    map.set(root.id, passed);
    const after = roadmapPosition(map, FLOOR);
    expect(after.lessonId).toBe(root.id);
    expect(after.description).toContain(root.title);
    expect(after.description).toMatch(/next available/i);
  });

  it('agrees with the curriculum about track membership', () => {
    const ids = new Set(allTracks().map((t) => t.id));
    for (const l of allLessons()) expect(ids.has(l.trackId)).toBe(true);
  });
});

function lessonById(id: LessonId): Lesson {
  const lesson = getLesson(id);
  if (!lesson) throw new Error(`unknown lesson ${id}`);
  return lesson;
}

describe('local date handling', () => {
  it('keys plan dates on the device-local calendar day', () => {
    const morning = new Date(2026, 2, 2, 1, 0, 0);
    expect(localDateKey(morning)).toBe('2026-03-02');
    const late = new Date(2026, 2, 2, 23, 30, 0);
    expect(localDateKey(late)).toBe('2026-03-02');
    expect(localDateKey(addDays(late, 1))).toBe('2026-03-03');
  });
});
