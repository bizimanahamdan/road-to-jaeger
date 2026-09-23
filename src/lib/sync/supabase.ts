import type { SupabaseClient } from '@supabase/supabase-js';
import { allLessons } from '@/lib/curriculum';
import type {
  DailyPlan,
  LessonProgress,
  Note,
  ProjectProgress,
  Reminder,
  StudySession,
  SyncState,
} from '@/lib/types';
import {
  mergeRemote,
  markSynced,
  type LearnerState,
} from '@/lib/db/repository';
import {
  lessonFromRows,
  lessonToChildRows,
  lessonToRow,
  noteFromRow,
  noteToRow,
  planFromRows,
  planToRows,
  projectFromRows,
  projectToRows,
  reminderFromRow,
  reminderToRow,
  sessionFromRow,
  sessionToRow,
  settingsFromRow,
  settingsToRow,
  type AttemptRow,
  type ExerciseRow,
  type LessonProgressRow,
  type NoteRow,
  type ObjectiveRow,
  type PlanItemRow,
  type PlanRow,
  type ProjectProgressRow,
  type ProjectTaskRow,
  type ReminderRow,
  type SessionRow,
  type SettingsRow,
} from './mappers';

/**
 * Optional Supabase sync.
 *
 * Ground rules, all of them deliberate:
 *
 *  - **Local-first.** With no configuration at all the app is fully functional;
 *    this module is never imported unless `NEXT_PUBLIC_SUPABASE_URL` and the anon
 *    key are present, and the client itself is loaded with a dynamic import so
 *    the library is not even parsed on a device that does not use sync.
 *  - **Only the anon key ever reaches the client.** `assertNotServiceRole` decodes
 *    the JWT and refuses to start if the role is anything other than `anon`,
 *    because the service-role key bypasses Row Level Security entirely and this
 *    app has no server to hide it behind.
 *  - **RLS does the authorisation**, not this code. Every policy restricts rows to
 *    `auth.uid() = user_id` (see `supabase/migrations/0002_rls_policies.sql`).
 *  - **Sync never destroys local evidence.** Push happens before pull, and the
 *    merge rule in `repository.mergeRemote` refuses to downgrade a mastered
 *    lesson or an undone task.
 *  - **Failure is reported, not thrown.** A learner offline on a train gets a
 *    `lastError` string and keeps working; the queue stays dirty and retries.
 */

const URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL';
const ANON_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function syncEnv(): { url: string; anonKey: string } | null {
  const url = (process.env[URL_KEY] ?? '').trim();
  const anonKey = (process.env[ANON_KEY] ?? '').trim();
  if (!url || !anonKey) return null;
  if (!/^https:\/\//.test(url)) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return syncEnv() !== null;
}

/**
 * Decodes a Supabase JWT and refuses a service-role key.
 *
 * The anon key is safe to ship *because* RLS constrains it. A service-role key in
 * an APK would hand every row in the database to anyone who unzipped the file.
 */
export function assertNotServiceRole(key: string): void {
  const parts = key.split('.');
  if (parts.length < 2) return; // not a JWT we can inspect; RLS still applies
  const raw = parts[1] ?? '';
  // JWT segments are base64url without padding; add it back before decoding.
  const payload = raw.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(raw.length / 4) * 4, '=');
  try {
    const json = atob(payload);
    const parsed = JSON.parse(json) as { role?: string };
    if (parsed.role && parsed.role !== 'anon' && parsed.role !== 'authenticated') {
      throw new Error(
        `Refusing to initialise sync: the configured key has role "${parsed.role}". Only the anon key may be used client-side.`,
      );
    }
  } catch (err) {
    if (err instanceof SyntaxError) return; // opaque key format; nothing to check
    throw err;
  }
}

