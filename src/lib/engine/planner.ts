import { allProjects, getLesson } from '@/lib/curriculum';
import type { DailyPlan, PlanItem, ProjectProgress, Settings } from '@/lib/types';
import { availableLessons, dueReviews, inProgressLessons, isPassed, type ProgressMap } from './graph';
import { daysUntilDue } from './srs';
import { emptyDailyPlan, isoOf, localDateKey, newPlanItem } from './state';

/**
 * The daily plan.
 *
 * A deterministic fill from five pools, in this order:
 *
 *   1. overdue reviews   - forgetting is the only thing that gets worse on its own
 *   2. reviews due today
 *   3. lessons in progress - finishing what you started beats starting something new
 *   4. newly unlocked lessons, preferring the learner's focus tracks
 *   5. tasks from an active project whose prerequisites are passed
 *
 * The budget is filled, not exceeded by more than one item, and item ids are
 * derived from the date and the thing being studied so that a regenerated plan
 * keeps the ticks already made. Nothing here reads a random number, which means
 * the same state at the same time always produces the same plan.
 */

export const REVIEW_MINUTES = 5;
export const MAX_PLAN_ITEMS = 12;
/** Non-study days get a maintenance plan: keep the memory alive, learn nothing new. */
export const REST_DAY_MINUTES = 15;

export interface PlanContext {
  progressMap: ProgressMap;
  projectProgress: ReadonlyMap<string, ProjectProgress>;
  settings: Settings;
  now: Date;
  /** The plan already stored for this date, if any. */
  existing?: DailyPlan | null;
  /** Rebuild even if a plan already exists for today. */
  regenerate?: boolean;
}

export function isStudyDay(settings: Settings, now: Date): boolean {
  if (!settings.studyDays.length) return true;
  return settings.studyDays.includes(now.getDay());
}

/** Deterministic plan item id: stable across regenerations on the same date. */
function itemId(date: string, kind: PlanItem['kind'], refId: string, sub?: string): string {
  return `${date}:${kind}:${refId}${sub ? `:${sub}` : ''}`;
}

interface Candidate {
  kind: PlanItem['kind'];
  refId: string;
  sub?: string;
  title: string;
  subjectId?: string;
  estimatedMinutes: number;
  reason: string;
  /** Lower sorts first within its pool. */
  rank: number;
  pool: number;
}

