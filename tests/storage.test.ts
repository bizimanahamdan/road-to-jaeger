import { beforeEach, describe, expect, it } from 'vitest';

import { allLessons, allProjects } from '@/lib/curriculum';
import { dbGet, dbGetAll, dbPut, dbResetAll, isMemoryOnly } from '@/lib/db/idb';
import {
  bootstrap,
  countDirty,
  emptyLearnerState,
  markSynced,
  mergeRemote,
  persistDirty,
  persistLesson,
  persistSession,
  persistSettings,
} from '@/lib/db/repository';
import { gradeAssessment, type AnswerValue } from '@/lib/engine/assessment';
import {
  applyGradedAttempt,
  applyReview,
  effectivePassScore,
  requiredExerciseIds,
  setExerciseState,
  setReflection,
} from '@/lib/engine/mastery';
import { completeSession, startSession } from '@/lib/engine/session';
import {
  addDays,
  addMinutes,
  defaultSettings,
  emptyLessonProgress,
  localDateKey,
} from '@/lib/engine/state';
import {
  lessonFromRows,
  lessonToChildRows,
  lessonToRow,
  noteFromRow,
  noteToRow,
  num,
  numArray,
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
  strArray,
  toTrackIds,
} from '@/lib/sync/mappers';
import { assertNotServiceRole, isSupabaseConfigured, syncEnv } from '@/lib/sync/supabase';
import type { Lesson, LessonId, LessonProgress, Note, Settings, StudySession } from '@/lib/types';

/**
 * Storage and sync-mapping tests.
 *
 * IndexedDB is not available under Vitest's node environment, so the wrapper runs
 * against its in-memory fallback - which is the same code path a private-mode
 * browser would take, and is asserted here rather than assumed.
 */

const FLOOR = 80;
const T0 = new Date(2026, 2, 2, 8, 0, 0);

beforeEach(async () => {
  await dbResetAll();
});

function allCorrect(lesson: Lesson): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  for (const q of lesson.assessment.questions) {
    if (q.type === 'mcq') out[q.id] = q.answer as number;
    else if (q.type === 'numeric') out[q.id] = q.answer as number;
    else out[q.id] = Array.isArray(q.answer) ? q.answer[0] ?? String(q.answer) : String(q.answer);
  }
  return out;
}

/** A genuinely mastered lesson record, produced through the engine's only path. */
function masteredRecord(lesson: Lesson, now: Date): LessonProgress {
  let p = emptyLessonProgress(lesson.id, now);
  for (const id of requiredExerciseIds(lesson)) {
    p = setExerciseState(lesson, p, id, true, now, FLOOR);
  }
  const graded = gradeAssessment(
    lesson,
    allCorrect(lesson),
    { durationSeconds: 300, passScore: effectivePassScore(lesson, FLOOR) },
    now,
  );
  p = applyGradedAttempt(lesson, p, graded, now, FLOOR);
  p = setReflection(p, 'I can reproduce the derivation but not yet from memory.', now);
  return applyReview(lesson, p, 'good', addDays(now, 1), FLOOR);
}

describe('the storage fallback', () => {
  it('falls back to memory when IndexedDB is absent, and says so', async () => {
    // Under Vitest's node environment there is no IndexedDB, so the wrapper uses
    // its in-memory fallback. That is the same path a private-mode browser takes,
    // and `storageAvailable()` is what the Settings screen uses to warn the
    // learner that progress will not survive a reload.
    await dbPut('meta', 'probe', { ok: true });
    expect(isMemoryOnly()).toBe(true);
    expect(await dbGet<{ ok: boolean }>('meta', 'probe')).toEqual({ ok: true });
  });

  it('round-trips a record through the wrapper', async () => {
    const record = emptyLessonProgress('math-01', T0);
    await persistLesson(record);
    const read = await dbGet<LessonProgress>('lessonProgress', 'math-01');
    expect(read).toEqual(record);
    // Values are cloned at the boundary, like a real object store.
    expect(read).not.toBe(record);
  });
});

