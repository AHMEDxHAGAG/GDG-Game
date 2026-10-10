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
        className="@container relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-lg border-4 bg-parchment-100"
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
        <div className="relative flex h-full flex-col items-center px-5 pt-5 pb-4 text-center @min-[23rem]:px-8 @min-[23rem]:pt-8 @min-[23rem]:pb-6">
          <ExpeditionBrand compact tone="dark" />
          <p
            dir="ltr"
            className="mt-2 text-[0.6rem] font-bold tracking-[0.3em] text-ink-faint uppercase @min-[23rem]:mt-3 @min-[23rem]:text-xs"
          >
            {ui.reveal.resultHeading}
          </p>
          {/* Portrait box is sized in container units rather than percentages:
              a viewBox SVG resolves `height:100%` against an indefinite
              parent as auto, which made it grow to width × 1.3 and paint over
              the text below. A definite box lets preserveAspectRatio
              letterbox it instead, at every card width. */}
          <div className="mt-2 flex w-full justify-center">
            <CharacterPortrait
              character={character}
              className="h-[36cqw] w-[30cqw] max-w-[11rem]"
            />
          </div>
          <p
            dir="ltr"
            className="mt-3 font-display text-3xl leading-none text-ink @min-[23rem]:text-5xl"
          >
            {character.title}
          </p>
          <p
            className="mt-1 text-lg font-extrabold @min-[23rem]:text-2xl"
            style={{ color: character.palette.deep }}
          >
            {character.titleAr}
          </p>
          <p
            dir="ltr"
            className="text-sm font-extrabold tracking-wide text-ink @min-[23rem]:text-lg"
          >
            {character.trackName}
          </p>
          <p className="mt-2 max-w-[46ch] text-[0.78rem] leading-snug font-semibold text-ink-soft @min-[23rem]:text-[0.85rem]">
            {character.personalityAr}
          </p>
          {nickname ? (
            <p className="mt-1.5 text-xs font-bold text-ink-soft @min-[23rem]:mt-2 @min-[23rem]:text-sm">
              {ui.chat.you} · <span dir="auto">{nickname}</span>
            </p>
          ) : null}
          <div className="mt-auto w-full border-t-2 pt-2 text-center text-[0.6rem] leading-tight font-bold text-ink-faint @min-[23rem]:pt-3 @min-[23rem]:text-[0.68rem]">
            {/* Short tag rather than the full banner: the sentence wraps to
                four lines at card width. The full explanation stays on the
                result screen behind the card. */}
            {origin === 'demo' ? <p className="mb-1 text-ink-soft">{ui.reveal.demoTag}</p> : null}
            <span className="inline-flex items-center justify-center gap-1.5">
              <TrackEmblem
                emblem={character.emblem}
                color={character.palette.deep}
                className="size-4 shrink-0 @min-[23rem]:size-5"
              />
              <span dir="ltr">{`${site.organization} · ${site.campus}`}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ResultCard = forwardRef(ResultCardInner);
ResultCard.displayName = 'ResultCard';
