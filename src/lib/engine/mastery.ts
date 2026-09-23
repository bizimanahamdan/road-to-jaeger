import type {
  ExerciseState,
  Lesson,
  LessonProgress,
  LessonStatus,
  ObjectiveCoverage,
} from '@/lib/types';
import { mergeObjectiveCoverage, type GradedQuestion } from './assessment';
import { retentionOf, reviewSrs, seedAfterPass, type ReviewRating } from './srs';
import { clamp, isoOf } from './state';

/**
 * Mastery.
 *
 * This module is the reason the app is not a habit tracker. Two rules define it:
 *
 *  1. `masteryScore` is always computed, never assigned. It is a weighted blend
 *     of evidence, and every component of that blend is something the learner
 *     actually produced: assessment results, objective coverage, completed
 *     exercises, and predicted retention from real reviews.
 *  2. MASTERED is gated, not scored. A perfect score alone does not master a
 *     lesson. The gate demands a passing assessment, every objective covered by a
 *     correct answer, the required exercises done, a written reflection, at least
 *     one successful review after passing, and predicted retention above the bar.
 *
 * The consequence is deliberate: a learner can read every lesson and still have
 * nothing mastered, and there is no way to fake it short of actually answering
 * the questions correctly and coming back later to prove it stuck.
 */

/** Weights of the four evidence components. They sum to 1. */
export const MASTERY_WEIGHTS = {
  assessment: 0.55,
  objectives: 0.2,
  exercises: 0.15,
  retention: 0.1,
} as const;

/** The gate. Not configurable: these are the app's definition of mastery. */
export const MASTERY_GATE = {
  /** Best assessment score required, as a floor over the lesson's pass score. */
  minBestScore: 85,
  /** Every objective must have been answered correctly at least once. */
  requireAllObjectives: true,
  /** Reflection must be a real sentence, not a tick. */
  minReflectionChars: 20,
  /** Successful reviews after passing. */
  minPostPassReviews: 1,
  /** Predicted recall at the moment mastery is evaluated. */
  minRetention: 0.8,
} as const;

/** The score required to pass a lesson, honouring the user's floor. */
export function effectivePassScore(lesson: Lesson, passScoreFloor: number): number {
  return Math.max(lesson.assessment.passScore, clamp(passScoreFloor, 0, 100));
}

/** The score required to master: the gate, but never below passing. */
export function effectiveMasteryScore(lesson: Lesson, passScoreFloor: number): number {
  return Math.max(MASTERY_GATE.minBestScore, effectivePassScore(lesson, passScoreFloor));
}

/**
 * The exercises that must be completed for this lesson to pass.
 *
 * The curriculum sets `exercisesRequired`, which may be fewer than the total; the
 * required set is the first N in authored order, so it is stable across sessions.
 */
export function requiredExerciseIds(lesson: Lesson): string[] {
  return lesson.exercises.slice(0, Math.max(0, lesson.exercisesRequired)).map((x) => x.id);
}

export function exercisesDoneCount(lesson: Lesson, progress: LessonProgress): number {
  return requiredExerciseIds(lesson).filter((id) => progress.exercises[id]?.done).length;
}

export function exercisesRequiredMet(lesson: Lesson, progress: LessonProgress): boolean {
  return exercisesDoneCount(lesson, progress) >= lesson.exercisesRequired;
}

export function objectivesCoverage(
  lesson: Lesson,
  progress: LessonProgress,
): Record<string, ObjectiveCoverage> {
  const out: Record<string, ObjectiveCoverage> = {};
  for (const o of lesson.objectives) out[o.id] = progress.objectiveCoverage[o.id] ?? 'unseen';
  return out;
}

export function objectivesMetCount(lesson: Lesson, progress: LessonProgress): number {
  return lesson.objectives.filter((o) => progress.objectiveCoverage[o.id] === 'correct').length;
}

