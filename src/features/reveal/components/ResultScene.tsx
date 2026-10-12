'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { ui } from '@/content/ui';
import { getCharacter } from '@/config/characters';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { resultRoute, trackIdFromRoute } from '@/lib/routes';
import { ExpeditionBrand, NauticalBackground } from '@/components/shared/NauticalBackground';
import { TrackEmblem } from '@/components/characters/TrackEmblem';
import { ResultCard, type ResultCardHandle } from '@/features/reveal/components/ResultCard';
import { ResultActions, useResultExport } from '@/features/reveal/components/ResultActions';
import { CreateTeamCta } from '@/features/reveal/components/CreateTeamCta';
import { TRACK_CONTENT } from '@/content/tracks';

export interface ResultSceneProps {
  /** The track id from the route. */
  trackId: string;
}

/**
 * The chosen persona's card.
 *
 * The card is the deliverable: username plus the chosen track, downloadable and
 * shareable. Everything above it explains how that track was reached.
 */
export function ResultScene({ trackId }: ResultSceneProps): React.JSX.Element {
  const router = useRouter();
  const { state, isHydrated, enterPhase, clearSession } = useQuiz();
  const cardRef = useRef<ResultCardHandle>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announced = useRef(false);
  // Latches the entry check below so it runs once per mount, not on every
  // state change.
  const checkedEntry = useRef(false);
  const correctedRoute = useRef(false);

  const selected = state.selectedTrackId;
  const character = selected !== null ? getCharacter(selected) : null;
  const match = state.ranking?.find((entry) => entry.trackId === selected) ?? null;
  const copy = selected !== null ? TRACK_CONTENT[selected] : null;

  const { shareState, share, exportPng } = useResultExport(
    cardRef,
    character ?? getCharacter('software-engineering'),
    state.username,
  );

  useEffect(() => {
    if (character !== null) headingRef.current?.focus();
  }, [character]);

  // Hydration has to finish, and the visitor must actually have picked a track.
  // A deep link to /result/:id is not enough — it would let anyone mint a card
  // for a persona they never scored.
  useEffect(() => {
    if (!isHydrated) return;
    enterPhase('result');
  }, [isHydrated, enterPhase]);

  //
  // Latched with a ref on purpose: this is an entry check, not a standing
  // invariant. Without the latch, pressing "start over" nulls
  // `selectedTrackId`, which re-triggers this effect and redirects to `/quiz`
  // while the real navigation to `/` is still in flight.
  useEffect(() => {
    if (!isHydrated || checkedEntry.current) return;
    checkedEntry.current = true;
    if (state.selectedTrackId === null) {
      router.replace('/quiz');
      return;
    }
    announced.current = true;
    document.title = `${getCharacter(state.selectedTrackId).titleAr} · ${ui.card.eyebrow}`;
  }, [isHydrated, state.selectedTrackId, router]);

  // The route segment and the stored selection must agree. If a visitor edits
  // the URL by hand, trust the stored selection, never the URL — otherwise a
  // crafted link could mint a card for a persona the visitor never scored.
  useEffect(() => {
    if (selected === null || correctedRoute.current) return;
    const routeTrack = trackIdFromRoute(trackId);
    if (routeTrack === null || routeTrack !== selected) {
      correctedRoute.current = true;
      router.replace(resultRoute(selected));
    }
  }, [selected, trackId, router]);

  if (!isHydrated || character === null || copy === null) {
    return (
      <NauticalBackground>
        <main className="grid min-h-[100dvh] place-items-center" aria-busy="true">
          <span className="sr-only">{ui.errors.missingResult}</span>
        </main>
      </NauticalBackground>
    );
  }

  const secondary = getCharacter(copy.secondaryTrackId);

  // The create-team bar is fixed to the viewport, so the page has to reserve
  // its height or it would sit on top of the last button in the stack.
  const bottomInset = isSupabaseConfigured
    ? 'pb-[8.5rem] sm:pb-[7.5rem]'
    : 'pb-[max(2rem,env(safe-area-inset-bottom))]';

  return (
    <NauticalBackground scene="deck">
      <main
        className={`mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] ${bottomInset} sm:px-6`}
        data-scene="result"
      >
        <header className="flex items-center justify-between gap-3">
          <ExpeditionBrand />
          {match ? (
            <p
              dir="ltr"
              data-testid="result-rank"
              className="rounded-sm border border-accent-gold/40 bg-background/75 px-3 py-1 text-sm font-bold text-text-primary"
            >
              #{match.rank} · {ui.matches.scoreLabel(match.score)}
            </p>
          ) : null}
        </header>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div className="order-2 space-y-5 lg:order-1" data-testid="result-details">
            <div>
              <p className="text-sm font-bold text-text-secondary">{copy.eyebrow}</p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mt-1 font-display text-3xl font-black leading-snug outline-none sm:text-4xl"
                style={{ color: character.palette.vivid }}
              >
                {copy.personaTitleAr}
              </h1>
              <p className="mt-2 text-xl font-bold text-text-primary">{copy.trackSubtitleAr}</p>
              <p dir="ltr" className="mt-1 font-brand text-sm text-text-secondary">
                {character.trackName}
              </p>
              <p className="mt-4 text-lg leading-relaxed text-text-primary">{copy.taglineAr}</p>
            </div>
            <section className="navy-panel p-4 sm:p-5">
              <h2 className="flex items-center gap-3 text-lg font-extrabold text-accent-gold">
                <TrackEmblem
                  emblem={character.emblem}
                  color={character.palette.vivid}
                  appearance="ornate"
                  className="size-10"
                />
                {copy.strengthTitleAr}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-text-primary">{copy.strengthAr}</p>
            </section>
            <section className="navy-panel p-4 sm:p-5">
              <h2 className="text-lg font-extrabold text-accent-gold">{copy.traitsTitleAr}</h2>
              <ul className="mt-3 space-y-3">
                {copy.traits.map((trait) => (
                  <li
                    key={trait}
                    className="flex items-start gap-3 text-base leading-relaxed text-text-primary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rotate-45"
                      style={{ backgroundColor: character.palette.vivid }}
                    />
                    {trait}
                  </li>
                ))}
              </ul>
            </section>
            <section className="navy-panel p-4 sm:p-5">
              <h2 className="text-base font-bold text-text-secondary">{copy.secondaryEyebrowAr}</h2>
              <p
                className="mt-3 flex items-center gap-3 text-xl font-extrabold"
                style={{ color: secondary.palette.vivid }}
              >
                <TrackEmblem
                  emblem={secondary.emblem}
                  color={secondary.palette.vivid}
                  appearance="ornate"
                  className="size-10"
                />
                {secondary.trackNameAr}
              </p>
              <p className="mt-3 text-base leading-relaxed text-text-primary">
                {copy.secondaryDescriptionAr}
              </p>
            </section>
            <p className="text-base leading-relaxed text-text-secondary">
              {character.discoveryNoteAr}
            </p>
          </div>
          <div className="order-1 mx-auto w-full max-w-[27rem] lg:order-2">
            <ResultCard
              ref={cardRef}
              character={character}
              username={state.username}
              match={match}
            />
            <ResultActions
              shareState={shareState}
              onShare={() => void share()}
              onExport={() => void exportPng()}
              onBackToMatches={() => router.push('/matches')}
              onTracks={() => router.push('/tracks')}
              onRestart={() => {
                clearSession();
                router.push('/');
              }}
            />
          </div>
        </div>
      </main>
      {/* Pinned above the fold, so reaching teams never costs a scroll past the
          traits list. It carries its own bottom padding — see the note there. */}
      <CreateTeamCta />
    </NauticalBackground>
  );
}
