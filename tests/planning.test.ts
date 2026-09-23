import { describe, expect, it } from 'vitest';

import { allLessons, allProjects, allSkills, getProject, requireLesson } from '@/lib/curriculum';
import { gradeAssessment, type AnswerValue } from '@/lib/engine/assessment';
import { isUnlocked, type ProgressMap } from '@/lib/engine/graph';
import {
  applyGradedAttempt,
  applyReview,
  effectivePassScore,
  markOpened,
  requiredExerciseIds,
  setExerciseState,
  setReflection,
} from '@/lib/engine/mastery';
import {
  MAX_PLAN_ITEMS,
  REVIEW_MINUTES,
  buildDailyPlan,
  carryOverUndone,
  isStudyDay,
  planSummary,
  resolvePlanItem,
  setPlanItemState,
} from '@/lib/engine/planner';
import { buildSnapshot, nextLessonToStudy } from '@/lib/engine/progress';
import {
  projectReadiness,
  setTaskDone,
  summariseProject,
  addStudySecondsToProject,
} from '@/lib/engine/project';
import {
  closeStaleSessions,
  completeSession,
  creditedSeconds,
  currentStreakDays,
  dailyActivity,
  formatDuration,
  last7DaysSeconds,
  longestStreakDays,
  pauseSession,
  resumeSession,
  skipSession,
  startSession,
  targetHitDays,
  todaySeconds,
} from '@/lib/engine/session';
import {
  addDays,
  addMinutes,
  defaultSettings,
  emptyDailyPlan,
  emptyLessonProgress,
  emptyProjectProgress,
  localDateKey,
  newPlanItem,
} from '@/lib/engine/state';
import type { DailyPlan, Lesson, LessonId, LessonProgress, Settings, StudySession } from '@/lib/types';

/**
 * Tests for the time-keeping half of the engine: sessions, the daily plan, the
 * progress snapshot and project progress.
 *
 * The theme is that none of these can inflate themselves. Study time comes only
 * from finished running segments, plans are deterministic and stay inside the
 * budget, snapshots are pure counts of real records, and projects only advance
 * when their tasks are actually done.
 */

const FLOOR = 80;
/** A Monday, so the default study-day set (Mon-Sat) includes it. */
const T0 = new Date(2026, 2, 2, 8, 0, 0);

function freshProgressMap(now: Date): Map<LessonId, LessonProgress> {
  const map = new Map<LessonId, LessonProgress>();
  for (const lesson of allLessons()) map.set(lesson.id, emptyLessonProgress(lesson.id, now));
  return map;
}

function allCorrect(lesson: Lesson): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  for (const q of lesson.assessment.questions) {
    if (q.type === 'mcq') out[q.id] = q.answer as number;
    else if (q.type === 'numeric') out[q.id] = q.answer as number;
    else out[q.id] = Array.isArray(q.answer) ? q.answer[0] ?? String(q.answer) : String(q.answer);
  }
  return out;
}

function pass(
  lesson: Lesson,
  map: Map<LessonId, LessonProgress>,
  now: Date,
): LessonProgress {
  const before = map.get(lesson.id) ?? emptyLessonProgress(lesson.id, now);
  const graded = gradeAssessment(
    lesson,
    allCorrect(lesson),
    { durationSeconds: 300, passScore: effectivePassScore(lesson, FLOOR) },
    now,
  );
  const after = applyGradedAttempt(lesson, before, graded, now, FLOOR);
  map.set(lesson.id, after);
  return after;
}

/** A fully mastered lesson, achieved through the only route the engine allows. */
function master(
  lesson: Lesson,
  map: Map<LessonId, LessonProgress>,
  now: Date,
): LessonProgress {
  let p = map.get(lesson.id) ?? emptyLessonProgress(lesson.id, now);
  p = markOpened(p, now);
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
  const reviewed = applyReview(lesson, p, 'good', addDays(now, 1), FLOOR);
  map.set(lesson.id, reviewed);
  return reviewed;
}

function settings(overrides: Partial<Settings> = {}, now: Date = T0): Settings {
  return { ...defaultSettings(now), ...overrides };
}

