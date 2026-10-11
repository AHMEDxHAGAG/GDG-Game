'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { ui } from '@/content/ui';
import { getCharacter } from '@/config/characters';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { resultRoute, trackIdFromRoute } from '@/lib/routes';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { CharacterArtwork } from '@/components/characters/CharacterArtwork';
import { TrackEmblem } from '@/components/characters/TrackEmblem';
import { ResultCard, type ResultCardHandle } from '@/features/reveal/components/ResultCard';
import { ResultActions, useResultExport } from '@/features/reveal/components/ResultActions';
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

  return (
    <NauticalBackground withLantern>
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[46rem] flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6"
        data-scene="result"
      >
        <header className="flex items-center justify-between gap-3">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="sr-only"
          >
            {copy.eyebrow} {copy.personaTitleAr}
          </h1>
          <p className="text-[0.8rem] font-bold text-text-secondary">{ui.card.eyebrow}</p>
          {match ? (
            <p
              dir="ltr"
              data-testid="result-rank"
              className="rounded-full border border-surface-border px-2.5 py-0.5 text-[0.72rem] font-bold text-text-primary"
            >
              #{match.rank} · {ui.matches.scoreLabel(match.score)}
            </p>
          ) : null}
        </header>

        {/* Quick summary above the card — the card itself stays clean so the
            exported PNG reads well. */}
        <div className="mt-3 flex items-center gap-3">
          <span className="h-20 w-14 shrink-0">
            <CharacterArtwork character={character} className="h-full w-full" priority />
          </span>
          <div className="min-w-0">
            <p
              className="text-[0.75rem] font-bold text-text-secondary"
              style={{ color: character.palette.vivid }}
            >
              {copy.personaTitleAr}
            </p>
            <p className="text-lg leading-tight font-extrabold text-text-primary">
              {copy.trackSubtitleAr}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5">
              <TrackEmblem
                emblem={character.emblem}
                color={character.palette.vivid}
                className="size-3.5 shrink-0"
              />
              <span dir="ltr" className="text-[0.75rem] text-text-secondary">
                {character.trackName}
              </span>
            </p>
          </div>
        </div>

        <p className="mt-3 text-[0.85rem] leading-relaxed text-text-secondary">
          {copy.taglineAr}
        </p>

        <div className="mt-4 w-full">
          <ResultCard
            ref={cardRef}
            character={character}
            username={state.username}
            match={match}
          />
        </div>

        <p className="mt-3 text-center text-[0.8rem] leading-relaxed text-text-secondary">
          {character.discoveryNoteAr}
        </p>

        <ResultActions
          shareState={shareState}
          onShare={() => void share()}
          onExport={() => void exportPng()}
          onBackToMatches={() => router.push('/matches')}
          onTracks={() => router.push('/tracks')}
          onRestart={() => {
            // clearSession wipes storage too; a plain `restart()` would leave a
            // stale run behind and the next visitor would inherit it.
            clearSession();
            router.push('/');
          }}
        />
      </main>
    </NauticalBackground>
  );
}
