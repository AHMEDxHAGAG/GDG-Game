import { expect, test } from '@playwright/test';

import { scene } from './helpers';

const copy = {
  createGroupsTitle: 'اعمل فريق',
  notConfiguredTitle: 'الروم مش متاحة دلوقتي',
  notReadyTitle: 'خلّص الاختبار الأول',
  notFoundTitle: 'مالهاش روم',
} as const;

/*
 * Rooms need a name and a track, and the room screens need a project to talk
 * to — neither of which Playwright can supply here. What *is* testable without
 * a project is the behaviour of the screens when they have nothing to record,
 * and that is the path most likely to regress silently: a missing env var does
 * not throw, it just quietly changes what a visitor sees.
 *
 * This spec therefore runs against a *separate* server built without
 * `NEXT_PUBLIC_SUPABASE_*` — see the `no-project-*` projects in
 * `playwright.config.ts` and the `test:e2e` script. Those variables are inlined
 * at build time, so there is no way to unset them from inside a test.
 *
 * The full rule set — the cap of four, one track each, every refusal, and the
 * fact that `anon` can reach none of it directly — is covered against a real
 * database instead; see `tools/verify-team-rules.sql`.
 */

test.describe('team hub without a project', () => {
  test('explains itself instead of offering a dead end', async ({ page }) => {
    await page.goto('/create-groups');
    await expect(scene(page)).toHaveAttribute('data-scene', 'create-groups');
    await expect(page.getByRole('heading', { name: copy.notConfiguredTitle })).toBeVisible();
  });

  test('never offers the create or join forms', async ({ page }) => {
    await page.goto('/create-groups');
    await expect(page.getByRole('button', { name: 'اعمل روم' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'ادخل روم' })).toHaveCount(0);
    // The name field is the only way into either form, and it is hidden too.
    await expect(page.getByLabel('اسمك')).toHaveCount(0);
  });

  test('does not overflow horizontally', async ({ page }) => {
    await page.goto('/create-groups');
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1);
  });
});

test.describe('room screen without a project', () => {
  /*
   * With nothing to check the code against, the honest answer is "rooms are not
   * switched on" — not a spinner that never resolves, and not "no such room",
   * which would blame a code that was never even looked at.
   */
  test('says rooms are unavailable rather than spinning', async ({ page }) => {
    await page.goto('/team/ABCDEF');
    await expect(page.getByRole('heading', { name: copy.notConfiguredTitle })).toBeVisible();
  });

  test('says the same for a malformed code', async ({ page }) => {
    await page.goto('/team/nope');
    await expect(page.getByRole('heading', { name: copy.notConfiguredTitle })).toBeVisible();
  });
});