describe('bootstrap', () => {
  it('creates a record for every lesson and project on a fresh device', async () => {
    const { state, repaired } = await bootstrap(T0);
    expect(Object.keys(state.lessons)).toHaveLength(allLessons().length);
    expect(Object.keys(state.projects)).toHaveLength(allProjects().length);
    expect(state.sessions).toEqual([]);
    expect(state.notes).toEqual([]);
    expect(state.settings.dailyMinutes).toBe(45);
    expect(state.sync.mode).toBe('local');
    expect(repaired).toBeGreaterThanOrEqual(0);
    // A fresh device has nothing to sync.
    expect(countDirty(state)).toBe(0);
  });

  it('replaces a corrupt record instead of crashing', async () => {
    await dbPut('lessonProgress', 'math-01', { nonsense: true });
    await dbPut('sessions', 'broken', { id: 'broken' });
    const { state, repaired } = await bootstrap(T0);
    expect(state.lessons['math-01']?.status).toBe('NOT_STARTED');
    expect(state.lessons['math-01']?.masteryScore).toBe(0);
    expect(state.sessions).toEqual([]);
    expect(repaired).toBeGreaterThan(0);
  });

  it('keeps valid stored progress and adopts the learner settings', async () => {
    const lesson = allLessons()[0];
    if (!lesson) throw new Error('no lessons');
    const record = masteredRecord(lesson, T0);
    await persistLesson(record);
    await persistSettings({ ...defaultSettings(T0), dailyMinutes: 90, dirty: false });

    const { state } = await bootstrap(addDays(T0, 1));
    expect(state.settings.dailyMinutes).toBe(90);
    const loaded = state.lessons[lesson.id];
    expect(loaded?.bestScore).toBe(100);
    expect(loaded?.attempts).toHaveLength(1);
    expect(loaded?.reflection?.text).toMatch(/memory/);
    expect(loaded?.srs.successesSincePass).toBe(1);
  });

  it('recomputes time-dependent mastery on load, demoting a decayed lesson', async () => {
    const lesson = allLessons()[0];
    if (!lesson) throw new Error('no lessons');
    await persistLesson(masteredRecord(lesson, T0));

    // Same day: still mastered.
    const sameDay = await bootstrap(addMinutes(T0, 60));
    expect(sameDay.state.lessons[lesson.id]?.status).toBe('MASTERED');

    // Five days later the predicted recall has fallen below the mastery gate.
    await dbResetAll();
    await persistLesson(masteredRecord(lesson, T0));
    const later = await bootstrap(addDays(T0, 5));
    expect(later.state.lessons[lesson.id]?.status).toBe('REVIEW');
    expect(later.repaired).toBeGreaterThan(0);
  });

  it('settles a session that was left running when the app died', async () => {
    const stale = startSession('lesson', 'math-01', T0);
    await persistSession(stale);
    const { state } = await bootstrap(addMinutes(T0, 45));
    const closed = state.sessions[0];
    expect(closed?.state).toBe('abandoned');
    expect(closed?.accumulatedSeconds).toBe(15 * 60);
    expect(closed?.autoEndedReason).toMatch(/idle/i);
  });

  it('sorts sessions chronologically', async () => {
    await persistSession(completeSession(startSession('lesson', 'math-02', addDays(T0, 2)), addDays(T0, 2)));
    await persistSession(completeSession(startSession('lesson', 'math-01', T0), addMinutes(T0, 10)));
    const { state } = await bootstrap(T0);
    const refs = state.sessions.map((s) => s.refId);
    expect(refs).toEqual(['math-01', 'math-02']);
  });
});

