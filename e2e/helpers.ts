import { expect, type Page } from '@playwright/test';

/** Copy is owned by `src/content/ui.ts`; the specs reference it through here. */
export const copy = {
  welcomeCta: 'يلا نبدأ المغامرة!',
  nicknameSkip: 'مش هحدد، سميّني اللي تحب',
  resumeTitle: 'عندك مغامرة لسه مخلصتهاش!',
  resumeContinue: 'كمل المغامرة',
  composerPlaceholder: 'اكتب ردك يا قرصان...',
  send: 'إرسال',
  revealSkip: 'تخطّي الكشف',
  resultHeading: 'YOUR PIRATE IDENTITY',
  chosen: 'THE CAPTAIN HAS CHOSEN…',
  save: 'احفظ كارت الشخصية',
  share: 'شارك قرصانك',
  saved: 'تم تحميل الكارت',
  tryAgain: 'جرّب المغامرة تاني',
  gallery: 'شوف القراصنة الخمسة',
  galleryTitle: 'قراصنة GDGoC الخمسة',
  reset: 'امسح الرحلة',
} as const;

/**
 * The scripted voyage: the captain poses 7 scenarios after an intro beat, and
 * the closing line lands on the reply that answers the last one — so a full
 * playthrough is 8 player messages (1 opener + 7 scenario answers).
 */
export const SCENARIO_COUNT = 7;

export const ANSWERS = [
  'يلا نبدأ',
  'هعمل خريطة وأكتب كل حاجة لقيتها',
  'بفك الأجزاء دي ورا بعض الأول',
  'هحاول أقرأ الأرقام وأربطها ببعض',
  'هسمع الاتنين وأدور على حل يجمعهم',
  'هخترع بوصلة بتقول لنا فين وإيه اللي فاكرينه',
  'هقول حد يبعد الطاقم وأنا أتأكد بنفسي',
  'الطريق الآمن، صح أنا مستعجل بس مش عايز نضيع',
];

/**
 * Waits for the conversation scene, skipping the boarding animation so specs
 * do not depend on its duration.
 */
export async function gotoConversation(page: Page, nickname?: string): Promise<void> {
  await page.goto('/');
  await expect(page.locator('[data-scene="welcome"]')).toBeVisible();

  if (nickname !== undefined) {
    await page.getByLabel('نندهلك بإيه يا قرصان؟').fill(nickname);
  }
  await page.getByRole('button', { name: copy.welcomeCta }).click();
  await expect(page.locator('[data-scene="conversation"]')).toBeVisible();
}

type CaptainState = 'ready' | 'thinking' | 'revealing' | 'result' | 'gone';

/**
 * Polls the page until the captain has answered.
 *
 * Deliberately reads the DOM through a single `evaluate` instead of locators:
 * once the voyage closes the textarea unmounts, and any locator query that
 * waits for it would block for the full timeout instead of reporting state.
 */
async function waitForCaptain(page: Page, timeoutMs = 20_000): Promise<CaptainState> {
  const deadline = Date.now() + timeoutMs;
  let last: CaptainState = 'thinking';

  while (Date.now() < deadline) {
    const probe = await page.evaluate(() => {
      const scenes = Array.from(document.querySelectorAll('[data-scene]')).map((node) =>
        node.getAttribute('data-scene'),
      );
      const textarea = document.querySelector('textarea');
      return { scenes, enabled: textarea ? !textarea.disabled : null };
    });

    if (probe.scenes.includes('revealing')) return 'revealing';
    if (probe.scenes.includes('result')) return 'result';
    if (probe.enabled === true) return 'ready';
    // No textarea at all (unmounted for the reveal) with no reveal scene yet.
    last = probe.enabled === false ? 'thinking' : 'gone';
    await page.waitForTimeout(100);
  }

  return last;
}

/**
 * Sends one free-text answer and waits until the captain has responded.
 *
 * Returns 'revealing'/'result' if that reply closed the voyage, in which case
 * the composer is gone for good.
 */
export async function sendAnswer(page: Page, answer: string): Promise<CaptainState> {
  const composer = page.getByRole('textbox', { name: copy.composerPlaceholder });
  const send = page.getByRole('button', { name: copy.send });

  await expect(composer).toBeEnabled();
  await composer.fill(answer);
  await send.click();

  // Anchor on the send actually landing: the composer clears itself in the same
  // handler that dispatches, so this cannot race ahead of React. Without it the
  // next call could type over a message still in flight.
  await expect(composer).toHaveValue('', { timeout: 15_000 });

  const settled = await waitForCaptain(page);
  expect(settled, 'captain never finished replying').not.toBe('thinking');
  return settled;
}

/**
 * Plays the whole scripted voyage and returns once the result is on screen.
 *
 * `skipReveal` exercises the suspense gate's skip affordance rather than
 * waiting out the full timeline.
 */
export async function playVoyage(page: Page, skipReveal = true): Promise<void> {
  for (const answer of ANSWERS) {
    const settled = await sendAnswer(page, answer);
    if (settled === 'revealing' || settled === 'result') break;
  }

  if (skipReveal) {
    const skip = page.getByRole('button', { name: copy.revealSkip });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
    }
  }

  await expect(page.locator('[data-scene="result"]')).toBeVisible({ timeout: 20_000 });
}

/** Fails the test if the document scrolls horizontally. */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scroll: doc.scrollWidth, client: doc.clientWidth };
  });
  // Allow a 1px rounding tolerance.
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1);
}