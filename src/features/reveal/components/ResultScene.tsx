'use client';

import { useEffect, useRef, useState } from 'react';

import { ui } from '@/content/ui';
import { getCharacter } from '@/config/characters';
import type { ExpeditionResult } from '@/features/conversation/types';
import { useExpedition } from '@/features/expedition/state/ExpeditionProvider';
import { CharacterBadge, CharacterPortrait } from '@/components/characters/CharacterPortrait';
import { CharacterGallery } from '@/features/characters/components/CharacterGallery';
import { ResultCard, type ResultCardHandle } from '@/features/reveal/components/ResultCard';
import { SecondaryAffinity } from '@/features/reveal/components/SecondaryAffinity';
import { ResultActions, useResultExport } from '@/features/reveal/components/ResultActions';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { ParchmentPanel } from '@/components/shared/ParchmentPanel';

export interface ResultSceneProps {
  result: ExpeditionResult;
}

export function ResultScene({ result }: ResultSceneProps): React.JSX.Element {
  const { state, previewTrack } = useExpedition();
  const character = getCharacter(result.trackId);
  const [introDone, setIntroDone] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const cardRef = useRef<ResultCardHandle>(null);
  const { shareState, share, exportPng } = useResultExport(cardRef, character);

  // Timed silhouette → portrait entrance. The timer is the effect; no
  // synchronous setState, and switching tracks restarts via the key below.
  useEffect(() => {
    const id = window.setTimeout(() => setIntroDone(true), 2100);
    return () => window.clearTimeout(id);
  }, [result.trackId]);

  return (
    <NauticalBackground withCompass>
      <main
        className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2.75rem,env(safe-area-inset-bottom))]"
        data-scene="result"
      >
        <p
          dir="ltr"
          aria-hidden={introDone}
          className="mt-2 text-center text-[0.72rem] font-bold tracking-[0.3em] text-ink-soft uppercase"
        >
          {ui.reveal.chosen}
        </p>

        <div className="relative mt-1 flex w-full flex-col items-center">
          {!introDone ? (
            <div className="grid h-56 w-44 place-items-center" aria-hidden="true">
              <span className="animate-sway inline-block h-52 w-40 rounded-t-full bg-ink/85 blur-[1px]" />
            </div>
          ) : (
            <CharacterPortrait
              character={character}
              priority
              className="animate-bubble-in h-60 w-48"
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-6 bottom-0 -z-10 rounded-full blur-2xl"
            style={{ backgroundColor: character.palette.wash }}
          />
        </div>

        <p
          dir="ltr"
          className="mt-3 text-center text-[0.72rem] font-bold tracking-[0.3em] text-ink-faint uppercase"
        >
          {ui.reveal.resultHeading}
        </p>
        <h1
          dir="ltr"
          className="mt-1 text-center font-display text-[clamp(1.9rem,9vw,2.7rem)] leading-none text-ink"
        >
          {character.title}
        </h1>
        <p
          className="mt-1 text-center text-lg font-extrabold"
          style={{ color: character.palette.deep }}
        >
          {character.titleAr} · <span dir="ltr">{character.trackName}</span>
        </p>
        <div className="mt-2 flex justify-center">
          <CharacterBadge character={character} />
        </div>
        <p className="mt-3 max-w-md text-center text-[0.95rem] leading-relaxed font-semibold">
          {character.personalityAr}
        </p>
        {result.origin === 'demo' ? (
          <p className="mt-3 rounded-md border border-dashed border-gold/70 bg-parchment-100/70 px-3 py-2 text-center text-[0.78rem] font-bold text-ink-soft">
            {ui.reveal.demoBanner}
          </p>
        ) : null}
        <div className="mt-5 w-full">
          <ResultCard ref={cardRef} character={character} nickname={state.nickname} origin={result.origin} />
        </div>
        <ParchmentPanel className="mt-4 w-full p-4" torn>
          <h2 className="text-[0.95rem] font-extrabold">{ui.reveal.whyHeading}</h2>
          {result.explanation ? (
            <p className="mt-1.5 text-[0.9rem] leading-relaxed" dir="auto">{result.explanation}</p>
          ) : (
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-soft">
              <span className="mb-1 block text-[0.7rem] font-bold tracking-wide text-ink-faint uppercase">
                {ui.reveal.sampleExplanationLabel}
              </span>
              {character.personalityAr}
            </p>
          )}
          {result.secondaryTrackId ? (
            <div className="mt-3"><SecondaryAffinity trackId={result.secondaryTrackId} /></div>
          ) : null}
          <p className="mt-3 text-[0.85rem] font-bold text-ink-soft">{character.discoveryNoteAr}</p>
        </ParchmentPanel>
        <ResultActions
          shareState={shareState}
          onShare={() => void share()}
          onExport={() => void exportPng()}
          onGallery={() => setGalleryOpen(true)}
        />
        {galleryOpen ? (
          <CharacterGallery
            activeId={character.id}
            onSelect={(track) => { previewTrack(track); setGalleryOpen(false); }}
            onClose={() => setGalleryOpen(false)}
          />
        ) : null}
      </main>
    </NauticalBackground>
  );
}

