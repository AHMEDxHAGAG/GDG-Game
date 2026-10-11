import { QUESTIONS, QUESTION_BY_ID } from '@/content/questions';
import { TRACK_IDS, isTrackId, type TrackId } from '@/features/characters/types';
import { storageKeys } from '@/config/site';

import type { QuizState } from '@/features/quiz/state/quizReducer';
import { createInitialQuizState } from '@/features/quiz/state/quizReducer';
import type { RankedMatch } from '@/features/quiz/scoring/scoreAnswers';

/**
 * Quiz sessions are disposable and local. Nothing here is personal beyond a
 * nickname the visitor typed themselves, and nothing leaves the device.
 */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/**
 * Version 2. Version 1 was the retired chat session — its payload has no
 * compatible subset, so it is discarded rather than migrated.
 */
export const SCHEMA_VERSION = 2;

/**
 * Validation is hand-written rather than schema-driven on purpose.
 *
 * This module is imported by every route's provider, so its dependency graph
 * lands in the critical bundle of five of the six pages. The zod v4 runtime
 * measured 122 KB raw / 34 KB gzipped there to check one small payload, which
 * was the single largest removable chunk in the build. The schema below is
 * small and fixed, so the guards cost a few hundred bytes and behave
 * identically — `quizStorage.test.ts` pins every case.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `Number.isFinite` rather than `typeof`: NaN and Infinity are numbers. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A whole number at or above `min`. */
function isCount(value: unknown, min = 0): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= min;
}

function parseRankedMatch(value: unknown): RankedMatch | null {
  if (!isPlainObject(value)) return null;
  const { trackId, rank, score, primaryHits, secondaryHits, ratio } = value;
  if (!isTrackId(trackId)) return null;
  // Rank is 1-based and bounded by the number of tracks, so the array can
  // never be shorter than its own rank claims.
  if (!isCount(rank, 1) || rank > TRACK_IDS.length) return null;
  if (!isCount(score) || !isCount(primaryHits) || !isCount(secondaryHits)) return null;
  if (!isFiniteNumber(ratio) || ratio < 0) return null;
  return { trackId, rank, score, primaryHits, secondaryHits, ratio };
}

/** A flat string→string map, as produced by `Object.fromEntries` over answers. */
function parseAnswers(value: unknown): Record<string, string> | null {
  if (!isPlainObject(value)) return null;
  const answers: Record<string, string> = {};
  for (const [questionId, optionId] of Object.entries(value)) {
    if (typeof optionId !== 'string') return null;
    answers[questionId] = optionId;
  }
  return answers;
}

/**
 * Parses the persisted envelope, or `null` when anything about it is not
 * exactly what this build wrote. Unknown extra keys are ignored rather than
 * rejected, so a payload from a build with extra fields still restores.
 */
function parsePersistedSession(parsed: unknown): PersistedQuizSession | null {
  if (!isPlainObject(parsed)) return null;
  if (parsed.version !== SCHEMA_VERSION) return null;
  if (!isFiniteNumber(parsed.savedAt) || parsed.savedAt <= 0) return null;

  const state = parsed.state;
  if (!isPlainObject(state)) return null;

  if (typeof state.sessionId !== 'string' || state.sessionId.length === 0) return null;
  if (
    state.username !== null &&
    !(typeof state.username === 'string' && state.username.length <= 64)
  ) {
    return null;
  }
  if (
    !isCount(state.questionIndex) ||
    state.questionIndex > QUESTIONS.length - 1
  ) {
    return null;
  }
  if (!isCount(state.updatedAt)) return null;
  if (state.startedAt !== null && !isCount(state.startedAt)) return null;
  if (state.selectedTrackId !== null && !isTrackId(state.selectedTrackId)) return null;

  const answers = parseAnswers(state.answers);
  if (answers === null) return null;

  let ranking: readonly RankedMatch[] | null = null;
  if (state.ranking !== null) {
    if (!Array.isArray(state.ranking)) return null;
    const parsedRanking = state.ranking.map(parseRankedMatch);
    if (parsedRanking.some((match) => match === null)) return null;
    ranking = parsedRanking as RankedMatch[];
  }

  return {
    version: SCHEMA_VERSION,
    savedAt: parsed.savedAt,
    state: {
      sessionId: state.sessionId,
      username: state.username,
      questionIndex: state.questionIndex,
      answers,
      ranking,
      selectedTrackId: state.selectedTrackId,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
    },
  };
}