/** A session that ran for `minutes` on the day of `start`. */
function sessionOn(start: Date, minutes: number, refId: string | null = 'math-01'): StudySession {
  const s = startSession('lesson', refId, start);
  return completeSession(s, addMinutes(start, minutes));
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

describe('study sessions', () => {
  it('credits only finished running segments', () => {
    const s = startSession('lesson', 'math-01', T0);
    expect(s.state).toBe('running');
    expect(creditedSeconds(s, addMinutes(T0, 1.5))).toBe(90);

    const paused = pauseSession(s, addMinutes(T0, 1.5));
    expect(paused.state).toBe('paused');
    expect(paused.accumulatedSeconds).toBe(90);
    expect(paused.segmentStartedAt).toBeNull();
    // Paused time does not accrue, so an app left open cannot invent study time.
    expect(creditedSeconds(paused, addMinutes(T0, 20))).toBe(90);

    const resumed = resumeSession(paused, addMinutes(T0, 20));
    const done = completeSession(resumed, addMinutes(T0, 21));
    expect(done.state).toBe('completed');
    expect(done.accumulatedSeconds).toBe(150);
    expect(done.endedAt).not.toBeNull();
  });

  it('credits nothing for a skipped session, even one that was running', () => {
    const s = startSession('review', 'math-01', T0);
    const skipped = skipSession(s, addMinutes(T0, 5));
    expect(skipped.state).toBe('skipped');
    expect(skipped.accumulatedSeconds).toBe(0);
    expect(creditedSeconds(skipped, addMinutes(T0, 60))).toBe(0);
  });

  it('closes a session left running, capping the credit at the idle limit', () => {
    const s = startSession('lesson', 'math-01', T0);
    const { sessions, changed } = closeStaleSessions([s], addMinutes(T0, 20), 15);
    expect(changed).toBe(true);
    const closed = sessions[0];
    if (!closed) throw new Error('session disappeared');
    expect(closed.state).toBe('abandoned');
    expect(closed.accumulatedSeconds).toBe(15 * 60);
    expect(closed.autoEndedReason).toMatch(/idle/i);
    expect(closed.endedAt).not.toBeNull();
  });

  it('leaves a session alone while it is inside the idle limit', () => {
    const s = startSession('lesson', 'math-01', T0);
    const { sessions, changed } = closeStaleSessions([s], addMinutes(T0, 5), 15);
    expect(changed).toBe(false);
    expect(sessions[0]?.state).toBe('running');
  });

  it('keeps banked time when a long-paused session is closed', () => {
    const s = startSession('lesson', 'math-01', T0);
    const paused = pauseSession(s, addMinutes(T0, 5));
    const { sessions } = closeStaleSessions([paused], addMinutes(T0, 5 + 60 * 8), 15);
    const closed = sessions[0];
    if (!closed) throw new Error('session disappeared');
    expect(closed.state).toBe('abandoned');
    expect(closed.accumulatedSeconds).toBe(300);
  });

  it('counts activity, streaks and target days from the same records', () => {
    const sessions = [
      sessionOn(addDays(T0, -2), 10),
      sessionOn(addDays(T0, -1), 10),
      sessionOn(T0, 10),
      sessionOn(addDays(T0, -6), 10),
    ];
    expect(todaySeconds(sessions, T0)).toBe(600);
    expect(last7DaysSeconds(sessions, T0)).toBe(2400);
    expect(currentStreakDays(sessions, T0)).toBe(3);
    expect(longestStreakDays(sessions)).toBe(3);
    expect(targetHitDays(sessions, T0, 10, 30)).toBe(4);
    expect(targetHitDays(sessions, T0, 30, 30)).toBe(0);

    const activity = dailyActivity(sessions, T0, 5);
    expect(activity).toHaveLength(5);
    expect(activity[4]?.date).toBe(localDateKey(T0));
    expect(activity[0]?.date).toBe(localDateKey(addDays(T0, -4)));
    expect(activity[0]?.seconds).toBe(0);
    expect(activity[4]?.seconds).toBe(600);
  });

  it('does not break a streak before the learner has had a chance to study today', () => {
    const sessions = [sessionOn(addDays(T0, -1), 10)];
    expect(todaySeconds(sessions, T0)).toBe(0);
    expect(currentStreakDays(sessions, T0)).toBe(1);
  });

  it('formats durations for humans', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(600)).toBe('10m');
    expect(formatDuration(3600 + 1500)).toBe('1h 25m');
    expect(formatDuration(-10)).toBe('0s');
  });
});

