import { allLessons, allProjects, allSkills, allSubjects, allTracks, getLesson } from '@/lib/curriculum';
import type {
  LessonProgress,
  ProgressSnapshot,
  ProjectProgress,
  Settings,
  SkillId,
  StudySession,
  SubjectProgress,
  TrackProgress,
} from '@/lib/types';
import { isMastered, isPassed, isUnlocked, roadmapPosition, unlockedSkills, type ProgressMap } from './graph';
import { isDue, isOverdue, daysUntilDue } from './srs';
import {
  currentStreakDays,
  dailyActivity,
  last7DaysSeconds,
  longestStreakDays,
  targetHitDays,
  todaySeconds,
} from './session';
import { round1 } from './state';

/**
 * The progress snapshot.
 *
 * Everything here is derived, nothing is stored. That is deliberate: a stored
 * aggregate can drift from the evidence it summarises, and a drifted aggregate is
 * how an app ends up telling someone they are "87% engineer". The only numbers in
 * this file are counts of lessons in a state, sums of credited seconds, and means
 * of computed mastery scores - each of which can be checked against the records
 * that produced it.
 */

export interface SnapshotInput {
  progressMap: ProgressMap;
  projectProgress: ReadonlyMap<string, ProjectProgress>;
  sessions: StudySession[];
  settings: Settings;
  now: Date;
  /** How many days of activity history to include. */
  activityDays?: number;
}

type StatusKey = LessonProgress['status'];

function progressOf(map: ProgressMap, lessonId: string): LessonProgress | undefined {
  return map.get(lessonId);
}

export function buildSubjectProgress(
  subjectId: string,
  progressMap: ProgressMap,
  passScoreFloor: number,
): SubjectProgress | null {
  const subject = allSubjects().find((s) => s.id === subjectId);
  if (!subject) return null;
  const track = allTracks().find((t) => t.id === subject.trackId);
  if (!track) return null;

  const lessons = allLessons().filter((l) => l.subjectId === subjectId);
  const counts: Record<StatusKey, number> = {
    NOT_STARTED: 0,
    LEARNING: 0,
    PRACTICING: 0,
    REVIEW: 0,
    MASTERED: 0,
  };
  let studySeconds = 0;
  let attempted = 0;
  let masterySum = 0;
  let nextLessonId: string | null = null;

  for (const lesson of lessons) {
    const p = progressOf(progressMap, lesson.id);
    const status = p?.status ?? 'NOT_STARTED';
    counts[status] += 1;
    studySeconds += p?.totalStudySeconds ?? 0;
    if (status !== 'NOT_STARTED') {
      attempted += 1;
      masterySum += p?.masteryScore ?? 0;
    }
    if (
      nextLessonId === null &&
      status !== 'MASTERED' &&
      isUnlocked(lesson, progressMap, passScoreFloor)
    ) {
      nextLessonId = lesson.id;
    }
  }

  return {
    subject,
    track,
    total: lessons.length,
    notStarted: counts.NOT_STARTED,
    learning: counts.LEARNING,
    practicing: counts.PRACTICING,
    review: counts.REVIEW,
    mastered: counts.MASTERED,
    averageMasteryOfAttempted: attempted > 0 ? round1(masterySum / attempted) : 0,
    attempted,
    studySeconds,
    nextLessonId,
  };
}

