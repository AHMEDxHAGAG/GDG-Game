'use client';

import { useEffect } from 'react';
import { toPng } from 'html-to-image';

import { ui } from '@/content/ui';
import { site } from '@/config/site';
import type { CharacterDefinition } from '@/features/characters/types';
import { CharacterPortrait } from '@/components/characters/CharacterPortrait';
import { TrackEmblem } from '@/components/characters/TrackEmblem';
import { ExpeditionBrand } from '@/components/shared/NauticalBackground';
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type Ref,
} from 'react';

export interface ResultCardHandle {
  exportPng: () => Promise<Blob | null>;
}

export interface ResultCardProps {
  character: CharacterDefinition;
  nickname: string | null;
  origin: 'engine' | 'demo';
}

/**
 * Shareable pirate identity card (screenshot / story / PNG friendly).
 *
 * Fixed 3:4-ish layout (1080x1350 export), real text (no baked assets),
 * bidi-safe: Arabic copy uses dir="rtl", English titles keep dir="ltr".
 * Export waits for fonts so Arabic shaping survives html-to-image.
 */
function ResultCardInner(
  { character, nickname, origin }: ResultCardProps,
  ref: Ref<ResultCardHandle>,
): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    exportPng: async () => {
      const node = cardRef.current;
      if (!node) return null;
      try {
        await document.fonts.ready;
      } catch {
        /* fonts are best-effort; export anyway */
      }
      // Export at the card's own size — the node is responsive (max 420px
      // wide) and html-to-image captures it 1:1, so sizing here only sets the
      // output scale, never the layout.
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        style: { transform: 'none', margin: '0' },
      });
      const response = await fetch(dataUrl);
      return response.blob();
    },
  }));

  useEffect(() => {
    try {
      void document.fonts.ready;
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="w-full overflow-x-auto">
      <div
        ref={cardRef}
        dir="rtl"
        role="img"
        aria-label={`${character.titleAr} — ${character.trackName}`}
        className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-lg border-4 bg-parchment-100"
        style={{ borderColor: character.palette.deep }}
      >
        <div className="surface-parchment absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-x-0 top-0 h-24 opacity-80"
          aria-hidden="true"
          style={{
            background: `linear-gradient(180deg, ${character.palette.wash}, transparent)`,
          }}
        />
        <div className="relative flex h-full flex-col items-center px-8 pt-8 pb-6 text-center">
          <ExpeditionBrand compact tone="dark" />
          <p dir="ltr" className="mt-3 text-xs font-bold tracking-[0.3em] text-ink-faint uppercase">
            {ui.reveal.resultHeading}
          </p>
          <CharacterPortrait character={character} className="mt-2 h-72 w-56" />
          <p dir="ltr" className="mt-2 font-display text-5xl leading-none text-ink">
            {character.title}
          </p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: character.palette.deep }}>
            {character.titleAr}
          </p>
          <p dir="ltr" className="text-lg font-extrabold tracking-wide text-ink">
            {character.trackName}
          </p>
          <p className="mt-2 max-w-[46ch] text-[0.95rem] leading-relaxed font-semibold text-ink-soft">
            {character.personalityAr}
          </p>
          {nickname ? (
            <p className="mt-2 text-sm font-bold text-ink-soft">
              {ui.chat.you} · <span dir="auto">{nickname}</span>
            </p>
          ) : null}
          <div className="mt-auto flex w-full items-center justify-between border-t-2 pt-3 text-[0.72rem] font-bold text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <TrackEmblem emblem={character.emblem} color={character.palette.deep} className="size-5" />
              <span dir="ltr">
                {site.organization} · {site.campus}
              </span>
            </span>
            {origin === 'demo' ? <span>{ui.reveal.demoBanner}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ResultCard = forwardRef(ResultCardInner);
ResultCard.displayName = 'ResultCard';
