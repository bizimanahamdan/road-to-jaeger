/**
 * Road to Jaeger - domain model.
 *
 * Two kinds of data live in this app and they are kept strictly separate:
 *
 *   CONTENT (curriculum)  - tracks, subjects, lessons, resources, exercises,
 *                           assessments, projects, skills. Authored in
 *                           `src/data/curriculum`, compiled into the bundle so
 *                           it is always available offline, and exported to SQL
 *                           for Supabase by `scripts/export-curriculum-sql.mjs`.
 *                           Content is read-only at runtime.
 *
 *   STATE  (the learner)  - lesson progress, study sessions, plans, project
 *                           progress, notes, settings, reminders. Written to
 *                           IndexedDB, optionally synced to Supabase.
 *
 * Nothing in STATE is ever derived by guessing: mastery only ever comes from a
 * recorded assessment result plus completed practice plus a retained review.
 */

/* -------------------------------------------------------------------------- */
/* Curriculum identifiers                                                     */
/* -------------------------------------------------------------------------- */

export type TrackId =
  | 'foundation'
  | 'software'
  | 'electronics'
  | 'embedded'
  | 'mechanical'
  | 'cad'
  | 'control'
  | 'robotics'
  | 'ai-robotics'
  | 'humanoid'
  | 'systems'
  | 'large-robotics';

export type SubjectId = string;
export type LessonId = string;
export type ProjectId = string;
export type SkillId = string;

/**
 * How trustworthy a track's endpoint is, today.
 *
 * `core`       - well established engineering, learnable now with free resources.
 * `advanced`   - established but needs hardware, deeper math and real projects.
 * `frontier`   - active research. Teachable in principle, but no course of study
 *                in this app can promise a working outcome.
 */
export type TrackMaturity = 'core' | 'advanced' | 'frontier';

export interface Track {
  id: TrackId;
  /** Short engineering designation shown in the roadmap, e.g. "FND". */
  code: string;
  name: string;
  order: number;
  summary: string;
  maturity: TrackMaturity;
  /**
   * Plain-language statement of what this track can and cannot promise.
   * Always rendered next to the track so the learner is never misled.
   */
  realityCheck: string;
  subjectIds: SubjectId[];
}

export type Difficulty = 'intro' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Subject {
  id: SubjectId;
  trackId: TrackId;
  name: string;
  /** e.g. "MATH", "EE" - stamped on cards for fast scanning. */
  code: string;
  order: number;
  description: string;
  /** Subject-level prerequisites (used for roadmap ordering/unlock hints). */
  prerequisites: SubjectId[];
}

/* -------------------------------------------------------------------------- */
/* Lesson content                                                             */
/* -------------------------------------------------------------------------- */

export interface Objective {
  id: string;
  /** What the learner must be able to do. Verb-first, checkable. */
  text: string;
}

export type ResourceKind =
  | 'video'
  | 'docs'
  | 'article'
  | 'course'
  | 'book'
  | 'simulator'
  | 'practice'
  | 'tool';

export interface Resource {
  id: string;
  title: string;
  kind: ResourceKind;
  url: string;
  author?: string;
  /** True when no payment or account is required to use it. */
  free: boolean;
  /** Approximate consumption time, used by the daily planner. */
  minutes?: number;
  /**
   * Set by `npm run check:resources` after the URL is fetched successfully.
   * Authored links ship as `false` - this app does not claim a URL works
   * until something has actually verified it.
   */
  verified: boolean;
  note?: string;
}

export type ExerciseKind =
  | 'question'
  | 'calculation'
  | 'code'
  | 'build'
  | 'measurement'
  | 'reflection';

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  prompt: string;
  hint?: string;
  /** Reference answer/solution. Hidden until the learner marks it done. */
  solution?: string;
  minutes: number;
  /** True when the exercise needs physical parts, not just a browser. */
  requiresHardware?: boolean;
  hardware?: string[];
}

export type QuestionType = 'mcq' | 'numeric' | 'short';

