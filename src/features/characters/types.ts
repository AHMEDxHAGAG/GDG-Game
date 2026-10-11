/**
 * The five GDGoC technical tracks.
 *
 * This union is the vocabulary shared by the character catalogue, the quiz
 * scoring matrix, the ranked-matches list, the result card and the gallery.
 *
 * The ids are kebab-case and are used verbatim as
 * `public/assets/characters/<id>.webp` filenames, so changing one means renaming
 * the artwork file too — see `tools/generate-artwork-manifest.mjs`.
 */
export const TRACK_IDS = [
  'software-engineering',
  'ai',
  'web-development',
  'data-science',
  'cybersecurity',
] as const;

export type TrackId = (typeof TRACK_IDS)[number];

/** Ink-style emblem used for badges, the gallery and the result card. */
export type EmblemId = 'gear' | 'robot' | 'globe' | 'chart' | 'shield';

/** Stable ordering used as the final, deterministic ranking tie-break. */
export function trackIndex(trackId: TrackId): number {
  return TRACK_IDS.indexOf(trackId);
}

export function isTrackId(value: unknown): value is TrackId {
  return typeof value === 'string' && (TRACK_IDS as readonly string[]).includes(value);
}

/**
 * Artwork slot for a character.
 *
 * `width`/`height` are the real intrinsic pixel dimensions of the shipped PNG.
 * They are always declared rather than optional so the browser reserves the
 * correct box before the image decodes — this is what keeps the result-card
 * export free of layout shift.
 */
export interface CharacterArtwork {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export interface CharacterPalette {
  /** Saturated accent; used for borders, glows and large display type. */
  readonly vivid: string;
  /** Darkened accent; the only track colour used for text on parchment. */
  readonly deep: string;
  /** Low-opacity tint for card fills and glows. */
  readonly wash: string;
  /** Optional emissive halo colour around magical props. */
  readonly glow?: string;
}

export interface CharacterDefinition {
  readonly id: TrackId;
  /** English pirate title, e.g. "The Lead Engineer". */
  readonly title: string;
  /** Arabic persona title, e.g. "المهندس القائد". */
  readonly titleAr: string;
  /** Official GDGoC track name, English. */
  readonly trackName: string;
  /** Official GDGoC track name, Arabic. */
  readonly trackNameAr: string;
  /** One-line English description of the archetype. */
  readonly tagline: string;
  /** Egyptian-Arabic description of how the archetype thinks. */
  readonly personalityAr: string;
  readonly palette: CharacterPalette;
  readonly emblem: EmblemId;
  /** Short English motif list, used on the gallery card. */
  readonly motifs: readonly string[];
  readonly artwork: CharacterArtwork;
  /** Encouraging "this is a starting point" note shown on the result screen. */
  readonly discoveryNoteAr: string;
}
