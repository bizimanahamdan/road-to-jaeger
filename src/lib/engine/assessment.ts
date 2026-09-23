import type { AssessmentQuestion, Lesson, ObjectiveCoverage } from '@/lib/types';
import { newAttempt } from './state';
import type { AssessmentAttempt } from '@/lib/types';

/**
 * Grading.
 *
 * One place defines what "correct" means, because a mastery system is only as
 * honest as its grader. Three rules matter here:
 *
 *  1. Numeric answers are graded on relative tolerance, and the tolerance is the
 *     one the curriculum author set - never a global fudge factor. An answer of 0
 *     falls back to a small absolute epsilon, since relative tolerance is
 *     meaningless there.
 *  2. Short answers are compared after normalisation (case, punctuation,
 *     surrounding whitespace, article prefixes), so wording differences do not
 *     fail a learner who knows the answer. They are not fuzzy-matched beyond
 *     that: an incorrect term is incorrect.
 *  3. Unanswered questions are wrong, not skipped. A learner cannot raise their
 *     score by leaving hard questions blank.
 */

export type AnswerValue = number | string | null;

export interface GradedQuestion {
  questionId: string;
  objectiveId: string;
  correct: boolean;
  answered: boolean;
  expected: string;
  given: string;
  explanation: string;
}

export interface GradingResult {
  attempt: AssessmentAttempt;
  questions: GradedQuestion[];
  score: number;
  correct: number;
  total: number;
  passed: boolean;
}

/** Fallback absolute tolerance for a numeric question whose answer is 0. */
const ZERO_EPSILON = 1e-9;

export function normaliseShort(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9.'+\-/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLeadingArticle(value: string): string {
  return value.replace(/^(a|an|the)\s+/, '');
}