export async function getClient(): Promise<SupabaseClient | null> {
  const env = syncEnv();
  if (!env) return null;
  assertNotServiceRole(env.anonKey);
  if (!clientPromise) {
    clientPromise = (async () => {
      const { createClient } = await import('@supabase/supabase-js');
      return createClient(env.url, env.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
    })().catch((err: unknown) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

/**
 * Anonymous sign-in.
 *
 * V1 deliberately has no email/password or OAuth flow: anonymous auth gives each
 * device a real `auth.uid()` (which is what RLS keys on) without the app ever
 * handling a credential. Linking an account to email is a V2 task.
 */
export async function ensureSignedIn(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getSession();
  const existing = data.session?.user.id;
  if (existing) return existing;
  const { data: anon, error } = await client.auth.signInAnonymously();
  if (error) throw new Error(error.message);
  return anon.user?.id ?? null;
}

export interface SyncOutcome {
  state: LearnerState;
  sync: SyncState;
  pushed: number;
  pulled: number;
}

/** Pushes every dirty record, then pulls and merges the remote view. */
export async function syncNow(state: LearnerState, now: Date): Promise<SyncOutcome> {
  const startedAt = now.toISOString();
  const base: SyncState = {
    ...state.sync,
    mode: 'supabase',
    configured: true,
    lastAttemptAt: startedAt,
  };

  try {
    const client = await getClient();
    if (!client) {
      return {
        state,
        sync: { ...base, mode: 'local', configured: false, lastError: null },
        pushed: 0,
        pulled: 0,
      };
    }
    const userId = await ensureSignedIn(client);
    if (!userId) {
      return {
        state,
        sync: { ...base, signedIn: false, lastError: 'Sign-in did not return a user id.' },
        pushed: 0,
        pulled: 0,
      };
    }

    const pushed = await pushDirty(client, userId, state);
    const remote = await pullRemote(client, userId);
    const merged = mergeRemote(state, remote);

    const afterPull: LearnerState = {
      ...merged.state,
      settings: remote.settings
        ? settingsFromRow(remote.settings, merged.state.settings)
        : merged.state.settings,
      plans: { ...merged.state.plans, ...remote.plans },
      reminders: remote.reminders.length
        ? dedupeReminders([...merged.state.reminders, ...remote.reminders])
        : merged.state.reminders,
    };

    const clean = markSynced(afterPull);
    const sync: SyncState = {
      mode: 'supabase',
      configured: true,
      signedIn: true,
      userId,
      lastPushedAt: pushed > 0 ? new Date().toISOString() : base.lastPushedAt,
      lastPulledAt: new Date().toISOString(),
      lastError: null,
      pendingWrites: 0,
      lastAttemptAt: startedAt,
    };
    return { state: { ...clean, sync }, sync, pushed, pulled: merged.merged };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed for an unknown reason.';
    const sync: SyncState = {
      ...base,
      signedIn: Boolean(base.userId),
      lastError: message,
      pendingWrites: countDirtyRecords(state),
    };
    return { state: { ...state, sync }, sync, pushed: 0, pulled: 0 };
  }
}

function countDirtyRecords(state: LearnerState): number {
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

async function pushDirty(
  client: SupabaseClient,
  userId: string,
  state: LearnerState,
): Promise<number> {
  let pushed = 0;

  if (state.settings.dirty) {
    const row = settingsToRow(userId, state.settings);
    const { error } = await client.from('settings').upsert(row, { onConflict: 'user_id' });
    if (error) throw new Error(`settings: ${error.message}`);
    pushed += 1;
  }

  const dirtyLessons = Object.values(state.lessons).filter((l) => l.dirty);
  if (dirtyLessons.length) {
    const mains: LessonProgressRow[] = [];
    const attempts: AttemptRow[] = [];
    const exercises: ExerciseRow[] = [];
    const objectives: ObjectiveRow[] = [];
    for (const lesson of dirtyLessons) {
      mains.push(lessonToRow(userId, lesson));
      const children = lessonToChildRows(userId, lesson);
      attempts.push(...children.attempts);
      exercises.push(...children.exercises);
      objectives.push(...children.objectives);
    }
    const steps: [string, PromiseLike<{ error: { message: string } | null }>][] = [
      ['lesson_progress', client.from('lesson_progress').upsert(mains, {
        onConflict: 'user_id,lesson_id',
      })],
    ];
    if (attempts.length) {
      steps.push(['lesson_attempts', client.from('lesson_attempts').upsert(attempts, { onConflict: 'id' })]);
    }
    if (exercises.length) {
      steps.push([
        'exercise_state',
        client.from('exercise_state').upsert(exercises, {
          onConflict: 'user_id,lesson_id,exercise_id',
        }),
      ]);
    }
    if (objectives.length) {
      steps.push([
        'objective_coverage',
        client.from('objective_coverage').upsert(objectives, {
          onConflict: 'user_id,lesson_id,objective_id',
        }),
      ]);
    }
    for (const [table, promise] of steps) {
      const { error } = await promise;
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    pushed += dirtyLessons.length;
  }

  const dirtyProjects = Object.values(state.projects).filter((p) => p.dirty);
  if (dirtyProjects.length) {
    const mains: ProjectProgressRow[] = [];
    const tasks: ProjectTaskRow[] = [];
    for (const project of dirtyProjects) {
      const rows = projectToRows(userId, project);
      mains.push(rows.main);
      tasks.push(...rows.tasks);
    }
    const { error } = await client
      .from('project_progress')
      .upsert(mains, { onConflict: 'user_id,project_id' });
    if (error) throw new Error(`project_progress: ${error.message}`);
    if (tasks.length) {
      const taskResult = await client
        .from('project_task_state')
        .upsert(tasks, { onConflict: 'user_id,project_id,task_id' });
      if (taskResult.error) throw new Error(`project_task_state: ${taskResult.error.message}`);
    }
    pushed += dirtyProjects.length;
  }

  const dirtySessions = state.sessions.filter((s) => s.dirty);
  if (dirtySessions.length) {
    const { error } = await client
      .from('study_sessions')
      .upsert(dirtySessions.map((s) => sessionToRow(userId, s)), { onConflict: 'id' });
    if (error) throw new Error(`study_sessions: ${error.message}`);
    pushed += dirtySessions.length;
  }

  const dirtyPlans = Object.values(state.plans).filter((p) => p.dirty);
  for (const plan of dirtyPlans) {
    const rows = planToRows(userId, plan);
    const { error } = await client.from('daily_plans').upsert(rows.main, {
      onConflict: 'user_id,plan_date',
    });
    if (error) throw new Error(`daily_plans: ${error.message}`);
    if (rows.items.length) {
      const itemResult = await client.from('plan_items').upsert(rows.items, {
        onConflict: 'user_id,plan_date,item_id',
      });
      if (itemResult.error) throw new Error(`plan_items: ${itemResult.error.message}`);
    }
    pushed += 1;
  }

  const dirtyNotes = state.notes.filter((n) => n.dirty);
  if (dirtyNotes.length) {
    const { error } = await client
      .from('notes')
      .upsert(dirtyNotes.map((n) => noteToRow(userId, n)), { onConflict: 'id' });
    if (error) throw new Error(`notes: ${error.message}`);
    pushed += dirtyNotes.length;
  }

  const dirtyReminders = state.reminders.filter((r) => r.dirty);
  if (dirtyReminders.length) {
    const { error } = await client
      .from('reminders')
      .upsert(dirtyReminders.map((r) => reminderToRow(userId, r)), { onConflict: 'id' });
    if (error) throw new Error(`reminders: ${error.message}`);
    pushed += dirtyReminders.length;
  }

  return pushed;
}

interface RemotePayload {
  lessons: LessonProgress[];
  projects: ProjectProgress[];
  sessions: StudySession[];
  notes: Note[];
  settings: SettingsRow | null;
  plans: Record<string, DailyPlan>;
  reminders: Reminder[];
}

async function pullRemote(client: SupabaseClient, userId: string): Promise<RemotePayload> {
  const select = (table: string) => client.from(table).select('*').eq('user_id', userId);

  const [
    settingsRes,
    lessonRes,
    attemptRes,
    exerciseRes,
    objectiveRes,
    projectRes,
    taskRes,
    sessionRes,
    planRes,
    planItemRes,
    noteRes,
    reminderRes,
  ] = await Promise.all([
    select('settings').maybeSingle(),
    select('lesson_progress'),
    select('lesson_attempts'),
    select('exercise_state'),
    select('objective_coverage'),
    select('project_progress'),
    select('project_task_state'),
    select('study_sessions'),
    select('daily_plans'),
    select('plan_items'),
    select('notes'),
    select('reminders'),
  ]);

  for (const res of [
    lessonRes,
    attemptRes,
    exerciseRes,
    objectiveRes,
    projectRes,
    taskRes,
    sessionRes,
    planRes,
    planItemRes,
    noteRes,
    reminderRes,
    settingsRes,
  ]) {
    if (res.error) throw new Error(res.error.message);
  }

  const attemptsByLesson = groupBy(attemptRes.data ?? [], (r) => (r as AttemptRow).lesson_id);
  const exercisesByLesson = groupBy(exerciseRes.data ?? [], (r) => (r as ExerciseRow).lesson_id);
  const objectivesByLesson = groupBy(objectiveRes.data ?? [], (r) => (r as ObjectiveRow).lesson_id);

  const knownLessons = new Set(allLessons().map((l) => l.id));
  const lessons: LessonProgress[] = (lessonRes.data ?? [])
    .map((row) => {
      const main = row as LessonProgressRow;
      if (!knownLessons.has(main.lesson_id)) return null;
      return lessonFromRows(
        main,
        (attemptsByLesson.get(main.lesson_id) ?? []) as AttemptRow[],
        (exercisesByLesson.get(main.lesson_id) ?? []) as ExerciseRow[],
        (objectivesByLesson.get(main.lesson_id) ?? []) as ObjectiveRow[],
      );
    })
    .filter((x): x is LessonProgress => x !== null);

  const tasksByProject = groupBy(taskRes.data ?? [], (r) => (r as ProjectTaskRow).project_id);
  const projects: ProjectProgress[] = (projectRes.data ?? []).map((row) => {
    const main = row as ProjectProgressRow;
    return projectFromRows(main, (tasksByProject.get(main.project_id) ?? []) as ProjectTaskRow[]);
  });

  const sessions = (sessionRes.data ?? []).map((row) => sessionFromRow(row as SessionRow));
  const notes = (noteRes.data ?? []).map((row) => noteFromRow(row as NoteRow));
  const reminders: Reminder[] = (reminderRes.data ?? []).map((row) =>
    reminderFromRow(row as ReminderRow),
  );

  const itemsByDate = groupBy(planItemRes.data ?? [], (r) => (r as PlanItemRow).plan_date);
  const plans: Record<string, DailyPlan> = {};
  for (const row of planRes.data ?? []) {
    const main = row as PlanRow;
    plans[main.plan_date] = planFromRows(main, (itemsByDate.get(main.plan_date) ?? []) as PlanItemRow[]);
  }

  return {
    lessons,
    projects,
    sessions,
    notes,
    settings: (settingsRes.data as SettingsRow | null) ?? null,
    plans,
    reminders,
  };
}

function groupBy<T>(rows: unknown[], key: (row: unknown) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = out.get(k);
    if (list) list.push(row as T);
    else out.set(k, [row as T]);
  }
  return out;
}

function dedupeReminders(reminders: Reminder[]): Reminder[] {
  const byId = new Map<string, Reminder>();
  for (const r of reminders) {
    const existing = byId.get(r.id);
    if (!existing || Date.parse(r.updatedAt) > Date.parse(existing.updatedAt)) byId.set(r.id, r);
  }
  return [...byId.values()];
}

export async function signOut(): Promise<void> {
  const client = await getClient();
  if (!client) return;
  await client.auth.signOut();
}
