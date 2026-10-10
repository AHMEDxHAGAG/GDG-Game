import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createElement, type ReactNode } from 'react';

import { MockConversationEngine } from '@/features/conversation/engine/MockConversationEngine';
import {
  ExpeditionProvider,
  useExpedition,
} from './ExpeditionProvider';

function setup() {
  const engine = new MockConversationEngine({ latencyMs: 0 });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(ExpeditionProvider, { engine, persist: false, children });
  return renderHook(() => useExpedition(), { wrapper });
}

describe('ExpeditionProvider orchestration', () => {
  it('runs start → reply → completing → result with locked composer in flight', async () => {
    const { result } = setup();

    act(() => {
      result.current.setNickname('كابتن');
    });
    expect(result.current.state.nickname).toBe('كابتن');

    act(() => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.state.phase).toBe('conversation');
    });
    expect(result.current.state.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.sendMessage('أنا بحب أبني حاجات وأفهمها من جوا');
    });
    // Duplicate sends while awaiting are ignored.
    const countAfterSubmit = result.current.state.messages.length;
    act(() => {
      result.current.sendMessage('ignored duplicate');
    });
    expect(result.current.state.messages.length).toBe(countAfterSubmit);

    await waitFor(() => {
      expect(result.current.state.phase).toBe('conversation');
    });

    // Drive the whole scripted voyage to completion.
    for (let i = 0; i < 10; i += 1) {
      if (result.current.state.phase === 'result') break;
      act(() => {
        result.current.sendMessage(`رد رقم ${i}`);
      });
      await waitFor(
        () => {
          expect(['conversation', 'revealing', 'result']).toContain(
            result.current.state.phase,
          );
        },
        { timeout: 2000 },
      );
      if (result.current.state.phase !== 'conversation') break;
    }

    await waitFor(
      () => {
        expect(result.current.state.phase).toBe('result');
      },
      { timeout: 5000 },
    );
    expect(result.current.state.result?.origin).toBe('demo');
    expect(result.current.state.result?.trackId).toBeTruthy();
  });

  it('previews all five tracks as demo results', () => {
    const { result } = setup();
    const tracks = [
      'software-engineering',
      'ai',
      'web-development',
      'data-science',
      'cybersecurity',
    ] as const;
    for (const track of tracks) {
      act(() => {
        result.current.previewTrack(track);
      });
      expect(result.current.state.phase).toBe('result');
      expect(result.current.state.result?.trackId).toBe(track);
      expect(result.current.state.result?.origin).toBe('demo');
    }
  });

  it('retries a recoverable start failure', async () => {
    const flaky = new MockConversationEngine({ latencyMs: 0, failNextCalls: 1 });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(ExpeditionProvider, { engine: flaky, persist: false, children });
    const { result } = renderHook(() => useExpedition(), { wrapper });

    act(() => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.state.phase).toBe('error');
    });
    expect(result.current.state.error?.recoverable).toBe(true);

    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.state.phase).toBe('conversation');
    });
  });

  it('restarts into a pristine welcome', async () => {
    const { result } = setup();
    act(() => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.state.phase).toBe('conversation');
    });
    act(() => {
      result.current.restart();
    });
    expect(result.current.state.phase).toBe('welcome');
    expect(result.current.state.messages).toHaveLength(0);
    expect(result.current.state.result).toBeNull();
    expect(result.current.canResume).toBe(false);
  });

  it('normalizes nicknames and drops empty messages', async () => {
    const { result } = setup();
    act(() => {
      result.current.setNickname('   ');
    });
    expect(result.current.state.nickname).toBeNull();
    act(() => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.state.phase).toBe('conversation');
    });
    const before = result.current.state.messages.length;
    act(() => {
      result.current.sendMessage('   ');
    });
    expect(result.current.state.messages.length).toBe(before);
  });
});
