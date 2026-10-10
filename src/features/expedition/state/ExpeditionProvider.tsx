'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { isTrackId } from '@/config/characters';
import { MAX_MESSAGE_LENGTH, MAX_NICKNAME_LENGTH } from '@/config/site';
import { createConversationEngine } from '@/features/conversation/engine';
import {
  isEngineError,
  type ConversationContext,
  type ConversationEngine,
  type EngineResponse,
} from '@/features/conversation/types';
import { clearSession, loadSession, saveSession } from '@/features/session/sessionStorage';
import { createId } from '@/lib/ids';
import {
  createInitialState,
  expeditionReducer,
  hasResumableSession,
  type ExpeditionState,
  type PendingOperation,
} from './expeditionReducer';

export interface ExpeditionContextValue {
  readonly state: ExpeditionState;
  readonly isHydrated: boolean;
  readonly canResume: boolean;
  readonly engineMode: ConversationEngine['mode'];
  readonly setNickname: (nickname: string | null) => void;
  readonly start: () => void;
  readonly resume: () => void;
  readonly restart: () => void;
  readonly sendMessage: (text: string) => void;
  readonly retry: () => void;
  readonly previewTrack: (track: string) => void;
}

const ExpeditionContext = createContext<ExpeditionContextValue | null>(null);

export interface ExpeditionProviderProps {
  children: ReactNode;
  /** Injection seam for tests and for a future server-backed engine. */
  engine?: ConversationEngine;
  /** Disable persistence (used by isolated component tests). */
  persist?: boolean;
}

