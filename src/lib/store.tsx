'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getLesson, getProject } from '@/lib/curriculum';
import { gradeAssessment, type AnswerValue, type GradingResult } from '@/lib/engine/assessment';
import { isUnlocked, roadmapPosition, type ProgressMap } from '@/lib/engine/graph';
import {
  applyGradedAttempt,
  applyReview,
  effectivePassScore,
  masteryGate,
  markContentRead,
  markOpened,
  refreshProgress,
  setExerciseState,
  setReflection,
  addStudySeconds,
  type MasteryGate,
} from '@/lib/engine/mastery';
import {
  buildDailyPlan,
  carryOverUndone,
  planSummary,
  setPlanItemState,
  attachSessionToPlanItem,
} from '@/lib/engine/planner';
import { buildSnapshot, nextLessonToStudy } from '@/lib/engine/progress';
import {
  addStudySecondsToProject,
  projectReadiness,
  setTaskDone,
  setProjectStatus,
  startProject,
} from '@/lib/engine/project';
import {
  closeStaleSessions,
  completeSession,
  creditedSeconds,
  pauseSession,
  resumeSession,
  skipSession,
  startSession,
} from '@/lib/engine/session';
import type { ReviewRating } from '@/lib/engine/srs';
import {
  emptyProjectProgress,
  isoOf,
  localDateKey,
  newNote,
  newReminder,
  addDays,
} from '@/lib/engine/state';
import {
  bootstrap,
  countDirty,
  deleteNote,
  deleteReminder,
  emptyLearnerState,
  emptySyncState,
  persistDirty,
  persistNote,
  persistReminder,
  persistSettings,
  persistSync,
  type LearnerState,
} from '@/lib/db/repository';
import { dbResetAll } from '@/lib/db/idb';
import { isSupabaseConfigured, syncNow } from '@/lib/sync/supabase';
import type {
  DailyPlan,
  Lesson,
  LessonId,
  LessonProgress,
  Note,
  NoteTarget,
  ProjectProgress,
  Reminder,
  Settings,
  StudySession,
  SyncState,
} from '@/lib/types';

/**
 * The application store.
 *
 * One React context holds the learner's entire local state and every mutation
 * that can be performed on it. The rules live in `src/lib/engine/*`; this file is
 * plumbing, and it is deliberately boring:
 *
 *  - state is loaded once through `bootstrap`, which repairs records, recomputes
 *    time-dependent mastery and settles abandoned sessions;
 *  - every mutation is immutable and re-derives the affected lesson, so a stored
 *    `masteryScore` or `status` can never disagree with the evidence;
 *  - writes are debounced to IndexedDB and flushed on `visibilitychange` and
 *    `pagehide`, because a mobile WebView is killed without warning;
 *  - a 60-second tick re-derives time-dependent state, so reviews come due while
 *    the app is open and retention decay is reflected without a reload.
 */

interface StoreMeta {
  ready: boolean;
  storageAvailable: boolean;
  repaired: number;
  error: string | null;
  syncing: boolean;
  lastSyncAt: string | null;
}

