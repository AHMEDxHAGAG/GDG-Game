import { describe, expect, it } from 'vitest';

import { CHARACTER_LIST, CHARACTERS, getCharacter } from '@/config/characters';
import { TRACK_IDS } from '@/features/characters/types';

describe('character catalogue', () => {
  it('covers all five tracks with distinct titles, colours and emblems', () => {
    expect(TRACK_IDS).toHaveLength(5);
    expect(CHARACTER_LIST).toHaveLength(5);
    const titles = new Set(CHARACTER_LIST.map((c) => c.title));
    const vivid = new Set(CHARACTER_LIST.map((c) => c.palette.vivid));
    const emblems = new Set(CHARACTER_LIST.map((c) => c.emblem));
    expect(titles.size).toBe(5);
    expect(vivid.size).toBe(5);
    expect(emblems.size).toBe(5);
  });

  it('keeps artwork slots, copy and discovery notes reviewable', () => {
    for (const character of CHARACTER_LIST) {
      expect(character.trackName).toBeTruthy();
      expect(character.titleAr).toBeTruthy();
      expect(character.personalityAr).toBeTruthy();
      expect(character.discoveryNoteAr).toContain('Track');
      expect(character.artwork.alt).toBeTruthy();
      expect(character.artwork.width).toBeGreaterThan(0);
      // Artwork src points at the production slot; placeholders render
      // until the transparent PNGs land in public/assets/characters/.
      expect(character.artwork.src).toMatch(/^\/assets\/characters\/.+\.png$/);
      expect(getCharacter(character.id)).toEqual(CHARACTERS[character.id]);
    }
  });
});