export function hasPassed(lesson: Lesson, progress: LessonProgress, passScoreFloor: number): boolean {
  return progress.passedAt !== null && progress.bestScore >= effectivePassScore(lesson, passScoreFloor);
}

export interface MasteryBreakdown {
  /** 0-100, rounded to one decimal. */
  score: number;
  components: {
    assessment: number;
    objectives: number;
    exercises: number;
    retention: number;
  };
  /** Weighted contribution of each component to the score, in points. */
  contribution: {
    assessment: number;
    objectives: number;
    exercises: number;
    retention: number;
  };
  retention: number;
  objectivesMet: number;
  objectivesTotal: number;
  exercisesDone: number;
  exercisesRequired: number;
  bestScore: number;
  passed: boolean;
}

/**
 * Computes the mastery score from evidence already in `progress`.
 *
 * Retention is 0 for a lesson that has never been reviewed after passing, which
 * is what keeps a fresh pass from jumping straight to MASTERED.
 */
export function masteryBreakdown(
  lesson: Lesson,
  progress: LessonProgress,
  now: Date,
  passScoreFloor: number,
): MasteryBreakdown {
  const objectivesTotal = lesson.objectives.length;
  const objectivesMet = objectivesMetCount(lesson, progress);
  const exercisesRequired = lesson.exercisesRequired;
  const exercisesDone = exercisesDoneCount(lesson, progress);
  const passed = hasPassed(lesson, progress, passScoreFloor);
  const retention = passed ? retentionOf(progress.srs, now) : 0;

  const components = {
    assessment: clamp(progress.bestScore / 100, 0, 1),
    objectives: objectivesTotal > 0 ? clamp(objectivesMet / objectivesTotal, 0, 1) : 0,
    exercises: exercisesRequired > 0 ? clamp(exercisesDone / exercisesRequired, 0, 1) : 1,
    retention,
  };

  const contribution = {
    assessment: components.assessment * MASTERY_WEIGHTS.assessment * 100,
    objectives: components.objectives * MASTERY_WEIGHTS.objectives * 100,
    exercises: components.exercises * MASTERY_WEIGHTS.exercises * 100,
    retention: components.retention * MASTERY_WEIGHTS.retention * 100,
  };

  const score =
    contribution.assessment + contribution.objectives + contribution.exercises + contribution.retention;

  return {
    score: Math.round(score * 10) / 10,
    components,
    contribution,
    retention: Math.round(retention * 1000) / 1000,
    objectivesMet,
    objectivesTotal,
    exercisesDone,
    exercisesRequired,
    bestScore: progress.bestScore,
    passed,
  };
}

export function masteryScore(
  lesson: Lesson,
  progress: LessonProgress,
  now: Date,
  passScoreFloor: number,
): number {
  return masteryBreakdown(lesson, progress, now, passScoreFloor).score;
}

export interface MasteryGate {
  mastered: boolean;
  /** Human-readable reasons mastery is withheld, in the order the UI shows them. */
  blockers: string[];
}

/**
 * The gate. Returns the reasons mastery is withheld so the UI can say exactly
 * what is missing instead of showing a progress bar that quietly fills itself.
 */
