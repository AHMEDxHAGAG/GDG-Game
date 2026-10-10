# AI Integration — architectural boundary (no AI implemented)

This document describes **where** a future conversation engine connects, not
**what** it should be. No provider was chosen, no model was selected, no
system prompt was written, and no scoring or classification exists anywhere in
this codebase. That is intentional and must stay true until the AI phase.

## The contract

`src/features/conversation/types.ts` defines the provider-neutral boundary:

```ts
interface ConversationEngine {
  readonly id: string;
  readonly mode: EngineMode; // 'mock' | 'remote'
  readonly start: (context: StartContext) => Promise<EngineResponse>;
  readonly reply: (context: ConversationContext, message: string) => Promise<EngineResponse>;
  readonly getResult: (context: ConversationContext) => Promise<ExpeditionResult>;
}
```

Key shapes:

- `ConversationMessage` — `{ id, role: 'captain' | 'player' | 'system', text,
  createdAt, illustrative? }`. Player text is rendered as-is (never injected
  as HTML); `illustrative` marks demo content in the UI.
- `StartContext` — `{ sessionId, nickname, engineState }`. `engineState` is
  opaque: the mock carries `{ cursor: number }`; a server engine could carry a
  remote conversation id through the same channel.
- `ConversationContext` — start context plus `messages`, `phase`
  (`intro | question | closing | completed`) and advisory `progress`
  (`{ asked, expected?, label? }`).
- `EngineResponse` — `{ messages, phase, progress?, engineState?,
  awaitsReply }`. The UI never requires `expected`: an adaptive engine may ask
  fewer, more, or follow-up questions and the journey meter degrades to an
  indeterminate state.
- `ExpeditionResult` — `{ trackId, secondaryTrackId?, explanation?,
  origin: 'engine' | 'demo', metadata? }`. `origin` is the honesty boundary:
  `'demo'` results render the illustrative banner; `'engine'` results render
  as the engine's own determination.
- Errors use `ConversationEngineError` (`code | message | recoverable`).
  Recoverable failures show retry; the reducer replays the failed operation
  (`start | reply | result`) with idempotency guards.

Runtime validation lives in `src/features/conversation/schemas.ts` (zod) and
is applied at the storage boundary today; a server engine must validate its
responses the same way before dispatching.

## Where a server-backed engine connects

1. Implement `ConversationEngine` against a **server route** (never call a
   third-party LLM from the browser, never ship keys in the bundle).
2. Return it from `createConversationEngine()` in
   `src/features/conversation/engine/index.ts` — optionally gated by an env
   flag for A/B comparison during the event. Nothing else imports a concrete
   engine: the reducer, provider, persistence, reveal and export depend on the
   interface only.
3. Keep the frontend async-agnostic: the provider already awaits promises,
   locks the composer while `pending !== null`, ignores duplicate submits,
   chains `getResult` inside the same guard when `phase === 'completed'`, and
   surfaces `recoverable` errors with retry.

## How async responses are handled

- `ExpeditionProvider.run()` serializes engine calls via `pendingRef`; the
  reducer mirrors `pending`/`failedOperation` for the UI.
- Player messages are appended optimistically with an idempotency key;
  engine messages are deduplicated by id on arrival.
- Hydration always lands on `welcome`; resume re-enters via
  `expedition/resume` without wiping history.
- Persistence (`sessionStorage.ts`) round-trips the same shapes with a schema
  version and TTL, so a server engine's cursor/ids survive refresh identically.

## Expected result object

A future engine should return something like:

```ts
{
  trackId: 'ai',                 // one of the five TrackIds
  secondaryTrackId: 'data-science' | null,
  explanation: '...short, friendly, Egyptian Arabic...',
  origin: 'engine',
  metadata: { analysed: true },  // provider-neutral display hints only
}
```

`ResultScene` already renders `explanation` when present (with a labelled
sample fallback in demo mode) and shows the secondary affinity only when the
payload supplies one — no hard-coded pairings exist.

## Intentionally not decided

- AI provider, model, costs, hosting, or latency budgets.
- System prompt, conversation orchestration, or track-classification method.
- Number of questions, scoring rubric, or follow-up policy.
- Safety configuration, moderation, or analytics (free-text answers are never
  logged to third parties today and expire from the device after 12 hours).
- Session management beyond localStorage (no backend exists).

## Blockers to resolve before integrating AI

- Choose a server transport (route handler / external service) and its auth,
  timeout, retry and rate-limit policy for a room full of concurrent players.
- Define Arabic-first response guidelines (Egyptian dialect, English track
  terms, bidi-safe output) and validate them against the chat UI.
- Decide how explanations are generated, length-limited, and rendered safely
  (plain text only — the UI has no rich-text path by design).
- Load-test the reveal path: `getResult` must resolve quickly on event
  networks or the suspense beat holds indefinitely.
- Rehearse fallback behaviour: if the AI is unreachable, the event needs a
  defined degradation (mock mode, queued retry, or paused onboarding).