describe('dirty tracking', () => {
  it('counts and clears dirty records', async () => {
    const state = emptyLearnerState(T0);
    expect(countDirty(state)).toBe(0);

    const changed: LessonProgress = { ...state.lessons['math-01']!, dirty: true };
    const dirtyState = { ...state, lessons: { ...state.lessons, 'math-01': changed } };
    expect(countDirty(dirtyState)).toBe(1);

    const written = await persistDirty(dirtyState);
    expect(written).toBe(1);
    const clean = markSynced(dirtyState);
    expect(countDirty(clean)).toBe(0);
    expect(clean.lessons['math-01']?.masteryScore).toBe(changed.masteryScore);
  });

  it('persists everything that is dirty in one pass', async () => {
    const state = emptyLearnerState(T0);
    const session: StudySession = { ...startSession('lesson', 'math-01', T0), dirty: true };
    const dirty = {
      ...state,
      sessions: [session],
      settings: { ...state.settings, dirty: true, dailyMinutes: 30 },
      notes: [{ ...makeNote(T0), dirty: true }],
    };
    const written = await persistDirty(dirty);
    expect(written).toBe(3);
    const sessions = await dbGetAll<StudySession>('sessions');
    expect(sessions).toHaveLength(1);
    const notes = await dbGetAll<Note>('notes');
    expect(notes).toHaveLength(1);
  });
});

function makeNote(now: Date): Note {
  return {
    id: 'note_1',
    title: 'Torque',
    body: 'Torque is force times lever arm.',
    target: { kind: 'lesson', id: 'phys-13' as LessonId },
    tags: ['physics'],
    pinned: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    dirty: false,
  };
}

describe('mergeRemote', () => {
  const lesson = allLessons()[0];
  if (!lesson) throw new Error('no lessons');

  it('takes a newer remote record but never downgrades mastery', () => {
    const local = emptyLearnerState(T0);
    const mastered = masteredRecord(lesson, T0);
    const localState = { ...local, lessons: { ...local.lessons, [lesson.id]: mastered } };

    const staleRemote: LessonProgress = {
      ...emptyLessonProgress(lesson.id, T0),
      status: 'LEARNING',
      masteryScore: 10,
      updatedAt: addDays(T0, 2).toISOString(), // newer timestamp, weaker evidence
    };
    const { state, merged } = mergeRemote(localState, { lessons: [staleRemote] });
    expect(merged).toBe(1);
    const result = state.lessons[lesson.id];
    expect(result?.status).toBe('MASTERED');
    expect(result?.masteryScore).toBe(100);
    expect(result?.bestScore).toBe(100);
  });

  it('accepts genuinely newer remote progress', () => {
    const local = emptyLearnerState(T0);
    const remote: LessonProgress = {
      ...emptyLessonProgress(lesson.id, T0),
      status: 'PRACTICING',
      bestScore: 70,
      masteryScore: 40,
      updatedAt: addDays(T0, 1).toISOString(),
    };
    const { state } = mergeRemote(local, { lessons: [remote] });
    expect(state.lessons[lesson.id]?.bestScore).toBe(70);
    expect(state.lessons[lesson.id]?.status).toBe('PRACTICING');
    expect(state.lessons[lesson.id]?.dirty).toBe(true);
  });

  it('unions attempts without duplicating them', () => {
    const local = emptyLearnerState(T0);
    const base = masteredRecord(lesson, T0);
    const attempt = base.attempts[0];
    if (!attempt) throw new Error('no attempt');
    const remote: LessonProgress = {
      ...base,
      attempts: [attempt, { ...attempt, id: 'att_new', at: addDays(T0, 3).toISOString() }],
      updatedAt: addDays(T0, 4).toISOString(),
    };
    const { state } = mergeRemote({ ...local, lessons: { ...local.lessons, [lesson.id]: base } }, {
      lessons: [remote],
    });
    const ids = state.lessons[lesson.id]?.attempts.map((a) => a.id).sort();
    expect(ids).toEqual([attempt.id, 'att_new'].sort());
  });

  it('never lets a remote row un-do a completed project task', () => {
    const local = emptyLearnerState(T0);
    const project = allProjects()[0];
    if (!project) throw new Error('no projects');
    const task = project.tasks[0];
    if (!task) throw new Error('no tasks');
    const localProgress = {
      ...local.projects[project.id]!,
      tasks: { [task.id]: { done: true, doneAt: T0.toISOString() } },
      updatedAt: T0.toISOString(),
    };
    const remote = {
      ...localProgress,
      tasks: { [task.id]: { done: false, doneAt: null } },
      updatedAt: addDays(T0, 1).toISOString(),
    };
    const { state } = mergeRemote(
      { ...local, projects: { ...local.projects, [project.id]: localProgress } },
      { projects: [remote] },
    );
    expect(state.projects[project.id]?.tasks[task.id]?.done).toBe(true);
  });

  it('adds remote sessions and notes that the device has not seen', () => {
    const local = emptyLearnerState(T0);
    const remoteSession: StudySession = {
      ...startSession('lesson', 'math-02', T0),
      id: 'ses_remote',
      state: 'completed',
      accumulatedSeconds: 600,
      dirty: false,
    };
    const { state, merged } = mergeRemote(local, {
      sessions: [remoteSession],
      notes: [makeNote(T0)],
    });
    expect(merged).toBe(2);
    expect(state.sessions.some((s) => s.id === 'ses_remote')).toBe(true);
    expect(state.notes.some((n) => n.id === 'note_1')).toBe(true);
  });
});

