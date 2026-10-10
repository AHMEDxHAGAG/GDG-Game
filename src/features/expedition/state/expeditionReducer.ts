import { createSessionId } from '@/lib/ids';
import type {
  ConversationMessage,
  ConversationPhase as EnginePhase,
  EngineErrorShape,
  EngineProgress,
  EngineResponse,
  EngineState,
  ExpeditionResult,
} from '@/features/conversation/types';

/**
 * Experience lifecycle.
 *
 * ```
 * welcome → boarding → conversation ⇄ awaiting → revealing → result
 *                            ↓
 *                          error (recoverable → retries the failed call)
 * ```
 */
export type ExpeditionPhase =
  | 'welcome'
  | 'boarding'
  | 'conversation'
  | 'awaiting'
  | 'error'
  | 'revealing'
  | 'result';

/** Which async engine call is in flight (or which one failed and may be retried). */
export type PendingOperation = 'start' | 'reply' | 'result';

export interface ExpeditionState {
  readonly phase: ExpeditionPhase;
  readonly sessionId: string;
  readonly nickname: string | null;
  readonly messages: readonly ConversationMessage[];
  readonly enginePhase: EnginePhase;
  readonly progress: EngineProgress | null;
  /** Opaque engine-owned state (mock cursor today; a conversation id later). */
  readonly engineState: EngineState | null;
  readonly result: ExpeditionResult | null;
  readonly error: EngineErrorShape | null;
  readonly pending: PendingOperation | null;
  /** The operation a recoverable error belongs to, so retry can repeat it. */
  readonly failedOperation: PendingOperation | null;
  /** Idempotency key for the message currently being answered. */
  readonly inFlightMessageId: string | null;
  readonly startedAt: number | null;
  readonly updatedAt: number;
}

export type ExpeditionAction =
  | { type: 'session/hydrate'; payload: ExpeditionState }
  | { type: 'nickname/set'; nickname: string | null; at: number }
  | { type: 'expedition/start'; at: number }
  | { type: 'expedition/resume'; at: number }
  | { type: 'engine/success'; response: EngineResponse; at: number }
  | { type: 'message/submit'; messageId: string; text: string; at: number }
  | { type: 'engine/failure'; error: EngineErrorShape; at: number }
  | { type: 'engine/retry'; at: number }
  | { type: 'reveal/result'; result: ExpeditionResult; at: number }
  | { type: 'result/preview'; result: ExpeditionResult; at: number }
  | { type: 'expedition/restart'; at: number };

export function createInitialState(now = Date.now()): ExpeditionState {
  return {
    phase: 'welcome',
    sessionId: createSessionId(),
    nickname: null,
    messages: [],
    enginePhase: 'intro',
    progress: null,
    engineState: null,
    result: null,
    error: null,
    pending: null,
    failedOperation: null,
    inFlightMessageId: null,
    startedAt: null,
    updatedAt: now,
  };
}

function appendMessages(
  state: ExpeditionState,
  incoming: readonly ConversationMessage[],
): readonly ConversationMessage[] {
  if (incoming.length === 0) return state.messages;
  const known = new Set(state.messages.map((m) => m.id));
  const additions = incoming.filter((m) => !known.has(m.id));
  return additions.length === 0 ? state.messages : [...state.messages, ...additions];
}

