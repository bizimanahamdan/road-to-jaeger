import type {
  Assessment,
  AssessmentQuestion,
  Difficulty,
  Exercise,
  ExerciseKind,
  LearnBlock,
  Lesson,
  LessonId,
  Resource,
  ResourceKind,
  SkillId,
  SubjectId,
} from '@/lib/types';
import { trackOfSubject } from './catalog';

/* -------------------------------------------------------------------------- */
/* Resource / exercise / question constructors                                */
/* -------------------------------------------------------------------------- */

/**
 * Resource constructor.
 *
 * `verified` is always `false` when authored. Links are only marked verified by
 * `npm run check:resources`, which actually fetches them. This app never claims
 * a URL works before something has checked it.
 */
export function R(
  title: string,
  kind: ResourceKind,
  url: string,
  opts: { author?: string; free?: boolean; minutes?: number; note?: string } = {},
): Resource {
  return {
    id: '', // assigned by defineLesson()
    title,
    kind,
    url,
    author: opts.author,
    free: opts.free ?? true,
    minutes: opts.minutes,
    verified: false,
    note: opts.note,
  };
}

export function X(
  kind: ExerciseKind,
  prompt: string,
  minutes: number,
  opts: { hint?: string; solution?: string; hardware?: string[] } = {},
): Exercise {
  return {
    id: '', // assigned by defineLesson()
    kind,
    prompt,
    minutes,
    hint: opts.hint,
    solution: opts.solution,
    requiresHardware: Boolean(opts.hardware && opts.hardware.length > 0),
    hardware: opts.hardware,
  };
}

/** Multiple-choice question. `answer` is the 0-based index into `choices`. */
export function mcq(
  objective: number,
  prompt: string,
  choices: string[],
  answer: number,
  explanation: string,
): AssessmentQuestion {
  return {
    id: '',
    objectiveId: String(objective),
    type: 'mcq',
    prompt,
    choices,
    answer,
    explanation,
  };
}

/** Numeric question, graded with a relative tolerance (default +/- 2%). */
export function numeric(
  objective: number,
  prompt: string,
  answer: number,
  explanation: string,
  opts: { tolerance?: number; unit?: string } = {},
): AssessmentQuestion {
  return {
    id: '',
    objectiveId: String(objective),
    type: 'numeric',
    prompt,
    answer,
    tolerance: opts.tolerance ?? 0.02,
    unit: opts.unit,
    explanation,
  };
}

/**
 * Short-answer question. Graded by normalised comparison against every
 * accepted answer, so wording differences do not fail a learner who knows it.
 */
export function short(
  objective: number,
  prompt: string,
  answers: string[],
  explanation: string,
): AssessmentQuestion {
  return {
    id: '',
    objectiveId: String(objective),
    type: 'short',
    prompt,
    answer: answers,
    explanation,
  };
}

/* -------------------------------------------------------------------------- */
/* Lesson drafts                                                              */
/* -------------------------------------------------------------------------- */

export interface LessonDraft {
  id: LessonId;
  subject: SubjectId;
  order: number;
  title: string;
  difficulty: Difficulty;
  minutes: number;
  description: string;
  why: string;
  objectives: string[];
  learn: LearnBlock[];
  resources: Resource[];
  exercises: Exercise[];
  /**
   * Questions reference objectives by 1-based index (see `mcq`/`numeric`/
   * `short`), which keeps the data readable and lets `defineLesson` prove that
   * every objective is actually assessed.
   */
  questions: AssessmentQuestion[];
  prereqs?: LessonId[];
  /** Exercises that must be completed to pass. Defaults to all of them. */
  required?: number;
  /** Defaults to 85%. */
  passScore?: number;
  skills?: SkillId[];
  hardware?: string[];
}

/**
 * Turns a compact draft into a fully-formed `Lesson` with deterministic ids,
 * and enforces the curriculum's structural invariants at module load time.
 *
 * Throwing here is intentional: a lesson whose objectives are never tested
 * would let a learner reach MASTERED without evidence, which this app forbids.
 */
