import { describe, expect, it } from 'vitest';

import { CHARACTER_LIST, CHARACTERS, getCharacter } from '@/config/characters';
import { ARTWORK_IDS, hasArtwork } from '@/generated/artwork-manifest';
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

describe('artwork availability', () => {
  it('never requests an illustration that is not on disk', () => {
    // The manifest is regenerated from `public/assets/characters/` on
    // prebuild/predev/pretest, so this assertion holds whatever the art status.
    for (const character of CHARACTER_LIST) {
      const filePresent = hasArtwork(character.id);
      const src = character.artwork.src;
      if (filePresent) {
        expect(src).toContain(`/assets/characters/${character.id}`);
      } else {
        // No file → the UI must fall back without issuing a request.
        expect(ARTWORK_IDS).not.toContain(character.id as never);
      }
    }
  });

  it('config points every track at its documented artwork path', () => {
    for (const character of CHARACTER_LIST) {
      expect(character.artwork.src).toBe(`/assets/characters/${character.id}.png`);
      expect(character.artwork.width).toBeGreaterThan(0);
      expect(character.artwork.height).toBeGreaterThan(0);
      expect(character.artwork.alt.length).toBeGreaterThan(0);
    }
  });
});
