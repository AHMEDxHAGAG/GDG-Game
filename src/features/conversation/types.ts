import type { TrackId } from '@/features/characters/types';

/** Who produced a message. `system` is reserved for non-narrative notices. */
export type MessageRole = 'captain' | 'player' | 'system';

export interface ConversationMessage {
  readonly id: string;
  readonly role: MessageRole;
  readonly text: string;
  /** Epoch milliseconds. */
  readonly createdAt: number;
  /**
   * Marks content the engine produced without real inference. Surfaced in the
   * UI so a demo result is never mistaken for an analysed personality.
   */
  readonly illustrative?: boolean;
}

/** Where the scripted/mock conversation currently is. */
export type ConversationPhase = 'intro' | 'question' | 'closing' | 'completed';

/** JSON values an engine is allowed to round-trip through the client. */
export type EngineJson = string | number | boolean | null;

/**
 * Opaque, engine-owned state.
 *
 * The mock uses it for its scripted cursor. A future server-backed engine can
 * use the same channel for a remote conversation id, without the frontend
 * needing to understand what is inside.
 */
export type EngineState = Readonly<Record<string, EngineJson>>;

/**
 * Optional progress hint.
 *
 * Deliberately advisory: a future AI engine may ask fewer, more, or follow-up
 * questions, so nothing in the UI is allowed to *require* these numbers.
 */
export interface EngineProgress {
  readonly asked: number;
  readonly expected?: number;
  /** Short label for the journey meter, e.g. "الموقف 3 من 7". */
  readonly label?: string;
}

/** Everything an engine needs to continue a conversation. */
export interface ConversationContext {
  readonly sessionId: string;
  readonly nickname: string | null;
  readonly messages: readonly ConversationMessage[];
  readonly phase: ConversationPhase;
  readonly progress: EngineProgress | null;
  readonly engineState: EngineState | null;
}

export interface StartContext {
  readonly sessionId: string;
  readonly nickname: string | null;
  /** Opaque state restored from a previous visit, when one exists. */
  readonly engineState: EngineState | null;
}

export interface EngineResponse {
  /** Captain lines to append, in order. */
  readonly messages: readonly ConversationMessage[];
  readonly phase: ConversationPhase;
  readonly progress?: EngineProgress | null;
  /** Opaque state the engine wants carried into the next call. */
  readonly engineState?: EngineState | null;
  /**
   * When true the caller must not accept another message until the next
   * response. Always true for async engines; kept explicit for transports that
   * can answer synchronously.
   */
  readonly awaitsReply: boolean;
}

/**
 * The reveal payload.
 *
 * `origin` is the honesty boundary: `'demo'` results are surfaced in the UI as
 * illustrative, `'engine'` results are the engine's own determination.
 */
export interface ExpeditionResult {
  readonly trackId: TrackId;
  readonly secondaryTrackId?: TrackId | null;
  /** Free-form, provider-neutral explanation. `null` means "not available yet". */
  readonly explanation?: string | null;
  readonly origin: 'engine' | 'demo';
  /** Provider-neutral display hints. Never provider-specific concepts. */
  readonly metadata?: Readonly<Record<string, EngineJson>>;
}

export type EngineErrorCode =
  | 'network'
  | 'timeout'
  | 'rate_limited'
  | 'server'
  | 'invalid_state'
  | 'aborted'
  | 'unknown';

export interface EngineErrorShape {
  readonly code: EngineErrorCode;
  readonly message: string;
  /** Whether offering a retry makes sense. */
  readonly recoverable: boolean;
}

/**
 * Thrown by engines. The reducer maps `recoverable` to the retry affordance so
 * transport-level concerns never leak into components.
 */
export class ConversationEngineError extends Error implements EngineErrorShape {
  readonly code: EngineErrorCode;
  readonly recoverable: boolean;

  constructor(shape: EngineErrorShape) {
    super(shape.message);
    this.name = 'ConversationEngineError';
    this.code = shape.code;
    this.recoverable = shape.recoverable;
  }
}

/**
 * The single boundary a future AI implementation must satisfy.
 *
 * Everything above this line (UI, state machine, persistence, reveal, export)
 * is provider-agnostic: replacing the mock with a server-backed engine must not
 * require rebuilding the frontend.
 */
export interface ConversationEngine {
  /** Stable identifier, useful for diagnostics and persistence. */
  readonly id: string;
  /** Surfaced in the UI so demo behaviour is never presented as real analysis. */
  readonly mode: EngineMode;
  readonly start: (context: StartContext) => Promise<EngineResponse>;
  readonly reply: (context: ConversationContext, message: string) => Promise<EngineResponse>;
  readonly getResult: (context: ConversationContext) => Promise<ExpeditionResult>;
}

export type EngineMode = 'mock' | 'remote';

export function isEngineError(error: unknown): error is ConversationEngineError {
  return error instanceof ConversationEngineError;
}
