import type { CharacterDefinition } from '@/features/characters/types';
import { CharacterArtwork } from './CharacterArtwork';
import { TrackEmblem } from './TrackEmblem';

export interface CharacterBadgeProps {
  character: CharacterDefinition;
  size?: number;
  withLabel?: boolean;
  className?: string;
}

/** Emblem + track name, used on the gallery cards and the result header. */
export function CharacterBadge({
  character,
  size = 40,
  withLabel = true,
  className = '',
}: CharacterBadgeProps): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ ['--badge-accent' as string]: character.palette.deep }}
    >
      <span
        className="grid shrink-0 place-items-center rounded-full border-2 bg-parchment-50/85"
        style={{
          width: size,
          height: size,
          borderColor: character.palette.deep,
          color: character.palette.deep,
        }}
      >
        <TrackEmblem emblem={character.emblem} color={character.palette.deep} className="size-[62%]" />
      </span>
      {withLabel ? (
        <span
          dir="ltr"
          className="text-sm font-extrabold tracking-wide text-ink"
          style={{ color: character.palette.deep }}
        >
          {character.trackName}
        </span>
      ) : null}
    </span>
  );
}

export interface CharacterPortraitProps {
  character: CharacterDefinition;
  className?: string;
  priority?: boolean;
}

/** Full-body character illustration with a soft track-coloured shadow. */
export function CharacterPortrait({
  character,
  className = '',
  priority = false,
}: CharacterPortraitProps): React.JSX.Element {
  return (
    <span
      className={`relative inline-grid place-items-end justify-center ${className}`}
      style={{ ['--portrait-accent' as string]: character.palette.vivid }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-[12%] bottom-[2%] h-[10%] rounded-[50%] blur-[10px]"
        style={{ backgroundColor: character.palette.wash }}
      />
      <CharacterArtwork
        character={character}
        priority={priority}
        className="relative h-full w-full"
      />
    </span>
  );
}
