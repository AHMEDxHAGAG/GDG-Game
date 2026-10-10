/**
 * The five GDGoC technical tracks.
 *
 * This union is the vocabulary shared by the character catalogue, the reveal,
 * the result card and the (future) engine result payload.
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

/**
 * Artwork slot for a character.
 *
 * `src` is intentionally `null` until the final, isolated transparent
 * character files are supplied. While it is `null` the UI renders a designed
 * placeholder that keeps the track colour, silhouette and emblem intact, so
 * the experience is complete and reviewable without the production art.
 */
export interface CharacterArtwork {
  /** e.g. `/assets/characters/ai.png` — transparent PNG/WebP recommended. */
  readonly src: string | null;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export interface CharacterPalette {
  /** Saturated accent pulled from the character's costume. */
  readonly vivid: string;
  /** Darkened accent; the only track colour used for text on parchment. */
  readonly deep: string;
  /** Low-opacity tint for card fills and glows. */
  readonly wash: string;
}

export interface CharacterDefinition {
  readonly id: TrackId;
  /** English pirate title, e.g. "The Shipwright". */
  readonly title: string;
  /** Arabic epithet used in Arabic copy, e.g. "بنّاء السفن". */
  readonly titleAr: string;
  /** Official GDGoC track name. */
  readonly trackName: string;
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
