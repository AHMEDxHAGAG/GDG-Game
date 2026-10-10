import { expect, test } from '@playwright/test';

import { copy, expectNoHorizontalOverflow } from './helpers';

test.describe('welcome screen', () => {
  test('shows the expedition branding and a single clear CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-scene="welcome"]')).toBeVisible();
    await expect(page.getByText('GDGoC · AASTMT Aswan')).toBeVisible();
    await expect(page.getByText('Pirate Identity', { exact: true })).toBeVisible();
    await expect(page.getByText(copy.welcomeCta)).toBeVisible();
    // The Plan wants a beginner to know what to do within seconds.
    await expect(page.getByText('مفيش إجابات صح وغلط — جاوب بطريقتك.')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('nickname is optional and skippable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: copy.welcomeCta }).click();
    await expect(page.locator('[data-scene="conversation"]')).toBeVisible();
  });

  test('accepts a nickname and shows it in the chat header', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('نندهلك بإيه يا قرصان؟').fill('Lila');
    await page.getByRole('button', { name: copy.welcomeCta }).click();

    await expect(page.locator('[data-scene="conversation"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Lila');
  });

  test('presses Enter in the nickname field to start', async ({ page }) => {
    await page.goto('/');

    const field = page.getByLabel('نندهلك بإيه يا قرصان؟');
    await field.fill('Sahar');
    await field.press('Enter');

    await expect(page.locator('[data-scene="conversation"]')).toBeVisible();
  });

  test('caps the nickname at the configured maximum length', async ({ page }) => {
    await page.goto('/');

    const field = page.getByLabel('نندهلك بإيه يا قرصان؟');
    await field.fill('a'.repeat(80));

    await expect(field).toHaveValue('a'.repeat(24));
  });

  test('sets RTL on the document and keeps English titles LTR', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    // English display title must not be visually reversed.
    await expect(page.getByText('Pirate Identity', { exact: true })).toHaveAttribute('dir', 'ltr');
  });
});