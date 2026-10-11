'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { Anchor, Compass, Globe, RotateCcw, SkipForward } from 'lucide-react';

import { ui } from '@/content/ui';
import { CHARACTER_LIST } from '@/config/characters';
import { MAX_USERNAME_LENGTH } from '@/config/site';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { resultRoute } from '@/lib/routes';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';
import { CharacterArtwork } from '@/components/characters/CharacterArtwork';

/**
 * Landing screen.
 *
 * Composition follows `assests/UI/LandingPage.png`: a dark ship scene, a
 * two-line gold Arabic title, a panoramic five-character stage across the lower
 * half with the web-development captain centred, and a red CTA beneath.
 *
 * The character stage is `aria-hidden` — it is atmosphere. The five personas
 * are described once, in the image alt text below, and again on `/tracks`.
 */
export function LandingScene(): React.JSX.Element {
  const router = useRouter();
  const { state, isHydrated, canResume, enterPhase, setUsername, start, resume, restart, clearSession } =
    useQuiz();
  const [erased, setErased] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (isHydrated) enterPhase('landing');
  }, [isHydrated, enterPhase]);

  /**
   * Each route mounts its own provider, so a state change is not a navigation:
   * every transition from here has to push explicitly, or the visitor would
   * sit on the landing screen with a started quiz behind it.
   */
  const handleStart = () => {
    start();
    router.push('/quiz');
  };

  /** Mirrors the reducer's `quiz/resume` destination. */
  const handleResume = () => {
    resume();
    if (state.selectedTrackId !== null) {
      router.push(resultRoute(state.selectedTrackId));
    } else if (state.ranking !== null) {
      router.push('/matches');
    } else {
      router.push('/quiz');
    }
  };

  const handleRestart = () => {
    restart();
    router.push('/quiz');
  };

  /** Wipes the stored run *and* the storage, not just the in-memory state. */
  const handleErase = () => {
    clearSession();
    setErased(true);
    window.setTimeout(() => setErased(false), 2500);
  };

  if (!isHydrated) {
    return (
      <NauticalBackground>
        <main
          className="grid min-h-[100dvh] place-items-center px-5"
          data-scene="landing"
          aria-busy="true"
        >
          <p className="animate-rise-in text-lg font-extrabold text-text-secondary">
            {ui.quiz.counter(1, 10)}
          </p>
        </main>
      </NauticalBackground>
    );
  }

  return (
    <NauticalBackground withCompass>
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
          <span dir="ltr" className="flex items-center gap-2">
            <span className="font-brand text-lg font-bold tracking-tight text-text-primary">
              {ui.brand.organization}
            </span>
            <span className="font-brand text-[0.6rem] font-medium tracking-[0.2em] text-text-secondary">
              {ui.brand.campus}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
            <Globe className="size-3.5" aria-hidden="true" />
            <span dir="ltr">{ui.locale.code}</span>
          </span>
        </header>

        <main
          className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col items-center px-5 pt-6 sm:px-6"
          data-scene="landing"
        >
          <h1
            className="animate-rise-in text-center text-shadow-pixel font-display font-black leading-[1.25] text-accent-gold [animation-delay:80ms]"
            style={{ fontSize: 'clamp(2.125rem, 10vw, 3.25rem)' }}
          >
            <span className="block">{ui.landing.headlineLines[0]}</span>
            <span className="block">{ui.landing.headlineLines[1]}</span>
          </h1>

          <p
            className="animate-rise-in mt-3 text-center font-bold text-text-primary [animation-delay:140ms]"
            style={{ fontSize: 'clamp(1.05rem, 4vw, 1.375rem)' }}
          >
            {ui.landing.subheadline}
          </p>
          <p className="animate-rise-in mt-1.5 max-w-[46ch] text-center leading-relaxed text-text-secondary [animation-delay:180ms]">
            {ui.landing.description}
          </p>

          {/* Panoramic stage. Web Development is the centred hero per the
              spec, so it is rendered last and sits on top. */}
          <div
            aria-hidden="true"
            className="animate-rise-in mt-auto w-full [animation-delay:220ms] pt-4"
          >
            <ul className="flex items-end justify-center gap-1 sm:gap-3">
              {[4, 3, 2, 1, 0].map((index, position) => {
                const character = CHARACTER_LIST[index]!;
                const isHero = position === 2;
                return (
                  <li
                    key={character.id}
                    className={
                      isHero
                        ? 'animate-float-idle relative z-10 w-[26%] max-w-[11rem]'
                        : 'relative w-[17%] max-w-[7rem]'
                    }
                  >
                    <CharacterArtwork
                      character={character}
                      priority={isHero}
                      className="h-auto w-full"
                    />
                  </li>
                );
              })}
            </ul>
            <p className="sr-only">{ui.landing.charactersLabel}</p>
          </div>

          <div className="animate-rise-in mt-5 w-full max-w-sm [animation-delay:280ms]">
            <label
              htmlFor={inputId}
              className="mb-1.5 flex items-baseline justify-between gap-2 text-[0.9rem] font-bold text-text-primary"
            >
              <span>{ui.username.label}</span>
              <span className="text-[0.7rem] font-semibold text-text-secondary">
                {ui.username.optional}
              </span>
            </label>

            <div className="flex gap-2">
              <input
                id={inputId}
                value={state.username ?? ''}
                onChange={(event) =>
                  setUsername(event.target.value.slice(0, MAX_USERNAME_LENGTH))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleStart();
                  }
                }}
                maxLength={MAX_USERNAME_LENGTH}
                placeholder={ui.username.placeholder}
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                enterKeyHint="go"
                dir="auto"
                className="min-w-0 flex-1 rounded-md border-2 border-surface-border bg-surface/85 px-3 py-2.5 text-[1rem] font-semibold text-text-primary placeholder:font-normal placeholder:text-text-secondary/70 focus:border-accent-gold"
              />
              <PirateButton
                variant="secondary"
                onClick={() => {
                  setUsername(null);
                  handleStart();
                }}
                icon={<SkipForward className="size-4" />}
                title={ui.username.skip}
              >
                <span className="hidden sm:inline">{ui.username.skip}</span>
                <span className="sr-only sm:hidden">{ui.username.skip}</span>
              </PirateButton>
            </div>
            <p className="mt-1.5 text-[0.72rem] text-text-secondary">{ui.username.hint}</p>
          </div>

          <div className="animate-rise-in mt-5 w-full max-w-sm [animation-delay:340ms]">
            <PirateButton
              fullWidth
              onClick={handleStart}
              icon={<Anchor className="size-4" />}
              className="min-h-[3.625rem] text-[1.125rem]"
            >
              {ui.landing.primaryCta}
            </PirateButton>

            {canResume ? (
              <ResumeOffer onResume={handleResume} onRestart={handleRestart} />
            ) : null}

            <Link
              href="/tracks"
              className="mt-3 flex items-center justify-center gap-1.5 text-[0.85rem] font-bold text-text-secondary underline decoration-accent-gold decoration-2 underline-offset-4 hover:text-text-primary"
            >
              <Compass className="size-4" aria-hidden="true" />
              {ui.landing.secondaryCta}
            </Link>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Link
            href="/present"
            className="text-[0.72rem] text-text-secondary/80 underline decoration-dotted underline-offset-4 hover:text-text-primary"
          >
            {ui.landing.presentLink}
          </Link>
          {/* Clearing a shared or demo device is the only way out of a stored
              run, so it has to be reachable without finishing the quiz. */}
          {canResume ? (
            <button
              type="button"
              onClick={handleErase}
              data-testid="landing-erase"
              className="text-[0.72rem] text-text-secondary/80 underline decoration-dotted underline-offset-4 hover:text-text-primary"
            >
              {erased ? ui.footer.resetDone : ui.footer.reset}
            </button>
          ) : null}
        </footer>
      </div>
    </NauticalBackground>
  );
}

function ResumeOffer({
  onResume,
  onRestart,
}: {
  onResume: () => void;
  onRestart: () => void;
}): React.JSX.Element {
  const { state } = useQuiz();
  const answered = Object.keys(state.answers).length;

  return (
    <div className="mt-3 rounded-md border-2 border-dashed border-accent-gold/60 bg-surface/70 p-3 text-center">
      <p className="text-[0.95rem] font-extrabold text-text-primary">{ui.resume.title}</p>
      <p className="mt-1 text-[0.82rem] text-text-secondary">{ui.resume.body}</p>
      {answered > 0 ? (
        <p className="mt-1 text-[0.78rem] font-bold text-accent-gold">
          {ui.resume.progress(answered)}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <PirateButton fullWidth onClick={onResume} icon={<Compass className="size-4" />}>
          {ui.resume.continue}
        </PirateButton>
        <PirateButton
          fullWidth
          variant="secondary"
          onClick={onRestart}
          icon={<RotateCcw className="size-4" />}
        >
          {ui.resume.restart}
        </PirateButton>
      </div>
    </div>
  );
}