export function normalizeNickname(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NICKNAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeMessage(raw: string): string {
  return raw.replace(/\r\n/g, '\n').trim().slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Owns the expedition: engine orchestration, state transitions and persistence.
 *
 * Components below it only read `state` and call intents — no component ever
 * talks to an engine directly.
 */
export function ExpeditionProvider({
  children,
  engine,
  persist = true,
}: ExpeditionProviderProps): React.JSX.Element {
  const [activeEngine] = useState<ConversationEngine>(() => engine ?? createConversationEngine());
  const [state, dispatch] = useReducer(expeditionReducer, undefined, () => createInitialState());
  const isHydrated = state.hydrated;

  // Refs mirroring reducer state keep async orchestration race-free and let the
  // engine callbacks stay referentially stable.
  const contextRef = useRef<ConversationContext>({
    sessionId: state.sessionId,
    nickname: state.nickname,
    messages: state.messages,
    phase: state.enginePhase,
    progress: state.progress,
    engineState: state.engineState,
  });
  const pendingRef = useRef<PendingOperation | null>(null);
  const failedOpRef = useRef<PendingOperation | null>(null);
  // Mirror of the latest reducer state, refreshed after commit. Only ever read
  // from event handlers (which run after effects), never during render.
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    contextRef.current = {
      sessionId: state.sessionId,
      nickname: state.nickname,
      messages: state.messages,
      phase: state.enginePhase,
      progress: state.progress,
      engineState: state.engineState,
    };
    failedOpRef.current = state.failedOperation;
  }, [state]);

  // 1. Restore a previous voyage, once, on the client. The effect only reads
  // storage and dispatches — the "restore already happened" fact lives in
  // reducer state, so there is no setState-in-effect cascade.
  useEffect(() => {
    if (state.hydrated) return;
    dispatch({
      type: 'session/hydrate',
      payload: persist ? loadSession() : null,
    });
  }, [state.hydrated, persist]);

  // 2. Persist every subsequent change.
  useEffect(() => {
    if (!state.hydrated || !persist) return;
    saveSession(state);
  }, [state, state.hydrated, persist]);

  function syncContextFromResponse(response: EngineResponse): void {
    const current = contextRef.current;
    const known = new Set(current.messages.map((m) => m.id));
    const additions = response.messages.filter((m) => !known.has(m.id));
    contextRef.current = {
      ...current,
      messages: additions.length > 0 ? [...current.messages, ...additions] : current.messages,
      phase: response.phase,
      progress: response.progress ?? current.progress,
      engineState: response.engineState ?? current.engineState,
    };
  }

  const run = useCallback(async (operation: PendingOperation, input?: string) => {
    if (pendingRef.current !== null) return;
    pendingRef.current = operation;

    try {
      if (operation === 'start') {
        const context = contextRef.current;
        const response = await activeEngine.start({
          sessionId: context.sessionId,
          nickname: context.nickname,
          engineState: context.engineState,
        });
        syncContextFromResponse(response);
        dispatch({ type: 'engine/success', response, at: Date.now() });
        if (response.phase === 'completed') {
          // Chain the reveal fetch inside the same guard so no message can
          // interleave between the closing turn and the result.
          try {
            const result = await activeEngine.getResult(contextRef.current);
            dispatch({ type: 'reveal/result', result, at: Date.now() });
          } catch (nested) {
            dispatch({
              type: 'engine/failure',
              error: isEngineError(nested)
                ? {
                    code: nested.code,
                    message: nested.message,
                    recoverable: nested.recoverable,
                  }
                : {
                    code: 'unknown',
                    message: 'حصلت مشكلة غير متوقعة في الاتصال. جرب تاني.',
                    recoverable: true,
                  },
              at: Date.now(),
            });
          }
        }
        return;
      }

      if (operation === 'reply') {
        const response = await activeEngine.reply(contextRef.current, input ?? '');
        syncContextFromResponse(response);
        dispatch({ type: 'engine/success', response, at: Date.now() });
        if (response.phase === 'completed') {
          try {
            const result = await activeEngine.getResult(contextRef.current);
            dispatch({ type: 'reveal/result', result, at: Date.now() });
          } catch (nested) {
            dispatch({
              type: 'engine/failure',
              error: isEngineError(nested)
                ? {
                    code: nested.code,
                    message: nested.message,
                    recoverable: nested.recoverable,
                  }
                : {
                    code: 'unknown',
                    message: 'حصلت مشكلة غير متوقعة في الاتصال. جرب تاني.',
                    recoverable: true,
                  },
              at: Date.now(),
            });
          }
        }
        return;
      }

      const result = await activeEngine.getResult(contextRef.current);
      dispatch({ type: 'reveal/result', result, at: Date.now() });
    } catch (error) {
      dispatch({
        type: 'engine/failure',
        error: isEngineError(error)
          ? { code: error.code, message: error.message, recoverable: error.recoverable }
          : {
              code: 'unknown',
              message: 'حصلت مشكلة غير متوقعة في الاتصال. جرب تاني.',
              recoverable: true,
            },
        at: Date.now(),
      });
    } finally {
      pendingRef.current = null;
    }
  }, [activeEngine]);

  const setNickname = useCallback((nickname: string | null) => {
    // WelcomeScene already normalizes, but normalizing here keeps direct
    // callers (and tests) consistent: whitespace-only becomes null.
    const normalized =
      nickname === null ? null : normalizeNickname(nickname);
    contextRef.current = { ...contextRef.current, nickname: normalized };
    dispatch({ type: 'nickname/set', nickname: normalized, at: Date.now() });
  }, []);

  const start = useCallback(() => {
    // Read the orchestration mirror, not `stateRef`: `setNickname` writes the
    // nickname there synchronously, so a nickname typed and submitted in the
    // same tick is already visible here.
    const current = contextRef.current;
    // Optimistic reset so the engine sees a fresh voyage even though the
    // reducer state syncs on the next render. The nickname chosen on the
    // welcome screen is preserved; everything else is cleared by the reducer.
    contextRef.current = {
      sessionId: current.sessionId,
      nickname: current.nickname,
      messages: [],
      phase: 'intro',
      progress: null,
      engineState: null,
    };
    pendingRef.current = null;
    failedOpRef.current = null;
    dispatch({ type: 'expedition/start', at: Date.now() });
    void run('start');
  }, [run]);

  /**
   * Re-opens a stored voyage.
   *
   * A finished expedition returns straight to its result; an interrupted one
   * asks the engine for the next beat, using the cursor carried in engine state.
   */
  const resume = useCallback(() => {
    if (state.result) {
      dispatch({ type: 'expedition/resume', at: Date.now() });
      return;
    }
    if (contextRef.current.messages.length === 0) {
      start();
      return;
    }
    pendingRef.current = null;
    failedOpRef.current = null;
    dispatch({ type: 'expedition/resume', at: Date.now() });
    void run('start');
  }, [run, start, state.result]);

  const restart = useCallback(() => {
    clearSession();
    pendingRef.current = null;
    failedOpRef.current = null;
    const fresh = createInitialState();
    // Reset the orchestration mirror to the fresh session id immediately.
    contextRef.current = {
      sessionId: fresh.sessionId,
      nickname: null,
      messages: [],
      phase: 'intro',
      progress: null,
      engineState: null,
    };
    dispatch({ type: 'expedition/restart', at: Date.now() });
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const normalized = normalizeMessage(text);
      if (!normalized) return;
      if (pendingRef.current !== null) return;
      const snapshot = stateRef.current;
      if (snapshot.phase !== 'conversation' || snapshot.pending !== null) return;
      const messageId = createId('msg');
      // Optimistic mirror so the engine sees the player's line even though the
      // reducer state syncs on the next render.
      contextRef.current = {
        ...contextRef.current,
        messages: [
          ...contextRef.current.messages,
          { id: messageId, role: 'player', text: normalized, createdAt: Date.now() },
        ],
      };
      dispatch({ type: 'message/submit', messageId, text: normalized, at: Date.now() });
      void run('reply', normalized);
    },
    [run],
  );

  const retry = useCallback(() => {
    const operation = failedOpRef.current;
    if (!operation) return;
    const lastPlayerMessage = [...state.messages].reverse().find((m) => m.role === 'player');
    dispatch({ type: 'engine/retry', at: Date.now() });
    void run(operation, operation === 'reply' ? (lastPlayerMessage?.text ?? '') : undefined);
  }, [run, state.messages]);

  const previewTrack = useCallback((track: string) => {
    if (!isTrackId(track)) return;
    dispatch({
      type: 'result/preview',
      result: {
        trackId: track,
        secondaryTrackId: null,
        explanation: null,
        origin: 'demo',
        metadata: { source: 'developer-preview', analysed: false },
      },
      at: Date.now(),
    });
  }, []);

  const value = useMemo<ExpeditionContextValue>(
    () => ({
      state,
      isHydrated,
      canResume: hasResumableSession(state),
      engineMode: activeEngine.mode,
      setNickname,
      start,
      resume,
      restart,
      sendMessage,
      retry,
      previewTrack,
    }),
    [state, isHydrated, activeEngine, setNickname, start, resume, restart, sendMessage, retry, previewTrack],
  );

  return <ExpeditionContext.Provider value={value}>{children}</ExpeditionContext.Provider>;
}

export function useExpedition(): ExpeditionContextValue {
  const context = useContext(ExpeditionContext);
  if (!context) {
    throw new Error('useExpedition must be used inside <ExpeditionProvider>.');
  }
  return context;
}
