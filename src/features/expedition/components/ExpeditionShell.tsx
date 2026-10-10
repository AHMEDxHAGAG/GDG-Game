'use client';

import { useEffect, useState } from 'react';

import { clearSession } from '@/features/session/sessionStorage';
import { ui } from '@/content/ui';
import { useExpedition } from '@/features/expedition/state/ExpeditionProvider';
import type { ExpeditionPhase } from '@/features/expedition/state/expeditionReducer';
import { WelcomeScene } from '@/features/expedition/components/WelcomeScene';
import { BoardingScene } from '@/features/expedition/components/BoardingScene';
import { ConversationScene } from '@/features/expedition/components/ConversationScene';
import { RevealingScene } from '@/features/reveal/components/RevealingScene';
import { ResultScene } from '@/features/reveal/components/ResultScene';
import { DevTools } from '@/components/shared/DevTools';

/**
 * How long the suspense beat stays up after the result payload arrives. The
 * captain's closing line and the reveal are the reward for the whole voyage —
 * cutting to the card the instant the payload lands reads as a glitch.
 */
const REVEAL_HOLD_MS = 1200;

/**
 * Phase router: the single place that maps expedition state to a scene.
 * Boarding / revealing are presentational gates over the real state machine,
 * so refresh, resume and error paths all stay consistent.
 */
export function ExpeditionShell(): React.JSX.Element {
  const { state, isHydrated, setNickname, start, resume } = useExpedition();
  // Starts "open": a voyage resumed straight into its result should not be
  // forced back through the suspense beat. Entering `revealing` closes it.
  const [revealSkipped, setRevealSkipped] = useState(true);
  const [boardingSkipped, setBoardingSkipped] = useState(false);
  const [gatedPhase, setGatedPhase] = useState(state.phase);

  // Re-arm the skippable gates at the points that begin a fresh voyage. The
  // setState-in-render below is the sanctioned "adjust state during render"
  // pattern (no effect, no cascade): it runs once per phase change.
  if (gatedPhase !== state.phase) {
    setGatedPhase(state.phase);
    if (state.phase === 'boarding') setBoardingSkipped(false);
    if (state.phase === 'revealing') setRevealSkipped(false);
  }

  // The suspense beat must linger briefly after the payload lands. Without
  // this, a fast engine flips straight to the result and the reveal flashes.
  useEffect(() => {
    if (state.phase !== 'result' || !state.result) return;
    const id = window.setTimeout(() => setRevealSkipped(true), REVEAL_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [state.phase, state.result]);

  if (!isHydrated) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-parchment-300" aria-busy="true">
        <p className="animate-bubble-in text-lg font-extrabold text-ink-soft">{ui.boarding.title}</p>
      </div>
    );
  }

  if (state.phase === 'result' && state.result) {
    // Still inside the suspense hold (or the player never reached `revealing`,
    // e.g. a resumed finished voyage): keep showing it until the gate opens.
    if (!revealSkipped) {
      return (
        <>
          <RevealingScene
            onDone={() => setRevealSkipped(true)}
            onSkip={() => setRevealSkipped(true)}
          />
          <DevTools />
        </>
      );
    }
    return (
      <>
        {/* Key remounts the reveal on track switch so the silhouette entrance
            replays and introDone never sticks from a previous character. */}
        <ResultScene key={state.result.trackId} result={state.result} />
        <DevTools />
      </>
    );
  }

  if (state.phase === 'revealing' || (state.phase === 'result' && !state.result)) {
    if (revealSkipped && state.phase === 'revealing') {
      // Skipped suspense while the result is still fetching: hold the chat
      // transcript instead of flashing an empty result.
      return (
        <>
          <ConversationScene />
          <DevTools />
        </>
      );
    }
    return (
      <RevealingScene
        onDone={() => setRevealSkipped(true)}
        onSkip={() => setRevealSkipped(true)}
      />
    );
  }

  if (state.phase === 'welcome') {
    return (
      <>
        <WelcomeScene
          nickname={state.nickname}
          onNicknameChange={setNickname}
          onStart={start}
          onResume={resume}
          canResume={state.messages.length > 0 || state.result !== null}
        />
        <DevTools />
      </>
    );
  }

  if (state.phase === 'boarding' && !boardingSkipped && state.messages.length === 0) {
    return <BoardingScene onCompassDone={() => setBoardingSkipped(true)} />;
  }

  if (state.phase === 'error') {
    return (
      <>
        <ConversationScene />
        <DevTools />
      </>
    );
  }

  // conversation | awaiting | boarding (messages arrived) → chat
  return (
    <>
      <ConversationScene />
      <DevTools />
    </>
  );
}

/**
 * Phases where the fixed "erase local session" bar would sit on top of
 * content that must stay readable — the composer caption, the boarding and
 * suspense beats, and the result card, which reaches the bottom edge on short
 * screens and is also what gets exported. It is not useful mid-voyage either,
 * so it simply steps aside; the welcome screen still offers it once you are
 * back there.
 */
const IMMERSIVE_PHASES: ReadonlySet<ExpeditionPhase> = new Set([
  'boarding',
  'conversation',
  'awaiting',
  'revealing',
  'result',
  'error',
]);

export function ExpeditionFooter(): React.JSX.Element | null {
  const { state, restart } = useExpedition();
  const [cleared, setCleared] = useState(false);

  if (IMMERSIVE_PHASES.has(state.phase)) return null;

  return (
    <div
      data-scene="session-reset"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
      <button
        type="button"
        className="pointer-events-auto rounded-full bg-transparent px-3 py-1 text-[0.65rem] font-semibold text-ink-faint/70 underline decoration-dotted underline-offset-4"
        onClick={() => {
          clearSession();
          restart();
          setCleared(true);
          window.setTimeout(() => setCleared(false), 2500);
        }}
      >
        {cleared ? ui.footer.resetDone : ui.footer.reset}
      </button>
    </div>
  );
}