export function masteryGate(
  lesson: Lesson,
  progress: LessonProgress,
  now: Date,
  passScoreFloor: number,
): MasteryGate {
  const b = masteryBreakdown(lesson, progress, now, passScoreFloor);
  const blockers: string[] = [];

  if (b.bestScore < effectiveMasteryScore(lesson, passScoreFloor)) {
    blockers.push(
      `Assessment best is ${Math.round(b.bestScore)}% - mastery needs ${effectiveMasteryScore(
        lesson,
        passScoreFloor,
      )}%.`,
    );
  }
  if (MASTERY_GATE.requireAllObjectives && b.objectivesMet < b.objectivesTotal) {
    blockers.push(
      `${b.objectivesTotal - b.objectivesMet} of ${b.objectivesTotal} objectives have no correct answer yet.`,
    );
  }
  if (b.exercisesDone < b.exercisesRequired) {
    blockers.push(
      `${b.exercisesRequired - b.exercisesDone} required exercise${
        b.exercisesRequired - b.exercisesDone === 1 ? '' : 's'
      } still to complete.`,
    );
  }
  const reflectionChars = progress.reflection?.text.trim().length ?? 0;
  if (reflectionChars < MASTERY_GATE.minReflectionChars) {
    blockers.push(
      `Write a reflection of at least ${MASTERY_GATE.minReflectionChars} characters on what is still shaky.`,
    );
  }
  if (!b.passed) {
    blockers.push('The assessment has not been passed yet.');
  }
  if (progress.srs.successesSincePass < MASTERY_GATE.minPostPassReviews) {
    blockers.push(
      `At least ${MASTERY_GATE.minPostPassReviews} successful review after passing is required (you have ${progress.srs.successesSincePass}).`,
    );
  }
  if (b.retention < MASTERY_GATE.minRetention) {
    blockers.push(
      `Predicted retention is ${Math.round(b.retention * 100)}% - mastery needs ${Math.round(
        MASTERY_GATE.minRetention * 100,
      )}%. Review when it comes due.`,
    );
  }

  return { mastered: blockers.length === 0, blockers };
}

/**
 * Derives the status from evidence. Statuses never move on their own: they are a
 * function of what has been recorded.
 *
 * NOT_STARTED -> LEARNING    opened or read the material
 * LEARNING    -> PRACTICING  an exercise done or an assessment attempted
 * PRACTICING  -> REVIEW      assessment passed
 * REVIEW      -> MASTERED    the gate is satisfied
 * MASTERED    -> REVIEW      retention decayed below the gate, or a review lapsed
 *
 * The last edge matters: forgetting is real, and a status that cannot fall is a
 * status that means nothing.
 */
export function deriveStatus(
  lesson: Lesson,
  progress: LessonProgress,
  now: Date,
  passScoreFloor: number,
): LessonStatus {
  const gate = masteryGate(lesson, progress, now, passScoreFloor);
  if (gate.mastered && hasPassed(lesson, progress, passScoreFloor)) return 'MASTERED';
  if (hasPassed(lesson, progress, passScoreFloor)) return 'REVIEW';

  const started =
    progress.firstOpenedAt !== null ||
    progress.contentReadAt !== null ||
    progress.attempts.length > 0 ||
    Object.values(progress.exercises).some((e) => e.attempts > 0 || e.done);
  if (!started) return 'NOT_STARTED';

  const practicing =
    progress.attempts.length > 0 || exercisesDoneCount(lesson, progress) > 0;
  return practicing ? 'PRACTICING' : 'LEARNING';
}

/**
 * Recomputes every derived field. Called on load and after any mutation, so the
 * stored `masteryScore` and `status` can never disagree with the evidence.
 */
export function refreshProgress(
  lesson: Lesson,
  progress: LessonProgress,
  now: Date,
  passScoreFloor: number,
): LessonProgress {
  const status = deriveStatus(lesson, progress, now, passScoreFloor);
  const score = masteryScore(lesson, progress, now, passScoreFloor);
  const masteredAt =
    status === 'MASTERED' ? progress.masteredAt ?? isoOf(now) : status === 'REVIEW' ? null : progress.masteredAt;

  if (status === progress.status && score === progress.masteryScore && masteredAt === progress.masteredAt) {
    return progress;
  }
  return { ...progress, status, masteryScore: score, masteredAt, updatedAt: isoOf(now), dirty: true };
}

/* -------------------------------------------------------------------------- */
/* Mutations - each returns a new progress record                             */
/* -------------------------------------------------------------------------- */