interface StoreValue {
  ready: boolean;
  meta: StoreMeta;
  learner: LearnerState;
  progressMap: ProgressMap;
  projectMap: ReadonlyMap<string, ProjectProgress>;
  settings: Settings;
  sync: SyncState;
  todayPlan: DailyPlan | null;
  todaySummary: ReturnType<typeof planSummary> | null;
  snapshot: ReturnType<typeof buildSnapshot> | null;
  activeSession: StudySession | null;
  activeSeconds: number;
  nextUp: { lessonId: string; reason: string } | null;
  position: ReturnType<typeof roadmapPosition>;
  /* lessons */
  lessonProgress: (id: LessonId) => LessonProgress | undefined;
  lessonGate: (id: LessonId) => MasteryGate | null;
  lessonUnlocked: (id: LessonId) => boolean;
  openLesson: (id: LessonId) => void;
  markLessonRead: (id: LessonId) => void;
  toggleExercise: (id: LessonId, exerciseId: string, done: boolean) => void;
  submitAssessment: (
    id: LessonId,
    answers: Record<string, AnswerValue>,
    durationSeconds: number,
  ) => GradingResult | null;
  reviewLesson: (id: LessonId, rating: ReviewRating) => void;
  saveReflection: (id: LessonId, text: string) => void;
  /* sessions */
  beginSession: (
    kind: StudySession['kind'],
    refId: string | null,
    planItemId?: string | null,
  ) => string | null;
  pauseActive: () => void;
  resumeActive: () => void;
  completeActive: (note?: string) => void;
  skipActive: () => void;
  endSessionById: (id: string, note?: string) => void;
  /* plan */
  regeneratePlan: () => void;
  updatePlanItem: (itemId: string, state: DailyPlan['items'][number]['state']) => void;
  skipPlanItem: (itemId: string) => void;
  /* projects */
  beginProject: (projectId: string) => void;
  toggleProjectTask: (projectId: string, taskId: string, done: boolean, note?: string) => void;
  changeProjectStatus: (projectId: string, status: ProjectProgress['status']) => void;
  projectReady: (projectId: string) => ReturnType<typeof projectReadiness>;
  /* notes */
  createNote: (title: string, body: string, target: NoteTarget, tags?: string[]) => string;
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'body' | 'tags' | 'pinned'>>) => void;
  removeNote: (id: string) => void;
  notesFor: (target: NoteTarget) => Note[];
  /* reminders */
  saveReminder: (reminder: Reminder) => void;
  createReminder: (label: string, time: string) => string;
  removeReminder: (id: string) => void;
  /* settings + sync */
  updateSettings: (patch: Partial<Omit<Settings, 'updatedAt' | 'dirty'>>) => void;
  runSync: () => Promise<void>;
  flushNow: () => Promise<void>;
  resetEverything: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Recomputes everything that depends on the passage of time. */
