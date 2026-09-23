import { allLessons, allProjects } from '@/lib/curriculum';
import { refreshProgress } from '@/lib/engine/mastery';
import { closeStaleSessions } from '@/lib/engine/session';
import { defaultSettings, emptyLessonProgress, emptyProjectProgress } from '@/lib/engine/state';
import type {
  DailyPlan,
  LessonProgress,
  Note,
  ProjectProgress,
  Reminder,
  Settings,
  StudySession,
  SyncState,
} from '@/lib/types';
import { dbDelete, dbGet, dbGetAll, dbPut, dbPutMany, isMemoryOnly } from './idb';

/**
 * The persistence boundary.
 *
 * Everything the learner has done lives here, keyed the way the engine wants it.
 * Three responsibilities matter:
 *
 *  1. **Self-healing on load.** Content updates add lessons; a learner's stored
 *     state must gain a record for each new one rather than crash on a missing
 *     key. Records that fail validation are replaced with empty ones, because a
 *     corrupt local row should cost a learner one lesson, not the app.
 *  2. **Recomputing derived state after the app has been closed.** Mastery is a
 *     function of evidence *and time*: retention decays while nobody is looking.
 *     `bootstrap` refreshes every lesson so a `MASTERED` status that no longer
 *     holds is demoted on the next open, not left standing.
 *  3. **Closing abandoned sessions.** A session left running when the app was
 *     killed is settled here, with its credit capped, so study time cannot be
 *     inflated by forgetting to press stop.
 */

export const SETTINGS_KEY = 'settings';
export const SYNC_KEY = 'sync';

export interface LearnerState {
  settings: Settings;
  /** lessonId -> progress. Every curriculum lesson has an entry after bootstrap. */
  lessons: Record<string, LessonProgress>;
  /** projectId -> progress. Every project has an entry after bootstrap. */
  projects: Record<string, ProjectProgress>;
  sessions: StudySession[];
  /** date (YYYY-MM-DD) -> plan */
  plans: Record<string, DailyPlan>;
  notes: Note[];
  reminders: Reminder[];
  sync: SyncState;
}

export function emptySyncState(): SyncState {
  return {
    mode: 'local',
    configured: false,
    signedIn: false,
    userId: null,
    lastPushedAt: null,
    lastPulledAt: null,
    lastError: null,
    pendingWrites: 0,
    lastAttemptAt: null,
  };
}

export function emptyLearnerState(now: Date): LearnerState {
  // Defaults are not "unsynced changes": a fresh device has nothing to push
  // until the learner actually changes a setting.
  const settings: Settings = { ...defaultSettings(now), dirty: false };
  const lessons: Record<string, LessonProgress> = {};
  for (const lesson of allLessons()) {
    lessons[lesson.id] = { ...emptyLessonProgress(lesson.id, now), dirty: false };
  }
  const projects: Record<string, ProjectProgress> = {};
  for (const project of allProjects()) {
    projects[project.id] = { ...emptyProjectProgress(project.id, now), dirty: false };
  }
  return {
    settings,
    lessons,
    projects,
    sessions: [],
    plans: {},
    notes: [],
    reminders: [],
    sync: emptySyncState(),
  };
}

/* -------------------------------------------------------------------------- */
/* Validation on read                                                         */
/* -------------------------------------------------------------------------- */

function isValidLessonProgress(value: unknown): value is LessonProgress {
  const v = value as LessonProgress | null;
  return (
    !!v &&
    typeof v.lessonId === 'string' &&
    typeof v.masteryScore === 'number' &&
    Array.isArray(v.attempts) &&
    typeof v.exercises === 'object' &&
    typeof v.objectiveCoverage === 'object' &&
    typeof v.srs === 'object' &&
    v.srs !== null
  );
}

function isValidSession(value: unknown): value is StudySession {
  const v = value as StudySession | null;
  return (
    !!v &&
    typeof v.id === 'string' &&
    typeof v.startedAt === 'string' &&
    typeof v.accumulatedSeconds === 'number' &&
    typeof v.state === 'string'
  );
}

function isValidNote(value: unknown): value is Note {
  const v = value as Note | null;
  return !!v && typeof v.id === 'string' && typeof v.body === 'string' && !!v.target;
}

