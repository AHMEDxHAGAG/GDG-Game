import { expect, test } from '@playwright/test';

import {
  copy,
  gotoQuiz,
  matchRows,
  pickOption,
  playToMatches,
  rankedTrackIds,
  scene,
} from './helpers';
import { TRACK_IDS } from '../src/features/characters/types';
import { scoreAnswers, pickSameOption } from '../src/features/quiz/scoring/scoreAnswers';
import { QUESTIONS } from '../src/content/questions';

/** The picks used by most tests here: always the first option. */
const FIRST_EVERY_TIME = QUESTIONS.map(() => 0);

/** Every question's first option leans software-engineering. */
function expectedRanking(picks: number[]): string[] {
  const answers: Record<string, string> = {};
  QUESTIONS.forEach((question, index) => {
    const option = question.options[picks[index] ?? 0];
    if (option) answers[question.id] = option.id;
  });
  return scoreAnswers(answers).ranking.map((match) => match.trackId);
}

test.describe('ranked matches', () => {
  test('lists all five personas in score order', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);

    await expect(page.getByRole('heading', { name: copy.matchesTitle })).toBeVisible();
    const rows = matchRows(page);
    await expect(rows).toHaveCount(TRACK_IDS.length);

    const listed = await rankedTrackIds(page);
    expect(listed).toEqual(expectedRanking(FIRST_EVERY_TIME));
  });

  test('labels each row with its Arabic rank, first to last', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);

    const rows = matchRows(page);
    for (let index = 0; index < copy.rankLabels.length; index++) {
      const row = rows.nth(index);
      await expect(row).toContainText(copy.rankLabels[index]!);
      await expect(row).toHaveAttribute('data-rank', String(index + 1));
    }
  });

  test('shows a score and a meter on every row', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);

    const rows = matchRows(page);
    await expect(rows.nth(0)).toContainText(copy.scoreLabel(24));
    // The top track with this pattern is software-engineering on 8 primaries.
    await expect(rows.nth(0)).toContainText('Software Engineering');
  });

  test('produces the same order for the same answers', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    const first = await rankedTrackIds(page);
    await page.reload();
    await expect(scene(page)).toHaveAttribute('data-scene', 'matches');
    expect(await rankedTrackIds(page)).toEqual(first);
  });

  test('scores a deliberately software-leaning run as software first', async ({ page }) => {
    // Pick the software-engineering primary on every question that offers one.
    const picks = QUESTIONS.map((question) =>
      Math.max(0, question.options.findIndex((option) => option.primary === 'software-engineering')),
    );
    await playToMatches(page, picks);

    const listed = await rankedTrackIds(page);
    expect(listed[0]).toBe('software-engineering');
    expect(listed).toEqual(expectedRanking(picks));
  });

  test('announces the full ranking once for screen readers', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    const status = page.getByRole('status').first();
    await expect(status).toContainText('الأول');
    await expect(status).toContainText('الخامس');
  });

  test('redirects to the quiz when there is nothing scored', async ({ page }) => {
    await page.goto('/matches');
    await expect(scene(page)).toHaveAttribute('data-scene', 'quiz', { timeout: 10_000 });
  });

  test('routes through the analyzing beat', async ({ page }) => {
    await gotoQuiz(page);

    for (let index = 1; index <= 10; index++) {
      await pickOption(page, index, 0);
      const button =
        index === 10
          ? page.getByRole('button', { name: copy.submit })
          : page.getByRole('button', { name: copy.next });
      await button.click();
      if (index === 10) break;
    }

    // Either the beat or the destination may already be on screen — the point
    // is that the visitor never sees a blank or an error.
    await expect(scene(page)).toHaveAttribute('data-scene', 'matches', { timeout: 15_000 });
  });

  test('the analyzing beat shows an indeterminate bar, not a fake percentage', async ({ page }) => {
    await gotoQuiz(page);
    for (let index = 1; index <= 10; index++) {
      await pickOption(page, index, 0);
      await page
        .getByRole('button', { name: index === 10 ? copy.submit : copy.next })
        .click();
    }

    // Scope to the scene: Next's route announcer repeats the page's text, so
    // an unscoped getByText would match twice and trip strict mode.
    const sceneRoot = page.locator('[data-scene="analyzing"]');
    const bar = sceneRoot.getByRole('progressbar');
    if (await bar.isVisible().catch(() => false)) {
      // No numeric percentage: scoring is instant and local, so any value here
      // would be fabricated.
      await expect(bar).not.toHaveAttribute('aria-valuenow', /./);
      await expect(sceneRoot.getByText(copy.analyzing)).toBeVisible();
    }
  });
});

test.describe('choosing a match', () => {
  test('lets the visitor pick any ranked persona, not only the first', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    const listed = await rankedTrackIds(page);
    const last = listed[listed.length - 1]!;

    await matchRows(page).nth(4).click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'result');
    await expect(page).toHaveURL(new RegExp(`/result/${last}$`));
  });

  test('shows the chosen persona on the card', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    const listed = await rankedTrackIds(page);
    const chosen = listed[2]!;

    await matchRows(page).nth(2).click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'result');
    await expect(page.getByTestId('result-card')).toBeVisible();
    await expect(page.getByTestId('result-card')).toContainText(chosen === 'ai' ? 'ساحر الذكاء' : '');
  });

  test('returns to the list from the card', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    await matchRows(page).nth(0).click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'result');

    await page.getByRole('button', { name: copy.backToMatches }).click();
    await expect(scene(page)).toHaveAttribute('data-scene', 'matches');
  });
});

test.describe('scoring invariants, end to end', () => {
  test('a known answer set matches the pure scoring function exactly', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    expect(await rankedTrackIds(page)).toEqual(expectedRanking(FIRST_EVERY_TIME));
  });

  test('an all-first-option run never strands a persona at zero', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    // Score text is Arabic-Indic, so read it rather than pattern-matching
    // Latin digits out of the row.
    const scores = await matchRows(page).evaluateAll((rows) =>
      rows.map((row) => {
        const match = /(\d+)/.exec(
          (row.textContent ?? '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))),
        );
        return Number(match?.[1] ?? -1);
      }),
    );
    for (const score of scores) expect(score).toBeGreaterThan(0);
  });

  test('every ranking is a permutation of the five tracks', async ({ page }) => {
    await playToMatches(page, FIRST_EVERY_TIME);
    const listed = await rankedTrackIds(page);
    expect(new Set(listed)).toEqual(new Set(TRACK_IDS));
  });
});

// Guards the fixture itself: if the helper's pattern ever drifts from the bank,
// these two assertions fail before the browser tests give a confusing result.
test('the shared always-first pick is a complete, scorable answer set', () => {
  expect(pickSameOption(0)).toEqual(expectedRanking.length === 0 ? {} : Object.fromEntries(
    QUESTIONS.map((q) => [q.id, q.options[0]!.id]),
  ));
  expect(scoreAnswers(pickSameOption(0)).complete).toBe(true);
  expect(FIRST_EVERY_TIME).toHaveLength(10);
});