function refreshTimeDependent(state: LearnerState, now: Date): LearnerState {
  let changed = false;
  const lessons: Record<string, LessonProgress> = {};
  for (const [id, progress] of Object.entries(state.lessons)) {
    const lesson = getLesson(id);
    if (!lesson) {
      lessons[id] = progress;
      continue;
    }
    const next = refreshProgress(lesson, progress, now, state.settings.passScoreFloor);
    if (next !== progress) changed = true;
    lessons[id] = next;
  }

  const settled = closeStaleSessions(state.sessions, now, state.settings.staleSessionMinutes);
  if (settled.changed) changed = true;

  if (!changed) return state;
  return { ...state, lessons, sessions: settled.sessions };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [learner, setLearner] = useState<LearnerState | null>(null);
  const [meta, setMeta] = useState<StoreMeta>({
    ready: false,
    storageAvailable: true,
    repaired: 0,
    error: null,
    syncing: false,
    lastSyncAt: null,
  });
  /**
   * A coarse clock. Time-dependent state (due reviews, retention decay, live
   * session seconds) is recomputed from this value rather than from `new Date()`
   * inside a memo, so the dependency is explicit and the UI updates on a tick.
   */
  const [clock, setClock] = useState(() => Date.now());

  const learnerRef = useRef<LearnerState | null>(null);
  learnerRef.current = learner;

  /* ---------------------------- load ---------------------------- */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const now = new Date();
        const result = await bootstrap(now);
        if (cancelled) return;
        setLearner(result.state);
        setMeta((m) => ({
          ...m,
          ready: true,
          storageAvailable: result.storageAvailable,
          repaired: result.repaired,
        }));
        await persistDirty(result.state);
      } catch (err) {
        if (cancelled) return;
        setMeta((m) => ({ ...m, ready: true, error: messageOf(err) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* --------------------- debounced persistence -------------------- */
  useEffect(() => {
    if (!learner) return;
    const timer = setTimeout(() => {
      void persistDirty(learner).catch((err: unknown) =>
        setMeta((m) => ({ ...m, error: messageOf(err) })),
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [learner]);

  /* -------- flush on hide: a WebView can be killed without warning ------- */
  const flushNow = useCallback(async () => {
    const current = learnerRef.current;
    if (!current) return;
    try {
      await persistDirty(current);
    } catch (err) {
      setMeta((m) => ({ ...m, error: messageOf(err) }));
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flushNow();
      } else {
        // Coming back: settle time-dependent state immediately.
        setClock(Date.now());
      }
    };
    const onPageHide = () => {
      void flushNow();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [flushNow]);

  /* ---------------- 60-second tick for time-dependent state ------------- */
  useEffect(() => {
    if (!meta.ready) return;
    const interval = setInterval(() => setClock(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [meta.ready]);

  useEffect(() => {
    if (!learnerRef.current) return;
    const refreshed = refreshTimeDependent(learnerRef.current, new Date(clock));
    if (refreshed !== learnerRef.current) setLearner(refreshed);
  }, [clock]);

  /* ------------------------ mutate helper ------------------------ */
  const commit = useCallback((next: LearnerState | null) => {
    if (next) setLearner(next);
  }, []);

  const withLesson = useCallback(
    (
      lessonId: LessonId,
      fn: (lesson: Lesson, progress: LessonProgress, state: LearnerState, now: Date) => LessonProgress | null,
    ): LessonProgress | null => {
      const state = learnerRef.current;
      if (!state) return null;
      const lesson = getLesson(lessonId);
      const progress = state.lessons[lessonId];
      if (!lesson || !progress) return null;
      const now = new Date();
      const next = fn(lesson, progress, state, now);
      if (!next || next === progress) return next;
      commit({ ...state, lessons: { ...state.lessons, [lessonId]: next } });
      return next;
    },
    [commit],
  );

  /* --------------------------- lessons --------------------------- */
  const openLesson = useCallback(
    (id: LessonId) => {
      withLesson(id, (_lesson, progress, _state, now) => markOpened(progress, now));
    },
    [withLesson],
  );

  const markLessonRead = useCallback(
    (id: LessonId) => {
      withLesson(id, (_lesson, progress, _state, now) => markContentRead(progress, now));
    },
    [withLesson],
  );

  const toggleExercise = useCallback(
    (id: LessonId, exerciseId: string, done: boolean) => {
      withLesson(id, (lesson, progress, state, now) =>
        setExerciseState(lesson, progress, exerciseId, done, now, state.settings.passScoreFloor),
      );
    },
    [withLesson],
  );

  const submitAssessment = useCallback(
    (id: LessonId, answers: Record<string, AnswerValue>, durationSeconds: number) => {
      const state = learnerRef.current;
      if (!state) return null;
      const lesson = getLesson(id);
      const progress = state.lessons[id];
      if (!lesson || !progress) return null;
      const now = new Date();
      const floor = state.settings.passScoreFloor;
      const graded = gradeAssessment(
        lesson,
        answers,
        { durationSeconds, passScore: effectivePassScore(lesson, floor) },
        now,
      );
      const next = applyGradedAttempt(lesson, progress, graded, now, floor);
      commit({ ...state, lessons: { ...state.lessons, [id]: next } });
      return graded;
    },
    [commit],
  );

  const reviewLesson = useCallback(
    (id: LessonId, rating: ReviewRating) => {
      withLesson(id, (lesson, progress, state, now) =>
        applyReview(lesson, progress, rating, now, state.settings.passScoreFloor),
      );
    },
    [withLesson],
  );

  const saveReflection = useCallback(
    (id: LessonId, text: string) => {
      withLesson(id, (lesson, progress, state, now) =>
        refreshProgress(
          lesson,
          { ...setReflection(progress, text, now) },
          now,
          state.settings.passScoreFloor,
        ),
      );
    },
    [withLesson],
  );

  /* --------------------------- sessions --------------------------- */
  const activeSession = useMemo(() => {
    if (!learner) return null;
    return (
      [...learner.sessions]
        .reverse()
        .find((s) => s.state === 'running' || s.state === 'paused') ?? null
    );
  }, [learner]);

  const beginSession = useCallback(
    (kind: StudySession['kind'], refId: string | null, planItemId?: string | null) => {
      const state = learnerRef.current;
      if (!state) return null;
      const now = new Date();
      // One open session at a time: starting another completes the first.
      let sessions = state.sessions;
      const open = sessions.find((s) => s.state === 'running' || s.state === 'paused');
      if (open) {
        sessions = sessions.map((s) => (s.id === open.id ? completeSession(s, now) : s));
      }
      const planDate = localDateKey(now);
      const session = startSession(kind, refId, now, {
        planDate,
        planItemId: planItemId ?? null,
        targetMinutes: kind === 'lesson' && refId ? getLesson(refId)?.estimatedMinutes ?? null : null,
      });
      let plans = state.plans;
      if (planItemId && plans[planDate]) {
        plans = {
          ...plans,
          [planDate]: attachSessionToPlanItem(plans[planDate], planItemId, session.id, now),
        };
      }
      commit({ ...state, sessions: [...sessions, session], plans });
      return session.id;
    },
    [commit],
  );

  const mutateActive = useCallback(
    (fn: (session: StudySession, now: Date) => StudySession) => {
      const state = learnerRef.current;
      if (!state) return;
      const now = new Date();
      const open = [...state.sessions].reverse().find((s) => s.state === 'running' || s.state === 'paused');
      if (!open) return;
      const next = fn(open, now);
      if (next === open) return;
      const sessions = state.sessions.map((s) => (s.id === open.id ? next : s));
      // Credit the study time to whatever the session was about.
      const creditedDelta = next.accumulatedSeconds - open.accumulatedSeconds;
      commit(creditTo(state, sessions, next, creditedDelta, now));
    },
    [commit],
  );

  const pauseActive = useCallback(() => mutateActive((s, now) => pauseSession(s, now)), [mutateActive]);
  const resumeActive = useCallback(() => mutateActive((s, now) => resumeSession(s, now)), [mutateActive]);
  const completeActive = useCallback(
    (note?: string) => mutateActive((s, now) => completeSession(s, now, note ?? null)),
    [mutateActive],
  );
  const skipActive = useCallback(() => mutateActive((s, now) => skipSession(s, now)), [mutateActive]);

  const endSessionById = useCallback(
    (id: string, note?: string) => {
      const state = learnerRef.current;
      if (!state) return;
      const now = new Date();
      const target = state.sessions.find((s) => s.id === id);
      if (!target) return;
      const next = completeSession(target, now, note ?? null);
      const sessions = state.sessions.map((s) => (s.id === id ? next : s));
      commit(creditTo(state, sessions, next, next.accumulatedSeconds - target.accumulatedSeconds, now));
    },
    [commit],
  );

  /* ----------------------------- plan ----------------------------- */
  const ensurePlan = useCallback((): DailyPlan | null => {
    const state = learnerRef.current;
    if (!state) return null;
    const now = new Date();
    const today = localDateKey(now);
    const existing = state.plans[today] ?? null;
    const progressMap = toProgressMap(state);
    const built = buildDailyPlan({
      progressMap,
      projectProgress: toProjectMap(state),
      settings: state.settings,
      now,
      existing,
    });
    const yesterdayKey = localDateKey(addDays(now, -1));
    const withCarry = carryOverUndone(state.plans[yesterdayKey] ?? null, built, now);
    if (existing && withCarry.items.length === existing.items.length && withCarry.generatedAt === existing.generatedAt) {
      return existing;
    }
    commit({ ...state, plans: { ...state.plans, [today]: withCarry } });
    return withCarry;
  }, [commit]);

  useEffect(() => {
    if (!meta.ready) return;
    ensurePlan();
  }, [meta.ready, clock, ensurePlan]);

  const regeneratePlan = useCallback(() => {
    const state = learnerRef.current;
    if (!state) return;
    const now = new Date();
    const today = localDateKey(now);
    const built = buildDailyPlan({
      progressMap: toProgressMap(state),
      projectProgress: toProjectMap(state),
      settings: state.settings,
      now,
      existing: state.plans[today] ?? null,
      regenerate: true,
    });
    commit({ ...state, plans: { ...state.plans, [today]: built } });
  }, [commit]);

  const updatePlanItem = useCallback(
    (itemId: string, itemState: DailyPlan['items'][number]['state']) => {
      const state = learnerRef.current;
      if (!state) return;
      const now = new Date();
      const today = localDateKey(now);
      const plan = state.plans[today];
      if (!plan) return;
      commit({
        ...state,
        plans: { ...state.plans, [today]: setPlanItemState(plan, itemId, itemState, now) },
      });
    },
    [commit],
  );

  const skipPlanItem = useCallback(
    (itemId: string) => updatePlanItem(itemId, 'skipped'),
    [updatePlanItem],
  );

  /* ---------------------------- projects ---------------------------- */
  const withProject = useCallback(
    (
      projectId: string,
      fn: (project: NonNullable<ReturnType<typeof getProject>>, progress: ProjectProgress, now: Date) => ProjectProgress,
    ) => {
      const state = learnerRef.current;
      if (!state) return;
      const project = getProject(projectId);
      if (!project) return;
      const now = new Date();
      const current = state.projects[projectId] ?? emptyProjectProgress(projectId, now);
      const next = fn(project, current, now);
      commit({ ...state, projects: { ...state.projects, [projectId]: next } });
    },
    [commit],
  );

  const beginProject = useCallback(
    (projectId: string) => withProject(projectId, (_p, progress, now) => startProject(progress, now)),
    [withProject],
  );

  const toggleProjectTask = useCallback(
    (projectId: string, taskId: string, done: boolean, note?: string) =>
      withProject(projectId, (project, progress, now) =>
        setTaskDone(project, progress, taskId, done, now, note),
      ),
    [withProject],
  );

  const changeProjectStatus = useCallback(
    (projectId: string, status: ProjectProgress['status']) =>
      withProject(projectId, (_project, progress, now) => setProjectStatus(progress, status, now)),
    [withProject],
  );

  /* ----------------------------- notes ----------------------------- */
  const createNote = useCallback(
    (title: string, body: string, target: NoteTarget, tags: string[] = []) => {
      const state = learnerRef.current;
      if (!state) return '';
      const now = new Date();
      const note = newNote(title, body, target, now, tags);
      commit({ ...state, notes: [note, ...state.notes] });
      void persistNote(note);
      return note.id;
    },
    [commit],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, 'title' | 'body' | 'tags' | 'pinned'>>) => {
      const state = learnerRef.current;
      if (!state) return;
      const now = new Date();
      const notes = state.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: isoOf(now), dirty: true } : n,
      );
      const updated = notes.find((n) => n.id === id);
      commit({ ...state, notes });
      if (updated) void persistNote(updated);
    },
    [commit],
  );

  const removeNote = useCallback(
    (id: string) => {
      const state = learnerRef.current;
      if (!state) return;
      commit({ ...state, notes: state.notes.filter((n) => n.id !== id) });
      void deleteNote(id);
    },
    [commit],
  );

  /* --------------------------- reminders --------------------------- */
  const saveReminder = useCallback(
    (reminder: Reminder) => {
      const state = learnerRef.current;
      if (!state) return;
      const now = new Date();
      const next: Reminder = { ...reminder, updatedAt: isoOf(now), dirty: true };
      const exists = state.reminders.some((r) => r.id === next.id);
      commit({
        ...state,
        reminders: exists
          ? state.reminders.map((r) => (r.id === next.id ? next : r))
          : [...state.reminders, next],
      });
      void persistReminder(next);
    },
    [commit],
  );

  const createReminder = useCallback(
    (label: string, time: string) => {
      const state = learnerRef.current;
      if (!state) return '';
      const now = new Date();
      const reminder = newReminder(label, time, now);
      commit({ ...state, reminders: [...state.reminders, reminder] });
      void persistReminder(reminder);
      return reminder.id;
    },
    [commit],
  );

  const removeReminder = useCallback(
    (id: string) => {
      const state = learnerRef.current;
      if (!state) return;
      commit({ ...state, reminders: state.reminders.filter((r) => r.id !== id) });
      void deleteReminder(id);
    },
    [commit],
  );

  /* --------------------------- settings --------------------------- */
  const updateSettings = useCallback(
    (patch: Partial<Omit<Settings, 'updatedAt' | 'dirty'>>) => {
      const state = learnerRef.current;
      if (!state) return;
      const now = new Date();
      const settings: Settings = { ...state.settings, ...patch, updatedAt: isoOf(now), dirty: true };
      // A changed pass floor or study pattern changes derived state everywhere.
      const refreshed = refreshTimeDependent({ ...state, settings }, now);
      commit(refreshed);
      void persistSettings(settings);
    },
    [commit],
  );

  /* ----------------------------- sync ----------------------------- */
  const runSync = useCallback(async () => {
    const state = learnerRef.current;
    if (!state) return;
    setMeta((m) => ({ ...m, syncing: true, error: null }));
    try {
      const result = await syncNow(state, new Date());
      commit(result.state);
      await persistDirty(result.state);
      await persistSync(result.sync);
      setMeta((m) => ({
        ...m,
        syncing: false,
        lastSyncAt: result.sync.lastPulledAt,
        error: result.sync.lastError,
      }));
    } catch (err) {
      setMeta((m) => ({ ...m, syncing: false, error: messageOf(err) }));
    }
  }, [commit]);

  const resetEverything = useCallback(async () => {
    const now = new Date();
    // Wipe the device store first: otherwise the next load would resurrect the
    // records we just pretended to delete.
    await dbResetAll();
    const fresh: LearnerState = { ...emptyLearnerState(now), sync: emptySyncState() };
    commit(fresh);
    await persistDirty(fresh);
    await persistSettings(fresh.settings);
    setMeta((m) => ({ ...m, repaired: 0, error: null, lastSyncAt: null }));
  }, [commit]);

  /* --------------------------- derived --------------------------- */
  const progressMap = useMemo(() => (learner ? toProgressMap(learner) : new Map()), [learner]);
  const projectMap = useMemo(() => (learner ? toProjectMap(learner) : new Map()), [learner]);

  const snapshot = useMemo(() => {
    if (!learner) return null;
    return buildSnapshot({
      progressMap,
      projectProgress: projectMap,
      sessions: learner.sessions,
      settings: learner.settings,
      now: new Date(clock),
    });
  }, [learner, progressMap, projectMap, clock]);

  const todayKey = learner ? localDateKey(new Date()) : '';
  const todayPlan = learner && todayKey ? learner.plans[todayKey] ?? null : null;
  const todaySummary = todayPlan ? planSummary(todayPlan) : null;

  const position = useMemo(
    () => roadmapPosition(progressMap, learner?.settings.passScoreFloor ?? 80),
    [progressMap, learner],
  );

  const nextUp = useMemo(() => {
    if (!learner) return null;
    return nextLessonToStudy(progressMap, learner.settings, new Date(clock));
  }, [learner, progressMap, clock]);

  const activeSeconds = useMemo(() => {
    if (!activeSession) return 0;
    return creditedSeconds(activeSession, new Date(clock));
  }, [activeSession, clock]);

  const lessonProgress = useCallback(
    (id: LessonId) => learner?.lessons[id],
    [learner],
  );

  const lessonGate = useCallback(
    (id: LessonId): MasteryGate | null => {
      if (!learner) return null;
      const lesson = getLesson(id);
      const progress = learner.lessons[id];
      if (!lesson || !progress) return null;
      return masteryGate(lesson, progress, new Date(), learner.settings.passScoreFloor);
    },
    [learner],
  );

  const lessonUnlocked = useCallback(
    (id: LessonId) => {
      if (!learner) return false;
      const lesson = getLesson(id);
      if (!lesson) return false;
      return isUnlocked(lesson, progressMap, learner.settings.passScoreFloor);
    },
    [learner, progressMap],
  );

  const projectReady = useCallback(
    (projectId: string) => {
      const project = getProject(projectId);
      if (!project) return { ready: false, missing: [] };
      return projectReadiness(project, progressMap, learner?.settings.passScoreFloor ?? 80);
    },
    [progressMap, learner],
  );

  const notesFor = useCallback(
    (target: NoteTarget) => {
      if (!learner) return [];
      return learner.notes
        .filter((n) => n.target.kind === target.kind && n.target.id === target.id)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
    },
    [learner],
  );

  const value: StoreValue | null = learner
    ? {
        ready: meta.ready,
        meta,
        learner,
        progressMap,
        projectMap,
        settings: learner.settings,
        sync: learner.sync,
        todayPlan,
        todaySummary,
        snapshot,
        activeSession,
        activeSeconds,
        nextUp,
        position,
        lessonProgress,
        lessonGate,
        lessonUnlocked,
        openLesson,
        markLessonRead,
        toggleExercise,
        submitAssessment,
        reviewLesson,
        saveReflection,
        beginSession,
        pauseActive,
        resumeActive,
        completeActive,
        skipActive,
        endSessionById,
        regeneratePlan,
        updatePlanItem,
        skipPlanItem,
        beginProject,
        toggleProjectTask,
        changeProjectStatus,
        projectReady,
        createNote,
        updateNote,
        removeNote,
        notesFor,
        saveReminder,
        createReminder,
        removeReminder,
        updateSettings,
        runSync,
        flushNow,
        resetEverything,
      }
    : null;

  if (!value) {
    return (
      <StoreContext.Provider value={null}>
        <LoadingScreen error={meta.error} />
      </StoreContext.Provider>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside <StoreProvider> after state has loaded');
  }
  return ctx;
}

/** For screens that must render before the store is ready. */
export function useOptionalStore(): StoreValue | null {
  return useContext(StoreContext);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toProgressMap(state: LearnerState): ProgressMap {
  return new Map(Object.entries(state.lessons) as [LessonId, LessonProgress][]);
}

function toProjectMap(state: LearnerState): ReadonlyMap<string, ProjectProgress> {
  return new Map(Object.entries(state.projects));
}

/**
 * Adds the seconds a session just banked to whatever it was studying, and marks
 * the matching plan item done when the session completed.
 */
function creditTo(
  state: LearnerState,
  sessions: StudySession[],
  session: StudySession,
  deltaSeconds: number,
  now: Date,
): LearnerState {
  let next: LearnerState = { ...state, sessions };

  if (deltaSeconds > 0 && session.refId) {
    if (session.kind === 'lesson' || session.kind === 'review') {
      const lesson = getLesson(session.refId);
      const progress = next.lessons[session.refId];
      if (lesson && progress) {
        next = {
          ...next,
          lessons: {
            ...next.lessons,
            [session.refId]: addStudySeconds(progress, deltaSeconds, now),
          },
        };
      }
    } else if (session.kind === 'project') {
      const progress = next.projects[session.refId] ?? emptyProjectProgress(session.refId, now);
      next = {
        ...next,
        projects: {
          ...next.projects,
          [session.refId]: addStudySecondsToProject(progress, deltaSeconds, now),
        },
      };
    }
  }

  if (session.state === 'completed' && session.planDate && session.planItemId) {
    const plan = next.plans[session.planDate];
    if (plan) {
      next = {
        ...next,
        plans: {
          ...next.plans,
          [session.planDate]: setPlanItemState(plan, session.planItemId, 'done', now),
        },
      };
    }
  }

  return next;
}

function LoadingScreen({ error }: { error: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-graphite-950 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500/80">
        Road to Jaeger
      </p>
      <p className="text-sm text-graphite-300">Loading your local progress…</p>
      {error ? (
        <p className="max-w-sm text-xs text-red-400">
          Storage error: {error}. The app will still work, but progress may not be
          saved on this device.
        </p>
      ) : null}
    </div>
  );
}

/** Convenience for screens that need a lesson plus its state in one call. */
export function useLesson(id: LessonId | null): {
  lesson: Lesson | null;
  progress: LessonProgress | null;
  gate: MasteryGate | null;
  unlocked: boolean;
} {
  const store = useOptionalStore();
  return useMemo(() => {
    const lesson = id ? getLesson(id) ?? null : null;
    if (!store || !lesson) {
      return { lesson, progress: null, gate: null, unlocked: false };
    }
    return {
      lesson,
      progress: store.lessonProgress(lesson.id) ?? null,
      gate: store.lessonGate(lesson.id),
      unlocked: store.lessonUnlocked(lesson.id),
    };
  }, [store, id]);
}

/** Exposed for the Settings screen: how much local data is waiting to sync. */
export function usePendingWrites(): number {
  const store = useOptionalStore();
  const learner = store?.learner ?? null;
  return useMemo(() => (learner ? countDirty(learner) : 0), [learner]);
}

/** Whether cross-device sync can be offered at all in this build. */
export function useSyncAvailable(): boolean {
  return useMemo(() => isSupabaseConfigured(), []);
}
