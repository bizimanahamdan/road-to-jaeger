import type { StudySession } from '@/lib/types';
import { isoOf, localDateKey, newSession, parseLocalDateKey, secondsBetween } from './state';

/**
 * Study sessions.
 *
 * Time is credited in whole seconds from *finished running segments* only. That
 * rule does a lot of work:
 *
 *  - A paused session accrues nothing, so leaving the app open on a paused
 *    session cannot manufacture study time.
 *  - A session left running is not trusted indefinitely. Once it has been idle
 *    longer than the stale threshold it is closed automatically as `abandoned`
 *    and credited at most the threshold - the honest assumption is "you studied
 *    for a bit and then put the phone down", not "you studied for nine hours".
 *  - Skipped sessions credit nothing.
 *
 * Every function is pure and takes `now`, so session accounting is testable and
 * identical on device and in CI.
 */

export const MAX_CREDIT_PER_SEGMENT_SECONDS = 6 * 60 * 60;

/** Whole seconds credited for the currently running segment, capped for sanity. */
export function runningSegmentSeconds(session: StudySession, now: Date): number {
  if (session.state !== 'running' || !session.segmentStartedAt) return 0;
  const started = Date.parse(session.segmentStartedAt);
  if (Number.isNaN(started)) return 0;
  return Math.min(Math.max(0, Math.floor((now.getTime() - started) / 1000)), MAX_CREDIT_PER_SEGMENT_SECONDS);
}

/** Total seconds this session has earned so far, including the live segment. */
export function creditedSeconds(session: StudySession, now: Date): number {
  return session.accumulatedSeconds + runningSegmentSeconds(session, now);
}

export function isOpen(session: StudySession): boolean {
  return session.state === 'running' || session.state === 'paused';
}

export function startSession(
  kind: StudySession['kind'],
  refId: string | null,
  now: Date,
  opts: { planDate?: string | null; planItemId?: string | null; targetMinutes?: number | null } = {},
): StudySession {
  return newSession(kind, refId, now, opts);
}