function isValidReminder(value: unknown): value is Reminder {
  const v = value as Reminder | null;
  return !!v && typeof v.id === 'string' && /^\d{2}:\d{2}$/.test(v.time ?? '');
}

function isValidPlan(value: unknown): value is DailyPlan {
  const v = value as DailyPlan | null;
  return !!v && typeof v.date === 'string' && Array.isArray(v.items);
}

function isValidSettings(value: unknown): value is Settings {
  const v = value as Settings | null;
  return !!v && typeof v.dailyMinutes === 'number' && Array.isArray(v.studyDays);
}

function isValidProjectProgress(value: unknown): value is ProjectProgress {
  const v = value as ProjectProgress | null;
  return !!v && typeof v.projectId === 'string' && typeof v.tasks === 'object' && v.tasks !== null;
}

/* -------------------------------------------------------------------------- */
/* Load                                                                       */
/* -------------------------------------------------------------------------- */

export interface BootstrapResult {
  state: LearnerState;
  /** Records that were repaired, created or recomputed during load. */
  repaired: number;
  storageAvailable: boolean;
}

/**
 * Loads the learner's state, repairs it, and settles anything time-dependent.
 *
 * Safe to call repeatedly; the store calls it once on mount.
 */
export async function bootstrap(now: Date): Promise<BootstrapResult> {
  const base = emptyLearnerState(now);
  let repaired = 0;

  const [storedSettings, storedSync, storedLessons, storedProjects, storedSessions, storedPlans, storedNotes, storedReminders] =
    await Promise.all([
      dbGet<Settings>('settings', SETTINGS_KEY),
      dbGet<SyncState>('meta', SYNC_KEY),
      dbGetAll<LessonProgress>('lessonProgress'),
      dbGetAll<ProjectProgress>('projectProgress'),
      dbGetAll<StudySession>('sessions'),
      dbGetAll<DailyPlan>('plans'),
      dbGetAll<Note>('notes'),
      dbGetAll<Reminder>('reminders'),
    ]);

  const settings: Settings = isValidSettings(storedSettings)
    ? { ...base.settings, ...storedSettings }
    : base.settings;
  if (!isValidSettings(storedSettings)) repaired += 1;

  const state: LearnerState = {
    settings,
    lessons: base.lessons,
    projects: base.projects,
    sessions: [],
    plans: {},
    notes: [],
    reminders: [],
    sync: storedSync ?? emptySyncState(),
  };

  /* Lesson progress: adopt valid records, fill gaps for new lessons. */
  for (const record of storedLessons) {
    if (!isValidLessonProgress(record)) {
      repaired += 1;
      continue;
    }
    if (!base.lessons[record.lessonId]) {
      // A record for a lesson that no longer exists is kept out of the map but
      // not deleted, so a content rollback cannot destroy a learner's history.
      continue;
    }
    state.lessons[record.lessonId] = record;
  }
  for (const lesson of allLessons()) {
    const existing = state.lessons[lesson.id];
    if (!existing) {
      state.lessons[lesson.id] = { ...emptyLessonProgress(lesson.id, now), dirty: false };
      continue;
    }
    // Time passed while the app was closed: retention decays, mastery can fall.
    const refreshed = refreshProgress(lesson, existing, now, settings.passScoreFloor);
    if (refreshed !== existing) {
      state.lessons[lesson.id] = refreshed;
      repaired += 1;
    }
  }

  /* Project progress. */
  for (const record of storedProjects) {
    if (!isValidProjectProgress(record) || !base.projects[record.projectId]) {
      if (!isValidProjectProgress(record)) repaired += 1;
      continue;
    }
    state.projects[record.projectId] = record;
  }

  /* Sessions: validate, then settle anything left open. */
  const validSessions = storedSessions.filter((s) => {
    if (isValidSession(s)) return true;
    repaired += 1;
    return false;
  });
  const settled = closeStaleSessions(validSessions, now, settings.staleSessionMinutes);
  state.sessions = settled.sessions;
  if (settled.changed) repaired += 1;
  // Oldest first: the UI renders history chronologically.
  state.sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  /* Plans. */
  for (const plan of storedPlans) {
    if (!isValidPlan(plan)) {
      repaired += 1;
      continue;
    }
    state.plans[plan.date] = plan;
  }

  state.notes = storedNotes.filter((n) => {
    if (isValidNote(n)) return true;
    repaired += 1;
    return false;
  });
  state.reminders = storedReminders.filter((r) => {
    if (isValidReminder(r)) return true;
    repaired += 1;
    return false;
  });

  state.sync = {
    ...state.sync,
    pendingWrites: countDirty(state),
  };

  return {
    state,
    repaired,
    storageAvailable: !isMemoryOnly(),
  };
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function persistLessons(records: LessonProgress[]): Promise<void> {
  await dbPutMany(
    'lessonProgress',
    records.map((r) => [r.lessonId, r] as [string, LessonProgress]),
  );
}

export async function persistLesson(record: LessonProgress): Promise<void> {
  await dbPut('lessonProgress', record.lessonId, record);
}

export async function persistProject(record: ProjectProgress): Promise<void> {
  await dbPut('projectProgress', record.projectId, record);
}

export async function persistProjects(records: ProjectProgress[]): Promise<void> {
  await dbPutMany(
    'projectProgress',
    records.map((r) => [r.projectId, r] as [string, ProjectProgress]),
  );
}

export async function persistSession(record: StudySession): Promise<void> {
  await dbPut('sessions', record.id, record);
}

export async function persistPlan(record: DailyPlan): Promise<void> {
  await dbPut('plans', record.date, record);
}

export async function deletePlan(date: string): Promise<void> {
  await dbDelete('plans', date);
}

export async function persistNote(record: Note): Promise<void> {
  await dbPut('notes', record.id, record);
}

export async function deleteNote(id: string): Promise<void> {
  await dbDelete('notes', id);
}

export async function persistReminder(record: Reminder): Promise<void> {
  await dbPut('reminders', record.id, record);
}

export async function deleteReminder(id: string): Promise<void> {
  await dbDelete('reminders', id);
}

export async function persistSettings(record: Settings): Promise<void> {
  await dbPut('settings', SETTINGS_KEY, record);
}

export async function persistSync(record: SyncState): Promise<void> {
  await dbPut('meta', SYNC_KEY, record);
}

/** Writes every record still flagged dirty - used by sync and by "save now". */
export async function persistDirty(state: LearnerState): Promise<number> {
  const dirtyLessons = Object.values(state.lessons).filter((l) => l.dirty);
  const dirtyProjects = Object.values(state.projects).filter((p) => p.dirty);
  const dirtySessions = state.sessions.filter((s) => s.dirty);
  const dirtyPlans = Object.values(state.plans).filter((p) => p.dirty);
  const dirtyNotes = state.notes.filter((n) => n.dirty);
  const dirtyReminders = state.reminders.filter((r) => r.dirty);

  await Promise.all([
    persistLessons(dirtyLessons),
    persistProjects(dirtyProjects),
    dbPutMany('sessions', dirtySessions.map((s) => [s.id, s] as [string, StudySession])),
    dbPutMany('plans', dirtyPlans.map((p) => [p.date, p] as [string, DailyPlan])),
    dbPutMany('notes', dirtyNotes.map((n) => [n.id, n] as [string, Note])),
    dbPutMany('reminders', dirtyReminders.map((r) => [r.id, r] as [string, Reminder])),
    state.settings.dirty ? persistSettings(state.settings) : Promise.resolve(),
  ]);

  return (
    dirtyLessons.length +
    dirtyProjects.length +
    dirtySessions.length +
    dirtyPlans.length +
    dirtyNotes.length +
    dirtyReminders.length +
    (state.settings.dirty ? 1 : 0)
  );
}

/** How many local records have not been pushed to the remote yet. */
export function countDirty(state: LearnerState): number {
  return (
    Object.values(state.lessons).filter((l) => l.dirty).length +
    Object.values(state.projects).filter((p) => p.dirty).length +
    state.sessions.filter((s) => s.dirty).length +
    Object.values(state.plans).filter((p) => p.dirty).length +
    state.notes.filter((n) => n.dirty).length +
    state.reminders.filter((r) => r.dirty).length +
    (state.settings.dirty ? 1 : 0)
  );
}

/** Clears dirty flags after a successful push. Returns a new state object. */
export function markSynced(state: LearnerState): LearnerState {
  const lessons: Record<string, LessonProgress> = {};
  for (const [id, l] of Object.entries(state.lessons)) lessons[id] = l.dirty ? { ...l, dirty: false } : l;
  const projects: Record<string, ProjectProgress> = {};
  for (const [id, p] of Object.entries(state.projects)) {
    projects[id] = p.dirty ? { ...p, dirty: false } : p;
  }
  return {
    ...state,
    lessons,
    projects,
    sessions: state.sessions.map((s) => (s.dirty ? { ...s, dirty: false } : s)),
    plans: Object.fromEntries(
      Object.entries(state.plans).map(([date, p]) => [date, p.dirty ? { ...p, dirty: false } : p]),
    ),
    notes: state.notes.map((n) => (n.dirty ? { ...n, dirty: false } : n)),
    reminders: state.reminders.map((r) => (r.dirty ? { ...r, dirty: false } : r)),
    settings: state.settings.dirty ? { ...state.settings, dirty: false } : state.settings,
  };
}

/**
 * Merges remote records into local state.
 *
 * Conflict rule: last write wins on `updatedAt`, except that a record already
 * mastered or passed locally is never downgraded by a remote record that has not
 * been - losing evidence of mastery to a stale sync would be the worst possible
 * failure mode for this app.
 */
export function mergeRemote(
  local: LearnerState,
  remote: {
    lessons?: LessonProgress[];
    projects?: ProjectProgress[];
    sessions?: StudySession[];
    notes?: Note[];
  },
): { state: LearnerState; merged: number } {
  let merged = 0;
  const state: LearnerState = {
    ...local,
    lessons: { ...local.lessons },
    projects: { ...local.projects },
    sessions: [...local.sessions],
    notes: [...local.notes],
  };

  const newer = (a: { updatedAt: string }, b: { updatedAt: string }) =>
    Date.parse(a.updatedAt) >= Date.parse(b.updatedAt) ? a : b;

  for (const record of remote.lessons ?? []) {
    const existing = state.lessons[record.lessonId];
    if (!existing) {
      state.lessons[record.lessonId] = { ...record, dirty: true };
      merged += 1;
      continue;
    }
    const winner = newer(record, existing);
    if (winner === record) {
      const protectedStatus =
        existing.status === 'MASTERED' && record.status !== 'MASTERED' ? existing.status : record.status;
      const protectedScore = Math.max(existing.masteryScore, record.masteryScore);
      const protectedBest = Math.max(existing.bestScore, record.bestScore);
      state.lessons[record.lessonId] = {
        ...record,
        status: protectedStatus,
        masteryScore: protectedScore,
        bestScore: protectedBest,
        attempts: dedupeById([...existing.attempts, ...record.attempts]),
        dirty: true,
      };
      merged += 1;
    }
  }

  for (const record of remote.projects ?? []) {
    const existing = state.projects[record.projectId];
    if (!existing) {
      state.projects[record.projectId] = { ...record, dirty: true };
      merged += 1;
      continue;
    }
    if (newer(record, existing) === record) {
      const tasks = { ...existing.tasks };
      for (const [id, t] of Object.entries(record.tasks)) {
        // A task done anywhere stays done.
        tasks[id] = tasks[id]?.done && !t.done ? tasks[id] : t;
      }
      state.projects[record.projectId] = { ...record, tasks, dirty: true };
      merged += 1;
    }
  }

  const sessionIds = new Set(state.sessions.map((s) => s.id));
  for (const record of remote.sessions ?? []) {
    if (sessionIds.has(record.id)) continue;
    state.sessions.push({ ...record, dirty: false });
    merged += 1;
  }
  state.sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const noteIds = new Set(state.notes.map((n) => n.id));
  for (const record of remote.notes ?? []) {
    if (noteIds.has(record.id)) continue;
    state.notes.push({ ...record, dirty: false });
    merged += 1;
  }

  return { state, merged };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) seen.set(item.id, item);
  return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
}