export function buildDailyPlan(ctx: PlanContext): DailyPlan {
  const { progressMap, projectProgress, settings, now } = ctx;
  const date = localDateKey(now);

  // Idempotent: a plan built today is returned as-is unless forced.
  if (ctx.existing && ctx.existing.date === date && !ctx.regenerate) {
    return ctx.existing;
  }

  const studyDay = isStudyDay(settings, now);
  const budget = studyDay
    ? Math.max(10, settings.dailyMinutes)
    : Math.min(REST_DAY_MINUTES, Math.max(10, settings.dailyMinutes));

  const candidates: Candidate[] = [];
  const taken = new Set<string>();

  const push = (c: Candidate) => {
    const key = `${c.kind}:${c.refId}:${c.sub ?? ''}`;
    if (taken.has(key)) return;
    taken.add(key);
    candidates.push(c);
  };

  /* 1 + 2. Reviews: overdue first, then due today. */
  const reviews = dueReviews(progressMap, now);
  for (const r of reviews) {
    const late = daysUntilDue(r.progress.srs, now) ?? 0;
    const overdue = late < -1;
    push({
      kind: 'review',
      refId: r.lesson.id,
      title: `Review: ${r.lesson.title}`,
      subjectId: r.lesson.subjectId,
      estimatedMinutes: REVIEW_MINUTES,
      reason: overdue
        ? `Overdue review - ${Math.abs(Math.round(late))} day${Math.abs(Math.round(late)) === 1 ? '' : 's'} late`
        : 'Review due today',
      rank: -late,
      pool: overdue ? 0 : 1,
    });
  }

  // A rest day stops here: reviews only.
  if (!studyDay) return fill(ctx.existing, date, budget, candidates, now);

  /* 3. Lessons already in progress. */
  const inProgress = inProgressLessons(progressMap, settings.passScoreFloor);
  inProgress.forEach((lesson, i) => {
    const progress = progressMap.get(lesson.id);
    const lastStudied = progress?.lastStudiedAt ? Date.parse(progress.lastStudiedAt) : 0;
    push({
      kind: 'lesson',
      refId: lesson.id,
      title: `Continue: ${lesson.title}`,
      subjectId: lesson.subjectId,
      estimatedMinutes: Math.max(10, Math.round(lesson.estimatedMinutes / 2)),
      reason: progress?.attempts.length
        ? `Assessment attempted (best ${Math.round(progress.bestScore)}%) - finish it`
        : 'Started but not finished',
      rank: Number.isNaN(lastStudied) ? i : -lastStudied,
      pool: 2,
    });
  });

  /* 4. Newly unlocked lessons, focus tracks first. */
  const focus = new Set(settings.focusTracks);
  availableLessons(progressMap, settings.passScoreFloor).forEach((lesson, i) => {
    push({
      kind: 'lesson',
      refId: lesson.id,
      title: lesson.title,
      subjectId: lesson.subjectId,
      estimatedMinutes: lesson.estimatedMinutes,
      reason: focus.has(lesson.trackId)
        ? 'Newly unlocked (in your focus tracks)'
        : 'Newly unlocked - prerequisites passed',
      rank: (focus.has(lesson.trackId) ? 0 : 1) * 1000 + i,
      pool: 3,
    });
  });

  /* 5. Project tasks. */
  for (const project of allProjects()) {
    const pp = projectProgress.get(project.id);
    const active = pp?.status === 'active';
    const ready = project.requiredSkills.every((lid) => {
      const l = getLesson(lid);
      return l ? isPassed(l, progressMap.get(lid), settings.passScoreFloor) : false;
    });
    if (!ready) continue;
    if (pp && pp.status === 'completed') continue;
    // Only the active project, or - if none is active - the first ready one.
    if (!active && pp?.status && pp.status !== 'not-started') continue;

    for (const task of [...project.tasks].sort((a, b) => a.order - b.order)) {
      if (pp?.tasks[task.id]?.done) continue;
      push({
        kind: 'project-task',
        refId: project.id,
        sub: task.id,
        title: `${project.name}: ${task.title}`,
        estimatedMinutes: task.estimatedMinutes,
        reason: active ? 'Active project - next task' : 'Project unlocked by your lessons',
        rank: project.order * 100 + task.order,
        pool: 4,
      });
      // One task per project per day keeps the plan from being all project work.
      break;
    }
    if (active) break;
  }

  return fill(ctx.existing, date, budget, candidates, now);
}

/**
 * Fills the budget from the ordered candidate pools, preserving any state the
 * learner already recorded against an item with the same id.
 */
function fill(
  existing: DailyPlan | null | undefined,
  date: string,
  budget: number,
  candidates: Candidate[],
  now: Date,
): DailyPlan {
  const previous = new Map<string, PlanItem>();
  if (existing) for (const item of existing.items) previous.set(item.id, item);

  const ordered = [...candidates].sort(
    (a, b) => a.pool - b.pool || a.rank - b.rank || a.refId.localeCompare(b.refId),
  );

  const items: PlanItem[] = [];
  let planned = 0;
  for (const c of ordered) {
    if (items.length >= MAX_PLAN_ITEMS) break;
    const prev = previous.get(itemId(date, c.kind, c.refId, c.sub));
    // Keep completed or in-progress items even if the pool no longer produces them.
    if (prev && prev.state === 'done') {
      items.push(prev);
      planned += prev.estimatedMinutes;
      continue;
    }
    if (planned >= budget) {
      if (prev && prev.state === 'in-progress') items.push({ ...prev, reason: c.reason });
      continue;
    }
    items.push(
      newPlanItem({
        id: itemId(date, c.kind, c.refId, c.sub),
        kind: c.kind,
        refId: c.refId,
        title: c.title,
        subjectId: c.subjectId,
        estimatedMinutes: c.estimatedMinutes,
        order: items.length + 1,
        reason: c.reason,
        state: prev?.state === 'in-progress' ? 'in-progress' : 'planned',
      }),
    );
    planned += c.estimatedMinutes;
  }

  // Anything already done today stays visible even when the pools moved on.
  if (existing && existing.date === date) {
    for (const prev of existing.items) {
      if (prev.state === 'done' && !items.some((i) => i.id === prev.id)) {
        items.push(prev);
        planned += prev.estimatedMinutes;
      }
    }
  }

  items.sort((a, b) => a.order - b.order);
  const base = emptyDailyPlan(date, budget, now);
  return {
    ...base,
    items: items.map((item, i) => ({ ...item, order: i + 1 })),
    generatedAt: existing && existing.date === date ? existing.generatedAt : isoOf(now),
  };
}

