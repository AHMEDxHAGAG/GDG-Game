import { expect, type Locator, type Page } from '@playwright/test';

import { QUESTIONS } from '../src/content/questions';
import { TOTAL_POINTS } from '../src/features/quiz/types';

export const copy = {
  landingHeadline: 'اكتشف',
  usernameLabel: 'اسمك على الكارت إيه؟',
  startCta: 'ابدأ الاختبار',
  skipUsername: 'من غير اسم',
  tracksCta: 'شوف المسارات',

  quizCounter: (index: number) => `السؤال ${ar(index)} من ${ar(10)}`,
  optionsLegend: 'اختار إجابة واحدة',
  previous: 'اللي فات',
  next: 'كمّل',
  submit: 'شوف النتيجة',

  analyzing: 'بنحسب نتيجتك…',

  matchesTitle: 'ترتيب شخصياتك',
  matchesSubtitle: 'اختار الشخصية اللي شايفها أقرب ليك',

  rankLabels: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'],
  scoreLabel: (score: number) => `${ar(score)} نقطة`,

  save: 'احفظ الكارت',
  saved: 'الكارت اتحمّل',
  backToMatches: 'ارجع للترتيب',
  restart: 'جرّب تاني',

  reset: 'امسح إجاباتي',
  resumeTitle: 'عندك اختبار لسه مخلصتوش',
  resumeContinue: 'كمل الاختبار',

  presentScan: 'Scan the QR Code',
} as const;

/** Arabic-Indic digits, matching what the app renders. */
export function ar(value: number): string {
  return String(value).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)] ?? d);
}

/** The scene wrapper for the current route. */
export function scene(page: Page): Locator {
  return page.locator('[data-scene]');
}

/**
 * Walks the landing screen to the quiz, optionally setting a username.
 *
 * The field is filled through the label so the test does not depend on the
 * generated input id.
 */
export async function gotoQuiz(page: Page, username?: string): Promise<void> {
  await page.goto('/');
  await expect(scene(page)).toHaveAttribute('data-scene', 'landing');
  if (username !== undefined) {
    await page.getByLabel(copy.usernameLabel).fill(username);
  }
  await page.getByRole('button', { name: copy.startCta }).click();
  await expect(scene(page)).toHaveAttribute('data-scene', 'quiz');
}

/**
 * Clicks the option card at `optionIndex` (0-3) for the 1-based `question`.
 *
 * Clicking the `<label>` rather than the `<input>` is deliberate: the radio is
 * `sr-only` (1px, clipped), so its own box is not where a finger lands. The
 * label is the real touch target and is what a visitor actually taps.
 */
export async function pickOption(page: Page, question: number, optionIndex: number): Promise<void> {
  await page.locator(`label:has(input[name="q${question}-option"])`).nth(optionIndex).click();
  await expect(page.locator(`input[name="q${question}-option"]`).nth(optionIndex)).toBeChecked();
}

/**
 * Picks option `optionIndex` (0-3) on the current question and advances.
 *
 * On the last question this presses the submit button instead of Next, which
 * is what the spec's final-step label calls for.
 */
export async function answerQuestion(page: Page, optionIndex: number): Promise<void> {
  const question = await currentQuestionIndex(page);
  await pickOption(page, question + 1, optionIndex);

  const last = question === QUESTIONS.length - 1;
  const button = last
    ? page.getByRole('button', { name: copy.submit })
    : page.getByRole('button', { name: copy.next });
  await expect(button).toBeEnabled();
  await button.click();
}

/** Reads the 0-based question index from the counter text. */
export async function currentQuestionIndex(page: Page): Promise<number> {
  const text = (await page.getByTestId('quiz-counter').innerText()).trim();
  const match = /(\d+)/.exec(text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
  if (!match?.[1]) throw new Error(`Could not read the question counter from "${text}"`);
  return Number(match[1]) - 1;
}

/** Answers every question with the given option indices. */
export async function playQuiz(
  page: Page,
  picks: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
): Promise<void> {
  for (const pick of picks) await answerQuestion(page, pick);
}

/** Plays through and lands on the ranked matches screen. */
export async function playToMatches(page: Page, picks?: number[]): Promise<void> {
  await gotoQuiz(page);
  await playQuiz(page, picks);
  await expect(scene(page)).toHaveAttribute('data-scene', 'matches', { timeout: 15_000 });
}

/** The five ranked rows, best first. */
export function matchRows(page: Page): Locator {
  return page.locator('[data-track-id][data-rank]');
}

/** The track ids in the order the matches screen lists them. */
export async function rankedTrackIds(page: Page): Promise<string[]> {
  return matchRows(page).evaluateAll((rows) =>
    rows.map((row) => row.getAttribute('data-track-id') ?? ''),
  );
}

/** Asserts the page does not scroll sideways at the current viewport. */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scroll: doc.scrollWidth, client: doc.clientWidth };
  });
  // Allow one device pixel of sub-pixel rounding.
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1);
}

/** True when an element is visible and at least 44px on its smaller axis. */
export async function hasTouchTarget(page: Page, selector: string): Promise<boolean> {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) return false;
  return Math.min(box.width, box.height) >= 44;
}

export { TOTAL_POINTS };