export interface AssessmentQuestion {
  id: string;
  /** Which objective this question evidences. Drives objective coverage. */
  objectiveId: string;
  type: QuestionType;
  prompt: string;
  /** Present for `mcq` only. */
  choices?: string[];
  /**
   * `mcq`     -> index into `choices`
   * `numeric` -> accepted value (string form also allowed, e.g. "1.5e3")
   * `short`   -> accepted answer(s); case/punctuation insensitive, and a
   *              candidate is correct if it matches any entry.
   */
  answer: number | string | string[];
  /** Relative tolerance for `numeric`, e.g. 0.02 = +/- 2%. Default 0.01. */
  tolerance?: number;
  unit?: string;
  /** Shown after answering - the explanation is part of the teaching. */
  explanation: string;
}

export interface Assessment {
  id: string;
  /** Percentage of questions that must be correct to pass. */
  passScore: number;
  questions: AssessmentQuestion[];
  suggestedMinutes: number;
}

/** A block of lesson body text. Structured rather than markdown on purpose: */
/** no parser dependency, no runtime cost, fully typed, renders identically */
/** on a 2 GB phone. */
export type LearnBlock =
  | { kind: 'text'; heading: string; body: string[]; bullets?: string[] }
  | { kind: 'formula'; heading: string; formula: string; defines?: string[]; body?: string[] }
  | {
      kind: 'example';
      heading: string;
      problem: string;
      solution: string[];
      answer?: string;
    }
  | {
      kind: 'callout';
      tone: 'warning' | 'note' | 'safety';
      heading: string;
      body: string[];
    }
  | { kind: 'table'; heading: string; columns: string[]; rows: string[][] };

