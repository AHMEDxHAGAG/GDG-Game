import type { CharacterDefinition } from '@/features/characters/types';

export interface PiratePlaceholderProps {
  character: CharacterDefinition;
  className?: string;
  /** Renders the accent wash behind the silhouette. */
  withWash?: boolean;
  title?: string;
}

/**
 * Designed placeholder used until the final isolated character artwork lands.
 *
 * It is not a stand-in for the real illustration: it is a distinct, ink-drawn
 * pirate bust that keeps the character's silhouette language, emblem and track
 * colour, so the layout, reveal and export can be reviewed honestly while the
 * production PNGs are still in progress.
 *
 * `CharacterArtwork` prefers `character.artwork.src` and only falls back here.
 */
export function PiratePlaceholder({
  character,
  className,
  withWash = true,
  title,
}: PiratePlaceholderProps): React.JSX.Element {
  const { palette, emblem } = character;
  const ink = '#2a231b';

  return (
    <svg
      viewBox="0 0 200 260"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}

      {withWash ? (
        <ellipse cx="100" cy="196" rx="86" ry="72" fill={palette.wash} />
      ) : null}

      <g stroke={ink} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Coat */}
        <path d="M18 260c2-58 34-80 82-80s80 22 82 80Z" fill={ink} />
        {/* Coat lapels in the track colour */}
        <path d="M76 184 100 232 124 184" fill="none" stroke={palette.vivid} strokeWidth="4" />
        {/* Scarf */}
        <path d="M70 172c10 16 50 16 60 0l10 12c-18 22-62 22-80 0Z" fill={palette.vivid} />

        {/* Head */}
        <path d="M74 96a26 30 0 0 1 52 0v34a26 30 0 0 1-52 0Z" fill="#f2dfbd" />

        {/* Eyes */}
        <circle cx="90" cy="118" r="3.4" fill={ink} stroke="none" />
        <circle cx="110" cy="118" r="3.4" fill={ink} stroke="none" />
        {/* Grin */}
        <path d="M90 132c6 6 14 6 20 0" fill="none" strokeWidth="3" />

        {emblem === 'gear' ? (
          <>
            {/* Tricorn with a gear badge */}
            <path d="M42 96c6-34 110-34 116 0Z" fill={palette.vivid} />
            <path d="M30 96h140" fill="none" />
            <circle cx="100" cy="80" r="11" fill="#f2dfbd" strokeWidth="3" />
            <circle cx="100" cy="80" r="4" fill={ink} stroke="none" />
            <path d="M100 69v-6M100 97v-6M89 80h-6M117 80h-6" strokeWidth="2.6" />
          </>
        ) : null}

        {emblem === 'robot' ? (
          <>
            {/* Futuristic cap + antenna with an orb companion */}
            <path d="M46 96c8-26 100-26 108 0Z" fill={palette.vivid} />
            <path d="M38 96h124" fill="none" />
            <path d="M100 70V52" fill="none" />
            <circle cx="100" cy="44" r="9" fill="#f2dfbd" />
            <circle cx="100" cy="44" r="3.4" fill={palette.vivid} stroke="none" />
            <path d="M60 108c6-6 12-6 18 0" fill="none" stroke={palette.vivid} strokeWidth="4" />
          </>
        ) : null}

        {emblem === 'globe' ? (
          <>
            {/* Captain's bicorne with a compass badge */}
            <path d="M28 96c14-40 130-40 144 0Z" fill={ink} />
            <path d="M28 96 18 74l18 8M172 96l10-22-18 8" fill={ink} />
            <path d="M34 96h132" fill="none" />
            <circle cx="100" cy="74" r="12" fill={palette.vivid} strokeWidth="3" />
            <path d="M100 66v16M92 74h16" stroke="#f2dfbd" strokeWidth="2.4" />
          </>
        ) : null}

        {emblem === 'chart' ? (
          <>
            {/* Explorer hat + round glasses */}
            <path d="M46 96c8-30 100-30 108 0Z" fill={palette.vivid} />
            <path d="M34 96h132" fill="none" />
            <circle cx="90" cy="118" r="9" fill="#e7d3ae" strokeWidth="3" />
            <circle cx="110" cy="118" r="9" fill="#e7d3ae" strokeWidth="3" />
            <path d="M99 118h2" fill="none" />
            <path d="M81 116l-8-4M119 116l8-4" fill="none" strokeWidth="2.6" />
          </>
        ) : null}

        {emblem === 'shield' ? (
          <>
            {/* Hood + mask */}
            <path d="M62 100c2-38 74-38 76 0-8-6-16-8-38-8s-30 2-38 8Z" fill={ink} />
            <path d="M66 100c6-30 62-30 68 0" fill="none" stroke={palette.vivid} strokeWidth="4" />
            <path d="M74 124h52v14a26 26 0 0 1-52 0Z" fill={palette.vivid} strokeWidth="3" />
            <path d="M90 132h20" stroke="#f2dfbd" strokeWidth="3" />
          </>
        ) : null}
      </g>
    </svg>
  );
}
