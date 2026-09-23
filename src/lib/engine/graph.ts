import {
  allLessons,
  allSkills,
  allTracks,
  getLesson,
  getSubject,
  getTrack,
  lessonsInSubject,
  topologicalLessonOrder,
} from '@/lib/curriculum';
import type {
  Lesson,
  LessonId,
  LessonProgress,
  LessonStatus,
  LessonViewModel,
  Skill,
} from '@/lib/types';
import { hasPassed } from './mastery';
import { retentionOf, isDue, isOverdue } from './srs';

/**
 * The dependency graph, from the learner's point of view.
 *
 * A lesson unlocks when every prerequisite has been *passed* - not opened, not
 * skimmed. That single rule is what makes the roadmap a curriculum rather than a
 * list, and it is why `algebra -> trigonometry -> vectors -> kinematics -> robot
 * control` cannot be shortcut by scrolling.
 */

export type ProgressMap = ReadonlyMap<LessonId, LessonProgress>;

export interface MissingPrerequisite {
  id: LessonId;
  title: string;
  status: LessonStatus;
}

export function isPassed(
  lesson: Lesson,
  progress: LessonProgress | undefined,
  passScoreFloor: number,
): boolean {
  if (!progress) return false;
  return hasPassed(lesson, progress, passScoreFloor);
}

export function isMastered(progress: LessonProgress | undefined): boolean {
  return progress?.status === 'MASTERED';
}

/** Prerequisites that have not been passed yet, in curriculum order. */
export function missingPrerequisites(
  lesson: Lesson,
  progressMap: ProgressMap,
  passScoreFloor: number,
): MissingPrerequisite[] {
  const out: MissingPrerequisite[] = [];
  for (const id of lesson.prerequisites) {
    const prereq = getLesson(id);
    if (!prereq) continue;
    if (!isPassed(prereq, progressMap.get(id), passScoreFloor)) {
      out.push({ id, title: prereq.title, status: progressMap.get(id)?.status ?? 'NOT_STARTED' });
    }
  }
  return out;
}

export function isUnlocked(
  lesson: Lesson,
  progressMap: ProgressMap,
  passScoreFloor: number,
): boolean {
  return missingPrerequisites(lesson, progressMap, passScoreFloor).length === 0;
}

export function unlockedLessonIds(
  progressMap: ProgressMap,
  passScoreFloor: number,
): Set<LessonId> {
  const out = new Set<LessonId>();
  for (const lesson of allLessons()) {
    if (isUnlocked(lesson, progressMap, passScoreFloor)) out.add(lesson.id);
  }
  return out;
}

/**
 * Lessons the learner can start right now, in topological order.
 *
 * "Available" means unlocked and not yet passed. This is the pool the planner
 * draws from and the list the Roadmap screen highlights.
 */
export function availableLessons(
  progressMap: ProgressMap,
  passScoreFloor: number,
): Lesson[] {
  return topologicalLessonOrder().filter(
    (l) =>
      isUnlocked(l, progressMap, passScoreFloor) && !isPassed(l, progressMap.get(l.id), passScoreFloor),
  );
}

/** Lessons currently in progress (opened, not passed), in topological order. */
export function inProgressLessons(
  progressMap: ProgressMap,
  passScoreFloor: number,
): Lesson[] {
  return topologicalLessonOrder().filter((l) => {
    const p = progressMap.get(l.id);
    if (!p) return false;
    if (isPassed(l, p, passScoreFloor)) return false;
    return p.firstOpenedAt !== null || p.attempts.length > 0 || Object.keys(p.exercises).length > 0;
  });
}

/** Passed lessons whose review has come due, most overdue first. */
export function dueReviews(
  progressMap: ProgressMap,
  now: Date,
  opts: { overdueFirst?: boolean } = {},
): { lesson: Lesson; progress: LessonProgress; daysLate: number }[] {
  const out: { lesson: Lesson; progress: LessonProgress; daysLate: number }[] = [];
  for (const lesson of allLessons()) {
    const progress = progressMap.get(lesson.id);
    if (!progress?.passedAt || !progress.srs.dueAt) continue;
    if (!isDue(progress.srs, now)) continue;
    const due = Date.parse(progress.srs.dueAt);
    const daysLate = Number.isNaN(due) ? 0 : (now.getTime() - due) / 86_400_000;
    out.push({ lesson, progress, daysLate });
  }
  out.sort((a, b) => b.daysLate - a.daysLate || a.lesson.id.localeCompare(b.lesson.id));
  return opts.overdueFirst === false ? out.reverse() : out;
}

/**
 * A skill is unlocked only when every lesson that grants it is MASTERED.
 *
 * Skills are the honest résumé: no partial credit, no rounding up, and nothing
 * that reads like a percentage of an engineer.
 */
