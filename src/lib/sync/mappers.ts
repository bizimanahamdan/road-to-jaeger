import { allTracks } from '@/lib/curriculum';
import type {
  DailyPlan,
  LessonProgress,
  Note,
  PlanItem,
  ProjectProgress,
  Reminder,
  Settings,
  StudySession,
  TrackId,
} from '@/lib/types';

/**
 * Row <-> record mapping for Supabase.
 *
 * These functions are pure and fully unit-tested, because they are the part of
 * sync that can actually break silently: a field dropped here loses a learner's
 * evidence of mastery, and no amount of correct networking would show it.
 *
 * The remote schema is normalised (see `supabase/migrations/0001_schema.sql`):
 * one row per attempt, per exercise, per objective, per project task, per plan
 * item. The local record is denormalised because that is what the engine wants.
 * Mapping happens here and nowhere else.
 */

/* -------------------------------------------------------------------------- */
/* Row shapes (snake_case, matching the SQL schema)                           */
/* -------------------------------------------------------------------------- */

export interface SettingsRow {
  user_id: string;
  daily_minutes: number;
  study_days: number[];
  focus_tracks: string[];
  stale_session_minutes: number;
  pass_score_floor: number;
  theme: 'dark' | 'light';
  reduced_motion: boolean;
  sync_enabled: boolean;
  onboarded_at: string | null;
  updated_at: string;
}

export interface LessonProgressRow {
  user_id: string;
  lesson_id: string;
  status: string;
  mastery_score: number;
  best_score: number;
  last_score: number;
  first_opened_at: string | null;
  content_read_at: string | null;
  last_studied_at: string | null;
  passed_at: string | null;
  mastered_at: string | null;
  reflection_text: string | null;
  reflection_at: string | null;
  total_study_seconds: number;
  srs_ease: number;
  srs_interval_days: number;
  srs_repetitions: number;
  srs_lapses: number;
  srs_due_at: string | null;
  srs_last_reviewed_at: string | null;
  srs_successes_since_pass: number;
  updated_at: string;
}

export interface AttemptRow {
  id: string;
  user_id: string;
  lesson_id: string;
  taken_at: string;
  score: number;
  correct: number;
  total: number;
  duration_seconds: number;
  mode: 'full' | 'review';
  per_question: Record<string, boolean>;
}

export interface ExerciseRow {
  user_id: string;
  lesson_id: string;
  exercise_id: string;
  done: boolean;
  attempts: number;
  last_at: string | null;
  note: string | null;
}

export interface ObjectiveRow {
  user_id: string;
  lesson_id: string;
  objective_id: string;
  coverage: 'unseen' | 'incorrect' | 'correct';
}

export interface ProjectProgressRow {
  user_id: string;
  project_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  last_worked_at: string | null;
  total_study_seconds: number;
  updated_at: string;
}

export interface ProjectTaskRow {
  user_id: string;
  project_id: string;
  task_id: string;
  done: boolean;
  done_at: string | null;
  note: string | null;
}

export interface SessionRow {
  id: string;
  user_id: string;
  kind: string;
  ref_id: string | null;
  plan_date: string | null;
  plan_item_id: string | null;
  started_at: string;
  ended_at: string | null;
  state: string;
  accumulated_seconds: number;
  segment_started_at: string | null;
  paused_at: string | null;
  target_minutes: number | null;
  note: string | null;
  auto_ended_reason: string | null;
  updated_at: string;
}

export interface PlanRow {
  user_id: string;
  plan_date: string;
  budget_minutes: number;
  generated_at: string;
  updated_at: string;
}

