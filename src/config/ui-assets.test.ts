import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UI_ASSETS, EMBLEM_ASSETS } from './ui-assets';
import { CHARACTER_LIST } from './characters';

describe('production artwork', () => {
  it('publishes every catalogue entry and both responsive scene sizes', () => {
    for (const asset of Object.values(UI_ASSETS)) {
      expect(existsSync(`public${asset.src}`), asset.src).toBe(true);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
    for (const scene of ['harbour', 'cabin', 'gallery', 'voyage', 'deck'] as const) {
      expect(existsSync(`public${UI_ASSETS[scene].src.replace('.webp', '-mobile.webp')}`)).toBe(
        true,
      );
    }
    expect(UI_ASSETS['poster-frame'].width / UI_ASSETS['poster-frame'].height).toBe(0.8);
  });

  it('provides compact and ornate emblems, plus all character sizes', () => {
    for (const character of CHARACTER_LIST) {
      const emblem = EMBLEM_ASSETS[character.emblem];
      expect(UI_ASSETS[emblem]).toBeDefined();
      expect(UI_ASSETS[`${emblem}-ornate`]).toBeDefined();
      for (const suffix of ['', '-256', '-512']) {
        const file = `public${character.artwork.src.replace('.webp', `${suffix}.webp`)}`;
        expect(existsSync(file), file).toBe(true);
        expect(readFileSync(file).subarray(8, 12).toString()).toBe('WEBP');
      }
    }
  });
});