export function markOpened(progress: LessonProgress, now: Date): LessonProgress {
  if (progress.firstOpenedAt) {
    return { ...progress, lastStudiedAt: isoOf(now), updatedAt: isoOf(now), dirty: true };
  }
  return {
    ...progress,
    firstOpenedAt: isoOf(now),
    lastStudiedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function markContentRead(progress: LessonProgress, now: Date): LessonProgress {
  return {
    ...markOpened(progress, now),
    contentReadAt: progress.contentReadAt ?? isoOf(now),
  };
}

export function addStudySeconds(progress: LessonProgress, seconds: number, now: Date): LessonProgress {
  const whole = Math.max(0, Math.floor(seconds));
  if (whole === 0 && progress.lastStudiedAt) return progress;
  return {
    ...progress,
    totalStudySeconds: progress.totalStudySeconds + whole,
    lastStudiedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function setExerciseState(
  lesson: Lesson,
  progress: LessonProgress,
  exerciseId: string,
  done: boolean,
  now: Date,
  passScoreFloor: number,
  note?: string,
): LessonProgress {
  if (!lesson.exercises.some((x) => x.id === exerciseId)) return progress;
  const prev: ExerciseState = progress.exercises[exerciseId] ?? {
    done: false,
    attempts: 0,
    lastAt: null,
  };
  const next: ExerciseState = {
    done,
    attempts: prev.attempts + (done && !prev.done ? 1 : 0),
    lastAt: isoOf(now),
    note: note ?? prev.note,
  };
  const exercises = { ...progress.exercises, [exerciseId]: next };
  return refreshProgress(
    lesson,
    { ...markOpened(progress, now), exercises },
    now,
    passScoreFloor,
  );
}

export function setReflection(
  progress: LessonProgress,
  text: string,
  now: Date,
): LessonProgress {
  const trimmed = text.trim();
  return {
    ...progress,
    reflection: trimmed ? { text: trimmed, at: isoOf(now) } : null,
    lastStudiedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

/**
 * Records a graded assessment attempt.
 *
 * Passing seeds the review schedule the first time; failing does not clear
 * anything, because earlier correct answers remain evidence.
 */
export function applyGradedAttempt(
  lesson: Lesson,
  progress: LessonProgress,
  graded: { attempt: LessonProgress['attempts'][number]; questions: GradedQuestion[]; passed: boolean },
  now: Date,
  passScoreFloor: number,
): LessonProgress {
  const attempts = [...progress.attempts, graded.attempt];
  const bestScore = Math.max(progress.bestScore, graded.attempt.score);
  const objectiveCoverage = mergeObjectiveCoverage(progress.objectiveCoverage, graded.questions);
  const passed =
    graded.attempt.score >= effectivePassScore(lesson, passScoreFloor) && graded.passed !== false;

  let next: LessonProgress = {
    ...markOpened(progress, now),
    attempts,
    bestScore,
    lastScore: graded.attempt.score,
    objectiveCoverage,
    passedAt: passed ? progress.passedAt ?? isoOf(now) : progress.passedAt,
    lastStudiedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };

  // First pass opens the review schedule; re-passing does not reset it.
  if (passed && !progress.passedAt) {
    next = { ...next, srs: seedAfterPass(next.srs, now) };
  }

  return refreshProgress(lesson, next, now, passScoreFloor);
}

/**
 * Applies one review rating to a lesson that has passed.
 *
 * A lapse can demote MASTERED back to REVIEW, because the retention gate is
 * evaluated on the schedule that the lapse just reset.
 */
export function applyReview(
  lesson: Lesson,
  progress: LessonProgress,
  rating: ReviewRating,
  now: Date,
  passScoreFloor: number,
): LessonProgress {
  if (!progress.passedAt) return progress;
  const srs = reviewSrs(progress.srs, rating, now);
  const next: LessonProgress = {
    ...progress,
    srs,
    lastStudiedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
  return refreshProgress(lesson, next, now, passScoreFloor);
}

/**
 * True when a passed lesson should be re-taught rather than re-quizzed: too many
 * lapses means the material never got in, and another flashcard-style review is
 * the wrong intervention.
 */
export function needsRelearning(progress: LessonProgress, lapseThreshold = 3): boolean {
  return progress.srs.lapses >= lapseThreshold;
}
