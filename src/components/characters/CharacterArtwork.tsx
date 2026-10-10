'use client';

import { useState } from 'react';
import Image from 'next/image';

import { hasArtwork } from '@/generated/artwork-manifest';
import type { CharacterDefinition } from '@/features/characters/types';
import { PiratePlaceholder } from './PiratePlaceholder';

export interface CharacterArtworkProps {
  character: CharacterDefinition;
  className?: string;
  /** Width/height of the rendered box; artwork keeps its aspect ratio. */
  size?: number;
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
 */
export function CharacterArtwork({
  character,
  className,
  size,
  priority = false,
}: CharacterArtworkProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  const { artwork } = character;
  // Skip the request entirely when no file exists: a guaranteed 404 would cost
  // a round trip and flash a broken image before the fallback rendered.
  const canRenderArtwork = hasArtwork(character.id);
  const showArtwork = Boolean(artwork.src) && canRenderArtwork && !failed;

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
      <Image
        src={artwork.src as string}
        alt={artwork.alt}
        width={size ?? artwork.width}
        height={size ?? artwork.height}
        priority={priority}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
        style={{ imageRendering: 'auto' }}
      />
    </span>
  );
}
