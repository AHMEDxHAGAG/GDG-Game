'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { toPng } from 'html-to-image';

import { ui } from '@/content/ui';
import { TRACK_CONTENT } from '@/content/tracks';
import { getCharacter } from '@/config/characters';
import type { CharacterDefinition } from '@/features/characters/types';
import type { RankedMatch } from '@/features/quiz/scoring/scoreAnswers';
import { TrackEmblem } from '@/components/characters/TrackEmblem';

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

/**
 * Shareable pirate identity card.
 *
 * Fixed 4:5 poster, real text, no baked assets. The composition follows
 * `assests/UI/ResultCardExample1.png`: brand line and username, the persona as
 * a large figure, then the track-coloured sections — tagline ribbon, unique
 * strength, four traits, and the secondary-track card.
 *
 * Every internal size is tuned so the whole composition fits inside the fixed
 * aspect box at its narrowest width. `overflow-hidden` on the frame means a
 * mis-sized child is *clipped and lost* rather than merely scrolled, so the
 * fitness of this layout is asserted in `result-card.spec.ts` rather than left
 * to a visual eyeball.
 *
 * Export waits on `document.fonts.ready` so Arabic shaping is never rasterised
 * against a fallback face, and waits on image decode so a slow PNG cannot
 * produce a half-empty poster.
 */
function ResultCardInner(
  { character, username, match }: ResultCardProps,
  ref: Ref<ResultCardHandle>,
): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const copy = TRACK_CONTENT[character.id];
  const secondaryCharacter = getCharacter(copy.secondaryTrackId);
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
        await Promise.all(
          Array.from(node.querySelectorAll('img'))
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true });
                  img.addEventListener('error', () => resolve(), { once: true });
                }),
            ),
        );
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
        aria-label={
          `${username ? `${ui.card.usernamePrefix} ${username}. ` : ''}${character.titleAr} — ${character.trackName}`
        }
        className="pixel-frame relative mx-auto aspect-[1080/1350] w-full max-w-[26rem] overflow-hidden"
        style={{ backgroundColor: character.palette.deep }}
        data-testid="result-card"
      >
        {/* Scene behind the text. The gradient stops are kept opaque enough
            that the persona title still clears 4.5:1 on top of them. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 90% 55% at 50% 16%, ${accent}66 0%, transparent 70%),
              linear-gradient(180deg, ${character.palette.deep} 0%, #0B0E20 100%)`,
          }}
        />

        <div className="relative flex h-full flex-col px-3.5 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <span dir="ltr" className="flex flex-col leading-none">
              <span className="font-brand text-[0.8rem] font-bold tracking-tight text-text-primary">
                {ui.brand.organization}
              </span>
              <span className="font-brand text-[0.5rem] font-medium tracking-[0.18em] text-text-secondary">
                {ui.brand.campus}
              </span>
            </span>

            {username ? (
              <span
                dir="auto"
                data-testid="result-card-username"
                className="max-w-[58%] truncate rounded-full border px-2.5 py-0.5 text-[0.75rem] font-bold"
                style={{ borderColor: accent, backgroundColor: `${accent}33`, color: accent }}
              >
                {ui.card.usernamePrefix} {username}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex h-[16%] items-end justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- html-to-image re-fetches every image URL while composing the export; the optimisation endpoint is not a reliable canvas source. See the note on exportPng. */}
            <img
              src={character.artwork.src}
              alt=""
              width={character.artwork.width}
              height={character.artwork.height}
              className="h-full w-auto object-contain object-bottom"
              draggable={false}
            />
          </div>

          <p className="mt-0.5 text-[0.66rem] font-bold text-text-secondary">{copy.eyebrow}</p>
          <h2
            className="font-display font-black leading-[1.1]"
            style={{ color: accent, fontSize: 'clamp(1.5rem, 7.5vw, 2.25rem)' }}
          >
            {copy.personaTitleAr}
          </h2>
          <p className="text-[0.8rem] font-bold text-text-primary">
            {copy.trackSubtitleAr}
          </p>
          {/* Track name and rank share a line: at a fixed 4:5 frame every row
              counts, and a separate rank row pushed the traits off the card. */}
          <p dir="ltr" className="text-[0.65rem] font-bold tracking-wide text-text-secondary">
            {character.trackName}
            {match ? (
              <span className="tracking-normal opacity-80">
                {' · '}
                #{match.rank} · {ui.matches.scoreLabel(match.score)}
              </span>
            ) : null}
          </p>

          <p
            className="mt-1 rounded-md px-2.5 py-1.5 text-center text-[0.78rem] leading-snug font-bold text-text-primary"
            style={{ backgroundColor: `${accent}33` }}
          >
            {copy.taglineAr}
          </p>

          <section className="mt-1 rounded-md border-2 px-2.5 py-1.5" style={{ borderColor: accent }}>
            <h3
              className="flex items-center gap-1.5 text-[0.75rem] font-extrabold"
              style={{ color: accent }}
            >
              <TrackEmblem emblem={character.emblem} color={accent} className="size-3.5 shrink-0" />
              {copy.strengthTitleAr}
            </h3>
            <p className="mt-0.5 text-[0.75rem] leading-snug text-text-primary">{copy.strengthAr}</p>
          </section>

          <section className="mt-1">
            <h3 className="text-[0.75rem] font-extrabold" style={{ color: accent }}>
              {copy.traitsTitleAr}
            </h3>
            <ul className="mt-0.5 grid grid-cols-2 gap-x-2 gap-y-0">
              {copy.traits.map((trait) => (
                <li key={trait} className="flex items-start gap-1">
                  <span
                    aria-hidden="true"
                    className="mt-1 size-1 shrink-0 rotate-45"
                    style={{ backgroundColor: accent }}
                  />
                  <span className="text-[0.62rem] leading-[1.3] text-text-primary">{trait}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="mt-auto rounded-md border px-2.5 py-1.5"
            style={{ borderColor: `${accent}80` }}
          >
            <h3 className="text-[0.6rem] font-bold text-text-secondary">
              {copy.secondaryEyebrowAr}
            </h3>
            <p
              className="mt-0.5 flex items-center gap-1.5 text-[0.82rem] font-extrabold"
              style={{ color: secondaryCharacter.palette.vivid }}
            >
              <TrackEmblem
                emblem={secondaryCharacter.emblem}
                color={secondaryCharacter.palette.vivid}
                className="size-3.5 shrink-0"
              />
              {secondaryCharacter.trackNameAr}
            </p>
            {/* Clamped so the longest authored description cannot push the
                wordmark out of the fixed 4:5 frame. */}
            <p className="mt-0.5 line-clamp-2 text-[0.64rem] leading-[1.4] text-text-secondary">
              {copy.secondaryDescriptionAr}
            </p>
          </section>

          <p
            dir="ltr"
            className="mt-1 text-center font-brand text-[0.5rem] tracking-[0.2em] text-text-secondary/70"
          >
            {ui.card.exportWordmark}
          </p>
        </div>
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
