'use client';

import { useState } from 'react';

import { hasArtwork } from '@/generated/artwork-manifest';
import type { CharacterDefinition } from '@/features/characters/types';
import { PiratePlaceholder } from './PiratePlaceholder';

export interface CharacterArtworkProps {
  character: CharacterDefinition;
  className?: string;
  priority?: boolean;
}

/**
 * Renders the production character artwork when it is available and falls back
 * to the designed placeholder when it is not.
 *
 * Dropping `public/assets/characters/<track>.png` into place is enough — the
 * build-time manifest picks it up automatically. The `onError` path stays as a
 * second line of defence for a wrong path or a stale build, so the UI never
 * shows a broken image during a live event.
 *
 * Deliberately a plain `<img>` rather than `next/image`: `html-to-image`
 * re-fetches every image URL while composing the exported card, and the
 * `/_next/image` optimisation endpoint has been a recurring source of export
 * flakiness. A same-origin file under `public/` is the most reliable thing to
 * hand a canvas rasteriser. The intrinsic `width`/`height` are always set, so
 * the browser still reserves the right box and there is no layout shift.
 */
export function CharacterArtwork({
  character,
  className,
  priority = false,
}: CharacterArtworkProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  const { artwork } = character;
  // Skip the request entirely when no file exists: a guaranteed 404 would cost
  // a round trip and flash a broken image before the fallback rendered.
  const canRenderArtwork = hasArtwork(character.id);
  const showArtwork = canRenderArtwork && !failed;

  if (!showArtwork) {
    return (
      <span className={className} data-artwork="placeholder">
        <PiratePlaceholder
          character={character}
          className="h-full w-full"
          withWash={false}
        />
      </span>
    );
  }

  return (
    <span className={className} data-artwork="final">
      {/* eslint-disable-next-line @next/next/no-img-element -- see the note on html-to-image above */}
      <img
        src={artwork.src}
        alt={artwork.alt}
        width={artwork.width}
        height={artwork.height}
        decoding={priority ? 'sync' : 'async'}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}
