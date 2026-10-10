'use client';

import { useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';

import { ui } from '@/content/ui';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';
import { ShipSilhouette } from '@/components/shared/nautical-art';

export interface RevealingSceneProps {
  onDone: () => void;
  onSkip: () => void;
}

/**
 * Suspense beat between the last captain line and the character reveal.
 *
 * Purely presentational and skippable; reduced-motion users (or anyone
 * impatient) can jump straight to the result. Auto-advances after ~3.2s.
 */
export function RevealingScene({ onDone, onSkip }: RevealingSceneProps): React.JSX.Element {
  const [lineIndex, setLineIndex] = useState(0);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const lineTimer = window.setInterval(() => {
      setLineIndex((index) => Math.min(index + 1, ui.reveal.suspense.length - 1));
    }, 1000);
    const doneTimer = window.setTimeout(() => doneRef.current(), 3400);
    return () => {
      window.clearInterval(lineTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  return (
    <NauticalBackground tone="deep" withSea={false}>
      <main
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center"
        data-scene="revealing"
        aria-live="polite"
      >
        <Compass
          className="animate-sway size-16 text-gold-bright"
          aria-hidden="true"
        />
        <div className="animate-drift pointer-events-none mt-4 w-[min(60vw,14rem)] text-parchment-200/50">
          <ShipSilhouette className="h-auto w-full" />
        </div>
        <div className="mt-6 min-h-20 space-y-2">
          {ui.reveal.suspense.slice(0, lineIndex + 1).map((line) => (
            <p
              key={line}
              className="animate-bubble-in text-[1.05rem] font-extrabold text-parchment-100"
            >
              {line}
            </p>
          ))}
        </div>
        <div className="mt-6">
          <PirateButton variant="ghost" onClick={onSkip} className="text-parchment-100">
            {ui.reveal.skip}
          </PirateButton>
        </div>
      </main>
    </NauticalBackground>
  );
}
