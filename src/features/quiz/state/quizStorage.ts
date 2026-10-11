import { QUESTIONS, QUESTION_BY_ID } from '@/content/questions';
import { TRACK_IDS } from '@/features/characters/types';
import { storageKeys } from '@/config/site';
import { z } from 'zod';

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

const trackIdSchema = z.enum(TRACK_IDS);

const rankedMatchSchema = z.object({
  trackId: trackIdSchema,
  rank: z.number().int().min(1).max(5),
  score: z.number().int().nonnegative(),
  primaryHits: z.number().int().nonnegative(),
  secondaryHits: z.number().int().nonnegative(),
  ratio: z.number().nonnegative(),
});

/**
 * Only the fields worth restoring are validated. `ranking` is re-derivable
 * from `answers`, but persisting it lets a returning visitor land on the
 * matches screen without waiting for a re-score.
 */
const persistedSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  savedAt: z.number().int().positive(),
  state: z.object({
    sessionId: z.string().min(1),
    username: z.string().max(64).nullable(),
    questionIndex: z.number().int().min(0).max(QUESTIONS.length - 1),
    answers: z.record(z.string(), z.string()),
    ranking: z.array(rankedMatchSchema).nullable(),
    selectedTrackId: trackIdSchema.nullable(),
    startedAt: z.number().int().nonnegative().nullable(),
    updatedAt: z.number().int().nonnegative(),
  }),
});

export interface PersistedQuizSession {
  version: number;
  savedAt: number;
  state: QuizState;
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

  const result = persistedSchema.safeParse(parsed);
  if (!result.success) return null;

  const { state, savedAt } = result.data;
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
  const ranking = (state.ranking as readonly RankedMatch[] | null) ?? null;
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
