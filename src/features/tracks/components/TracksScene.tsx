'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PirateButton } from '@/components/shared/PirateButton';
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
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const scrollToCard = (index: number) => {
    const item = listRef.current?.children[index];
    item?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  };
  const updateActive = () => {
    const list = listRef.current;
    if (!list) return;
    const bounds = list.getBoundingClientRect();
    const centre = (bounds.left + bounds.right) / 2;
    let nearest = 0;
    let distance = Infinity;
    Array.from(list.children).forEach((item, index) => {
      const box = item.getBoundingClientRect();
      const delta = Math.abs((box.left + box.right) / 2 - centre);
      if (delta < distance) {
        nearest = index;
        distance = delta;
      }
    });
    setActive(nearest);
  };
  const { state, isHydrated, enterPhase, chooseTrack } = useQuiz();
  const hasRanking = isHydrated && state.ranking !== null;
  // `/result` has no page of its own — the back link has to name the track the
  // visitor actually chose, so it lands on the card they already earned.
  const backHref = state.selectedTrackId ? resultRoute(state.selectedTrackId) : '/';

  useEffect(() => {
    if (isHydrated) enterPhase('matches');
  }, [isHydrated, enterPhase]);

  return (
    <NauticalBackground scene="gallery">
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[74rem] flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6"
        data-scene="tracks"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-64">
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
          ref={listRef}
          onScroll={updateActive}
          aria-label={ui.gallery.subtitle}
          className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5"
        >
          {CHARACTER_LIST.map((character) => (
            <li key={character.id} className="w-[70vw] max-w-[15rem] shrink-0 snap-start sm:w-auto">
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

        <div className="mt-4 flex flex-col items-center gap-2 sm:hidden">
          <p className="text-sm text-text-secondary">{ui.gallery.swipeHint}</p>
          <div className="flex items-center gap-[12px]">
            <PirateButton
              variant="secondary"
              aria-label={ui.gallery.previous}
              disabled={active === 0}
              onClick={() => scrollToCard(active - 1)}
            >
              <ArrowRight className="size-[16px]" aria-hidden="true" />
            </PirateButton>
            <span role="status" className="min-w-[48px] text-center text-sm text-accent-gold">
              {ui.gallery.position(active)}
            </span>
            <PirateButton
              variant="secondary"
              aria-label={ui.gallery.next}
              disabled={active === 4}
              onClick={() => scrollToCard(active + 1)}
            >
              <ArrowLeft className="size-[16px]" aria-hidden="true" />
            </PirateButton>
          </div>
        </div>

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
        style={{
          backgroundImage: `linear-gradient(180deg, ${character.palette.vivid}66 0%, transparent 100%)`,
        }}
      />
      <span className="relative mx-auto mt-3 block h-[68%] w-full">
        <CharacterArtwork character={character} className="h-full w-full" />
      </span>
      <span
        className="absolute inset-x-0 bottom-0 block px-2 pt-10 pb-3"
        style={{ backgroundImage: 'linear-gradient(180deg, transparent 0%, #090B17 55%)' }}
      >
        <TrackEmblem
          emblem={character.emblem}
          color={character.palette.vivid}
          appearance="ornate"
          className="mx-auto size-9"
        />
        <span
          className="mt-1 block text-center text-[1rem] leading-tight font-extrabold"
          style={{ color: character.palette.vivid }}
        >
          {character.trackNameAr}
        </span>
        <span dir="ltr" className="mt-0.5 block text-center text-sm text-text-secondary">
          {character.trackName}
        </span>
      </span>
    </>
  );

  const shell =
    'collectible-card relative block aspect-[0.62] w-full rounded-lg text-start transition-transform duration-150';
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
