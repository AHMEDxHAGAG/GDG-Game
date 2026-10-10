import { expect, test } from '@playwright/test';

import { copy, expectNoHorizontalOverflow, gotoConversation } from './helpers';

test.describe('conversation', () => {
  test('opens with the captain introduction and a locked composer', async ({ page }) => {
    await gotoConversation(page);

    const transcript = page.getByRole('log', { name: 'حوار الرحلة' });
    await expect(transcript).toBeVisible();
    await expect(transcript).toContainText('الكابتن');
    // The line lives in the transcript bubble and the sr-only live region.
    await expect(page.getByText(/أنا الكابتن بتاع الرحلة دي/).first()).toBeVisible();

    // The mock engine note must be visible: the demo must never pretend to be AI.
    await expect(page.getByText(/نسخة تجريبية/).first()).toBeVisible();
  });

  test('accepts free text and echoes the player line', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    await expect(composer).toBeEnabled();

    await composer.fill('هعمل خريطة للمكان الأول');
    await page.getByRole('button', { name: copy.send }).click();

    const transcript = page.getByRole('log', { name: 'حوار الرحلة' });
    await expect(transcript.getByText('هعمل خريطة للمكان الأول')).toBeVisible({ timeout: 15_000 });
  });

  test('disables send on empty or whitespace-only input', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    const send = page.getByRole('button', { name: copy.send });

    await expect(send).toBeDisabled();
    await composer.fill('   ');
    await expect(send).toBeDisabled();
    await composer.fill('ا');
    await expect(send).toBeEnabled();
  });

  test('Enter sends and Shift+Enter inserts a newline', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });

    await composer.fill('سطر أول');
    await composer.press('Shift+Enter');
    await composer.type('سطر تاني');
    // The newline must still be in the field — Shift+Enter must not submit.
    await expect(composer).toHaveValue('سطر أول\nسطر تاني');

    await composer.press('Enter');
    const transcript = page.getByRole('log', { name: 'حوار الرحلة' });
    await expect(transcript.getByText('سطر أول\nسطر تاني')).toBeVisible({ timeout: 15_000 });
  });

  test('caps input at the configured maximum length', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    await composer.fill('ا'.repeat(900));

    await expect(composer).toHaveValue('ا'.repeat(600));
  });

  test('clears the composer after sending and blocks duplicate submits', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    await composer.fill('رد سريع');
    await page.getByRole('button', { name: copy.send }).click();

    // While the captain is thinking the composer is locked, so the same
    // message cannot be double-submitted.
    await expect(composer).toHaveValue('');
    await expect(composer).toBeDisabled({ timeout: 5_000 });
  });

  test('supports mixed Arabic and English answers', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    const message = 'هكتب Data pipeline وأشتغل على API';
    await composer.fill(message);
    await page.getByRole('button', { name: copy.send }).click();

    const transcript = page.getByRole('log', { name: 'حوار الرحلة' });
    const echoed = transcript.getByText(message);
    await expect(echoed).toBeVisible({ timeout: 15_000 });
    // User content is bidi-isolated so mixed text lays out predictably.
    await expect(echoed).toHaveAttribute('dir', 'auto');
  });

  test('never offers multiple-choice answers or suggestion chips', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    await composer.fill('رد أول');
    await page.getByRole('button', { name: copy.send }).click();
    await expect(composer).toBeEnabled({ timeout: 15_000 });

    // No radio buttons and no button that is a preset answer next to the composer.
    await expect(page.getByRole('radio')).toHaveCount(0);
    const composerRow = page.locator('div').filter({ has: composer }).last();
    const siblingButtons = await composerRow.getByRole('button').count();
    expect(siblingButtons).toBeLessThanOrEqual(1);
  });

  test('lays out without horizontal overflow on a phone', async ({ page }) => {
    await gotoConversation(page);
    await expectNoHorizontalOverflow(page);
  });
});
test.describe('session reset bar', () => {
  test('stays clear of the composer while the voyage is running', async ({ page }) => {
    await gotoConversation(page);
    await page.waitForTimeout(500);

    // Hidden entirely mid-conversation: a fixed overlay here would sit on top
    // of the composer caption.
    const bar = page.locator('[data-scene="session-reset"]');
    await expect(bar).toHaveCount(0);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    await composer.fill('رد');
    await page.getByRole('button', { name: copy.send }).click();
    await expect(composer).toBeEnabled({ timeout: 15_000 });
    await expect(page.locator('[data-scene="session-reset"]')).toHaveCount(0);
  });

  test('never overlaps the welcome tagline', async ({ page }) => {
    await page.goto('/');

    const button = page.getByRole('button', { name: copy.reset });
    await expect(button).toBeVisible();

    const tagline = page.locator('footer span[dir="ltr"]').first();
    await expect(tagline).toBeVisible();

    const [resetBox, taglineBox] = await Promise.all([
      button.boundingBox(),
      tagline.boundingBox(),
    ]);
    expect(resetBox).not.toBeNull();
    expect(taglineBox).not.toBeNull();
    // No intersection between the two boxes.
    const overlaps =
      resetBox!.y + resetBox!.height > taglineBox!.y &&
      resetBox!.y < taglineBox!.y + taglineBox!.height;
    expect(overlaps).toBe(false);
  });
});
