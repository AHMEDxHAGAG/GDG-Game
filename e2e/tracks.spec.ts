import { expect, test } from '@playwright/test';

import { copy, expectNoHorizontalOverflow, scene } from './helpers';
import { CHARACTER_LIST } from '../src/config/characters';

test.describe('tracks gallery', () => {
  test('lists all five personas as browse-only cards', async ({ page }) => {
    await page.goto('/tracks');
    await expect(scene(page)).toHaveAttribute('data-scene', 'tracks');

    await expect(page.getByRole('heading', { name: copy.matchesTitle.replace('ترتيب شخصياتك', 'مسارات GDGoC') })).toBeVisible();
    await expect(page.locator('[data-artwork="final"]')).toHaveCount(CHARACTER_LIST.length);

    // Browsing is not scoring: nothing here is a button until a ranking exists.
    await expect(page.locator('[data-track-id]')).toHaveCount(0);
  });

  test('names every track in Arabic and English', async ({ page }) => {
    await page.goto('/tracks');
    for (const character of CHARACTER_LIST) {
      await expect(page.getByText(character.trackNameAr).first()).toBeVisible();
      await expect(page.getByText(character.trackName).first()).toBeAttached();
    }
  });

  test('does not overflow horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/tracks');
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('projector screen', () => {
  test('shows the invitation and a scannable QR', async ({ page }) => {
    await page.goto('/present');
    await expect(scene(page)).toHaveAttribute('data-scene', 'present');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('اكتشف');
    await expect(page.getByText(copy.presentScan)).toBeVisible();

    // Wait for the QR to be generated; the fallback is the URL in text.
    const qr = page.getByRole('img', { name: /QR code:/ });
    await expect(qr).toBeVisible({ timeout: 15_000 });
    await expect(qr).toHaveAttribute('src', /^data:image\/png;base64,/);
  });

  test('lists the steps and the five personas', async ({ page }) => {
    await page.goto('/present');
    await expect(page.locator('ol > li')).toHaveCount(3);
    await expect(page.locator('[data-artwork="final"]')).toHaveCount(CHARACTER_LIST.length);
  });

  test('does not overflow horizontally', async ({ page }) => {
    await page.goto('/present');
    await expectNoHorizontalOverflow(page);
  });
});