export interface PlanItemRow {
  user_id: string;
  plan_date: string;
  item_id: string;
  kind: string;
  ref_id: string;
  title: string;
  subject_id: string | null;
  estimated_minutes: number;
  item_order: number;
  state: string;
  reason: string;
  session_id: string | null;
}

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  target_kind: string;
  target_id: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderRow {
  id: string;
  user_id: string;
  label: string;
  time_of_day: string;
  days: number[];
  enabled: boolean;
  frequency: string;
  include_review_queue: boolean;
  last_fired_at: string | null;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/* Records -> rows                                                            */
/* -------------------------------------------------------------------------- */

export function settingsToRow(userId: string, s: Settings): SettingsRow {
  return {
    user_id: userId,
    daily_minutes: s.dailyMinutes,
    study_days: s.studyDays,
    focus_tracks: s.focusTracks,
    stale_session_minutes: s.staleSessionMinutes,
    pass_score_floor: s.passScoreFloor,
    theme: s.theme,
    reduced_motion: s.reducedMotion,
    sync_enabled: s.syncEnabled,
    onboarded_at: s.onboardedAt,
    updated_at: s.updatedAt,
  };
}

export function settingsFromRow(row: SettingsRow, fallback: Settings): Settings {
  return {
    dailyMinutes: num(row.daily_minutes, fallback.dailyMinutes),
    studyDays: numArray(row.study_days, fallback.studyDays),
    focusTracks: toTrackIds(strArray(row.focus_tracks, fallback.focusTracks)),
    staleSessionMinutes: num(row.stale_session_minutes, fallback.staleSessionMinutes),
    passScoreFloor: num(row.pass_score_floor, fallback.passScoreFloor),
    theme: row.theme === 'light' ? 'light' : 'dark',
    reducedMotion: Boolean(row.reduced_motion),
    syncEnabled: Boolean(row.sync_enabled),
    onboardedAt: row.onboarded_at ?? null,
    updatedAt: row.updated_at ?? new Date(0).toISOString(),
    dirty: false,
  };
}

export function lessonToRow(userId: string, p: LessonProgress): LessonProgressRow {
  return {
    user_id: userId,
    lesson_id: p.lessonId,
    status: p.status,
    mastery_score: p.masteryScore,
    best_score: p.bestScore,
    last_score: p.lastScore,
    first_opened_at: p.firstOpenedAt,
    content_read_at: p.contentReadAt,
    last_studied_at: p.lastStudiedAt,
    passed_at: p.passedAt,
    mastered_at: p.masteredAt,
    reflection_text: p.reflection?.text ?? null,
    reflection_at: p.reflection?.at ?? null,
    total_study_seconds: p.totalStudySeconds,
    srs_ease: p.srs.ease,
    srs_interval_days: p.srs.intervalDays,
    srs_repetitions: p.srs.repetitions,
    srs_lapses: p.srs.lapses,
    srs_due_at: p.srs.dueAt,
    srs_last_reviewed_at: p.srs.lastReviewedAt,
    srs_successes_since_pass: p.srs.successesSincePass,
    updated_at: p.updatedAt,
  };
}

export function lessonToChildRows(userId: string, p: LessonProgress): {
  attempts: AttemptRow[];
  exercises: ExerciseRow[];
  objectives: ObjectiveRow[];
} {
  return {
    attempts: p.attempts.map((a) => ({
      id: a.id,
      user_id: userId,
      lesson_id: p.lessonId,
      taken_at: a.at,
      score: a.score,
      correct: a.correct,
      total: a.total,
      duration_seconds: a.durationSeconds,
      mode: a.mode,
      per_question: a.perQuestion,
    })),
    exercises: Object.entries(p.exercises).map(([exerciseId, e]) => ({
      user_id: userId,
      lesson_id: p.lessonId,
      exercise_id: exerciseId,
      done: e.done,
      attempts: e.attempts,
      last_at: e.lastAt,
      note: e.note ?? null,
    })),
    objectives: Object.entries(p.objectiveCoverage).map(([objectiveId, coverage]) => ({
      user_id: userId,
      lesson_id: p.lessonId,
      objective_id: objectiveId,
      coverage,
    })),
  };
}

/** Reassembles a lesson record from its normalised rows. */
export function lessonFromRows(
  main: LessonProgressRow,
  attempts: AttemptRow[],
  exercises: ExerciseRow[],
  objectives: ObjectiveRow[],
): LessonProgress {
  return {
    lessonId: main.lesson_id,
    status: statusOf(main.status),
    masteryScore: num(main.mastery_score, 0),
    firstOpenedAt: main.first_opened_at ?? null,
    contentReadAt: main.content_read_at ?? null,
    lastStudiedAt: main.last_studied_at ?? null,
    passedAt: main.passed_at ?? null,
    masteredAt: main.mastered_at ?? null,
    exercises: Object.fromEntries(
      exercises.map((e) => [
        e.exercise_id,
        { done: Boolean(e.done), attempts: num(e.attempts, 0), lastAt: e.last_at ?? null, note: e.note ?? undefined },
      ]),
    ),
    attempts: attempts
      .map((a) => ({
        id: a.id,
        at: a.taken_at,
        score: num(a.score, 0),
        correct: num(a.correct, 0),
        total: num(a.total, 0),
        durationSeconds: num(a.duration_seconds, 0),
        mode: a.mode === 'review' ? ('review' as const) : ('full' as const),
        perQuestion: a.per_question ?? {},
      }))
      .sort((x, y) => x.at.localeCompare(y.at)),
    bestScore: num(main.best_score, 0),
    lastScore: num(main.last_score, 0),
    objectiveCoverage: Object.fromEntries(objectives.map((o) => [o.objective_id, o.coverage])),
    reflection: main.reflection_text
      ? { text: main.reflection_text, at: main.reflection_at ?? main.updated_at }
      : null,
    srs: {
      ease: num(main.srs_ease, 2.5),
      intervalDays: num(main.srs_interval_days, 0),
      repetitions: num(main.srs_repetitions, 0),
      lapses: num(main.srs_lapses, 0),
      dueAt: main.srs_due_at ?? null,
      lastReviewedAt: main.srs_last_reviewed_at ?? null,
      successesSincePass: num(main.srs_successes_since_pass, 0),
    },
    totalStudySeconds: num(main.total_study_seconds, 0),
    updatedAt: main.updated_at ?? new Date(0).toISOString(),
    dirty: false,
  };
}

export function projectToRows(userId: string, p: ProjectProgress): {
  main: ProjectProgressRow;
  tasks: ProjectTaskRow[];
} {
  return {
    main: {
      user_id: userId,
      project_id: p.projectId,
      status: p.status,
      started_at: p.startedAt,
      completed_at: p.completedAt,
      last_worked_at: p.lastWorkedAt,
      total_study_seconds: p.totalStudySeconds,
      updated_at: p.updatedAt,
    },
    tasks: Object.entries(p.tasks).map(([taskId, t]) => ({
      user_id: userId,
      project_id: p.projectId,
      task_id: taskId,
      done: t.done,
      done_at: t.doneAt,
      note: t.note ?? null,
    })),
  };
}

export function projectFromRows(
  main: ProjectProgressRow,
  tasks: ProjectTaskRow[],
): ProjectProgress {
  return {
    projectId: main.project_id,
    status: main.status as ProjectProgress['status'],
    startedAt: main.started_at ?? null,
    completedAt: main.completed_at ?? null,
    tasks: Object.fromEntries(
      tasks.map((t) => [t.task_id, { done: Boolean(t.done), doneAt: t.done_at ?? null, note: t.note ?? undefined }]),
    ),
    // Milestones are derived from tasks on load; storing them remotely would let
    // a stale row contradict the tasks that produce it.
    milestonesReached: {},
    attachments: [],
    lastWorkedAt: main.last_worked_at ?? null,
    totalStudySeconds: num(main.total_study_seconds, 0),
    updatedAt: main.updated_at ?? new Date(0).toISOString(),
    dirty: false,
  };
}

export function sessionToRow(userId: string, s: StudySession): SessionRow {
  return {
    id: s.id,
    user_id: userId,
    kind: s.kind,
    ref_id: s.refId,
    plan_date: s.planDate,
    plan_item_id: s.planItemId,
    started_at: s.startedAt,
    ended_at: s.endedAt,
    state: s.state,
    accumulated_seconds: s.accumulatedSeconds,
    segment_started_at: s.segmentStartedAt,
    paused_at: s.pausedAt,
    target_minutes: s.targetMinutes,
    note: s.note,
    auto_ended_reason: s.autoEndedReason,
    updated_at: s.updatedAt,
  };
}

export function sessionFromRow(row: SessionRow): StudySession {
  return {
    id: row.id,
    kind: row.kind as StudySession['kind'],
    refId: row.ref_id ?? null,
    planDate: row.plan_date ?? null,
    planItemId: row.plan_item_id ?? null,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    state: row.state as StudySession['state'],
    accumulatedSeconds: num(row.accumulated_seconds, 0),
    segmentStartedAt: row.segment_started_at ?? null,
    pausedAt: row.paused_at ?? null,
    targetMinutes: row.target_minutes ?? null,
    note: row.note ?? null,
    autoEndedReason: row.auto_ended_reason ?? null,
    updatedAt: row.updated_at ?? row.started_at,
    dirty: false,
  };
}

export function planToRows(userId: string, plan: DailyPlan): { main: PlanRow; items: PlanItemRow[] } {
  return {
    main: {
      user_id: userId,
      plan_date: plan.date,
      budget_minutes: plan.budgetMinutes,
      generated_at: plan.generatedAt,
      updated_at: plan.updatedAt,
    },
    items: plan.items.map((i) => planItemToRow(userId, plan.date, i)),
  };
}

export function planItemToRow(userId: string, date: string, i: PlanItem): PlanItemRow {
  return {
    user_id: userId,
    plan_date: date,
    item_id: i.id,
    kind: i.kind,
    ref_id: i.refId,
    title: i.title,
    subject_id: i.subjectId ?? null,
    estimated_minutes: i.estimatedMinutes,
    item_order: i.order,
    state: i.state,
    reason: i.reason,
    session_id: i.sessionId ?? null,
  };
}

export function planFromRows(main: PlanRow, items: PlanItemRow[]): DailyPlan {
  return {
    date: main.plan_date,
    budgetMinutes: num(main.budget_minutes, 45),
    items: items
      .map((i) => ({
        id: i.item_id,
        kind: i.kind as PlanItem['kind'],
        refId: i.ref_id,
        title: i.title,
        subjectId: i.subject_id ?? undefined,
        estimatedMinutes: num(i.estimated_minutes, 0),
        order: num(i.item_order, 0),
        state: i.state as PlanItem['state'],
        reason: i.reason ?? '',
        sessionId: i.session_id ?? null,
      }))
      .sort((a, b) => a.order - b.order),
    generatedAt: main.generated_at ?? main.updated_at,
    updatedAt: main.updated_at ?? main.generated_at,
    dirty: false,
  };
}

export function noteToRow(userId: string, n: Note): NoteRow {
  return {
    id: n.id,
    user_id: userId,
    title: n.title,
    body: n.body,
    target_kind: n.target.kind,
    target_id: n.target.id,
    tags: n.tags,
    pinned: n.pinned,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
}

export function noteFromRow(row: NoteRow): Note {
  const kind = row.target_kind as Note['target']['kind'];
  return {
    id: row.id,
    title: row.title ?? '',
    body: row.body ?? '',
    target: kind === 'general' ? { kind, id: 'general' } : { kind, id: row.target_id } as Note['target'],
    tags: strArray(row.tags, []),
    pinned: Boolean(row.pinned),
    createdAt: row.created_at ?? row.updated_at,
    updatedAt: row.updated_at ?? row.created_at,
    dirty: false,
  };
}

export function reminderToRow(userId: string, r: Reminder): ReminderRow {
  return {
    id: r.id,
    user_id: userId,
    label: r.label,
    time_of_day: r.time,
    days: r.days,
    enabled: r.enabled,
    frequency: r.frequency,
    include_review_queue: r.includeReviewQueue,
    last_fired_at: r.lastFiredAt,
    updated_at: r.updatedAt,
  };
}

export function reminderFromRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    label: row.label ?? 'Study reminder',
    time: /^\d{2}:\d{2}$/.test(row.time_of_day ?? '') ? row.time_of_day : '18:00',
    days: numArray(row.days, []),
    enabled: Boolean(row.enabled),
    frequency: (row.frequency as Reminder['frequency']) ?? 'daily',
    includeReviewQueue: Boolean(row.include_review_queue),
    lastFiredAt: row.last_fired_at ?? null,
    updatedAt: row.updated_at ?? new Date(0).toISOString(),
    dirty: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Defensive coercion: a remote column may be null, a string, or absent         */
/* -------------------------------------------------------------------------- */

/**
 * Keeps only ids that are real tracks. A remote row could contain a track that no
 * longer exists after a content change, and an unknown id would break every
 * `Set<TrackId>` lookup downstream.
 */
export function toTrackIds(values: string[]): TrackId[] {
  const valid = new Set<string>(allTracks().map((t) => t.id));
  return values.filter((v): v is TrackId => valid.has(v));
}

export function num(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

export function numArray(value: unknown, fallback: number[]): number[] {
  return Array.isArray(value) ? value.map((v) => num(v, 0)).filter((v) => Number.isFinite(v)) : fallback;
}

export function strArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : fallback;
}

function statusOf(value: string): LessonProgress['status'] {
  switch (value) {
    case 'LEARNING':
    case 'PRACTICING':
    case 'REVIEW':
    case 'MASTERED':
      return value;
    default:
      return 'NOT_STARTED';
  }
}
