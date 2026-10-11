import { expect, test } from '@playwright/test';

import {
  copy,
  currentQuestionIndex,
  expectNoHorizontalOverflow,
  gotoQuiz,
  hasTouchTarget,
  pickOption,
  scene,
} from './helpers';

test.describe('question flow', () => {
  test('advances through all ten questions', async ({ page }) => {
    await gotoQuiz(page);

    for (let index = 1; index <= 10; index++) {
      await expect(page.getByTestId('quiz-counter')).toHaveText(copy.quizCounter(index));
      // The final question offers the submit label instead of Next.
      const button =
        index === 10
          ? page.getByRole('button', { name: copy.submit })
          : page.getByRole('button', { name: copy.next });
      if (index === 10) break;
      // Next stays disabled until the question is answered.
      await expect(button).toBeDisabled();
      await pickOption(page, index, 0);
      await expect(button).toBeEnabled();
      await button.click();
    }

    await expect(scene(page)).toHaveAttribute('data-scene', 'quiz');
    expect(await currentQuestionIndex(page)).toBe(9);
  });

  test('marks the selected option visibly, not only by colour', async ({ page }) => {
    await gotoQuiz(page);
    const first = page.locator('label:has(input[name="q1-option"])').first();
    const second = page.locator('label:has(input[name="q1-option"])').nth(1);

    await expect(first).toHaveAttribute('data-checked', 'false');
    await first.click();
    await expect(first).toHaveAttribute('data-checked', 'true');
    // A check glyph appears inside the selection affordance.
    // Selection is shown by a check glyph as well as by colour.
    await expect(first.locator('svg')).toHaveCount(2);

    // Selecting another option moves the state rather than adding to it.
    await second.click();
    await expect(second).toHaveAttribute('data-checked', 'true');
    await expect(first).toHaveAttribute('data-checked', 'false');
  });

  test('back restores the previous selection', async ({ page }) => {
    await gotoQuiz(page);

    await pickOption(page, 1, 1);
    await page.getByRole('button', { name: copy.next }).click();

    await pickOption(page, 2, 3);
    await page.getByRole('button', { name: copy.next }).click();
    expect(await currentQuestionIndex(page)).toBe(2);

    await page.getByRole('button', { name: copy.previous }).click();
    expect(await currentQuestionIndex(page)).toBe(1);
    await expect(page.locator('input[name="q2-option"]').nth(3)).toBeChecked();

    await page.getByRole('button', { name: copy.previous }).click();
    await expect(page.locator('input[name="q1-option"]').nth(1)).toBeChecked();
  });

  test('changing an earlier answer does not clear a later one', async ({ page }) => {
    await gotoQuiz(page);

    await pickOption(page, 1, 0);
    await page.getByRole('button', { name: copy.next }).click();
    await pickOption(page, 2, 1);
    await page.getByRole('button', { name: copy.next }).click();

    await page.getByRole('button', { name: copy.previous }).click();
    await page.getByRole('button', { name: copy.previous }).click();
    await pickOption(page, 1, 2);

    await page.getByRole('button', { name: copy.next }).click();
    await expect(page.locator('input[name="q2-option"]').nth(1)).toBeChecked();
  });

  test('is keyboard navigable', async ({ page }) => {
    await gotoQuiz(page);

    // Tab reaches the first option; arrows move within the group.
    await page.locator('input[name="q1-option"]').first().focus();
    await page.keyboard.press('Space');
    await expect(page.locator('input[name="q1-option"]').first()).toBeChecked();


    await page.keyboard.press('ArrowDown');
    await expect(page.locator('input[name="q1-option"]').nth(1)).toBeChecked();

    // Enter advances from the focused control region.
    await page.getByRole('button', { name: copy.next }).focus();
    await page.keyboard.press('Enter');
    expect(await currentQuestionIndex(page)).toBe(1);
  });

  test('announces progress through a progressbar', async ({ page }) => {
    await gotoQuiz(page);
    const bar = page.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuemin', '1');
    await expect(bar).toHaveAttribute('aria-valuemax', '10');
    await expect(bar).toHaveAttribute('aria-valuenow', '1');

    await pickOption(page, 1, 0);
    await page.getByRole('button', { name: copy.next }).click();
    await expect(bar).toHaveAttribute('aria-valuenow', '2');
  });

  test('keeps every option and both buttons reachable when short', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await gotoQuiz(page);

    await expect(page.getByRole('radio')).toHaveCount(4);
    await expect(page.getByRole('button', { name: copy.next })).toBeVisible();
    await expect(page.getByRole('button', { name: copy.previous })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('gives the option cards a real touch target', async ({ page }) => {
    await gotoQuiz(page);
    expect(await hasTouchTarget(page, 'label:has(input[name="q1-option"])')).toBe(true);
  });
});

test.describe('session persistence', () => {
  test('offers to resume a run in progress', async ({ page }) => {
    await gotoQuiz(page);
    await pickOption(page, 1, 1);
    await page.getByRole('button', { name: copy.next }).click();
    await pickOption(page, 2, 0);
    await page.getByRole('button', { name: copy.next }).click();

    await page.goto('/');
    await expect(page.getByText(copy.resumeTitle)).toBeVisible();
    await expect(page.getByRole('button', { name: copy.resumeContinue })).toBeVisible();

    await page.getByRole('button', { name: copy.resumeContinue }).click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'quiz');
    // Resumed at the first *unanswered* question, not the last answered one.
    await expect(page.getByTestId('quiz-counter')).toHaveText(copy.quizCounter(3));
    // The answers behind it survived: stepping back restores the selection.
    await page.getByRole('button', { name: copy.previous }).click();
    await expect(page.locator('input[name="q2-option"]').first()).toBeChecked();
  });

  test('erase clears the stored run', async ({ page }) => {
    await gotoQuiz(page);
    await pickOption(page, 1, 0);

    await page.goto('/');
    await expect(page.getByText(copy.resumeTitle)).toBeVisible();
    await page.getByTestId('landing-erase').click();
    await expect(page.getByText(copy.resumeTitle)).toBeHidden();

    // A reload must not resurrect it: the storage is genuinely gone.
    await page.reload();
    await expect(page.getByText(copy.resumeTitle)).toBeHidden();
  });
});
