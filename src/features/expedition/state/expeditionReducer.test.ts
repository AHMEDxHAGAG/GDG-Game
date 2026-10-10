import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createInitialState,
  expeditionReducer,
  isComposerLocked,
  hasResumableSession,
} from './expeditionReducer';
import type { EngineResponse, ExpeditionResult } from '@/features/conversation/types';

vi.mock('@/lib/ids', () => ({
  createSessionId: () => 'sess_test',
  createId: (prefix = 'id') => `${prefix}_test`,
}));

function successResponse(overrides: Partial<EngineResponse> = {}): EngineResponse {
  return {
    messages: [],
    phase: 'question',
    progress: { asked: 1, expected: 7, label: 'x' },
    engineState: { cursor: 2 },
    awaitsReply: true,
    ...overrides,
  };
}

describe('expeditionReducer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts a fresh voyage from welcome', () => {
    const state = expeditionReducer(createInitialState(1000), {
      type: 'expedition/start',
      at: 1001,
    });
    expect(state.phase).toBe('boarding');
    expect(state.pending).toBe('start');
    expect(state.messages).toHaveLength(0);
  });

  it('resumes a stored voyage without wiping cursor', () => {
    const restored = {
      ...createInitialState(1000),
      messages: [
        { id: 'c1', role: 'captain' as const, text: 'hi', createdAt: 1000 },
      ],
      engineState: { cursor: 2 },
    };
    const hydrated = expeditionReducer(restored, {
      type: 'session/hydrate',
      payload: restored,
    });
    expect(hydrated.phase).toBe('welcome');
    const resumed = expeditionReducer(hydrated, { type: 'expedition/resume', at: 1003 });
    expect(resumed.phase).toBe('boarding');
    expect(resumed.messages).toHaveLength(1);
    expect(resumed.engineState).toEqual({ cursor: 2 });
  });

  it('clears restored conversation on fresh start but keeps nickname', () => {
    const restored = {
      ...createInitialState(1000),
      nickname: 'xxx',
      messages: [{ id: 'c1', role: 'captain' as const, text: 'hi', createdAt: 1000 }],
      engineState: { cursor: 3 },
    };
    const hydrated = expeditionReducer(restored, {
      type: 'session/hydrate',
      payload: restored,
    });
    const started = expeditionReducer(hydrated, { type: 'expedition/start', at: 1002 });
    expect(started.phase).toBe('boarding');
    expect(started.messages).toHaveLength(0);
    expect(started.nickname).toBe('xxx');
    expect(started.engineState).toBeNull();
  });

  it('returns straight to result when resuming a finished expedition', () => {
    const result: ExpeditionResult = {
      trackId: 'cybersecurity',
      secondaryTrackId: null,
      explanation: null,
      origin: 'demo',
    };
    const restored = { ...createInitialState(1000), result };
    const hydrated = expeditionReducer(restored, {
      type: 'session/hydrate',
      payload: restored,
    });
    const resumed = expeditionReducer(hydrated, { type: 'expedition/resume', at: 1004 });
    expect(resumed.phase).toBe('result');
    expect(resumed.result?.trackId).toBe('cybersecurity');
  });

  it('submits once and locks composer while awaiting', () => {
    const started = expeditionReducer(createInitialState(1000), {
      type: 'expedition/start',
      at: 1001,
    });
    const conversing = expeditionReducer(started, {
      type: 'engine/success',
      response: successResponse({ phase: 'question' }),
      at: 1002,
    });
    expect(conversing.phase).toBe('conversation');
    const submitted = expeditionReducer(conversing, {
      type: 'message/submit',
      messageId: 'msg_1',
      text: 'hello',
      at: 1003,
    });
    expect(submitted.phase).toBe('awaiting');
    expect(isComposerLocked(submitted)).toBe(true);
    const duplicate = expeditionReducer(submitted, {
      type: 'message/submit',
      messageId: 'msg_1',
      text: 'hello',
      at: 1004,
    });
    expect(duplicate.messages).toHaveLength(submitted.messages.length);
  });

  it('moves to revealing on completed then to result', () => {
    const awaiting = {
      ...createInitialState(1000),
      phase: 'awaiting' as const,
      pending: 'reply' as const,
    };
    const revealing = expeditionReducer(awaiting, {
      type: 'engine/success',
      response: successResponse({ phase: 'completed' }),
      at: 1005,
    });
    expect(revealing.phase).toBe('revealing');
    expect(revealing.pending).toBe('result');
    const done = expeditionReducer(revealing, {
      type: 'reveal/result',
      result: {
        trackId: 'ai',
        secondaryTrackId: null,
        explanation: null,
        origin: 'demo',
      },
      at: 1006,
    });
    expect(done.phase).toBe('result');
  });

  it('recovers via retry and restarts clean', () => {
    const awaiting = {
      ...createInitialState(1000),
      phase: 'awaiting' as const,
      pending: 'reply' as const,
    };
    const failed = expeditionReducer(awaiting, {
      type: 'engine/failure',
      error: { code: 'network' as const, message: 'x', recoverable: true },
      at: 1007,
    });
    expect(failed.phase).toBe('error');
    const retried = expeditionReducer(failed, { type: 'engine/retry', at: 1008 });
    expect(retried.pending).toBe('reply');
    const restarted = expeditionReducer(failed, { type: 'expedition/restart', at: 1009 });
    expect(restarted.phase).toBe('welcome');
    expect(hasResumableSession(createInitialState())).toBe(false);
  });
});
