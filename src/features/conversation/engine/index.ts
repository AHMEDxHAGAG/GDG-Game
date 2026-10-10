import { MockConversationEngine, type MockEngineOptions } from './MockConversationEngine';
import { MAX_MESSAGE_LENGTH } from '@/config/site';
import type { ConversationEngine } from '@/features/conversation/types';

/**
 * The single place where a conversation engine is chosen.
 *
 * AI integration seam
 * -------------------
 * Today this returns the scripted `MockConversationEngine`. When the real
 * conversation service is ready, implement `ConversationEngine` against the
 * server route and return it here (optionally gated by an env flag for
 * A/B comparison during the event).
 *
 * Nothing else in the app imports a concrete engine — the reducer, UI, session
 * persistence and reveal all depend on the interface only.
 */
export function createConversationEngine(options: Partial<MockEngineOptions> = {}): ConversationEngine {
  return new MockConversationEngine(options);
}

export { MockConversationEngine };
export type { MockEngineOptions };

/** Re-exported so callers get the same limit the composer enforces. */
export { MAX_MESSAGE_LENGTH };