export function buildSnapshot(input: SnapshotInput): ProgressSnapshot {
  const { progressMap, projectProgress, sessions, settings, now } = input;
  const activityDays = input.activityDays ?? 30;
  const floor = settings.passScoreFloor;
  const lessons = allLessons();

  const lessonCounts = {
    total: lessons.length,
    notStarted: 0,
    learning: 0,
    practicing: 0,
    review: 0,
    mastered: 0,
    passed: 0,
  };
  let totalStudySeconds = 0;

  for (const lesson of lessons) {
    const p = progressOf(progressMap, lesson.id);
    const status = p?.status ?? 'NOT_STARTED';
    if (status === 'NOT_STARTED') lessonCounts.notStarted += 1;
    else if (status === 'LEARNING') lessonCounts.learning += 1;
    else if (status === 'PRACTICING') lessonCounts.practicing += 1;
    else if (status === 'REVIEW') lessonCounts.review += 1;
    else lessonCounts.mastered += 1;
    if (isPassed(lesson, p, floor)) lessonCounts.passed += 1;
    totalStudySeconds += p?.totalStudySeconds ?? 0;
  }

  const subjects: SubjectProgress[] = [];
  for (const subject of allSubjects()) {
    const sp = buildSubjectProgress(subject.id, progressMap, floor);
    if (sp) subjects.push(sp);
  }

  const tracks: TrackProgress[] = allTracks().map((track) => {
    const trackSubjects = subjects.filter((s) => s.track.id === track.id);
    const trackLessons = lessons.filter((l) => l.trackId === track.id);
    return {
      track,
      subjects: trackSubjects,
      total: trackLessons.length,
      mastered: trackLessons.filter((l) => isMastered(progressOf(progressMap, l.id))).length,
      passed: trackLessons.filter((l) => isPassed(l, progressOf(progressMap, l.id), floor)).length,
      started: trackLessons.filter(
        (l) => (progressOf(progressMap, l.id)?.status ?? 'NOT_STARTED') !== 'NOT_STARTED',
      ).length,
      studySeconds: trackLessons.reduce(
        (sum, l) => sum + (progressOf(progressMap, l.id)?.totalStudySeconds ?? 0),
        0,
      ),
    };
  });

  /* Reviews */
  let dueNow = 0;
  let overdue = 0;
  let scheduledNext30Days = 0;
  let oldestOverdueLessonId: string | null = null;
  let oldestOverdueDays = Number.NEGATIVE_INFINITY;

  for (const lesson of lessons) {
    const p = progressOf(progressMap, lesson.id);
    if (!p?.passedAt || !p.srs.dueAt) continue;
    const days = daysUntilDue(p.srs, now);
    if (days === null) continue;
    if (isDue(p.srs, now)) dueNow += 1;
    if (isOverdue(p.srs, now)) {
      overdue += 1;
      if (-days > oldestOverdueDays) {
        oldestOverdueDays = -days;
        oldestOverdueLessonId = lesson.id;
      }
    } else if (days <= 30) {
      scheduledNext30Days += 1;
    }
  }

  /* Projects */
  const projects = allProjects();
  let tasksTotal = 0;
  let tasksDone = 0;
  let activeProjects = 0;
  let completedProjects = 0;
  for (const project of projects) {
    tasksTotal += project.tasks.length;
    const pp = projectProgress.get(project.id);
    if (pp) {
      tasksDone += project.tasks.filter((t) => pp.tasks[t.id]?.done).length;
      if (pp.status === 'active') activeProjects += 1;
      if (pp.status === 'completed') completedProjects += 1;
    }
  }

  /* Skills: unlocked only when every granting lesson is MASTERED. */
  const unlocked = unlockedSkills(progressMap);
  const unlockedIds: SkillId[] = unlocked.map((s) => s.id);

  const position = roadmapPosition(progressMap, floor);

  return {
    generatedAt: now.toISOString(),
    lessons: lessonCounts,
    subjects,
    tracks,
    study: {
      totalSeconds: totalStudySeconds,
      todaySeconds: todaySeconds(sessions, now),
      last7DaysSeconds: last7DaysSeconds(sessions, now),
      sessionsCompleted: sessions.filter((s) => s.state === 'completed').length,
      streakDays: currentStreakDays(sessions, now),
      longestStreakDays: longestStreakDays(sessions),
      dailyTargetMinutes: settings.dailyMinutes,
      dailyTargetHitDaysLast30: targetHitDays(sessions, now, settings.dailyMinutes, 30),
      activity: dailyActivity(sessions, now, activityDays),
    },
    reviews: { dueNow, overdue, scheduledNext30Days, oldestOverdueLessonId },
    projects: {
      total: projects.length,
      active: activeProjects,
      completed: completedProjects,
      tasksTotal,
      tasksDone,
    },
    skills: { total: allSkills().length, unlocked: unlockedIds.length, unlockedIds },
    roadmapPosition: {
      trackId: position.trackId,
      subjectId: position.subjectId,
      lessonId: position.lessonId,
      description: position.description,
    },
  };
}

/**
 * Next lesson to study, for the dashboard's "continue" card.
 *
 * Prefers a lesson already in progress over a new one, and a review over both
 * when something is overdue - the same priority order the planner uses, so the
 * dashboard and the plan never disagree.
 */
export function nextLessonToStudy(
  progressMap: ProgressMap,
  settings: Settings,
  now: Date,
): { lessonId: string; reason: string } | null {
  const floor = settings.passScoreFloor;
  const lessons = allLessons();

  const overdueReview = lessons
    .map((l) => ({ lesson: l, progress: progressOf(progressMap, l.id) }))
    .filter((x) => x.progress?.passedAt && isOverdue(x.progress.srs, now))
    .sort((a, b) => (daysUntilDue(a.progress!.srs, now) ?? 0) - (daysUntilDue(b.progress!.srs, now) ?? 0))[0];
  if (overdueReview) {
    return { lessonId: overdueReview.lesson.id, reason: 'Overdue review' };
  }

  const inProgress = lessons
    .map((l) => ({ lesson: l, progress: progressOf(progressMap, l.id) }))
    .filter((x) => {
      const p = x.progress;
      if (!p || p.status === 'NOT_STARTED') return false;
      if (isPassed(x.lesson, p, floor)) return false;
      return true;
    })
    .sort((a, b) => {
      const ta = a.progress?.lastStudiedAt ? Date.parse(a.progress.lastStudiedAt) : 0;
      const tb = b.progress?.lastStudiedAt ? Date.parse(b.progress.lastStudiedAt) : 0;
      return ta - tb;
    })[0];
  if (inProgress) {
    return { lessonId: inProgress.lesson.id, reason: 'Continue where you left off' };
  }

  const available = lessons.filter(
    (l) => isUnlocked(l, progressMap, floor) && !isPassed(l, progressOf(progressMap, l.id), floor),
  );
  if (available.length) {
    const focus = new Set(settings.focusTracks);
    const preferred = available.find((l) => focus.has(l.trackId)) ?? available[0];
    if (preferred) {
      return {
        lessonId: preferred.id,
        reason: focus.has(preferred.trackId)
          ? 'Next in your focus track'
          : 'Next unlocked lesson',
      };
    }
  }

  const dueToday = lessons
    .map((l) => ({ lesson: l, progress: progressOf(progressMap, l.id) }))
    .filter((x) => x.progress?.passedAt && isDue(x.progress.srs, now))[0];
  if (dueToday) return { lessonId: dueToday.lesson.id, reason: 'Review due today' };

  return null;
}

/** Resolves a lesson id to its title, tolerating stale local data. */
export function lessonTitle(lessonId: string | null): string {
  if (!lessonId) return '';
  return getLesson(lessonId)?.title ?? lessonId;
}
