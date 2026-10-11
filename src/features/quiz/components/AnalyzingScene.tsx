'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { UI_ASSETS } from '@/config/ui-assets';
import { ui } from '@/content/ui';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { ParchmentPanel } from '@/components/shared/ParchmentPanel';

/**
 * How long the beat stays up.
 *
 * Scoring is synchronous and finishes in microseconds, so routing straight to
 * `/matches` would flash the destination and read as a glitch. A short, fixed
 * minimum gives the screen a reason to exist; it is a presentation delay, not
 * a fake request, and nothing is shown as pending work that is not happening.
 */
const MINIMUM_DWELL_MS = 900;

/**
 * The scoring beat.
 *
 * The progress bar is deliberately **indeterminate** — no `aria-valuenow`, no
 * numeric percentage. The spec forbids animating a fabricated number, and since
 * the real work is a local function call there is no real progress to report.
 */
export function AnalyzingScene(): React.JSX.Element {
  const router = useRouter();
  const { state, isHydrated, enterPhase, submit } = useQuiz();
  const stayed = useRef(false);

  useEffect(() => {
    if (!isHydrated) return;
    enterPhase('analyzing');
  }, [isHydrated, enterPhase]);

  useEffect(() => {
    if (!isHydrated) return;

    // No scorable answers: the visitor arrived here directly. Send them home
    // rather than spinning forever.
    if (Object.keys(state.answers).length === 0) {
      router.replace('/quiz');
      return;
    }

    // `stayed` guards React's dev-mode double-effect, which would otherwise
    // restart the timer and hold the screen open twice as long. It is checked
    // after the guard above on purpose: once the timer is armed, the effect
    // must not be allowed to cancel it on a later state change.
    if (stayed.current) return;
    stayed.current = true;

    const id = window.setTimeout(() => {
      submit();
      router.replace('/matches');
    }, MINIMUM_DWELL_MS);

    return () => window.clearTimeout(id);
  }, [isHydrated, state.answers, submit, router]);

  return (
    <NauticalBackground scene="voyage">
      <main
        className="relative mx-auto flex min-h-[100dvh] w-full max-w-[36.75rem] flex-col justify-center px-5"
        data-scene="analyzing"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">{ui.analyzing.statusLabel}</span>

        <div aria-hidden="true" className="flex justify-center pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative local ship */}
          <img src={UI_ASSETS.brigantine.src} alt="" width={UI_ASSETS.brigantine.width} height={UI_ASSETS.brigantine.height} className="animate-ship-drift h-40 w-auto sm:h-52" />
        </div>

        <ParchmentPanel artwork="scroll" className="relative animate-rise-in p-4 text-center sm:p-6">
          <p className="text-ink-soft text-[0.8rem] font-bold tracking-wide uppercase">
            {ui.brand.organization}
          </p>

          <h1
            className="mt-2 text-ink"
            style={{ fontSize: 'clamp(1.25rem, 5.5vw, 1.5rem)', lineHeight: 1.3 }}
          >
            {ui.analyzing.headline}
          </h1>

          <div
            role="progressbar"
            aria-label={ui.analyzing.statusLabel}
            className="mx-auto mt-5 h-3.5 w-[85%] overflow-hidden rounded-full border-2 border-parchment-600/60 bg-parchment-100"
          >
            <span className="animate-progress-shimmer block h-full w-1/3 rounded-full bg-sea-blue" />
          </div>

          <p className="mt-4 leading-relaxed text-ink-soft" style={{ fontSize: 'clamp(0.875rem, 3.6vw, 1rem)' }}>
            {ui.analyzing.description}
          </p>
          <p className="mt-3 text-[0.78rem] font-bold text-ink-faint">
            {ui.analyzing.footnote}
          </p>
        </ParchmentPanel>
      </main>
    </NauticalBackground>
  );
}
