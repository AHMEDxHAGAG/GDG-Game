'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ui } from '@/content/ui';
import { CHARACTER_LIST } from '@/config/characters';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { resultRoute } from '@/lib/routes';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { CharacterArtwork } from '@/components/characters/CharacterArtwork';
import { TrackEmblem } from '@/components/characters/TrackEmblem';

/**
 * The five personas as collectible cards.
 *
 * This is a *browse* screen, not a result screen: per the spec, tapping a card
 * must never present a persona as if the visitor had scored it. Rows only
 * become selectable when a scored ranking exists, and then selecting one just
 * sends them back to that track's card.
 */
export function TracksScene(): React.JSX.Element {
  const router = useRouter();
  const { state, isHydrated, enterPhase, chooseTrack } = useQuiz();
  const hasRanking = isHydrated && state.ranking !== null;
  // `/result` has no page of its own — the back link has to name the track the
  // visitor actually chose, so it lands on the card they already earned.
  const backHref = state.selectedTrackId ? resultRoute(state.selectedTrackId) : '/';

  useEffect(() => {
    if (isHydrated) enterPhase('matches');
  }, [isHydrated, enterPhase]);

  return (
    <NauticalBackground>
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[74rem] flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6"
        data-scene="tracks"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1
              className="animate-rise-in text-shadow-pixel font-display font-black text-accent-gold"
              style={{ fontSize: 'clamp(1.5rem, 7vw, 2.25rem)' }}
            >
              {ui.gallery.title}
            </h1>
            <p className="animate-rise-in mt-1.5 max-w-[40ch] text-text-secondary [animation-delay:80ms]">
              {ui.gallery.subtitle}
            </p>
          </div>
          <Link
            href={backHref}
            className="shrink-0 text-[0.8rem] font-bold text-text-secondary underline decoration-accent-gold decoration-2 underline-offset-4 hover:text-text-primary"
          >
            {hasRanking ? ui.gallery.close : ui.errors.backHome}
          </Link>
        </header>

        {/* Horizontal scroll-snap carousel on mobile, five columns from 960px —
            both layouts come straight from the spec's all-tracks page. */}
        <ul
          aria-label={ui.gallery.subtitle}
          className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-5"
        >
          {CHARACTER_LIST.map((character) => (
            <li
              key={character.id}
              className="w-[70vw] max-w-[15rem] shrink-0 snap-center sm:w-auto"
            >
              <TrackCollectibleCard
                character={character}
                selectable={hasRanking}
                onSelect={() => {
                  chooseTrack(character.id);
                  router.push(resultRoute(character.id));
                }}
              />
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-6 text-center text-[0.78rem] text-text-secondary">
          {ui.matches.footnote}
        </p>
      </main>
    </NauticalBackground>
  );
}

function TrackCollectibleCard({
  character,
  selectable,
  onSelect,
}: {
  character: (typeof CHARACTER_LIST)[number];
  selectable: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  const body = (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-2/3 opacity-25"
        style={{ backgroundImage: `linear-gradient(180deg, ${character.palette.vivid}66 0%, transparent 100%)` }}
      />
      <span className="relative mx-auto mt-3 block h-[62%] w-full">
        <CharacterArtwork character={character} className="h-full w-full" />
      </span>
      <span
        className="absolute inset-x-0 bottom-0 block px-2 pt-10 pb-3"
        style={{ backgroundImage: 'linear-gradient(180deg, transparent 0%, #090B17 55%)' }}
      >
        <TrackEmblem
          emblem={character.emblem}
          color={character.palette.vivid}
          className="mx-auto size-5"
        />
        <span
          className="mt-1 block text-center text-[0.85rem] leading-tight font-extrabold"
          style={{ color: character.palette.vivid }}
        >
          {character.trackNameAr}
        </span>
        <span dir="ltr" className="mt-0.5 block text-center text-[0.62rem] text-text-secondary">
          {character.trackName}
        </span>
      </span>
    </>
  );

  const shell =
    'pixel-frame relative block aspect-[0.62] w-full overflow-hidden rounded-lg border-2 bg-surface text-start transition-transform duration-150';
  const border = { borderColor: `${character.palette.vivid}99` };

  if (!selectable) {
    return (
      <div
        className={`${shell} cursor-default`}
        style={border}
        aria-label={`${character.titleAr} — ${character.trackName}`}
      >
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      data-track-id={character.id}
      className={`${shell} cursor-pointer hover:-translate-y-1`}
      style={border}
      aria-label={`${ui.matches.select}: ${character.titleAr} — ${character.trackName}`}
    >
      {body}
    </button>
  );
}