describe('row mappers', () => {
  const lesson = allLessons()[0];
  if (!lesson) throw new Error('no lessons');

  it('round-trips a lesson record through its normalised rows', () => {
    const record = masteredRecord(lesson, T0);
    const userId = 'user-1';
    const main = lessonToRow(userId, record);
    const children = lessonToChildRows(userId, record);
    const back = lessonFromRows(main, children.attempts, children.exercises, children.objectives);

    expect(back.lessonId).toBe(record.lessonId);
    expect(back.status).toBe(record.status);
    expect(back.bestScore).toBe(record.bestScore);
    expect(back.masteryScore).toBe(record.masteryScore);
    expect(back.srs).toEqual(record.srs);
    expect(back.reflection).toEqual(record.reflection);
    expect(back.attempts).toHaveLength(record.attempts.length);
    expect(back.attempts[0]?.perQuestion).toEqual(record.attempts[0]?.perQuestion);
    expect(Object.keys(back.exercises).sort()).toEqual(Object.keys(record.exercises).sort());
    expect(back.objectiveCoverage).toEqual(record.objectiveCoverage);
    expect(back.dirty).toBe(false);
  });

  it('round-trips sessions, notes, reminders, plans, settings and projects', () => {
    const userId = 'user-1';
    const session = completeSession(startSession('lesson', 'math-01', T0), addMinutes(T0, 25));
    expect(sessionFromRow(sessionToRow(userId, session))).toEqual({ ...session, dirty: false });

    const note = makeNote(T0);
    const noteBack = noteFromRow(noteToRow(userId, note));
    expect(noteBack.title).toBe(note.title);
    expect(noteBack.target).toEqual(note.target);
    expect(noteBack.tags).toEqual(note.tags);

    const general: Note = { ...note, id: 'note_2', target: { kind: 'general', id: 'general' } };
    expect(noteFromRow(noteToRow(userId, general)).target).toEqual({ kind: 'general', id: 'general' });

    const settings: Settings = {
      ...defaultSettings(T0),
      dailyMinutes: 75,
      focusTracks: ['robotics'],
    };
    const settingsBack = settingsFromRow(settingsToRow(userId, settings), defaultSettings(T0));
    expect(settingsBack.dailyMinutes).toBe(75);
    expect(settingsBack.focusTracks).toEqual(['robotics']);

    const plan = {
      date: localDateKey(T0),
      budgetMinutes: 45,
      items: [
        {
          id: 'i1',
          kind: 'lesson' as const,
          refId: 'math-01',
          title: 'Arithmetic',
          estimatedMinutes: 25,
          order: 2,
          state: 'planned' as const,
          reason: 'Newly unlocked',
          sessionId: null,
        },
        {
          id: 'i2',
          kind: 'review' as const,
          refId: 'math-02',
          title: 'Review',
          estimatedMinutes: 5,
          order: 1,
          state: 'done' as const,
          reason: 'Due today',
          sessionId: 'ses_1',
        },
      ],
      generatedAt: T0.toISOString(),
      updatedAt: T0.toISOString(),
      dirty: false,
    };
    const planRows = planToRows(userId, plan);
    const planBack = planFromRows(planRows.main, planRows.items);
    expect(planBack.items.map((i) => i.id)).toEqual(['i2', 'i1']); // restored order
    expect(planBack.items[0]?.state).toBe('done');
    expect(planBack.items[0]?.sessionId).toBe('ses_1');

    const project = allProjects()[0];
    if (!project) throw new Error('no projects');
    const task = project.tasks[0];
    if (!task) throw new Error('no tasks');
    const pp = {
      ...emptyLearnerState(T0).projects[project.id]!,
      tasks: { [task.id]: { done: true, doneAt: T0.toISOString(), note: 'measured 12.4 V' } },
      status: 'active' as const,
    };
    const projectRows = projectToRows(userId, pp);
    const projectBack = projectFromRows(projectRows.main, projectRows.tasks);
    expect(projectBack.tasks[task.id]?.done).toBe(true);
    expect(projectBack.tasks[task.id]?.note).toBe('measured 12.4 V');
    expect(projectBack.status).toBe('active');

    const reminder = {
      id: 'rem_1',
      label: 'Evening study',
      time: '18:30',
      days: [1, 3, 5],
      enabled: true,
      frequency: 'custom' as const,
      includeReviewQueue: true,
      lastFiredAt: null,
      updatedAt: T0.toISOString(),
      dirty: false,
    };
    const reminderBack = reminderFromRow(reminderToRow(userId, reminder));
    expect(reminderBack.time).toBe('18:30');
    expect(reminderBack.days).toEqual([1, 3, 5]);
    expect(reminderBack.frequency).toBe('custom');

    // A malformed remote time falls back rather than breaking the scheduler.
    expect(reminderFromRow({ ...reminderToRow(userId, reminder), time_of_day: 'not-a-time' }).time).toBe(
      '18:00',
    );
  });

  it('coerces hostile remote values instead of propagating NaN', () => {
    expect(num('42', 0)).toBe(42);
    expect(num(null, 7)).toBe(7);
    expect(num('abc', 3)).toBe(3);
    expect(numArray([1, '2', null], [])).toEqual([1, 2, 0]);
    expect(strArray(['a', 3, null], ['z'])).toEqual(['a']);
    expect(toTrackIds(['robotics', 'not-a-track'])).toEqual(['robotics']);
  });

  it('maps an unknown remote status to NOT_STARTED', () => {
    const record = emptyLessonProgress(lesson.id, T0);
    const row = { ...lessonToRow('user-1', record), status: 'COMPLETE' };
    expect(lessonFromRows(row, [], [], []).status).toBe('NOT_STARTED');
  });
});

describe('sync safety', () => {
  it('refuses a service-role key', () => {
    const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
    expect(() => assertNotServiceRole(`eyJhbGci.${payload}.sig`)).toThrow(/service_role/);
  });

  it('accepts an anon key', () => {
    const payload = Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url');
    expect(() => assertNotServiceRole(`eyJhbGci.${payload}.sig`)).not.toThrow();
  });

  it('reports sync as unconfigured when the environment is empty', () => {
    // The repository ships with no Supabase credentials, so the default build is
    // local-only and must say so.
    expect(syncEnv()).toBeNull();
    expect(isSupabaseConfigured()).toBe(false);
  });
});