/**
 * The stored subset of `QuizState`.
 *
 * Deliberately narrower than `QuizState`: `phase` is derived on load and
 * `hydrated` is runtime-only, so neither is ever written to storage or read
 * back. Typing this separately keeps that omission enforced by the compiler
 * instead of by a cast.
 */
export interface PersistedQuizState {
  sessionId: string;
  username: string | null;
  questionIndex: number;
  answers: Record<string, string>;
  ranking: readonly RankedMatch[] | null;
  selectedTrackId: TrackId | null;
  startedAt: number | null;
  updatedAt: number;
}

export interface PersistedQuizSession {
  version: number;
  savedAt: number;
  state: PersistedQuizState;
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    // Safari private mode and some embedded webviews throw on access.
    return null;
  }
}

export function serializeQuizSession(state: QuizState, now = Date.now()): string {
  return JSON.stringify({
    version: SCHEMA_VERSION,
    savedAt: now,
    state: {
      sessionId: state.sessionId,
      username: state.username,
      questionIndex: state.questionIndex,
      answers: state.answers,
      ranking: state.ranking,
      selectedTrackId: state.selectedTrackId,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
    },
  });
}

/**
 * Restores a session, or `null` when there is nothing safe to restore.
 *
 * Anything unparseable, from another schema version, or past its TTL is
 * discarded rather than migrated. A malformed payload must never be able to
 * wedge the UI, so validation happens before anything is trusted.
 */
export function deserializeQuizSession(
  raw: string | null,
  now = Date.now(),
): QuizState | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = parsePersistedSession(parsed);
  if (!result) return null;

  const { state, savedAt } = result;
  if (now - savedAt > SESSION_TTL_MS) return null;

  // Drop any answer the bank no longer recognises. Content edits between
  // visits must not resurrect a question id that no longer exists.
  const answers: Record<string, string> = {};
  for (const [questionId, optionId] of Object.entries(state.answers)) {
    const question = QUESTION_BY_ID.get(questionId);
    if (question?.options.some((option) => option.id === optionId)) {
      answers[questionId] = optionId;
    }
  }

  // Phase is derived, never stored: an in-flight page load cannot be resumed.
  const ranking = state.ranking;
  const selectedTrackId =
    ranking?.some((match) => match.trackId === state.selectedTrackId) === true
      ? state.selectedTrackId
      : null;

  const phase =
    selectedTrackId !== null
      ? 'result'
      : ranking !== null
        ? 'matches'
        : Object.keys(answers).length > 0
          ? 'quiz'
          : 'landing';

  return {
    ...createInitialQuizState(state.updatedAt),
    phase,
    sessionId: state.sessionId,
    username: state.username,
    questionIndex: state.questionIndex,
    answers,
    ranking,
    selectedTrackId,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
  };
}

export function saveQuizSession(state: QuizState): void {
  const store = storage();
  if (!store) return;
  // Never persist a pristine landing screen with nothing to come back to.
  if (
    state.phase === 'landing' &&
    Object.keys(state.answers).length === 0 &&
    !state.selectedTrackId
  ) {
    clearQuizSession();
    return;
  }
  try {
    store.setItem(storageKeys.session, serializeQuizSession(state));
  } catch {
    // Quota exceeded or storage disabled — the quiz keeps working in memory.
  }
}

export function loadQuizSession(now = Date.now()): QuizState | null {
  const store = storage();
  if (!store) return null;
  try {
    return deserializeQuizSession(store.getItem(storageKeys.session), now);
  } catch {
    return null;
  }
}

export function clearQuizSession(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(storageKeys.session);
    store.removeItem(storageKeys.legacySession);
    store.removeItem(storageKeys.username);
  } catch {
    /* ignore */
  }
}

/**
 * Drops the retired chat key on boot so a stale payload can never linger.
 * Runs once per page load and is safe to call when nothing is there.
 */
export function purgeLegacySession(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(storageKeys.legacySession);
  } catch {
    /* ignore */
  }
}

/** The remembered username, used to prefill the landing field. */
export function loadRememberedUsername(): string | null {
  const store = storage();
  if (!store) return null;
  try {
    const value = store.getItem(storageKeys.username);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveRememberedUsername(username: string | null): void {
  const store = storage();
  if (!store) return;
  try {
    if (username === null || username.trim().length === 0) {
      store.removeItem(storageKeys.username);
    } else {
      store.setItem(storageKeys.username, username);
    }
  } catch {
    /* ignore */
  }
}
