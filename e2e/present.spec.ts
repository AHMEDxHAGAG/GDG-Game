import { expect, test } from '@playwright/test';

import { expectNoHorizontalOverflow } from './helpers';

test.describe('projector screen (/present)', () => {
  test('renders the invitation with title, steps and all five pirates', async ({ page }) => {
    await page.goto('/present');

    await expect(page.locator('[data-scene="present"]')).toBeVisible();
    await expect(page.getByText('Pirate Identity', { exact: true })).toBeVisible();
    await expect(page.getByText('مين القرصان اللي جواك؟')).toBeVisible();
    await expect(page.getByText('Scan the QR Code')).toBeVisible();

    // Three-step instructions.
    await expect(page.locator('ol > li')).toHaveCount(3);

    // All five track characters are shown.
    for (const title of [
      'THE SHIPWRIGHT',
      'THE ORACLE',
      'THE NAVIGATOR',
      'THE CARTOGRAPHER',
      'THE GUARDIAN',
    ]) {
      await expect(page.getByText(title).first()).toBeVisible();
    }
  });

  test('renders a scannable QR code for the configured destination', async ({ page }) => {
    await page.goto('/present');

    // With no NEXT_PUBLIC_SITE_URL the QR falls back to the runtime origin.
    const qr = page.getByRole('img', { name: /QR code:/ });
    await expect(qr).toBeVisible({ timeout: 15_000 });

    const url = new URL(page.url());
    const alt = await qr.getAttribute('alt');
    expect(alt).toContain(`${url.protocol}//${url.host}`);

    // The rendered code is a real PNG data URL, not a placeholder.
    const src = await qr.getAttribute('src');
    expect(src).toMatch(/^data:image\/png;base64,/);
  });

  test('shows no leaderboard or tracking affordances', async ({ page }) => {
    await page.goto('/present');
    // Plan §12/§26: this is an invitation screen, not a live dashboard.
    await expect(page.getByText(/leaderboard|ترتيب|ترشيحات/i)).toHaveCount(0);
  });

  test('does not overflow horizontally', async ({ page }) => {
    await page.goto('/present');
    await expectNoHorizontalOverflow(page);
  });
});