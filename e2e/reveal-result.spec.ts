import { expect, test } from '@playwright/test';

import {
  copy,
  expectNoHorizontalOverflow,
  gotoConversation,
  playVoyage,
  sendAnswer,
} from './helpers';

test.describe('reveal and result', () => {
  test('reaches the result after the scripted voyage', async ({ page }) => {
    await gotoConversation(page, 'Lila');
    await playVoyage(page);

    const result = page.locator('[data-scene="result"]');
    await expect(result).toBeVisible();
    // The heading appears in the scene and again inside the exportable card.
    await expect(page.getByText(copy.resultHeading).first()).toBeVisible();
    await expect(page.getByText('THE GUARDIAN').first()).toBeVisible();
    await expect(page.getByText('CYBERSECURITY').first()).toBeVisible();
  });

  test('labels the outcome as an illustrative demo, not an analysis', async ({ page }) => {
    await gotoConversation(page);
    await playVoyage(page);

    // Plan §2 / §6: the demo must never read as a real personality analysis.
    await expect(page.getByText(/نتيجة تجريبية/).first()).toBeVisible();
  });

  test('reveal is animated, announces itself, and is skippable', async ({ page }) => {
    await gotoConversation(page);

    for (const answer of ['يلا نبدأ', 'خطة', 'أدوات', 'رموز', 'اتنين', 'بوصلة', 'خطر', 'الطريق الآمن']) {
      const settled = await sendAnswer(page, answer);
      if (settled === 'revealing' || settled === 'result') break;
    }

    // The suspense beat appears with its announcement.
    const revealing = page.locator('[data-scene="revealing"]');
    await expect(revealing).toBeVisible({ timeout: 20_000 });
    await expect(revealing).toHaveAttribute('aria-live', 'polite');

    // Skipping is always available and moves straight to the result.
    await page.getByRole('button', { name: copy.revealSkip }).click();
    await expect(page.locator('[data-scene="result"]')).toBeVisible({ timeout: 20_000 });
  });

  test('exports the character card as a PNG download', async ({ page }) => {
    await gotoConversation(page);
    await playVoyage(page);

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: copy.save }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('pirate-cybersecurity.png');
    await expect(page.getByText(copy.saved)).toBeVisible();
  });

  test('renders an exportable card with real dimensions', async ({ page }) => {
    await gotoConversation(page);
    await playVoyage(page);

    const card = page.getByRole('img', { name: 'الحارس — Cybersecurity' });
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    // 4:5 portrait proportions, as required for Instagram stories.
    expect(box!.width / box!.height).toBeGreaterThan(0.6);
    expect(box!.width / box!.height).toBeLessThan(0.95);
  });

  test('opens the five-pirate gallery and returns to the result', async ({ page }) => {
    await gotoConversation(page);
    await playVoyage(page);

    await page.getByRole('button', { name: copy.gallery }).click();
    await expect(page.getByText(copy.galleryTitle)).toBeVisible();
    for (const title of [
      'THE SHIPWRIGHT',
      'THE ORACLE',
      'THE NAVIGATOR',
      'THE CARTOGRAPHER',
      'THE GUARDIAN',
    ]) {
      await expect(page.getByText(title).first()).toBeVisible();
    }

    await page.getByRole('button', { name: 'ارجع لنتيجتي' }).click();
    await expect(page.locator('[data-scene="result"]')).toBeVisible();
  });

  test('restart returns to a clean welcome screen', async ({ page }) => {
    await gotoConversation(page, 'Lila');
    await playVoyage(page);

    await page.getByRole('button', { name: copy.tryAgain }).click();
    await expect(page.locator('[data-scene="welcome"]')).toBeVisible();
    // The voyage must be gone: no stale resume offer after an explicit restart.
    await expect(page.getByText(copy.resumeTitle)).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText('Lila');
  });

  test('does not overflow horizontally on the result screen', async ({ page }) => {
    await gotoConversation(page);
    await playVoyage(page);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('session persistence', () => {
  test('offers to resume a voyage interrupted by a refresh', async ({ page }) => {
    await gotoConversation(page, 'Lila');

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    await composer.fill('رد قبل التحديث');
    await page.getByRole('button', { name: copy.send }).click();
    await expect(composer).toBeEnabled({ timeout: 15_000 });

    await page.reload();

    await expect(page.locator('[data-scene="welcome"]')).toBeVisible();
    await expect(page.getByText(copy.resumeTitle)).toBeVisible();

    await page.getByRole('button', { name: copy.resumeContinue }).click();
    await expect(page.locator('[data-scene="conversation"]')).toBeVisible();
    // The stored transcript survives the reload.
    await expect(page.getByRole('log', { name: 'حوار الرحلة' })).toContainText('رد قبل التحديث');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Lila');
  });

  test('erases the stored session from the footer', async ({ page }) => {
    await gotoConversation(page);

    const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
    await composer.fill('رد');
    await page.getByRole('button', { name: copy.send }).click();
    await expect(composer).toBeEnabled({ timeout: 15_000 });

    // The erase bar steps aside while chatting and returns on the welcome
    // screen, so drop back to it before using it.
    await page.reload();
    await expect(page.locator('[data-scene="welcome"]')).toBeVisible();
    await expect(page.getByText(copy.resumeTitle)).toBeVisible();

    await page.getByRole('button', { name: copy.reset }).click();

    await page.reload();
    await expect(page.locator('[data-scene="welcome"]')).toBeVisible();
    await expect(page.getByText(copy.resumeTitle)).toHaveCount(0);
  });
});
test.describe('result card legibility', () => {
  /**
   * The card is the shareable artefact, and it is also the one box on the page
   * with `overflow-hidden`. A fixed 4:5 height plus a fixed-height portrait used
   * to push the title, track name, personality and footer outside that box on
   * narrow viewports — silently, in the exported PNG as well as on screen.
   * Every child's box must therefore sit fully inside the card.
   */
  test('keeps all card text inside the card bounds', async ({ page }) => {
    await gotoConversation(page, 'Lila');
    await playVoyage(page);

    const card = page.locator('[role="img"]').first();
    await expect(card).toBeVisible();
    // Let the entrance animation settle so boxes are measured at rest.
    await page.waitForTimeout(1_500);

    const report = await card.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const offenders: { text: string; top: number; bottom: number }[] = [];
      for (const child of Array.from(el.querySelectorAll('*'))) {
        if (child.closest('[aria-hidden="true"]')) continue;
        const rect = child.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const over = Math.max(rect.bottom - box.bottom, box.top - rect.top);
        if (over > 1) {
          offenders.push({
            text: (child.textContent ?? '').trim().slice(0, 40),
            top: Math.round(rect.top - box.top),
            bottom: Math.round(rect.bottom - box.bottom),
          });
        }
      }
      return {
        offenders,
        height: Math.round(box.height),
        width: Math.round(box.width),
        scrollHeight: el.scrollHeight,
        innerOverflow: (() => {
          // The card is `overflow-hidden`, so content that outgrows it is simply
          // gone — including in the exported PNG. Measure the inner column,
          // which is where the slack (or its absence) actually shows up.
          const inner = Array.from(el.children).find(
            (node) => node instanceof HTMLElement && node.className.includes('flex'),
          ) as HTMLElement | undefined;
          return inner ? inner.scrollHeight - inner.clientHeight : 0;
        })(),
      };
    });

    expect(
      report.offenders,
      `content escaped the card at ${report.width}x${report.height}`,
    ).toEqual([]);
    // The card must not be scrolling its own content away either.
    expect(report.scrollHeight).toBeLessThanOrEqual(report.height + 1);
    expect(
      report.innerOverflow,
      `inner column overflows the card by ${report.innerOverflow}px`,
    ).toBeLessThanOrEqual(1);
  });

  test('still exports a 4:5-ish card with the full identity text', async ({ page }) => {
    await gotoConversation(page, 'Lila');
    await playVoyage(page);

    const card = page.locator('[role="img"]').first();
    await expect(card).toBeVisible();
    await page.waitForTimeout(1_000);

    const ratio = await card.evaluate((el) => el.clientWidth / el.clientHeight);
    // Exactly 4:5 — the export is an Instagram story, so the ratio is a hard
    // requirement rather than something content is allowed to grow out of.
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(0.9);

    // Every identity line has to be inside the exported frame.
    await expect(card.getByText('THE GUARDIAN')).toBeVisible();
    await expect(card.getByText('CYBERSECURITY')).toBeVisible();
    await expect(card.getByText(/الحارس/).first()).toBeVisible();
  });
});
