import { getLesson, getProject } from '@/lib/curriculum';
import type { LessonProgress, Project, ProjectMilestone, ProjectProgress } from '@/lib/types';
import { isPassed, type ProgressMap } from './graph';
import { emptyProjectProgress, isoOf } from './state';

export { emptyProjectProgress };

/**
 * Project progress.
 *
 * Projects are gated by the curriculum, not by enthusiasm: a project is only
 * offered once every lesson it requires has been *passed*. Milestones are reached
 * only when all of their tasks are done. Completion is a claim the learner makes,
 * and the UI shows it next to the acceptance criteria so the claim has to survive
 * being read.
 */

export interface ProjectReadiness {
  ready: boolean;
  missing: { lessonId: string; title: string; status: LessonProgress['status'] }[];
}

export function projectReadiness(
  project: Project,
  progressMap: ProgressMap,
  passScoreFloor: number,
): ProjectReadiness {
  const missing: ProjectReadiness['missing'] = [];
  for (const lid of project.requiredSkills) {
    const lesson = getLesson(lid);
    if (!lesson) continue;
    if (!isPassed(lesson, progressMap.get(lid), passScoreFloor)) {
      missing.push({
        lessonId: lid,
        title: lesson.title,
        status: progressMap.get(lid)?.status ?? 'NOT_STARTED',
      });
    }
  }
  return { ready: missing.length === 0, missing };
}

export function startProject(progress: ProjectProgress, now: Date): ProjectProgress {
  if (progress.status === 'active' || progress.status === 'completed') return progress;
  return {
    ...progress,
    status: 'active',
    startedAt: progress.startedAt ?? isoOf(now),
    lastWorkedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function setTaskDone(
  project: Project,
  progress: ProjectProgress,
  taskId: string,
  done: boolean,
  now: Date,
  note?: string,
): ProjectProgress {
  const task = project.tasks.find((t) => t.id === taskId);
  if (!task) return progress;

  const tasks = {
    ...progress.tasks,
    [taskId]: {
      done,
      doneAt: done ? progress.tasks[taskId]?.doneAt ?? isoOf(now) : null,
      note: note ?? progress.tasks[taskId]?.note,
    },
  };

  const milestonesReached = { ...progress.milestonesReached };
  for (const milestone of project.milestones) {
    const reached = milestoneReached(project, tasks, milestone);
    if (reached && !milestonesReached[milestone.id]) milestonesReached[milestone.id] = isoOf(now);
    if (!reached && milestonesReached[milestone.id]) delete milestonesReached[milestone.id];
  }

  let status = progress.status;
  if (status === 'not-started' && done) status = 'active';
  if (project.tasks.every((t) => tasks[t.id]?.done)) status = 'completed';
  else if (status === 'completed') status = 'active';

  return {
    ...startProject(progress, now),
    status,
    tasks,
    milestonesReached,
    startedAt: progress.startedAt ?? (done ? isoOf(now) : null),
    completedAt: status === 'completed' ? progress.completedAt ?? isoOf(now) : null,
    lastWorkedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

function milestoneReached(
  project: Project,
  tasks: ProjectProgress['tasks'],
  milestone: ProjectMilestone,
): boolean {
  if (!milestone.taskIds.length) return false;
  return milestone.taskIds.every((tid) => tasks[tid]?.done);
}

export interface ProjectSummary {
  project: Project;
  progress: ProjectProgress;
  tasksTotal: number;
  tasksDone: number;
  estimatedMinutesTotal: number;
  estimatedMinutesRemaining: number;
  milestonesTotal: number;
  milestonesReached: number;
  nextTaskId: string | null;
  readiness: ProjectReadiness;
  /** Acceptance criteria with a self-assessment the learner can tick. */
  acceptanceCriteria: string[];
}

export function summariseProject(
  projectId: string,
  progressMap: ProgressMap,
  projectProgress: ProjectProgress | undefined,
  passScoreFloor: number,
  now: Date,
): ProjectSummary | null {
  const project = getProject(projectId);
  if (!project) return null;
  const progress = projectProgress ?? emptyProjectProgress(projectId, now);
  const done = project.tasks.filter((t) => progress.tasks[t.id]?.done);
  const next = [...project.tasks]
    .sort((a, b) => a.order - b.order)
    .find((t) => !progress.tasks[t.id]?.done);

  return {
    project,
    progress,
    tasksTotal: project.tasks.length,
    tasksDone: done.length,
    estimatedMinutesTotal: project.tasks.reduce((s, t) => s + t.estimatedMinutes, 0),
    estimatedMinutesRemaining: project.tasks
      .filter((t) => !progress.tasks[t.id]?.done)
      .reduce((s, t) => s + t.estimatedMinutes, 0),
    milestonesTotal: project.milestones.length,
    milestonesReached: project.milestones.filter((m) =>
      milestoneReached(project, progress.tasks, m),
    ).length,
    nextTaskId: next?.id ?? null,
    readiness: projectReadiness(project, progressMap, passScoreFloor),
    acceptanceCriteria: project.acceptanceCriteria,
  };
}

export function addStudySecondsToProject(
  progress: ProjectProgress,
  seconds: number,
  now: Date,
): ProjectProgress {
  const whole = Math.max(0, Math.floor(seconds));
  return {
    ...progress,
    totalStudySeconds: progress.totalStudySeconds + whole,
    lastWorkedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function setProjectStatus(
  progress: ProjectProgress,
  status: ProjectProgress['status'],
  now: Date,
): ProjectProgress {
  return {
    ...progress,
    status,
    startedAt: progress.startedAt ?? (status === 'active' ? isoOf(now) : null),
    completedAt: status === 'completed' ? progress.completedAt ?? isoOf(now) : null,
    lastWorkedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}