/** Banks the running segment and stops the clock. */
export function pauseSession(session: StudySession, now: Date): StudySession {
  if (session.state !== 'running') return session;
  return {
    ...session,
    state: 'paused',
    accumulatedSeconds: session.accumulatedSeconds + runningSegmentSeconds(session, now),
    segmentStartedAt: null,
    pausedAt: isoOf(now),
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function resumeSession(session: StudySession, now: Date): StudySession {
  if (session.state !== 'paused') return session;
  return {
    ...session,
    state: 'running',
    segmentStartedAt: isoOf(now),
    pausedAt: null,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

export function completeSession(
  session: StudySession,
  now: Date,
  note?: string | null,
): StudySession {
  if (!isOpen(session)) return session;
  return {
    ...session,
    state: 'completed',
    accumulatedSeconds: creditedSeconds(session, now),
    segmentStartedAt: null,
    pausedAt: null,
    endedAt: isoOf(now),
    note: note ?? session.note,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

/**
 * Skips the session: the planned work was not done.
 *
 * A skipped session credits nothing, even if it was running - choosing to skip is
 * a statement that the time was not spent on the plan.
 */
export function skipSession(session: StudySession, now: Date, note?: string | null): StudySession {
  if (!isOpen(session)) return session;
  return {
    ...session,
    state: 'skipped',
    accumulatedSeconds: 0,
    segmentStartedAt: null,
    pausedAt: null,
    endedAt: isoOf(now),
    note: note ?? session.note,
    updatedAt: isoOf(now),
    dirty: true,
  };
}

/** How long a session has been sitting idle in its current state. */
export function idleSeconds(session: StudySession, now: Date): number {
  const anchor = session.segmentStartedAt ?? session.pausedAt ?? session.updatedAt;
  const at = Date.parse(anchor);
  if (Number.isNaN(at)) return 0;
  return Math.max(0, Math.floor((now.getTime() - at) / 1000));
}

/**
 * Closes sessions that were left open.
 *
 * A running session that has been idle past the threshold is `abandoned` and
 * credited at most the threshold; a paused session left for far longer is closed
 * with the time it had already banked. Both get an `autoEndedReason` so the UI can
 * explain what happened instead of silently showing a shorter session.
 */
export function closeStaleSessions(
  sessions: StudySession[],
  now: Date,
  staleMinutes: number,
): { sessions: StudySession[]; changed: boolean } {
  const thresholdSeconds = Math.max(60, Math.round(staleMinutes * 60));
  let changed = false;

  const out: StudySession[] = sessions.map((session): StudySession => {
    if (session.state === 'running') {
      if (idleSeconds(session, now) <= thresholdSeconds) return session;
      changed = true;
      return {
        ...session,
        state: 'abandoned',
        accumulatedSeconds: Math.min(
          session.accumulatedSeconds + runningSegmentSeconds(session, now),
          thresholdSeconds,
        ),
        segmentStartedAt: null,
        endedAt: isoOf(now),
        autoEndedReason: `Left running for more than ${staleMinutes} minutes; credited up to the idle limit.`,
        updatedAt: isoOf(now),
        dirty: true,
      };
    }
    if (session.state === 'paused') {
      // A paused session is trusted for much longer: the learner pressed pause.
      if (idleSeconds(session, now) <= thresholdSeconds * 8) return session;
      changed = true;
      return {
        ...session,
        state: 'abandoned',
        segmentStartedAt: null,
        endedAt: isoOf(now),
        autoEndedReason: 'Left paused for more than a day; closed with the time already banked.',
        updatedAt: isoOf(now),
        dirty: true,
      };
    }
    return session;
  });

  return { sessions: out, changed };
}

/* -------------------------------------------------------------------------- */
/* Aggregates for the dashboard and progress screens                          */
/* -------------------------------------------------------------------------- */

/** Local date key a session's credit belongs to, from when it started. */
export function sessionDateKey(session: StudySession): string | null {
  const started = Date.parse(session.startedAt);
  if (Number.isNaN(started)) return null;
  return localDateKey(new Date(started));
}

/** Credited seconds per local day for the last `days` days, oldest first. */
export function dailyActivity(
  sessions: StudySession[],
  now: Date,
  days: number,
): { date: string; seconds: number }[] {
  const totals = new Map<string, number>();
  for (const s of sessions) {
    if (s.state === 'skipped') continue;
    const key = sessionDateKey(s);
    if (!key) continue;
    totals.set(key, (totals.get(key) ?? 0) + s.accumulatedSeconds);
  }

  const out: { date: string; seconds: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    out.push({ date: key, seconds: totals.get(key) ?? 0 });
  }
  return out;
}

export function secondsOn(sessions: StudySession[], dateKey: string): number {
  return sessions.reduce((sum, s) => {
    if (s.state === 'skipped') return sum;
    return sessionDateKey(s) === dateKey ? sum + s.accumulatedSeconds : sum;
  }, 0);
}

export function todaySeconds(sessions: StudySession[], now: Date): number {
  return secondsOn(sessions, localDateKey(now));
}

export function last7DaysSeconds(sessions: StudySession[], now: Date): number {
  let total = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - i);
    total += secondsOn(sessions, localDateKey(d));
  }
  return total;
}

/**
 * Current streak: consecutive days ending today (or yesterday, so a streak is not
 * broken before the learner has had a chance to study today) with credited time.
 */
export function currentStreakDays(sessions: StudySession[], now: Date): number {
  const today = localDateKey(now);
  if (secondsOn(sessions, today) === 0) {
    const yesterday = new Date(now.getTime());
    yesterday.setDate(yesterday.getDate() - 1);
    if (secondsOn(sessions, localDateKey(yesterday)) === 0) return 0;
    return streakEndingOn(sessions, localDateKey(yesterday));
  }
  return streakEndingOn(sessions, today);
}

function streakEndingOn(sessions: StudySession[], dateKey: string): number {
  let streak = 0;
  const cursor = parseLocalDateKey(dateKey);
  if (!cursor) return 0;
  for (let i = 0; i < 3650; i += 1) {
    const d = new Date(cursor.getTime());
    d.setDate(d.getDate() - i);
    if (secondsOn(sessions, localDateKey(d)) > 0) streak += 1;
    else break;
  }
  return streak;
}

export function longestStreakDays(sessions: StudySession[]): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.state === 'skipped' || s.accumulatedSeconds <= 0) continue;
    const key = sessionDateKey(s);
    if (key) days.add(key);
  }
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const d = parseLocalDateKey(key);
    if (!d) continue;
    const consecutive = prev !== null && secondsBetween(prev, d) === 86_400;
    run = consecutive ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return longest;
}

/** Days in the last `window` that hit the daily target. */
export function targetHitDays(
  sessions: StudySession[],
  now: Date,
  dailyMinutes: number,
  window = 30,
): number {
  if (dailyMinutes <= 0) return 0;
  const target = dailyMinutes * 60;
  let hits = 0;
  for (let i = 0; i < window; i += 1) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - i);
    if (secondsOn(sessions, localDateKey(d)) >= target) hits += 1;
  }
  return hits;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${s}s`;
}
