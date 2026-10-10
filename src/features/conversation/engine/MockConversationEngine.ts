import { MOCK_ACKNOWLEDGEMENTS, MOCK_PROGRESS_LABEL, MOCK_SCRIPT } from '@/content/dialogue/mockScript';
import { DEFAULT_DEMO_TRACK } from '@/config/characters';
import {
  ConversationEngineError,
  type ConversationContext,
  type ConversationEngine,
  type ConversationMessage,
  type EngineProgress,
  type EngineResponse,
  type EngineState,
  type ExpeditionResult,
  type StartContext,
} from '@/features/conversation/types';

export interface MockEngineOptions {
  /** Total number of scenario prompts before the voyage closes. */
  readonly scenarioCount: number;
  /** Track handed back by `getResult` in demo mode. */
  readonly demoTrack: string;
  /** Artificial latency so the UI's waiting states are exercised realistically. */
  readonly latencyMs: number;
  /**
   * Test seam. Fails the next N engine calls so the error + retry path can be
   * exercised without touching the network.
   */
  readonly failNextCalls: number;
}

const DEFAULTS: MockEngineOptions = {
  scenarioCount: 7,
  demoTrack: DEFAULT_DEMO_TRACK,
  latencyMs: 850,
  failNextCalls: 0,
};

const CURSOR_KEY = 'cursor';

let messageCounter = 0;

export function createMessageId(role: ConversationMessage['role']): string {
  messageCounter += 1;
  return `${role}-${Date.now().toString(36)}-${messageCounter.toString(36)}`;
}

/** Test-only: keeps generated ids from growing without bound across suites. */
export function resetMessageCounter(): void {
  messageCounter = 0;
}

function makeMessage(role: ConversationMessage['role'], text: string): ConversationMessage {
  return { id: createMessageId(role), role, text, createdAt: Date.now() };
}

function readCursor(state: EngineState | null | undefined): number {
  const raw = state?.[CURSOR_KEY];
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
}

function withCursor(cursor: number): EngineState {
  return { [CURSOR_KEY]: cursor };
}

/**
 * The scripted stand-in for a real conversation engine.
 *
 * What it does:
 *  - plays the captain's intro and the scripted scenarios in order,
 *  - accepts and records genuine free-text answers,
 *  - emits content-free acknowledgements between scenarios,
 *  - closes the voyage and returns a clearly-labelled demo result,
 *  - resumes from the cursor carried in opaque engine state.
 *
 * What it deliberately does NOT do:
 *  - read, score, classify or keyword-match anything the visitor writes,
 *  - claim to have understood the answer,
 *  - pick a track based on the conversation.
 *
 * The returned track is a fixed configuration value, not an inference.
 */
export class MockConversationEngine implements ConversationEngine {
  readonly id = 'mock-scripted-v1';

  readonly mode = 'mock' as const;

  private readonly scenarioCount: number;

  private readonly demoTrack: string;

  private readonly latencyMs: number;

  private remainingFailures: number;

  constructor(options: Partial<MockEngineOptions> = {}) {
    const resolved = { ...DEFAULTS, ...options };
    // Never ask for more beats than the script contains.
    this.scenarioCount = Math.max(1, Math.min(resolved.scenarioCount, MOCK_SCRIPT.length - 2));
    this.demoTrack = resolved.demoTrack;
    this.latencyMs = Math.max(0, resolved.latencyMs);
    this.remainingFailures = Math.max(0, resolved.failNextCalls);
  }

  async start(context: StartContext): Promise<EngineResponse> {
    await this.tick();

    // Resuming mid-voyage: replay only the next scripted beat.
    const cursor = readCursor(context.engineState);
    if (cursor > 0) {
      const turn = MOCK_SCRIPT[Math.min(cursor, MOCK_SCRIPT.length - 1)]!;
      return {
        messages: [makeMessage('captain', turn.text)],
        phase: turn.phase,
        progress: this.progressFor(cursor),
        engineState: withCursor(cursor),
        awaitsReply: turn.phase !== 'completed',
      };
    }

    const turn = MOCK_SCRIPT[0]!;
    return {
      messages: [makeMessage('captain', turn.text)],
      phase: turn.phase,
      progress: this.progressFor(0),
      engineState: withCursor(1),
      awaitsReply: true,
    };
  }

  async reply(context: ConversationContext, message: string): Promise<EngineResponse> {
    await this.tick();

    const trimmed = message.trim();
    if (!trimmed) {
      throw new ConversationEngineError({
        code: 'invalid_state',
        message: 'مفيش رد اتبعت. اكتب حاجة الأول.',
        recoverable: false,
      });
    }

    const cursor = Math.max(1, readCursor(context.engineState));
    // Index of the turn we are about to show. Script index 0 is the intro and
    // indices 1..n are the scenarios, so `turnIndex` doubles as the ordinal of
    // the scenario being posed.
    const turnIndex = Math.min(cursor, MOCK_SCRIPT.length - 1);
    const turn = MOCK_SCRIPT[turnIndex]!;
    const isClosing = turn.phase === 'completed';

    const messages: ConversationMessage[] = [];
    if (!isClosing) {
      const acknowledgement =
        MOCK_ACKNOWLEDGEMENTS[
          (cursor - 1 + MOCK_ACKNOWLEDGEMENTS.length) % MOCK_ACKNOWLEDGEMENTS.length
        ];
      if (acknowledgement) messages.push(makeMessage('captain', acknowledgement));
    }
    messages.push(makeMessage('captain', turn.text));

    return {
      messages,
      phase: turn.phase,
      // `asked` counts scenarios the captain has actually posed, so the meter
      // never runs ahead of the conversation and never exceeds `expected`.
      progress: this.progressFor(
        isClosing ? this.scenarioCount : Math.min(turnIndex, this.scenarioCount),
      ),
      engineState: withCursor(isClosing ? cursor : cursor + 1),
      awaitsReply: !isClosing,
    };
  }

  async getResult(context: ConversationContext): Promise<ExpeditionResult> {
    await this.tick();
    void context;
    return {
      trackId: this.demoTrack as ExpeditionResult['trackId'],
      secondaryTrackId: null,
      explanation: null,
      origin: 'demo',
      metadata: { source: this.id, analysed: false },
    };
  }

  private progressFor(asked: number): EngineProgress {
    return {
      asked,
      expected: this.scenarioCount,
      label: MOCK_PROGRESS_LABEL(asked, this.scenarioCount),
    };
  }

  private async tick(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
    if (this.remainingFailures > 0) {
      this.remainingFailures -= 1;
      throw new ConversationEngineError({
        code: 'network',
        message: 'البدلة جابتش إشارة دلوقتي. جرب تاني.',
        recoverable: true,
      });
    }
  }
}
