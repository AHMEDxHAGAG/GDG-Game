import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { copy, expectNoHorizontalOverflow, gotoQuiz, playQuiz, scene } from './helpers';
import { TRACK_IDS } from '../src/features/characters/types';
import { TRACK_CONTENT } from '../src/content/tracks';

test('keeps Start above the fold on the target phone', async ({ page }) => {
  const imageBytes = new Map<string, number>();
  page.on('response', (response) => {
    if (response.url().includes('/assets/')) {
      imageBytes.set(response.url(), Number(response.headers()['content-length'] ?? 0));
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-artwork="final"]')).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready);
  const box = await page.getByRole('button', { name: copy.startCta }).boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await page.waitForLoadState('networkidle');
  expect([...imageBytes.values()].reduce((sum, bytes) => sum + bytes, 0)).toBeLessThan(1_500_000);
});

test('navigates all five gallery cards with controls in RTL', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tracks');
  const next = page.getByRole('button', { name: 'المسار اللي بعده' });
  const previous = page.getByRole('button', { name: 'المسار اللي فات' });
  await expect(previous).toBeDisabled();
  for (const position of ['٢', '٣', '٤', '٥']) {
    await next.click();
    await expect(page.getByRole('status')).toHaveText(`${position} من ٥`);
  }
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(page.getByRole('status')).toHaveText('٤ من ٥');
  await expectNoHorizontalOverflow(page);
});

test('exports all five identity posters with full details on the page', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await gotoQuiz(page, 'عبدالرحمن Ahmed 123456789');
  await playQuiz(page);
  await expect(scene(page)).toHaveAttribute('data-scene', 'matches');
  for (const trackId of TRACK_IDS) {
    await page.locator(`[data-track-id="${trackId}"][data-rank]`).click();
    const card = page.getByTestId('result-card');
    await expect(card).toContainText(TRACK_CONTENT[trackId].personaTitleAr);
    await expect(page.getByTestId('result-details')).toContainText(
      TRACK_CONTENT[trackId].strengthAr,
    );
    await expectNoHorizontalOverflow(page);
    await page.evaluate(() => document.fonts.ready);
    const textFits = await card.evaluate((node) => {
      const frame = node.getBoundingClientRect();
      const title = node.querySelector('[data-testid="poster-title"]')!.getBoundingClientRect();
      const tagline = node.querySelector('[data-testid="poster-tagline"]')!.getBoundingClientRect();
      return (
        title.bottom <= tagline.top + 1 &&
        Array.from(node.querySelectorAll('p, h2, span')).every((text) => {
          const box = text.getBoundingClientRect();
          return (
            box.top >= frame.top + frame.height * 0.1 - 1 &&
            box.bottom <= frame.bottom - frame.height * 0.085 + 1
          );
        })
      );
    });
    expect(textFits, `${trackId}: text must stay clear of the frame and other text`).toBe(true);
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('result-save').click();
    const download = await downloadPromise;
    const path = testInfo.outputPath(`${trackId}.png`);
    await download.saveAs(path);
    const png = readFileSync(path);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1350]);
    await page.screenshot({ path: testInfo.outputPath(`${trackId}-page.png`), fullPage: true });
    await page.getByRole('button', { name: copy.backToMatches }).click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'matches');
  }
});

test('keeps the quiz usable when scene artwork fails', async ({ page }) => {
  await page.route('**/assets/ui/**', (route) => route.abort());
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto('/quiz');
  await page.locator('label:has(input[type="radio"])').first().click();
  await page.getByRole('button', { name: copy.next }).click();
  await expect(page.getByTestId('quiz-counter')).toHaveText(copy.quizCounter(2));
  await expectNoHorizontalOverflow(page);
});

test('keeps the journey usable with text enlarged to 200%', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/', '/tracks', '/present']) {
      await page.goto(route);
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%';
        await document.fonts.ready;
      });
      await expectNoHorizontalOverflow(page);
    }
  }
  await gotoQuiz(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  for (let question = 1; question <= 10; question++) {
    await expectNoHorizontalOverflow(page);
    await page.locator('label:has(input[type="radio"])').first().click();
    await page.getByRole('button', { name: question === 10 ? copy.submit : copy.next }).click();
  }
  await expect(scene(page)).toHaveAttribute('data-scene', 'matches');
  await expectNoHorizontalOverflow(page);
  await page.locator('[data-track-id][data-rank]').first().click();
  await expect(page.getByTestId('result-details')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