/* -------------------------------------------------------------------------- */
/* Plan mutations                                                             */
/* -------------------------------------------------------------------------- */

export function setPlanItemState(
  plan: DailyPlan,
  planItemId: string,
  state: PlanItem['state'],
  now: Date,
): DailyPlan {
  const items = plan.items.map((item) =>
    item.id === planItemId ? { ...item, state } : item,
  );
  return { ...plan, items, updatedAt: isoOf(now), dirty: true };
}

export function attachSessionToPlanItem(
  plan: DailyPlan,
  planItemId: string,
  sessionId: string,
  now: Date,
): DailyPlan {
  return {
    ...plan,
    items: plan.items.map((item) =>
      item.id === planItemId
        ? { ...item, sessionId, state: item.state === 'planned' ? 'in-progress' : item.state }
        : item,
    ),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function planSummary(plan: DailyPlan) {
  const total = plan.items.length;
  const done = plan.items.filter((i) => i.state === 'done').length;
  const skipped = plan.items.filter((i) => i.state === 'skipped').length;
  const plannedMinutes = plan.items.reduce((s, i) => s + i.estimatedMinutes, 0);
  const doneMinutes = plan.items
    .filter((i) => i.state === 'done')
    .reduce((s, i) => s + i.estimatedMinutes, 0);
  return {
    total,
    done,
    skipped,
    remaining: Math.max(0, total - done - skipped),
    plannedMinutes,
    doneMinutes,
    budgetMinutes: plan.budgetMinutes,
    complete: total > 0 && done + skipped === total,
  };
}

/**
 * Carries unfinished items from yesterday into today's plan.
 *
 * Skipped and planned items are not dropped on the floor: a lesson you did not get
 * to is still a lesson you have not done, and the plan says so.
 */
export function carryOverUndone(
  previous: DailyPlan | null,
  plan: DailyPlan,
  now: Date,
): DailyPlan {
  if (!previous || previous.date === plan.date) return plan;
  const existing = new Set(plan.items.map((i) => `${i.kind}:${i.refId}`));
  const carried: PlanItem[] = [];

  for (const item of previous.items) {
    if (item.state === 'done') continue;
    const key = `${item.kind}:${item.refId}`;
    if (existing.has(key)) continue;
    if (carried.length + plan.items.length >= MAX_PLAN_ITEMS) break;
    carried.push(
      newPlanItem({
        id: itemId(plan.date, item.kind, item.refId, item.id.split(':')[3]),
        kind: item.kind,
        refId: item.refId,
        title: item.title,
        subjectId: item.subjectId,
        estimatedMinutes: item.estimatedMinutes,
        order: 0,
        reason:
          item.state === 'skipped'
            ? `Skipped on ${previous.date} - carried over`
            : `Not finished on ${previous.date} - carried over`,
      }),
    );
    existing.add(key);
  }

  if (!carried.length) return plan;
  const items = [...plan.items, ...carried].map((i, idx) => ({ ...i, order: idx + 1 }));
  return { ...plan, items, updatedAt: isoOf(now), dirty: true };
}

/** What a plan item points at, resolved for navigation. */
export function resolvePlanItem(item: PlanItem): {
  title: string;
  href: string;
  minutes: number;
} {
  if (item.kind === 'project-task') {
    return {
      title: item.title,
      href: `/projects/detail?id=${encodeURIComponent(item.refId)}&task=${encodeURIComponent(
        item.id.split(':')[3] ?? '',
      )}`,
      minutes: item.estimatedMinutes,
    };
  }
  const lesson = getLesson(item.refId);
  return {
    title: lesson?.title ?? item.title,
    href: `/lessons/detail?id=${encodeURIComponent(item.refId)}${
      item.kind === 'review' ? '&mode=review' : ''
    }`,
    minutes: item.estimatedMinutes,
  };
}
