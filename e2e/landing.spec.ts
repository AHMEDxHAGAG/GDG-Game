import { expect, test } from '@playwright/test';

import {
  copy,
  expectNoHorizontalOverflow,
  gotoQuiz,
  hasTouchTarget,
  pickOption,
  scene,
} from './helpers';

test.describe('landing', () => {
  test('shows the hero, the five personas and the CTA', async ({ page }) => {
    await page.goto('/');
    await expect(scene(page)).toHaveAttribute('data-scene', 'landing');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(copy.landingHeadline);
    await expect(page.getByRole('link', { name: copy.tracksCta })).toBeVisible();
    await expect(page.getByRole('button', { name: copy.startCta })).toBeVisible();

    // Five characters, decorative — described once in text, not five times.
    await expect(page.getByText('خمس شخصيات')).toBeAttached();
    await expect(page.locator('[data-artwork="final"]')).toHaveCount(5);
  });

  test('offers an optional username that is remembered on the card', async ({ page }) => {
    await page.goto('/');
    const field = page.getByLabel(copy.usernameLabel);

    await expect(field).toBeVisible();
    await field.fill('Lila');
    await expect(field).toHaveValue('Lila');

    // The name is optional: the skip button clears it and still starts.
    await page.getByRole('button', { name: copy.skipUsername }).click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'quiz');
  });

  test('caps the username length', async ({ page }) => {
    await page.goto('/');
    const field = page.getByLabel(copy.usernameLabel);
    await field.fill('a'.repeat(60));
    await expect(field).toHaveValue('a'.repeat(24));
  });

  test('Enter starts the quiz', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(copy.usernameLabel).fill('Lila');
    await page.getByLabel(copy.usernameLabel).press('Enter');
    await expect(scene(page)).toHaveAttribute('data-scene', 'quiz');
  });

  test('is laid out right-to-left', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('does not overflow horizontally at narrow widths', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await expect(page.getByRole('button', { name: copy.startCta })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test('keeps the CTA at a usable touch size', async ({ page }) => {
    await page.goto('/');
    expect(await hasTouchTarget(page, '[data-scene="landing"] button:has-text("ابدأ")')).toBe(true);
  });
});

test.describe('quiz entry', () => {
  test('lands on question 1 with Next disabled', async ({ page }) => {
    await gotoQuiz(page);
    await expect(page.getByTestId('quiz-counter')).toHaveText(copy.quizCounter(1));
    await expect(page.getByRole('button', { name: copy.next })).toBeDisabled();
    await expect(page.getByRole('button', { name: copy.previous })).toBeDisabled();
  });

  test('enables Next only once an option is picked', async ({ page }) => {
    await gotoQuiz(page);
    const next = page.getByRole('button', { name: copy.next });
    await expect(next).toBeDisabled();

    await pickOption(page, 1, 0);
    await expect(next).toBeEnabled();
  });

  test('has four single-select options and no text input anywhere', async ({ page }) => {
    await gotoQuiz(page);

    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(4);

    // Radio semantics: one group, one selection.
    await pickOption(page, 1, 0);
    await expect(radios.nth(0)).toBeChecked();
    await pickOption(page, 1, 2);
    await expect(radios.nth(2)).toBeChecked();
    await expect(radios.nth(0)).not.toBeChecked();

    // No free text, no composer: this replaced the chat entirely.
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.locator('textarea')).toHaveCount(0);
    await expect(page.locator('form')).toHaveCount(0);
  });
});