/* -------------------------------------------------------------------------- */
/* Daily plan                                                                 */
/* -------------------------------------------------------------------------- */

describe('the daily plan', () => {
  it('produces a deterministic plan that fits the budget', () => {
    const map = freshProgressMap(T0);
    const ctx = {
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings({ dailyMinutes: 45 }),
      now: T0,
    };
    const plan = buildDailyPlan(ctx);
    expect(plan.date).toBe(localDateKey(T0));
    expect(plan.budgetMinutes).toBe(45);
    expect(plan.items.length).toBeGreaterThan(0);

    const minutes = plan.items.reduce((s, i) => s + i.estimatedMinutes, 0);
    const largest = Math.max(...plan.items.map((i) => i.estimatedMinutes));
    // The budget may be crossed by the item that crosses it, and by nothing else.
    expect(minutes).toBeLessThanOrEqual(45 + largest);

    // Same state, same time -> identical plan.
    const again = buildDailyPlan({ ...ctx, existing: null });
    expect(again.items).toEqual(plan.items);

    const orders = plan.items.map((i) => i.order);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
    expect(new Set(plan.items.map((i) => i.id)).size).toBe(plan.items.length);
    for (const item of plan.items) {
      expect(item.reason.length).toBeGreaterThan(5);
      expect(item.state).toBe('planned');
    }
  });

  it('is idempotent for a plan that already exists today', () => {
    const map = freshProgressMap(T0);
    const ctx = {
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings(),
      now: T0,
    };
    const plan = buildDailyPlan(ctx);
    expect(buildDailyPlan({ ...ctx, existing: plan })).toBe(plan);
    // ...unless the learner asks for a rebuild.
    const rebuilt = buildDailyPlan({ ...ctx, existing: plan, regenerate: true });
    expect(rebuilt.date).toBe(plan.date);
  });

  it('puts overdue reviews ahead of everything else', () => {
    const map = freshProgressMap(T0);
    const lesson = requireLesson('math-01');
    pass(lesson, map, T0);

    const later = addDays(T0, 4);
    const plan = buildDailyPlan({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings(),
      now: later,
    });
    const first = plan.items[0];
    expect(first?.kind).toBe('review');
    expect(first?.refId).toBe('math-01');
    expect(first?.reason).toMatch(/overdue/i);
    expect(first?.estimatedMinutes).toBe(REVIEW_MINUTES);
  });

  it('prefers finishing what was started over starting something new', () => {
    const map = freshProgressMap(T0);
    const started = requireLesson('math-02');
    const before = map.get(started.id);
    if (!before) throw new Error('no progress record');
    map.set(started.id, markOpened(before, T0));

    const plan = buildDailyPlan({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings({ dailyMinutes: 120 }),
      now: T0,
    });
    const continueItem = plan.items.find((i) => i.refId === started.id);
    expect(continueItem).toBeDefined();
    expect(continueItem?.title).toMatch(/^Continue:/);
    // It must come before any brand-new lesson in the plan order.
    const index = plan.items.findIndex((i) => i.refId === started.id);
    const firstNew = plan.items.findIndex((i) => i.kind === 'lesson' && !i.title.startsWith('Continue'));
    expect(firstNew === -1 || index < firstNew).toBe(true);
  });

  it('rests on a non-study day: reviews only, small budget', () => {
    const map = freshProgressMap(T0);
    pass(requireLesson('math-01'), map, T0);
    const sunday = addDays(T0, 6);
    expect(isStudyDay(settings(), sunday)).toBe(false);

    const plan = buildDailyPlan({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings({ dailyMinutes: 60 }),
      now: sunday,
    });
    expect(plan.budgetMinutes).toBeLessThanOrEqual(15);
    expect(plan.items.every((i) => i.kind === 'review')).toBe(true);
  });

  it('never exceeds the item cap, however large the budget', () => {
    const map = freshProgressMap(T0);
    const plan = buildDailyPlan({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings({ dailyMinutes: 5000 }),
      now: T0,
    });
    expect(plan.items.length).toBeLessThanOrEqual(MAX_PLAN_ITEMS);
  });

  it('tracks item state and summarises the plan', () => {
    const map = freshProgressMap(T0);
    let plan = buildDailyPlan({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings({ dailyMinutes: 30 }),
      now: T0,
    });
    expect(planSummary(plan).done).toBe(0);

    for (const item of plan.items) {
      plan = setPlanItemState(plan, item.id, 'done', addMinutes(T0, 5));
    }
    const summary = planSummary(plan);
    expect(summary.done).toBe(summary.total);
    expect(summary.remaining).toBe(0);
    expect(summary.complete).toBe(true);
    expect(summary.doneMinutes).toBe(summary.plannedMinutes);
    expect(plan.dirty).toBe(true);
  });

  it('carries unfinished work into the next day, with the reason attached', () => {
    // A synthetic yesterday: phys-14 has prerequisites, so it cannot appear in
    // today's plan by itself - which is what makes the carry-over observable.
    const yesterday: DailyPlan = {
      ...emptyDailyPlan(localDateKey(T0), 30, T0),
      items: [
        newPlanItem({
          id: `${localDateKey(T0)}:lesson:phys-14`,
          kind: 'lesson',
          refId: 'phys-14',
          title: 'Centre of Mass and Stability',
          estimatedMinutes: 30,
          order: 1,
          reason: 'Newly unlocked',
        }),
      ],
    };
    const skipped = setPlanItemState(
      yesterday,
      yesterday.items[0]?.id ?? '',
      'skipped',
      T0,
    );

    const today = buildDailyPlan({
      progressMap: freshProgressMap(addDays(T0, 1)) as ProgressMap,
      projectProgress: new Map(),
      settings: settings({ dailyMinutes: 30 }),
      now: addDays(T0, 1),
    });
    expect(today.items.some((i) => i.refId === 'phys-14')).toBe(false);

    const carried = carryOverUndone(skipped, today, addDays(T0, 1));
    const found = carried.items.find((i) => i.refId === 'phys-14');
    expect(found).toBeDefined();
    expect(found?.reason).toMatch(/carried over/i);
    expect(found?.state).toBe('planned');
    expect(carried.items.length).toBeLessThanOrEqual(MAX_PLAN_ITEMS);
    const orders = carried.items.map((i) => i.order);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });

  it('resolves plan items to navigable links', () => {
    const lessonItem = resolvePlanItem({
      id: '2026-03-02:lesson:math-01',
      kind: 'lesson',
      refId: 'math-01',
      title: 'Arithmetic and Order of Operations',
      estimatedMinutes: 25,
      order: 1,
      state: 'planned',
      reason: 'Newly unlocked',
    });
    expect(lessonItem.href).toBe('/lessons/detail?id=math-01');
    expect(lessonItem.title).toBe('Arithmetic and Order of Operations');

    const project = allProjects()[0];
    if (!project) throw new Error('no projects');
    const task = project.tasks[0];
    if (!task) throw new Error('project has no tasks');
    const taskItem = resolvePlanItem({
      id: `2026-03-02:project-task:${project.id}:${task.id}`,
      kind: 'project-task',
      refId: project.id,
      title: `${project.name}: ${task.title}`,
      estimatedMinutes: task.estimatedMinutes,
      order: 2,
      state: 'planned',
      reason: 'Active project',
    });
    expect(taskItem.href).toContain(`/projects/detail?id=${project.id}`);
    expect(taskItem.href).toContain(`task=${task.id}`);
  });
});

