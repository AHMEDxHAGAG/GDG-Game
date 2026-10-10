import { describe, expect, it } from 'vitest';

import { createInitialState } from '@/features/expedition/state/expeditionReducer';
import {
  deserializeSession,
  SCHEMA_VERSION,
  serializeSession,
  SESSION_TTL_MS,
} from './sessionStorage';

describe('sessionStorage', () => {
  it('round-trips a conversation through serialize/deserialize', () => {
    const state = {
      ...createInitialState(1000),
      phase: 'conversation' as const,
      nickname: 'كابتن',
      messages: [{ id: 'c1', role: 'captain' as const, text: 'hi', createdAt: 1000 }],
      engineState: { cursor: 2 },
      updatedAt: 1001,
    };
    const restored = deserializeSession(serializeSession(state, 1002), 1003);
    expect(restored?.nickname).toBe('كابتن');
    expect(restored?.messages).toHaveLength(1);
    expect(restored?.engineState).toEqual({ cursor: 2 });
  });

  it('downgrades in-flight awaiting/boarding to conversation on restore', () => {
    const state = { ...createInitialState(1000), phase: 'awaiting' as const, updatedAt: 1000 };
    const restored = deserializeSession(serializeSession(state, 1000), 1001);
    expect(restored?.phase).toBe('conversation');
  });

  it('rejects garbage, version drift and expired sessions', () => {
    expect(deserializeSession('not-json')).toBeNull();
    expect(deserializeSession(null)).toBeNull();
    expect(
      deserializeSession(JSON.stringify({ version: 999, savedAt: 1, state: {} })),
    ).toBeNull();
    const state = { ...createInitialState(1000), updatedAt: 1000 };
    const expired = deserializeSession(
      serializeSession(state, 1000),
      1000 + SESSION_TTL_MS + 1,
    );
    expect(expired).toBeNull();
  });

  it('rejects payloads with unknown tracks or roles', () => {
    const state = {
      ...createInitialState(1000),
      phase: 'result' as const,
      result: {
        trackId: 'not-a-track',
        secondaryTrackId: null,
        explanation: null,
        origin: 'demo',
      },
      updatedAt: 1000,
    };
    // @ts-expect-error — intentionally invalid track for the test
    expect(deserializeSession(serializeSession(state, 1000), 1001)).toBeNull();
    expect(SCHEMA_VERSION).toBe(1);
  });
});