export function unlockedSkills(progressMap: ProgressMap): Skill[] {
  return allSkills().filter((sk) =>
    sk.requiredLessons.every((lid) => isMastered(progressMap.get(lid))),
  );
}

export function skillProgress(
  skill: Skill,
  progressMap: ProgressMap,
): { mastered: number; total: number; missing: LessonId[] } {
  const missing = skill.requiredLessons.filter((lid) => !isMastered(progressMap.get(lid)));
  return {
    mastered: skill.requiredLessons.length - missing.length,
    total: skill.requiredLessons.length,
    missing,
  };
}

/** Builds the read model the lesson screens render. Never persisted. */
export function toLessonViewModel(
  lesson: Lesson,
  progressMap: ProgressMap,
  now: Date,
  passScoreFloor: number,
): LessonViewModel | null {
  const subject = getSubject(lesson.subjectId);
  const track = getTrack(lesson.trackId);
  if (!subject || !track) return null;

  const progress = progressMap.get(lesson.id);
  if (!progress) return null;

  const missing = missingPrerequisites(lesson, progressMap, passScoreFloor);
  const passed = isPassed(lesson, progress, passScoreFloor);

  return {
    lesson,
    subject,
    track,
    progress,
    unlocked: missing.length === 0,
    missingPrerequisites: missing,
    retention: passed ? retentionOf(progress.srs, now) : 0,
    exercisesDone: lesson.exercises.filter((x) => progress.exercises[x.id]?.done).length,
    exercisesRequired: lesson.exercisesRequired,
    objectivesMet: lesson.objectives.filter((o) => progress.objectiveCoverage[o.id] === 'correct')
      .length,
    objectivesTotal: lesson.objectives.length,
    reviewDue: passed && isDue(progress.srs, now),
    reviewOverdue: passed && isOverdue(progress.srs, now),
  };
}

/**
 * Where the learner actually is on the roadmap.
 *
 * Defined as the deepest passed lesson in topological order, with the next
 * available lesson named. This is a position, not a score: it can be checked
 * against the curriculum by hand, which is the point.
 */
export function roadmapPosition(
  progressMap: ProgressMap,
  passScoreFloor: number,
): {
  trackId: Lesson['trackId'] | null;
  subjectId: Lesson['subjectId'] | null;
  lessonId: LessonId | null;
  description: string;
} {
  const order = topologicalLessonOrder();
  let deepest: Lesson | null = null;
  let deepestIndex = -1;

  for (let index = 0; index < order.length; index += 1) {
    const lesson = order[index];
    if (lesson && isPassed(lesson, progressMap.get(lesson.id), passScoreFloor)) {
      deepest = lesson;
      deepestIndex = index;
    }
  }

  if (!deepest) {
    const first = order[0];
    return {
      trackId: first?.trackId ?? null,
      subjectId: first?.subjectId ?? null,
      lessonId: null,
      description: 'Not started. The first lesson is open.',
    };
  }

  const track = getTrack(deepest.trackId);
  const subject = getSubject(deepest.subjectId);
  const subjectLessons = lessonsInSubject(deepest.subjectId);
  const passedInSubject = subjectLessons.filter((l) =>
    isPassed(l, progressMap.get(l.id), passScoreFloor),
  ).length;
  const next = availableLessons(progressMap, passScoreFloor)[0];

  const parts = [
    `Deepest passed: ${deepest.title} (${track?.name ?? deepest.trackId} / ${
      subject?.name ?? deepest.subjectId
    }).`,
    `${passedInSubject}/${subjectLessons.length} lessons passed in ${subject?.name ?? 'this subject'}.`,
  ];
  if (next) parts.push(`Next available: ${next.title}.`);
  else parts.push('Every lesson in the curriculum has been passed.');

  return {
    trackId: deepest.trackId,
    subjectId: deepest.subjectId,
    lessonId: deepestIndex >= 0 ? deepest.id : null,
    description: parts.join(' '),
  };
}

/** Track-level counts, used by the Roadmap screen headers. */
export function trackCounts(progressMap: ProgressMap, passScoreFloor: number) {
  return allTracks().map((track) => {
    const lessons = allLessons().filter((l) => l.trackId === track.id);
    return {
      track,
      total: lessons.length,
      passed: lessons.filter((l) => isPassed(l, progressMap.get(l.id), passScoreFloor)).length,
      mastered: lessons.filter((l) => isMastered(progressMap.get(l.id))).length,
      available: lessons.filter(
        (l) =>
          isUnlocked(l, progressMap, passScoreFloor) &&
          !isPassed(l, progressMap.get(l.id), passScoreFloor),
      ).length,
    };
  });
}
