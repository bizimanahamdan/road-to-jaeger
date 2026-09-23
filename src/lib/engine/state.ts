import type {
  AssessmentAttempt,
  DailyPlan,
  LessonId,
  LessonProgress,
  Note,
  PlanItem,
  ProjectProgress,
  Reminder,
  Settings,
  SrsState,
  StudySession,
} from '@/lib/types';

/**
 * State factories and time helpers.
 *
 * Every function here is pure with respect to `now`: callers pass the clock in,
 * which is what makes the mastery, SRS, planner and session engines testable
 * without mocking time. Nothing in this app derives progress from a wall clock it
 * read for itself.
 */

/* -------------------------------------------------------------------------- */
/* Time                                                                       */
/* -------------------------------------------------------------------------- */

export function isoOf(now: Date): string {
  return now.toISOString();
}

/** Device-local calendar date as `YYYY-MM-DD`. Plan dates are local, not UTC. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Midnight local time for a `YYYY-MM-DD` key. Invalid keys yield `null`. */
export function parseLocalDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + days);
  return out;
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

/** Whole days from `a` to `b` using local calendar dates, so DST does not skew it. */
export function wholeDaysBetween(a: Date, b: Date): number {
  const ka = parseLocalDateKey(localDateKey(a));
  const kb = parseLocalDateKey(localDateKey(b));
  if (!ka || !kb) return 0;
  return Math.round((kb.getTime() - ka.getTime()) / 86_400_000);
}

export function secondsBetween(a: Date | string, b: Date | string): number {
  const ta = typeof a === 'string' ? Date.parse(a) : a.getTime();
  const tb = typeof b === 'string' ? Date.parse(b) : b.getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
  return Math.max(0, Math.floor((tb - ta) / 1000));
}

/** Parses an ISO string, returning `null` for anything unusable. */
export function parseIso(value: string | null): Date | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}

/**
 * Local ids. `crypto.randomUUID` is absent on some older Android WebViews, and a
 * collision here would silently merge two learner records, so ids are built from
 * time plus an in-process counter plus randomness - unique enough for a
 * single-device local store, and stable across restarts.
 */
let idCounter = 0;

export function newId(prefix: string): string {
  idCounter = (idCounter + 1) % 1_000_000;
  const time = Date.now().toString(36);
  const seq = idCounter.toString(36).padStart(4, '0');
  const rand = Math.floor(Math.random() * 1_679_616)
    .toString(36)
    .padStart(4, '0');
  return `${prefix}_${time}${seq}${rand}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/* -------------------------------------------------------------------------- */
/* Default states                                                             */
/* -------------------------------------------------------------------------- */

/**
 * SRS defaults.
 *
 * Ease starts at the SM-2 default. `intervalDays: 0` means "no schedule yet" -
 * a lesson that has never passed is not a review item, and must never appear in
 * the review queue.
 */
export function emptySrs(): SrsState {
  return {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: null,
    lastReviewedAt: null,
    successesSincePass: 0,
  };
}

export function emptyLessonProgress(lessonId: LessonId, now: Date): LessonProgress {
  return {
    lessonId,
    status: 'NOT_STARTED',
    masteryScore: 0,
    firstOpenedAt: null,
    contentReadAt: null,
    lastStudiedAt: null,
    passedAt: null,
    masteredAt: null,
    exercises: {},
    attempts: [],
    bestScore: 0,
    lastScore: 0,
    objectiveCoverage: {},
    reflection: null,
    srs: emptySrs(),
    totalStudySeconds: 0,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function emptyProjectProgress(projectId: string, now: Date): ProjectProgress {
  return {
    projectId,
    status: 'not-started',
    startedAt: null,
    completedAt: null,
    tasks: {},
    milestonesReached: {},
    attachments: [],
    lastWorkedAt: null,
    totalStudySeconds: 0,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

/**
 * Settings defaults, tuned for a learner with a job: 45 minutes a day is enough
 * to make real progress and small enough to survive a bad week.
 */
export function defaultSettings(now: Date): Settings {
  return {
    dailyMinutes: 45,
    // Monday-Saturday; Sunday off by default.
    studyDays: [1, 2, 3, 4, 5, 6],
    focusTracks: [],
    staleSessionMinutes: 15,
    passScoreFloor: 80,
    theme: 'dark',
    reducedMotion: false,
    syncEnabled: false,
    onboardedAt: null,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function emptyDailyPlan(date: string, budgetMinutes: number, now: Date): DailyPlan {
  return {
    date,
    budgetMinutes,
    items: [],
    generatedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function newSession(
  kind: StudySession['kind'],
  refId: string | null,
  now: Date,
  opts: { planDate?: string | null; planItemId?: string | null; targetMinutes?: number | null } = {},
): StudySession {
  return {
    id: newId('ses'),
    kind,
    refId,
    planDate: opts.planDate ?? null,
    planItemId: opts.planItemId ?? null,
    startedAt: isoOf(now),
    endedAt: null,
    state: 'running',
    accumulatedSeconds: 0,
    segmentStartedAt: isoOf(now),
    pausedAt: null,
    targetMinutes: opts.targetMinutes ?? null,
    note: null,
    autoEndedReason: null,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function newNote(
  title: string,
  body: string,
  target: Note['target'],
  now: Date,
  tags: string[] = [],
): Note {
  return {
    id: newId('note'),
    title,
    body,
    target,
    tags,
    pinned: false,
    createdAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function newReminder(label: string, time: string, now: Date): Reminder {
  return {
    id: newId('rem'),
    label,
    time,
    days: [],
    enabled: true,
    frequency: 'daily',
    includeReviewQueue: true,
    lastFiredAt: null,
    nativeId: null,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function newPlanItem(
  item: Omit<PlanItem, 'state' | 'sessionId'> & { state?: PlanItem['state'] },
): PlanItem {
  return { ...item, state: item.state ?? 'planned', sessionId: null };
}

/**
 * Builds an attempt record from a grading result. Grading itself lives in
 * `assessment.ts` so that the numeric tolerance and short-answer normalisation
 * are defined in exactly one place.
 */
export function newAttempt(
  opts: {
    score: number;
    correct: number;
    total: number;
    durationSeconds: number;
    perQuestion: Record<string, boolean>;
    mode?: AssessmentAttempt['mode'];
  },
  now: Date,
): AssessmentAttempt {
  return {
    id: newId('att'),
    at: isoOf(now),
    score: clamp(Math.round(opts.score * 10) / 10, 0, 100),
    correct: opts.correct,
    total: opts.total,
    durationSeconds: Math.max(0, Math.floor(opts.durationSeconds)),
    perQuestion: opts.perQuestion,
    mode: opts.mode ?? 'full',
  };
}
