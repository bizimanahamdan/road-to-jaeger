import type { SrsState } from '@/lib/types';
import { addDays, addMinutes, clamp, isoOf } from './state';

/**
 * Spaced repetition: an SM-2 derivative, simplified and made fully
 * deterministic.
 *
 * Why not SM-2 verbatim?
 *  - SM-2's quality scale is 0-5 and self-reported. Here the learner rates a
 *    review with four buttons, which map onto quality values 1/3/4/5.
 *  - SM-2 has no notion of "this card was learned but the lesson was never
 *    passed". Here a lesson only enters the review queue once its assessment has
 *    been passed, because reviewing material you have not yet demonstrated
 *    understanding of is busywork.
 *  - SM-2 does not model forgetting. This engine does: `retentionOf` is an
 *    exponential forgetting curve calibrated so that a card is due when predicted
 *    recall has fallen to 90%. Mastery uses the same curve as evidence.
 *
 * There is no randomness anywhere. The same rating sequence from the same state
 * always produces the same schedule, which is what makes it testable.
 */

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export const REVIEW_RATINGS: ReviewRating[] = ['again', 'hard', 'good', 'easy'];

export const RATING_LABELS: Record<ReviewRating, string> = {
  again: 'Forgot it',
  hard: 'Hard recall',
  good: 'Recalled',
  easy: 'Effortless',
};

/** Maps a rating onto the SM-2 quality scale. */
const QUALITY: Record<ReviewRating, number> = { again: 1, hard: 3, good: 4, easy: 5 };

export const MIN_EASE = 1.3;
export const MAX_EASE = 3.2;
export const FIRST_INTERVAL_DAYS = 1;
export const SECOND_INTERVAL_DAYS = 4;
export const MAX_INTERVAL_DAYS = 365;
/** Predicted recall at which a card becomes due. */
export const TARGET_RETENTION = 0.9;
/** How long a lapsed card waits before it comes back in the same sitting. */
const LAPSE_RELEARN_MINUTES = 10;

/**
 * Stability of the memory, in days: the time constant of the forgetting curve.
 *
 * Calibrated so that `retentionOf` returns exactly TARGET_RETENTION when the
 * elapsed time equals `intervalDays` - i.e. the card is scheduled to come back at
 * the moment recall is predicted to have decayed to 90%.
 */
export function stabilityDays(intervalDays: number): number {
  if (intervalDays <= 0) return 0;
  return intervalDays / -Math.log(TARGET_RETENTION);
}

/**
 * Predicted recall in [0, 1] for a scheduled item, or 0 when there is no
 * schedule to speak of (never passed, never reviewed).
 */
export function retentionOf(srs: SrsState, now: Date): number {
  if (srs.intervalDays <= 0 || !srs.lastReviewedAt) return 0;
  const last = Date.parse(srs.lastReviewedAt);
  if (Number.isNaN(last)) return 0;
  const elapsedDays = Math.max(0, (now.getTime() - last) / 86_400_000);
  const stability = stabilityDays(srs.intervalDays);
  if (stability <= 0) return 0;
  return clamp(Math.exp(-elapsedDays / stability), 0, 1);
}

export function isScheduled(srs: SrsState): boolean {
  return srs.dueAt !== null;
}

export function isDue(srs: SrsState, now: Date): boolean {
  if (!srs.dueAt) return false;
  const due = Date.parse(srs.dueAt);
  return !Number.isNaN(due) && due <= now.getTime();
}

/** Due, and late by more than `graceDays`. Used to prioritise the queue. */
export function isOverdue(srs: SrsState, now: Date, graceDays = 1): boolean {
  if (!srs.dueAt) return false;
  const due = Date.parse(srs.dueAt);
  if (Number.isNaN(due)) return false;
  return now.getTime() - due > graceDays * 86_400_000;
}

/** Days until due, negative when overdue. `null` when nothing is scheduled. */
export function daysUntilDue(srs: SrsState, now: Date): number | null {
  if (!srs.dueAt) return null;
  const due = Date.parse(srs.dueAt);
  if (Number.isNaN(due)) return null;
  return (due - now.getTime()) / 86_400_000;
}

/**
 * Seeds the review schedule the first time a lesson passes its assessment.
 *
 * The first review is next day: passing today is not evidence of retention
 * tomorrow, and mastery deliberately refuses to be awarded before at least one
 * successful post-pass review.
 */
export function seedAfterPass(srs: SrsState, now: Date): SrsState {
  return {
    ...srs,
    intervalDays: FIRST_INTERVAL_DAYS,
    repetitions: 0,
    successesSincePass: 0,
    // `lastReviewedAt` stays null on purpose: passing is not a review, so
    // predicted retention is 0 until the learner actually comes back. This is
    // what stops a fresh pass from scoring retention points it has not earned.
    lastReviewedAt: srs.lastReviewedAt,
    dueAt: isoOf(addDays(now, FIRST_INTERVAL_DAYS)),
  };
}

/** Next interval in days for a successful review of the given rating. */
function nextInterval(srs: SrsState, rating: ReviewRating): number {
  if (srs.repetitions <= 0) return FIRST_INTERVAL_DAYS;
  if (srs.repetitions === 1) {
    return rating === 'easy' ? SECOND_INTERVAL_DAYS + 2 : SECOND_INTERVAL_DAYS;
  }
  const factor =
    rating === 'hard' ? Math.max(1.2, srs.ease * 0.6) : rating === 'easy' ? srs.ease * 1.3 : srs.ease;
  return Math.round(srs.intervalDays * factor);
}

/** SM-2 ease update, clamped so a bad streak cannot make an item unschedulable. */
function nextEase(srs: SrsState, rating: ReviewRating): number {
  const q = QUALITY[rating];
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  return clamp(Math.round((srs.ease + delta) * 100) / 100, MIN_EASE, MAX_EASE);
}

/**
 * Applies one review rating and returns the new schedule.
 *
 * A lapse resets repetitions and drops the item back into a short relearn
 * interval, but keeps the history (`lapses`) because repeated lapses on the same
 * lesson are exactly the signal the planner uses to prefer re-teaching over
 * re-quizzing.
 */
export function reviewSrs(srs: SrsState, rating: ReviewRating, now: Date): SrsState {
  if (rating === 'again') {
    return {
      ease: nextEase(srs, rating),
      intervalDays: 0,
      repetitions: 0,
      lapses: srs.lapses + 1,
      dueAt: isoOf(addMinutes(now, LAPSE_RELEARN_MINUTES)),
      lastReviewedAt: isoOf(now),
      successesSincePass: 0,
    };
  }

  const repetitions = srs.repetitions + 1;
  const intervalDays = clamp(nextInterval(srs, rating), FIRST_INTERVAL_DAYS, MAX_INTERVAL_DAYS);
  return {
    ease: nextEase(srs, rating),
    intervalDays,
    repetitions,
    lapses: srs.lapses,
    dueAt: isoOf(addDays(now, intervalDays)),
    lastReviewedAt: isoOf(now),
    successesSincePass: srs.successesSincePass + 1,
  };
}

/** How many reviews have happened, for the UI ("reviewed 4 times"). */
export function reviewCount(srs: SrsState): number {
  return srs.repetitions + srs.lapses;
}