export interface Lesson {
  id: LessonId;
  subjectId: SubjectId;
  trackId: TrackId;
  title: string;
  order: number;
  /** One or two sentences: what this lesson is. */
  description: string;
  /** Why a robotics engineer specifically needs this. */
  whyItMatters: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  /** Lesson ids that must be *passed* before this lesson unlocks. */
  prerequisites: LessonId[];
  objectives: Objective[];
  learn: LearnBlock[];
  resources: Resource[];
  exercises: Exercise[];
  /** How many exercises must be completed before the lesson can pass. */
  exercisesRequired: number;
  assessment: Assessment;
  /** Skill ids granted when this lesson reaches MASTERED. */
  grantsSkills?: SkillId[];
  requiresHardware?: boolean;
  hardware?: string[];
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export interface Skill {
  id: SkillId;
  name: string;
  trackId: TrackId;
  description: string;
  /** A skill is unlocked only when every one of these lessons is MASTERED. */
  requiredLessons: LessonId[];
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export type ProjectStage =
  | 'bench'
  | 'small-robot'
  | 'robotic-arm'
  | 'autonomous-robot'
  | 'advanced-manipulator'
  | 'small-humanoid'
  | 'large-subsystem'
  | 'large-scale-research';

export interface ProjectMilestone {
  id: string;
  title: string;
  detail: string;
  order: number;
  /** Task ids that must be done for this milestone to count as reached. */
  taskIds: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  detail?: string;
  order: number;
  estimatedMinutes: number;
  milestoneId?: string;
  requiresHardware?: boolean;
}

export interface Project {
  id: ProjectId;
  name: string;
  stage: ProjectStage;
  trackIds: TrackId[];
  description: string;
  difficulty: Difficulty;
  order: number;
  /** Lesson ids the learner should have passed before starting. */
  requiredSkills: LessonId[];
  materials: string[];
  estimatedCostUsd?: number;
  requiresHardware: boolean;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  /** What "done" actually means - a demonstrable outcome, not a feeling. */
  acceptanceCriteria: string[];
  learningOutcomes: string[];
}

/* -------------------------------------------------------------------------- */
/* Learner state                                                              */
/* -------------------------------------------------------------------------- */

export const LESSON_STATUSES = [
  'NOT_STARTED',
  'LEARNING',
  'PRACTICING',
  'REVIEW',
  'MASTERED',
] as const;

export type LessonStatus = (typeof LESSON_STATUSES)[number];

export interface ExerciseState {
  done: boolean;
  attempts: number;
  lastAt: string | null;
  note?: string;
}

export interface AssessmentAttempt {
  id: string;
  at: string;
  score: number;
  correct: number;
  total: number;
  durationSeconds: number;
  /** questionId -> correct? */
  perQuestion: Record<string, boolean>;
  /** Which mode produced this attempt. */
  mode: 'full' | 'review';
}

export type ObjectiveCoverage = 'unseen' | 'incorrect' | 'correct';

/** Spaced-repetition state (SM-2 derived, simplified and fully deterministic). */
export interface SrsState {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
  /** Number of successful post-pass reviews. Mastery requires at least one. */
  successesSincePass: number;
}

export interface Reflection {
  text: string;
  at: string;
}

export interface LessonProgress {
  lessonId: LessonId;
  status: LessonStatus;
  /** 0-100. Computed, never assigned by hand. See engine/mastery.ts. */
  masteryScore: number;
  firstOpenedAt: string | null;
  contentReadAt: string | null;
  lastStudiedAt: string | null;
  passedAt: string | null;
  masteredAt: string | null;
  exercises: Record<string, ExerciseState>;
  attempts: AssessmentAttempt[];
  bestScore: number;
  lastScore: number;
  /** objectiveId -> best observed coverage across all attempts. */
  objectiveCoverage: Record<string, ObjectiveCoverage>;
  reflection: Reflection | null;
  srs: SrsState;
  totalStudySeconds: number;
  updatedAt: string;
  /** Local write not yet pushed to Supabase. */
  dirty: boolean;
}

export type SessionKind = 'lesson' | 'review' | 'project' | 'free';
export type SessionState = 'running' | 'paused' | 'completed' | 'skipped' | 'abandoned';

export interface StudySession {
  id: string;
  kind: SessionKind;
  /** lessonId / projectId; null for free-form study. */
  refId: string | null;
  planDate: string | null;
  planItemId: string | null;
  startedAt: string;
  endedAt: string | null;
  state: SessionState;
  /** Whole seconds credited from finished running segments. */
  accumulatedSeconds: number;
  /** Start of the current running segment (only when state === 'running'). */
  segmentStartedAt: string | null;
  pausedAt: string | null;
  targetMinutes: number | null;
  note: string | null;
  /** Set when the app auto-closed a session that was left running. */
  autoEndedReason: string | null;
  updatedAt: string;
  dirty: boolean;
}

export type PlanItemKind = 'review' | 'lesson' | 'project-task';
export type PlanItemState = 'planned' | 'in-progress' | 'done' | 'skipped';

export interface PlanItem {
  id: string;
  kind: PlanItemKind;
  refId: string;
  title: string;
  subjectId?: string;
  estimatedMinutes: number;
  order: number;
  state: PlanItemState;
  reason: string;
  sessionId?: string | null;
}

export interface DailyPlan {
  /** Local date, `YYYY-MM-DD`. */
  date: string;
  budgetMinutes: number;
  items: PlanItem[];
  generatedAt: string;
  updatedAt: string;
  dirty: boolean;
}

export type ProjectStatus = 'not-started' | 'active' | 'blocked' | 'completed' | 'abandoned';

export interface ProjectProgress {
  projectId: ProjectId;
  status: ProjectStatus;
  startedAt: string | null;
  completedAt: string | null;
  tasks: Record<string, { done: boolean; doneAt: string | null; note?: string }>;
  milestonesReached: Record<string, string | null>;
  /** Photo/file references. Capacitor-only; see lib/media.ts for the limits. */
  attachments: { id: string; name: string; kind: 'image' | 'file'; storedAt: string }[];
  lastWorkedAt: string | null;
  totalStudySeconds: number;
  updatedAt: string;
  dirty: boolean;
}

export type NoteTarget =
  | { kind: 'lesson'; id: LessonId }
  | { kind: 'subject'; id: SubjectId }
  | { kind: 'project'; id: ProjectId }
  | { kind: 'track'; id: TrackId }
  | { kind: 'general'; id: 'general' };

export interface Note {
  id: string;
  title: string;
  body: string;
  target: NoteTarget;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  dirty: boolean;
}

export type ReminderFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Reminder {
  id: string;
  label: string;
  /** `HH:MM` in device local time. */
  time: string;
  /** 0 = Sunday ... 6 = Saturday. Used when frequency === 'custom'. */
  days: number[];
  enabled: boolean;
  frequency: ReminderFrequency;
  /** Nudge earlier when reviews are overdue. */
  includeReviewQueue: boolean;
  lastFiredAt: string | null;
  /** Platform notification id, when scheduled natively. */
  nativeId?: number | null;
  updatedAt: string;
  dirty: boolean;
}

export interface Settings {
  /** Daily study budget in minutes. */
  dailyMinutes: number;
  /** 0-6, days the learner intends to study. */
  studyDays: number[];
  /** Prefer lessons from these tracks when the planner has a free choice. */
  focusTracks: TrackId[];
  /** Auto-close a session left running for longer than this. */
  staleSessionMinutes: number;
  /** Percentage score required to pass an assessment (floor; lessons may set more). */
  passScoreFloor: number;
  theme: 'dark' | 'light';
  reducedMotion: boolean;
  syncEnabled: boolean;
  onboardedAt: string | null;
  updatedAt: string;
  dirty: boolean;
}

export interface SyncState {
  mode: 'local' | 'supabase';
  configured: boolean;
  signedIn: boolean;
  userId: string | null;
  lastPushedAt: string | null;
  lastPulledAt: string | null;
  lastError: string | null;
  pendingWrites: number;
  lastAttemptAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* Derived read models (never persisted)                                      */
/* -------------------------------------------------------------------------- */

export interface LessonViewModel {
  lesson: Lesson;
  subject: Subject;
  track: Track;
  progress: LessonProgress;
  unlocked: boolean;
  missingPrerequisites: { id: LessonId; title: string; status: LessonStatus }[];
  retention: number;
  exercisesDone: number;
  exercisesRequired: number;
  objectivesMet: number;
  objectivesTotal: number;
  reviewDue: boolean;
  reviewOverdue: boolean;
}

export interface SubjectProgress {
  subject: Subject;
  track: Track;
  total: number;
  notStarted: number;
  learning: number;
  practicing: number;
  review: number;
  mastered: number;
  /** Mean mastery of lessons that have actually been attempted. */
  averageMasteryOfAttempted: number;
  attempted: number;
  studySeconds: number;
  /** First lesson in this subject that is unlocked and not yet mastered. */
  nextLessonId: LessonId | null;
}

export interface TrackProgress {
  track: Track;
  subjects: SubjectProgress[];
  total: number;
  mastered: number;
  passed: number;
  started: number;
  studySeconds: number;
}

export interface ProgressSnapshot {
  generatedAt: string;
  lessons: {
    total: number;
    notStarted: number;
    learning: number;
    practicing: number;
    review: number;
    mastered: number;
    /** Lessons whose assessment has been passed (status REVIEW or MASTERED). */
    passed: number;
  };
  subjects: SubjectProgress[];
  tracks: TrackProgress[];
  study: {
    totalSeconds: number;
    todaySeconds: number;
    last7DaysSeconds: number;
    sessionsCompleted: number;
    /** Consecutive days with at least one credited session. */
    streakDays: number;
    longestStreakDays: number;
    dailyTargetMinutes: number;
    dailyTargetHitDaysLast30: number;
    /** Per-day credited seconds for the last N days, oldest first. */
    activity: { date: string; seconds: number }[];
  };
  reviews: {
    dueNow: number;
    overdue: number;
    scheduledNext30Days: number;
    oldestOverdueLessonId: LessonId | null;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    tasksTotal: number;
    tasksDone: number;
  };
  skills: {
    total: number;
    unlocked: number;
    unlockedIds: SkillId[];
  };
  /** Deepest point of the roadmap the learner has legitimately reached. */
  roadmapPosition: {
    trackId: TrackId | null;
    subjectId: SubjectId | null;
    lessonId: LessonId | null;
    description: string;
  };
}
