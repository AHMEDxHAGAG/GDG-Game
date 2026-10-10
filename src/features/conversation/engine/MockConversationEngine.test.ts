import { describe, expect, it } from 'vitest';

import { MockConversationEngine } from './MockConversationEngine';

describe('MockConversationEngine', () => {
  it('plays intro then scripted scenarios and closes with a demo result', async () => {
    const engine = new MockConversationEngine({ latencyMs: 0 });
    const started = await engine.start({ sessionId: 's1', nickname: null, engineState: null });
    expect(started.phase).toBe('intro');
    expect(started.messages).toHaveLength(1);
    expect(started.awaitsReply).toBe(true);

    let context = {
      sessionId: 's1',
      nickname: null,
      messages: started.messages,
      phase: started.phase,
      progress: started.progress ?? null,
      engineState: started.engineState ?? null,
    };

    // Walk the whole script: 7 scenarios + closing beat.
    for (let i = 0; i < 8; i += 1) {
      const response = await engine.reply(context, `answer ${i}`);
      context = { ...context, messages: response.messages, phase: response.phase };
      if (response.engineState) context = { ...context, engineState: response.engineState };
      if (response.progress !== undefined) {
        context = { ...context, progress: response.progress ?? null };
      }
      if (response.phase === 'completed') break;
    }
    expect(context.phase).toBe('completed');

    const result = await engine.getResult(context);
    expect(result.origin).toBe('demo');
    expect(result.trackId).toBeTruthy();
    expect(result.explanation).toBeNull();
  });

  it('reports progress that matches the scenarios actually posed', async () => {
    const engine = new MockConversationEngine({ latencyMs: 0 });
    const started = await engine.start({ sessionId: 's1', nickname: null, engineState: null });

    // Nothing has been asked yet.
    expect(started.progress?.asked).toBe(0);
    const expected = started.progress?.expected;
    expect(expected).toBeGreaterThan(0);

    let context = {
      sessionId: 's1',
      nickname: null,
      messages: started.messages,
      phase: started.phase,
      progress: started.progress ?? null,
      engineState: started.engineState ?? null,
    };

    const asked: number[] = [];
    for (let i = 0; i < 12 && context.phase !== 'completed'; i += 1) {
      const response = await engine.reply(context, `answer ${i}`);
      context = {
        ...context,
        messages: response.messages,
        phase: response.phase,
        progress: response.progress ?? context.progress,
        engineState: response.engineState ?? context.engineState,
      };
      asked.push(response.progress?.asked ?? 0);
    }

    expect(context.phase).toBe('completed');
    // One question asked per reply, in order, never skipping or repeating.
    expect(asked).toEqual([1, 2, 3, 4, 5, 6, 7, 7]);
    // The meter must never exceed the expected count (no "8 of 7").
    for (const value of asked) {
      expect(value).toBeLessThanOrEqual(expected!);
    }
  });

  it('resumes from an opaque cursor without replaying the intro', async () => {
    const engine = new MockConversationEngine({ latencyMs: 0 });
    const resumed = await engine.start({
      sessionId: 's1',
      nickname: 'كابتن',
      engineState: { cursor: 3 },
    });
    expect(resumed.messages).toHaveLength(1);
    expect(resumed.phase).not.toBe('intro');
  });

  it('rejects empty replies and surfaces a failing test seam', async () => {
    const engine = new MockConversationEngine({ latencyMs: 0 });
    const started = await engine.start({ sessionId: 's1', nickname: null, engineState: null });
    const context = {
      sessionId: 's1',
      nickname: null,
      messages: started.messages,
      phase: started.phase,
      progress: started.progress ?? null,
      engineState: started.engineState ?? null,
    };
    await expect(engine.reply(context, '   ')).rejects.toMatchObject({
      name: 'ConversationEngineError',
    });

    const flaky = new MockConversationEngine({ latencyMs: 0, failNextCalls: 1 });
    await expect(
      flaky.start({ sessionId: 's1', nickname: null, engineState: null }),
    ).rejects.toMatchObject({ recoverable: true });
  });

  it('never claims analysis: acknowledgements are content-free and metadata is demo', async () => {
    const engine = new MockConversationEngine({ latencyMs: 0 });
    expect(engine.mode).toBe('mock');
    const started = await engine.start({ sessionId: 's1', nickname: null, engineState: null });
    const response = await engine.reply(
      {
        sessionId: 's1',
        nickname: null,
        messages: started.messages,
        phase: started.phase,
        progress: started.progress ?? null,
        engineState: started.engineState ?? null,
      },
      'I love building robots that guard ships',
    );
    // The reply must not echo or classify the player's words.
    for (const message of response.messages) {
      expect(message.text).not.toContain('robots');
    }
    const result = await engine.getResult({
      sessionId: 's1',
      nickname: null,
      messages: response.messages,
      phase: response.phase,
      progress: response.progress ?? null,
      engineState: response.engineState ?? null,
    });
    expect(result.metadata).toMatchObject({ analysed: false });
  });
});
