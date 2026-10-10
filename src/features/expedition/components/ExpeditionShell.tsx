'use client';

import { useState } from 'react';

import { clearSession } from '@/features/session/sessionStorage';
import { ui } from '@/content/ui';
import { useExpedition } from '@/features/expedition/state/ExpeditionProvider';
import { WelcomeScene } from '@/features/expedition/components/WelcomeScene';
import { BoardingScene } from '@/features/expedition/components/BoardingScene';
import { ConversationScene } from '@/features/expedition/components/ConversationScene';
import { RevealingScene } from '@/features/reveal/components/RevealingScene';
import { ResultScene } from '@/features/reveal/components/ResultScene';
import { DevTools } from '@/components/shared/DevTools';

/**
 * Phase router: the single place that maps expedition state to a scene.
 * Boarding / revealing are presentational gates over the real state machine,
 * so refresh, resume and error paths all stay consistent.
 */
export function ExpeditionShell(): React.JSX.Element {
  const { state, isHydrated, setNickname, start, resume } = useExpedition();
  const [revealSkipped, setRevealSkipped] = useState(false);
  const [boardingSkipped, setBoardingSkipped] = useState(false);
  const [gatedPhase, setGatedPhase] = useState(state.phase);

  // Reset the skippable gates whenever the underlying phase changes. The
  // setState-in-render below is the sanctioned "adjust state during render"
  // pattern (no effect, no cascade): it runs once per phase change.
  if (gatedPhase !== state.phase) {
    setGatedPhase(state.phase);
    setRevealSkipped(false);
    setBoardingSkipped(false);
  }

  if (!isHydrated) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-parchment-300" aria-busy="true">
        <p className="animate-bubble-in text-lg font-extrabold text-ink-soft">{ui.boarding.title}</p>
      </div>
    );
  }

  if (state.phase === 'result' && state.result) {
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

export function ExpeditionFooter(): React.JSX.Element {
  const { restart } = useExpedition();
  const [cleared, setCleared] = useState(false);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-1">
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
