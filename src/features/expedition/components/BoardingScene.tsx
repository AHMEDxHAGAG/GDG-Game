'use client';

import { useEffect } from 'react';

import { ui } from '@/content/ui';
import { useExpedition } from '@/features/expedition/state/ExpeditionProvider';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';
import { CompassRose } from '@/components/shared/nautical-art';

export interface BoardingSceneProps {
  onCompassDone?: () => void;
}

/**
 * Short, skippable transition between welcome and the first captain line.
 * Purely presentational: the engine call is already in flight while this
 * shows, and the expedition renders the conversation as soon as the first
 * response lands.
 */
export function BoardingScene({ onCompassDone }: BoardingSceneProps): React.JSX.Element {
  useEffect(() => {
    if (!onCompassDone) return;
    const id = window.setTimeout(onCompassDone, 2400);
    return () => window.clearTimeout(id);
  }, [onCompassDone]);

  return (
    <NauticalBackground withCompass tone="deep">
      <main
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center"
        data-scene="boarding"
        aria-label={ui.chat.thinkingLabel}
      >
        <CompassRose
          animated
          className="animate-sway size-28 text-parchment-200/90"
          aria-hidden="true"
        />
        <p className="animate-bubble-in mt-6 text-xl font-extrabold text-parchment-100">
          {ui.boarding.title}
        </p>
        <p className="animate-bubble-in mt-2 text-[0.95rem] leading-relaxed text-parchment-200/80 [animation-delay:120ms]">
          {ui.boarding.body}
        </p>
        <div className="animate-bubble-in mt-6 [animation-delay:200ms]">
          <PirateButton variant="ghost" onClick={onCompassDone} className="text-parchment-100">
            {ui.boarding.skip}
          </PirateButton>
        </div>
      </main>
    </NauticalBackground>
  );
}

/** Convenience wrapper that hides itself once the conversation is ready. */
export function BoardingGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { state } = useExpedition();
  if (state.phase !== 'boarding' || state.messages.length > 0) return <>{children}</>;
  return <BoardingScene />;
}