export function defineLesson(
  draft: LessonDraft,
  subjectTrack: (subjectId: SubjectId) => Lesson['trackId'],
): Lesson {
  const { id, subject } = draft;

  // Collect every structural problem with this lesson and report them together,
  // so authoring feedback is one run per lesson rather than one run per issue.
  const problems: string[] = [];

  if (!draft.objectives.length) problems.push('at least one objective is required');
  if (!draft.questions.length) problems.push('the assessment cannot be empty');
  if (!draft.learn.length) problems.push('the lesson body cannot be empty');

  const objectives = draft.objectives.map((text, i) => ({ id: `o${i + 1}`, text }));

  const questions: AssessmentQuestion[] = draft.questions.map((q, i) => {
    const index = Number(q.objectiveId);
    if (!Number.isInteger(index)) {
      problems.push(`question ${i + 1} must reference a 1-based objective index`);
    } else if (!objectives[index - 1]) {
      problems.push(`question ${i + 1} references objective ${index}, which does not exist`);
    }
    if (q.type === 'mcq') {
      if (!q.choices || q.choices.length < 2) {
        problems.push(`question ${i + 1} needs at least two choices`);
      } else if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.choices.length) {
        problems.push(`question ${i + 1} answer index is out of range`);
      }
    }
    if (q.type === 'numeric' && typeof q.answer !== 'number') {
      problems.push(`question ${i + 1} numeric answer must be a number`);
    }
    const obj = objectives[index - 1];
    return { ...q, id: `${id}-q${i + 1}`, objectiveId: obj ? obj.id : '' };
  });

  // An objective that nothing tests is an objective that nothing can prove.
  // Mastery must be earned, so this is a hard error rather than a warning.
  for (const obj of objectives) {
    if (!questions.some((q) => q.objectiveId === obj.id)) {
      problems.push(`objective "${obj.text}" has no assessment question`);
    }
  }

  const required = draft.required ?? draft.exercises.length;
  if (required > draft.exercises.length) {
    problems.push(`requires ${required} exercises but only ${draft.exercises.length} exist`);
  }
  if (!draft.exercises.length) problems.push('at least one exercise is required');

  const passScore = draft.passScore ?? 85;
  if (passScore < 60 || passScore > 100) {
    problems.push(`passScore ${passScore} must be between 60 and 100`);
  }

  if (problems.length) {
    throw new Error(`lesson ${id}:\n  - ${problems.join('\n  - ')}`);
  }

  const resources = draft.resources.map((r, i) => ({ ...r, id: `${id}-r${i + 1}` }));
  const exercises = draft.exercises.map((x, i) => ({ ...x, id: `${id}-x${i + 1}` }));

  const assessment: Assessment = {
    id: `${id}-assessment`,
    passScore,
    questions,
    suggestedMinutes: Math.max(4, Math.round(questions.length * 1.5)),
  };

  return {
    id,
    subjectId: subject,
    trackId: subjectTrack(subject),
    title: draft.title,
    order: draft.order,
    description: draft.description,
    whyItMatters: draft.why,
    difficulty: draft.difficulty,
    estimatedMinutes: draft.minutes,
    prerequisites: draft.prereqs ?? [],
    objectives,
    learn: draft.learn,
    resources,
    exercises,
    exercisesRequired: required,
    assessment,
    grantsSkills: draft.skills,
    requiresHardware: Boolean(draft.hardware && draft.hardware.length > 0),
    hardware: draft.hardware,
  };
}

/* -------------------------------------------------------------------------- */
/* Convenience wrapper used by every content module                           */
/* -------------------------------------------------------------------------- */

/** Define a lesson; the track is derived from its subject. */
export function lesson(draft: LessonDraft): Lesson {
  return defineLesson(draft, trackOfSubject);
}