/* -------------------------------------------------------------------------- */
/* Progress snapshot                                                          */
/* -------------------------------------------------------------------------- */

describe('the progress snapshot', () => {
  it('reports nothing at all for a fresh learner', () => {
    const map = freshProgressMap(T0);
    const snap = buildSnapshot({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      sessions: [],
      settings: settings(),
      now: T0,
    });
    expect(snap.lessons.total).toBe(allLessons().length);
    expect(snap.lessons.notStarted).toBe(allLessons().length);
    expect(snap.lessons.mastered).toBe(0);
    expect(snap.lessons.passed).toBe(0);
    expect(snap.skills.total).toBe(allSkills().length);
    expect(snap.skills.unlocked).toBe(0);
    expect(snap.reviews.dueNow).toBe(0);
    expect(snap.study.totalSeconds).toBe(0);
    expect(snap.study.streakDays).toBe(0);
    expect(snap.roadmapPosition.lessonId).toBeNull();
    // Subject and track totals must add up to the curriculum - no double counting.
    expect(snap.subjects.reduce((s, x) => s + x.total, 0)).toBe(allLessons().length);
    expect(snap.tracks.reduce((s, x) => s + x.total, 0)).toBe(allLessons().length);
  });

  it('schedules a review after a pass, and counts it before it is due', () => {
    const map = freshProgressMap(T0);
    pass(requireLesson('math-01'), map, T0);
    const snap = buildSnapshot({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      sessions: [],
      settings: settings(),
      now: T0,
    });
    expect(snap.lessons.passed).toBe(1);
    expect(snap.lessons.review).toBe(1);
    expect(snap.lessons.mastered).toBe(0);
    expect(snap.reviews.dueNow).toBe(0);
    expect(snap.reviews.scheduledNext30Days).toBe(1);

    const tomorrow = buildSnapshot({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      sessions: [],
      settings: settings(),
      now: addDays(T0, 1),
    });
    expect(tomorrow.reviews.dueNow).toBe(1);
  });

  it('unlocks a skill only after full mastery', () => {
    const map = freshProgressMap(T0);
    const single = allSkills().find((s) => s.requiredLessons.length === 1);
    if (!single) throw new Error('no single-lesson skill');
    const lesson = requireLesson(single.requiredLessons[0] ?? '');
    master(lesson, map, addDays(T0, 1));

    const snap = buildSnapshot({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      sessions: [],
      settings: settings(),
      now: addDays(T0, 1),
    });
    expect(snap.lessons.mastered).toBe(1);
    expect(snap.skills.unlockedIds).toContain(single.id);
    expect(snap.roadmapPosition.lessonId).toBe(lesson.id);
    expect(snap.roadmapPosition.description).toContain(lesson.title);
  });

  it('adds credited study time from sessions and lesson records', () => {
    const map = freshProgressMap(T0);
    const sessions = [sessionOn(T0, 25), sessionOn(T0, 10)];
    const snap = buildSnapshot({
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      sessions,
      settings: settings({ dailyMinutes: 30 }),
      now: T0,
    });
    expect(snap.study.todaySeconds).toBe(2100);
    expect(snap.study.sessionsCompleted).toBe(2);
    expect(snap.study.streakDays).toBe(1);
    expect(snap.study.dailyTargetHitDaysLast30).toBe(1);
    expect(snap.study.activity).toHaveLength(30);
  });

  it('points the dashboard at an overdue review before anything else', () => {
    const map = freshProgressMap(T0);
    pass(requireLesson('math-01'), map, T0);
    const later = addDays(T0, 5);
    const next = nextLessonToStudy(map as ProgressMap, settings(), later);
    expect(next?.lessonId).toBe('math-01');
    expect(next?.reason).toMatch(/overdue/i);
  });

  it('points a fresh learner at the first unlocked lesson', () => {
    const map = freshProgressMap(T0);
    const next = nextLessonToStudy(map as ProgressMap, settings(), T0);
    expect(next).not.toBeNull();
    const lesson = requireLesson(next?.lessonId ?? '');
    expect(isUnlocked(lesson, map as ProgressMap, FLOOR)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

describe('project progress', () => {
  const projectId = 'prj-bench-measure';
  const project = getProject(projectId);
  if (!project) throw new Error('missing project fixture');

  it('is gated on the lessons it requires', () => {
    const map = freshProgressMap(T0);
    const readiness = projectReadiness(project, map as ProgressMap, FLOOR);
    expect(readiness.ready).toBe(false);
    expect(readiness.missing.length).toBe(project.requiredSkills.length);
    expect(readiness.missing.every((m) => m.title.length > 0)).toBe(true);

    for (const lid of project.requiredSkills) pass(requireLesson(lid), map, T0);
    expect(projectReadiness(project, map as ProgressMap, FLOOR).ready).toBe(true);
  });

  it('advances only when tasks are actually done', () => {
    let pp = emptyProjectProgress(projectId, T0);
    expect(pp.status).toBe('not-started');

    const first = project.tasks[0];
    if (!first) throw new Error('project has no tasks');
    pp = setTaskDone(project, pp, first.id, true, T0);
    expect(pp.status).toBe('active');
    expect(pp.startedAt).not.toBeNull();
    expect(pp.tasks[first.id]?.done).toBe(true);
    expect(pp.completedAt).toBeNull();

    // Milestone 1 needs every one of its tasks.
    const milestone = project.milestones[0];
    if (!milestone) throw new Error('project has no milestones');
    expect(pp.milestonesReached[milestone.id]).toBeUndefined();
    for (const tid of milestone.taskIds) pp = setTaskDone(project, pp, tid, true, T0, undefined);
    expect(pp.milestonesReached[milestone.id]).not.toBeUndefined();

    // Undoing one task removes the milestone again: nothing is sticky.
    const undone = milestone.taskIds[0];
    if (!undone) throw new Error('milestone has no tasks');
    pp = setTaskDone(project, pp, undone, false, T0);
    expect(pp.milestonesReached[milestone.id]).toBeUndefined();
    expect(pp.status).toBe('active');

    for (const t of project.tasks) pp = setTaskDone(project, pp, t.id, true, T0);
    expect(pp.status).toBe('completed');
    expect(pp.completedAt).not.toBeNull();
    expect(project.milestones.every((m) => pp.milestonesReached[m.id])).toBe(true);
  });

  it('summarises remaining work and names the next task', () => {
    let pp = emptyProjectProgress(projectId, T0);
    const first = project.tasks[0];
    if (!first) throw new Error('project has no tasks');
    const summary = summariseProject(projectId, new Map() as ProgressMap, pp, FLOOR, T0);
    expect(summary).not.toBeNull();
    expect(summary?.tasksTotal).toBe(project.tasks.length);
    expect(summary?.tasksDone).toBe(0);
    expect(summary?.nextTaskId).toBe(first.id);
    expect(summary?.readiness.ready).toBe(false);
    expect(summary?.acceptanceCriteria.length).toBe(project.acceptanceCriteria.length);

    pp = setTaskDone(project, pp, first.id, true, T0);
    const after = summariseProject(projectId, new Map() as ProgressMap, pp, FLOOR, T0);
    expect(after?.tasksDone).toBe(1);
    expect(after?.estimatedMinutesRemaining).toBe(
      summary!.estimatedMinutesTotal - first.estimatedMinutes,
    );

    const timed = addStudySecondsToProject(pp, 90, addMinutes(T0, 5));
    expect(timed.totalStudySeconds).toBe(90);
    expect(timed.lastWorkedAt).not.toBeNull();
  });
});

describe('plan and session wiring', () => {
  it('keeps plan item ids stable so ticks survive a rebuild', () => {
    const map = freshProgressMap(T0);
    const ctx = {
      progressMap: map as ProgressMap,
      projectProgress: new Map(),
      settings: settings({ dailyMinutes: 60 }),
      now: T0,
    };
    const plan: DailyPlan = buildDailyPlan(ctx);
    const target = plan.items[0];
    if (!target) throw new Error('empty plan');
    const ticked = setPlanItemState(plan, target.id, 'done', T0);

    const rebuilt = buildDailyPlan({ ...ctx, existing: ticked, regenerate: true });
    const stillThere = rebuilt.items.find((i) => i.id === target.id);
    expect(stillThere).toBeDefined();
    expect(stillThere?.state).toBe('done');
  });
});
