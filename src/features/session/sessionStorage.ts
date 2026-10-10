import { storageKeys } from '@/config/site';
import { createInitialState, type ExpeditionState } from '@/features/expedition/state/expeditionReducer';
import { createSessionId } from '@/lib/ids';
import { messagesSchema } from '@/features/conversation/schemas';
import { z } from 'zod';

import { TRACK_IDS } from '@/features/characters/types';

/** Sessions are disposable: free-text answers never linger for long. */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
export const SCHEMA_VERSION = 1;

const trackIdSchema = z.enum(TRACK_IDS);

const persistedSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  savedAt: z.number().int().positive(),
  state: z.object({
    phase: z.enum([
      'welcome',
      'boarding',
      'conversation',
      'awaiting',
      'error',
      'revealing',
      'result',
    ]),
    sessionId: z.string().min(1),
    nickname: z.string().max(64).nullable(),
    messages: messagesSchema,
    enginePhase: z.enum(['intro', 'question', 'closing', 'completed']),
    progress: z
      .object({
        asked: z.number().int().nonnegative(),
        expected: z.number().int().positive().optional(),
        label: z.string().optional(),
      })
      .nullable(),
    engineState: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable(),
    result: z
      .object({
        trackId: trackIdSchema,
        secondaryTrackId: trackIdSchema.nullish(),
        explanation: z.string().nullish(),
        origin: z.enum(['engine', 'demo']),
        metadata: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .optional(),
      })
      .nullable(),
    startedAt: z.number().int().nonnegative().nullable(),
    updatedAt: z.number().int().nonnegative(),
  }),
});

export interface PersistedSession {
  version: number;
  savedAt: number;
  state: ExpeditionState;
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

export function serializeSession(state: ExpeditionState, now = Date.now()): string {
  return JSON.stringify({
    version: SCHEMA_VERSION,
    savedAt: now,
    state: {
      phase: state.phase,
      sessionId: state.sessionId,
      nickname: state.nickname,
      messages: state.messages,
      enginePhase: state.enginePhase,
      progress: state.progress,
      engineState: state.engineState,
      result: state.result,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
    },
  });
}

/**
 * Restores a session, or `null` when there is nothing safe to restore.
 *
 * Anything unparseable, from an older schema version, or past its TTL is
 * discarded rather than migrated — this prototype has no history worth
 * keeping, and a bad payload must never be able to wedge the UI.
 */
export function deserializeSession(raw: string | null, now = Date.now()): ExpeditionState | null {
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

  // An in-flight request cannot survive a reload, so it is downgraded.
  const phase =
    state.phase === 'awaiting' || state.phase === 'boarding' ? 'conversation' : state.phase;

  return {
    ...createInitialState(state.updatedAt),
    phase,
    sessionId: state.sessionId || createSessionId(),
    nickname: state.nickname,
    messages: state.messages,
    enginePhase: state.enginePhase,
    progress: state.progress,
    engineState: state.engineState,
    result: state.result,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
  };
}

export function saveSession(state: ExpeditionState): void {
  const store = storage();
  if (!store) return;
  // Never persist a pristine welcome screen.
  if (state.phase === 'welcome' && state.messages.length === 0 && !state.result) {
    clearSession();
    return;
  }
  try {
    store.setItem(storageKeys.session, serializeSession(state));
  } catch {
    // Quota exceeded or storage disabled — the game keeps working in memory.
  }
}

export function loadSession(now = Date.now()): ExpeditionState | null {
  const store = storage();
  if (!store) return null;
  try {
    return deserializeSession(store.getItem(storageKeys.session), now);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(storageKeys.session);
  } catch {
    /* ignore */
  }
}