/** Parses a numeric answer the learner typed, tolerating commas and units. */
export function parseNumericInput(value: string): number | null {
  const cleaned = value
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    // Strip a trailing unit or percent sign; the number is what is graded.
    .replace(/(%|deg|rad|hz|khz|mhz|ms|us|ns|s|m|mm|cm|km|kg|g|n|nm|j|kj|w|kw|v|mv|a|ma|ohm|k\u03a9|pa|kpa|mpa|mol|k)$/i, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function gradeNumeric(question: AssessmentQuestion, given: AnswerValue): boolean {
  const expected = typeof question.answer === 'number' ? question.answer : Number(question.answer);
  if (!Number.isFinite(expected)) return false;
  const value = typeof given === 'number' ? given : given === null ? null : parseNumericInput(given);
  if (value === null || !Number.isFinite(value)) return false;
  const tolerance = question.tolerance ?? 0.02;
  const scale = Math.abs(expected) > ZERO_EPSILON ? Math.abs(expected) : 1;
  const allowance = Math.abs(expected) > ZERO_EPSILON ? tolerance * scale : ZERO_EPSILON;
  return Math.abs(value - expected) <= allowance;
}

export function gradeShort(question: AssessmentQuestion, given: AnswerValue): boolean {
  if (given === null) return false;
  const raw = typeof given === 'number' ? String(given) : given;
  const candidate = stripLeadingArticle(normaliseShort(raw));
  if (!candidate) return false;
  const accepted = Array.isArray(question.answer) ? question.answer : [String(question.answer)];
  return accepted.some((a) => {
    const target = stripLeadingArticle(normaliseShort(String(a)));
    if (!target) return false;
    if (target === candidate) return true;
    // Allow "1.5e3" for "1500" and unit-suffixed prose for a bare term.
    const numericTarget = parseNumericInput(target);
    const numericCandidate = parseNumericInput(candidate);
    if (numericTarget !== null && numericCandidate !== null) {
      const tolerance = question.tolerance ?? 0.02;
      const scale = Math.abs(numericTarget) > ZERO_EPSILON ? Math.abs(numericTarget) : 1;
      return Math.abs(numericCandidate - numericTarget) <= tolerance * scale;
    }
    return false;
  });
}

export function gradeMcq(question: AssessmentQuestion, given: AnswerValue): boolean {
  const expected = typeof question.answer === 'number' ? question.answer : Number(question.answer);
  const value = typeof given === 'number' ? given : given === null ? null : Number(given);
  if (value === null || !Number.isFinite(value)) return false;
  return Math.trunc(value) === expected;
}

export function gradeQuestion(question: AssessmentQuestion, given: AnswerValue): boolean {
  switch (question.type) {
    case 'mcq':
      return gradeMcq(question, given);
    case 'numeric':
      return gradeNumeric(question, given);
    case 'short':
      return gradeShort(question, given);
    default:
      return false;
  }
}

/** Human-readable form of the accepted answer, for the post-assessment review. */
export function expectedAnswerText(question: AssessmentQuestion): string {
  if (question.type === 'mcq') {
    const index = typeof question.answer === 'number' ? question.answer : Number(question.answer);
    const choice = question.choices?.[index];
    return choice ?? '';
  }
  if (Array.isArray(question.answer)) return question.answer.join(' / ');
  const text = String(question.answer);
  return question.unit ? `${text} ${question.unit}` : text;
}

export function givenAnswerText(given: AnswerValue): string {
  if (given === null || given === '') return '(no answer)';
  return String(given);
}

/**
 * Grades a whole assessment.
 *
 * `answers` is keyed by question id; a missing or null entry counts as wrong.
 * Returns the attempt record ready to be appended to lesson progress, plus the
 * per-question detail the review screen renders.
 */
export function gradeAssessment(
  lesson: Lesson,
  answers: Record<string, AnswerValue>,
  opts: { durationSeconds: number; passScore: number; mode?: AssessmentAttempt['mode'] },
  now: Date,
): GradingResult {
  const questions: GradedQuestion[] = [];
  let correct = 0;

  for (const q of lesson.assessment.questions) {
    const given = answers[q.id] ?? null;
    const isCorrect = gradeQuestion(q, given);
    if (isCorrect) correct += 1;
    questions.push({
      questionId: q.id,
      objectiveId: q.objectiveId,
      correct: isCorrect,
      answered: given !== null && given !== '',
      expected: expectedAnswerText(q),
      given: givenAnswerText(given),
      explanation: q.explanation,
    });
  }

  const total = lesson.assessment.questions.length;
  const score = total > 0 ? (correct / total) * 100 : 0;
  const perQuestion: Record<string, boolean> = {};
  for (const g of questions) perQuestion[g.questionId] = g.correct;

  return {
    attempt: newAttempt(
      {
        score,
        correct,
        total,
        durationSeconds: opts.durationSeconds,
        perQuestion,
        mode: opts.mode ?? 'full',
      },
      now,
    ),
    questions,
    score: Math.round(score * 10) / 10,
    correct,
    total,
    passed: score >= opts.passScore,
  };
}

/**
 * Best coverage per objective across all attempts, from a grading result merged
 * into the coverage already recorded.
 *
 * Coverage only ever improves within a lesson's history: an objective answered
 * correctly once is evidence, and a later careless mistake does not erase it.
 * The mastery gate is what prevents that from becoming a loophole - it requires
 * every objective covered *and* a passing best score *and* a post-pass review.
 */
export function mergeObjectiveCoverage(
  existing: Record<string, ObjectiveCoverage>,
  questions: GradedQuestion[],
): Record<string, ObjectiveCoverage> {
  const rank: Record<ObjectiveCoverage, number> = { unseen: 0, incorrect: 1, correct: 2 };
  const out: Record<string, ObjectiveCoverage> = { ...existing };
  for (const q of questions) {
    if (!q.objectiveId) continue;
    const next: ObjectiveCoverage = q.correct ? 'correct' : q.answered ? 'incorrect' : 'unseen';
    const prev = out[q.objectiveId] ?? 'unseen';
    if (rank[next] > rank[prev]) out[q.objectiveId] = next;
  }
  return out;
}
