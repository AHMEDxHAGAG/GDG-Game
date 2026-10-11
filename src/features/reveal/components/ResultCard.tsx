'use client';

import { forwardRef, useImperativeHandle, useRef, type Ref } from 'react';
import { toPng } from 'html-to-image';

import { ui } from '@/content/ui';
import { TRACK_CONTENT } from '@/content/tracks';
import { UI_ASSETS, EMBLEM_ASSETS } from '@/config/ui-assets';
import type { CharacterDefinition } from '@/features/characters/types';
import type { RankedMatch } from '@/features/quiz/scoring/scoreAnswers';

export interface ResultCardHandle {
  exportPng: () => Promise<Blob | null>;
}

export interface ResultCardProps {
  character: CharacterDefinition;
  /** Printed on the card. Null when the visitor skipped it. */
  username: string | null;
  /** The visitor's chosen match, when one is known. */
  match: RankedMatch | null;
}

/**
 * Export geometry from the spec's `share_card.suggested_export_size_px`.
 *
 * `canvasWidth`/`canvasHeight` size the bitmap and `pixelRatio` multiplies it
 * again, so the ratio must stay at 1 to land on exactly 1080×1350. The SVG
 * source is emitted at the card's natural layout size and scaled up
 * vectorially, which keeps text and line art crisp at 3× without a 3240px
 * canvas.
 */
const EXPORT_WIDTH_PX = 1080;
const EXPORT_HEIGHT_PX = 1350;
const EXPORT_PIXEL_RATIO = 1;

/** A fixed 4:5 identity poster; full result explanations live on the page. */
function ResultCardInner(
  { character, username, match }: ResultCardProps,
  ref: Ref<ResultCardHandle>,
): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const copy = TRACK_CONTENT[character.id];
  const emblem = UI_ASSETS[`${EMBLEM_ASSETS[character.emblem]}-ornate`];
  const accent = character.palette.vivid;

  useImperativeHandle(ref, () => ({
    exportPng: async () => {
      const node = cardRef.current;
      if (!node) return null;

      // Fonts first: an unfired Cairo/Tajawal swap would bake fallback glyphs.
      try {
        await document.fonts.ready;
      } catch {
        /* fonts are best-effort; export anyway */
      }

      // Then images: html-to-image inlines them, and one still decoding yields
      // a transparent hole instead of the character.
      try {
        await Promise.all(Array.from(node.querySelectorAll('img'), (img) => img.decode()));
      } catch {
        /* best-effort */
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: EXPORT_PIXEL_RATIO,
        canvasWidth: EXPORT_WIDTH_PX,
        canvasHeight: EXPORT_HEIGHT_PX,
        style: { transform: 'none', margin: '0' },
      });
      const response = await fetch(dataUrl);
      return response.blob();
    },
  }));

  return (
    <div className="w-full">
      <div
        ref={cardRef}
        dir="rtl"
        role="img"
        aria-label={`${username ? `${ui.card.usernamePrefix} ${username}. ` : ''}${character.titleAr} — ${character.trackName}. ${copy.taglineAr}`}
        className="poster-content relative mx-auto aspect-[1080/1350] w-full max-w-[27rem] overflow-hidden"
        style={{ backgroundColor: character.palette.deep }}
        data-testid="result-card"
      >
        {/* Plain image elements keep every poster layer visible to the export decoder. */}
        {/* eslint-disable @next/next/no-img-element */}
        <img
          src={UI_ASSETS.deck.src}
          alt=""
          width={UI_ASSETS.deck.width}
          height={UI_ASSETS.deck.height}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${accent}40, transparent 60%), linear-gradient(180deg, #090f22bb, transparent 35%, #090f22 78%)`,
          }}
        />
        <div className="absolute inset-x-[10%] top-[11%] flex items-center justify-between">
          <span dir="ltr" className="flex flex-col leading-tight">
            <span className="font-brand text-[0.9em] font-bold text-text-primary">
              {ui.brand.organization}
            </span>
            <span className="font-brand text-[0.55em] tracking-widest text-text-secondary">
              {ui.brand.campus}
            </span>
          </span>
          {match ? (
            <span dir="ltr" className="text-[0.75em] font-bold text-text-secondary">
              #{match.rank} · {ui.matches.scoreLabel(match.score)}
            </span>
          ) : null}
        </div>
        {username ? (
          <p
            dir="auto"
            data-testid="result-card-username"
            className="absolute inset-x-[10%] top-[16%] text-center text-[0.95em] font-bold leading-tight text-text-primary break-words"
          >
            {ui.card.usernamePrefix} {username}
          </p>
        ) : null}
        <div className="absolute inset-x-[8%] top-[24%] h-[36%]">
          <img
            src={character.artwork.src}
            alt=""
            width={character.artwork.width}
            height={character.artwork.height}
            className="h-full w-full object-contain"
            draggable={false}
          />
          <img
            src={emblem.src}
            alt=""
            width={emblem.width}
            height={emblem.height}
            className="absolute end-[6%] bottom-[12%] h-[20%] w-auto"
          />
        </div>
        <div data-testid="poster-title" className="absolute inset-x-[10%] top-[62%] text-center">
          <p className="text-[0.75em] font-bold text-text-secondary">{copy.eyebrow}</p>
          <h2
            className="font-display text-[1.65em] font-black leading-[1.3]"
            style={{ color: accent }}
          >
            {copy.personaTitleAr}
          </h2>
          <p className="text-[0.95em] font-bold leading-relaxed text-text-primary">
            {copy.trackSubtitleAr}
          </p>
          <p dir="ltr" className="font-brand text-[0.7em] leading-relaxed text-text-secondary">
            {character.trackName}
          </p>
        </div>
        <p
          data-testid="poster-tagline"
          className="absolute inset-x-[10%] bottom-[14%] text-center text-[0.85em] font-bold leading-[1.4] text-text-primary"
        >
          {copy.taglineAr}
        </p>
        <img
          src={UI_ASSETS['poster-frame'].src}
          alt=""
          width={1080}
          height={1350}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
    </div>
  );
}

export const ResultCard = forwardRef(ResultCardInner);
ResultCard.displayName = 'ResultCard';

/**
 * Filename for the downloaded PNG: `gdgoc-<username>-<track>.png`.
 *
 * Arabic letters are kept — they are valid in a filename and the card is
 * Arabic — but separators and filesystem-hostile punctuation are not.
 */
export function resultFileName(username: string | null, character: CharacterDefinition): string {
  const slug = username
    ? username
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[/\\?%*:|"<>]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : '';
  return `gdgoc${slug ? `-${slug}` : ''}-${character.id}.png`;
}
