import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

import {
  copy,
  expectNoHorizontalOverflow,
  matchRows,
  pickOption,
  playToMatches,
  rankedTrackIds,
  scene,
} from './helpers';
import { QUESTIONS } from '../src/content/questions';
import { TRACK_IDS } from '../src/features/characters/types';
import { TRACK_CONTENT } from '../src/content/tracks';

const PICKS = QUESTIONS.map(() => 0);

/** Plays through, picks the ranked persona at `rowIndex`, waits for the card. */
async function chooseAndOpenCard(page: Page, rowIndex: number) {
  await playToMatches(page, PICKS);
  const listed = await rankedTrackIds(page);
  const trackId = listed[rowIndex]!;
  await matchRows(page).nth(rowIndex).click();
  await expect(scene(page)).toHaveAttribute('data-scene', 'result');
  return { trackId, copy: TRACK_CONTENT[trackId as keyof typeof TRACK_CONTENT] };
}

test.describe('result card', () => {
  test('shows the username and the chosen track', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(copy.usernameLabel).fill('Lila');
    await page.getByRole('button', { name: copy.startCta }).click();

    for (let index = 1; index <= 10; index++) {
      await pickOption(page, index, 0);
      await page
        .getByRole('button', { name: index === 10 ? copy.submit : copy.next })
        .click();
    }
    await expect(scene(page)).toHaveAttribute('data-scene', 'matches', { timeout: 15_000 });

    const trackId = (await rankedTrackIds(page))[0]!;
    await matchRows(page).first().click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'result');

    const card = page.getByTestId('result-card');
    await expect(card).toBeVisible();

    // Username on the card.
    await expect(page.getByTestId('result-card-username')).toContainText('Lila');

    // Track on the card, in both its Arabic and English names.
    await expect(card).toContainText(TRACK_CONTENT[trackId as keyof typeof TRACK_CONTENT].personaTitleAr);
    await expect(card).toContainText(TRACK_CONTENT[trackId as keyof typeof TRACK_CONTENT].trackSubtitleAr);
    await expect(card).toContainText(trackId === 'software-engineering' ? 'Software Engineering' : '');
  });

  test('renders without a username when the visitor skipped it', async ({ page }) => {
    await playToMatches(page, PICKS);
    await matchRows(page).first().click();

    const card = page.getByTestId('result-card');
    await expect(card).toBeVisible();
    await expect(page.getByTestId('result-card-username')).toHaveCount(0);
  });

  test('shows the full explanation on the page and identity on the poster', async ({ page }) => {
    const { copy: content } = await chooseAndOpenCard(page, 0);
    const card = page.getByTestId('result-card');

    await expect(card).toContainText(content.eyebrow);
    await expect(card).toContainText(content.taglineAr);
    const details = page.getByTestId('result-details');
    await expect(card).not.toContainText(content.strengthTitleAr);
    await expect(details).toContainText(content.strengthTitleAr);
    await expect(details).toContainText(content.strengthAr);
    await expect(details).toContainText(content.traitsTitleAr);
    for (const trait of content.traits) {
      await expect(details).toContainText(trait);
    }
    await expect(details).toContainText(content.secondaryEyebrowAr);
  });

  test('every track can reach a card', async ({ page }) => {
    // Pick each track's primary wherever it is offered, so it ranks first.
    const picks = QUESTIONS.map((question) =>
      Math.max(0, question.options.findIndex((option) => option.primary === 'data-science')),
    );
    await playToMatches(page, picks);
    expect((await rankedTrackIds(page))[0]).toBe('data-science');

    await matchRows(page).first().click();
    await expect(page.getByTestId('result-card')).toContainText(TRACK_CONTENT['data-science'].personaTitleAr);
  });

  test('keeps the 4:5 export ratio', async ({ page }) => {
    await chooseAndOpenCard(page, 0);
    const box = await page.getByTestId('result-card').boundingBox();
    expect(box).not.toBeNull();
    // 1080/1350 = 0.8, with a little tolerance for sub-pixel rounding.
    expect(box!.width / box!.height).toBeCloseTo(0.8, 2);
  });

  /**
   * The card frame is `overflow-hidden` at a fixed aspect ratio, so content
   * that is too tall is *clipped and lost* — not scrolled. That silently ate
   * the traits and the secondary-track card once already, so the fit is
   * asserted for all five tracks rather than eyeballed.
   */
  test('never clips its own content, for any track', async ({ page }) => {
    for (const trackId of TRACK_IDS) {
      // Answer so that this track ranks first, then choose it.
      const picks = QUESTIONS.map((question) =>
        Math.max(
          0,
          question.options.findIndex((option) => option.primary === trackId),
        ),
      );
      await playToMatches(page, picks);
      await matchRows(page).first().click();
      await expect(page.getByTestId('result-card')).toBeVisible();

      const overflow = await page.getByTestId('result-card').evaluate((node) => {
        const frame = node.getBoundingClientRect();
        let worst = 0;
        let culprit = '';
        for (const child of node.querySelectorAll('*')) {
          const box = child.getBoundingClientRect();
          if (box.height === 0) continue;
          const past = Math.max(box.bottom - frame.bottom, 0);
          if (past > worst) {
            worst = past;
            culprit = (child.textContent ?? '').slice(0, 40);
          }
        }
        return { worst, culprit, frameHeight: frame.height };
      });

      expect(
        overflow.worst,
        `${trackId}: content overflows the card by ${overflow.worst}px (${overflow.culprit})`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test('downloads a PNG named after the visitor and the track', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(copy.usernameLabel).fill('Lila');
    await page.getByRole('button', { name: copy.startCta }).click();
    for (let index = 1; index <= 10; index++) {
      await pickOption(page, index, 0);
      await page.getByRole('button', { name: index === 10 ? copy.submit : copy.next }).click();
    }
    await expect(scene(page)).toHaveAttribute('data-scene', 'matches', { timeout: 15_000 });
    const trackId = (await rankedTrackIds(page))[0]!;
    await matchRows(page).first().click();

    const download = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByTestId('result-save').click();
    const file = await download;

    expect(file.suggestedFilename()).toBe(`gdgoc-Lila-${trackId}.png`);
    await expect(page.getByText(copy.saved)).toBeVisible();

    // The spec's `share_card.suggested_export_size_px`. Regression guard:
    // html-to-image multiplies `canvasWidth` by `pixelRatio`, and its
    // `width`/`height` options only size the SVG source. Passing all three
    // once shipped a 3240×4050 file, 3x the intended weight.
    const target = test.info().outputPath('card.png');
    await file.saveAs(target);
    const bytes = readFileSync(target);
    const geometry = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    expect(geometry).toEqual({ width: 1080, height: 1350 });
  });

  test('restarts back to a clean landing screen', async ({ page }) => {
    await chooseAndOpenCard(page, 0);
    await page.getByRole('button', { name: copy.restart }).click();

    await expect(scene(page)).toHaveAttribute('data-scene', 'landing');
    await expect(page.getByText(copy.resumeTitle)).toBeHidden();
  });
});

test.describe('result guards', () => {
  test('a hand-edited result URL cannot mint a card', async ({ page }) => {
    // No quiz has been taken, so no track may be selected.
    await page.goto('/result/cybersecurity');
    await expect(scene(page)).toHaveAttribute('data-scene', 'quiz', { timeout: 10_000 });
    await expect(page.getByTestId('result-card')).toHaveCount(0);
  });

  test('an unknown track id falls back to the stored choice', async ({ page }) => {
    const { trackId } = await chooseAndOpenCard(page, 0);
    await page.goto(`/result/${trackId === 'ai' ? 'cybersecurity' : 'ai'}`);
    await expect(page).toHaveURL(new RegExp(`/result/${trackId}$`), { timeout: 10_000 });
  });

  test('does not overflow horizontally', async ({ page }) => {
    await chooseAndOpenCard(page, 0);
    await expectNoHorizontalOverflow(page);
  });
});
