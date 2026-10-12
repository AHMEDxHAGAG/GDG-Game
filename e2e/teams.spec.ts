import { expect, test } from '@playwright/test';

import { scene } from './helpers';

const copy = {
  createGroupsTitle: 'اعمل فريق',
  notConfiguredTitle: 'الروم مش متاحة دلوقتي',
  notReadyTitle: 'خلّص الاختبار الأول',
  notFoundTitle: 'مالهاش روم',
} as const;

/*
 * The screens that need a live project. The unconfigured-branch checks live in
 * `teams.no-project.spec.ts`, which runs against a second server built without
 * `NEXT_PUBLIC_SUPABASE_*` — that pair splits what used to be one file, because
 * the two halves need mutually exclusive environments.
 *
 * A name and a track are the only inputs Playwright can supply, so what is
 * covered here is the screen's own behaviour: it refuses to open before the
 * quiz is finished, and it never mounts without an identity to attach.
 *
 * The full rule set — the cap of four, shared tracks, every refusal, and the
 * fact that `anon` can reach none of it directly — is covered against a real
 * database instead; see `tools/verify-team-rules.sql`.
 */

test.describe('no accounts anywhere', () => {
  test('the quiz never asks anyone to sign in', async ({ page }) => {
    // The whole point of the change: a name is the only identity, so no
    // sign-in affordance may appear on any screen a visitor can reach.
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'ابدأ الاختبار' })).toBeVisible();
    await expect(page.getByRole('button', { name: /جوجل/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /تسجيل الخروج/ })).toHaveCount(0);
  });

  test('there are no OAuth routes left to navigate to', async ({ page }) => {
    for (const route of ['/auth/login', '/auth/callback']) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should not exist`).toBe(404);
    }
  });
});

test.describe('team hub before a result', () => {
  test('will not open a room without a finished quiz', async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
        !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
      'Requires a configured Supabase project; offline coverage runs separately.',
    );
    // The hub needs a track to put a seat on. Without a result there is none,
    // and the honest answer is to send the visitor back rather than to open a
    // room that could never be filled.
    await page.goto('/create-groups');
    await expect(scene(page)).toHaveAttribute('data-scene', 'create-groups');
    await expect(page.getByRole('heading', { name: copy.notReadyTitle })).toBeVisible();
    await expect(page.getByRole('button', { name: 'اعمل روم' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'ادخل روم' })).toHaveCount(0);
  });
});