export function expeditionReducer(
  state: ExpeditionState,
  action: ExpeditionAction,
): ExpeditionState {
  switch (action.type) {
    case 'session/hydrate':
      // Land back on welcome but keep the stored voyage so the welcome screen
      // can offer "continue vs restart". The resume intent re-enters via
      // `expedition/resume` without wiping messages or the engine cursor.
      return {
        ...action.payload,
        phase: 'welcome',
        error: null,
        pending: null,
        failedOperation: null,
        inFlightMessageId: null,
      };

    case 'nickname/set':
      return { ...state, nickname: action.nickname, updatedAt: action.at };

    case 'expedition/start': {
      if (state.phase !== 'welcome') return state;
      // Fresh voyage: clear any restored conversation but keep the session id
      // and the nickname chosen on the welcome screen.
      return {
        ...state,
        phase: 'boarding',
        pending: 'start',
        failedOperation: null,
        error: null,
        messages: [],
        enginePhase: 'intro',
        progress: null,
        engineState: null,
        result: null,
        inFlightMessageId: null,
        startedAt: state.startedAt ?? action.at,
        updatedAt: action.at,
      };
    }

    case 'expedition/resume': {
      // Re-enters a stored voyage without wiping its messages or engine cursor.
      // Only valid from the welcome screen when there is something to resume.
      if (state.phase !== 'welcome') return state;
      if (state.messages.length === 0 && state.result === null) return state;
      if (state.result !== null) {
        return {
          ...state,
          phase: 'result',
          pending: null,
          failedOperation: null,
          error: null,
          updatedAt: action.at,
        };
      }
      return {
        ...state,
        phase: 'boarding',
        pending: 'start',
        failedOperation: null,
        error: null,
        inFlightMessageId: null,
        startedAt: state.startedAt ?? action.at,
        updatedAt: action.at,
      };
    }

    case 'message/submit': {
      // Hard guards: no sending while the engine is thinking, before the voyage
      // has started, after the closing turn, or twice for the same message id.
      if (state.phase !== 'conversation') return state;
      if (state.pending !== null) return state;
      if (state.enginePhase === 'completed') return state;
      if (state.messages.some((m) => m.id === action.messageId)) return state;

      const playerMessage: ConversationMessage = {
        id: action.messageId,
        role: 'player',
        text: action.text,
        createdAt: action.at,
      };

      return {
        ...state,
        phase: 'awaiting',
        pending: 'reply',
        failedOperation: null,
        inFlightMessageId: action.messageId,
        error: null,
        messages: [...state.messages, playerMessage],
        updatedAt: action.at,
      };
    }

    case 'engine/success': {
      if (state.pending === null) return state;
      const { response } = action;
      const messages = appendMessages(state, response.messages);

      if (response.phase === 'completed') {
        // The captain's closing lines stay on screen behind the reveal overlay.
        return {
          ...state,
          phase: 'revealing',
          pending: 'result',
          failedOperation: null,
          enginePhase: response.phase,
          progress: response.progress ?? state.progress,
          engineState: response.engineState ?? state.engineState,
          messages,
          inFlightMessageId: null,
          error: null,
          updatedAt: action.at,
        };
      }

      return {
        ...state,
        phase: 'conversation',
        pending: null,
        failedOperation: null,
        enginePhase: response.phase,
        progress: response.progress ?? state.progress,
        engineState: response.engineState ?? state.engineState,
        messages,
        inFlightMessageId: null,
        error: null,
        updatedAt: action.at,
      };
    }

    case 'engine/failure': {
      if (state.pending === null) return state;
      return {
        ...state,
        phase: 'error',
        pending: null,
        failedOperation: state.pending,
        error: action.error,
        inFlightMessageId: null,
        updatedAt: action.at,
      };
    }

    case 'engine/retry': {
      if (state.phase !== 'error' || !state.error?.recoverable) return state;
      const operation = state.failedOperation;
      if (operation === null) return state;

      const phase: ExpeditionPhase =
        operation === 'start' ? 'boarding' : operation === 'reply' ? 'awaiting' : 'revealing';

      return {
        ...state,
        phase,
        pending: operation,
        failedOperation: null,
        error: null,
        updatedAt: action.at,
      };
    }

    case 'reveal/result': {
      if (state.phase !== 'revealing' && state.phase !== 'result') return state;
      return {
        ...state,
        phase: 'result',
        pending: null,
        failedOperation: null,
        result: action.result,
        error: null,
        updatedAt: action.at,
      };
    }

    case 'result/preview':
      return {
        ...state,
        phase: 'result',
        pending: null,
        failedOperation: null,
        result: action.result,
        error: null,
        updatedAt: action.at,
      };

    case 'expedition/restart':
      return createInitialState(action.at);

    default:
      return state;
  }
}

/** True while the composer must be read-only. */
export function isComposerLocked(state: ExpeditionState): boolean {
  return state.phase !== 'conversation';
}

/** True when the welcome screen should offer to resume instead of restart. */
export function hasResumableSession(state: ExpeditionState): boolean {
  return state.phase !== 'welcome' && (state.messages.length > 0 || state.result !== null);
}
