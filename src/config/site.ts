/**
 * Event / brand configuration.
 *
 * Everything an organiser may need to change for a different campus, event or
 * deployment lives here. Nothing in `src/components` hardcodes copy.
 */

/**
 * Absolute URL used by the projector screen's QR code.
 *
 * Defaults to this deployment's own origin so a fresh `npm run dev` produces a
 * working QR code without inventing a production address. Override with
 * `NEXT_PUBLIC_SITE_URL` before building for the real event.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');

export const site = {
  organization: 'GDGoC',
  organizationLong: 'Google Developer Groups on Campus',
  campus: 'AASTMT Aswan',
  campusLong: 'Arab Academy for Science, Technology & Maritime Transport — Aswan',
  title: 'Discover Your Personality',
  titleAr: 'اكتشف شخصيتك',
  taglineAr: 'أنهي مسار في GDGoC يناسبك؟',
  taglineEn: 'Discover Your Personality',
  themeColor: '#090F22',
  authorGitHub: 'https://github.com/AHMEDxHAGAG',
  /** Question count, mirrored from `content/questions.ts` for landing copy. */
  questionCount: 10,
  communityLinks: {
    discord: null as string | null,
    whatsapp: null as string | null,
    website: null as string | null,
  },
} as const;

export const storageKeys = {
  /** Current quiz session. Bumped to `quiz:*` when the chat system was removed. */
  session: 'gdgoc-pirate-quiz:session',
  /**
   * The retired chat session key. Cleared once on boot so a stale chat payload
   * can never be read back by the quiz.
   */
  legacySession: 'gdgoc-pirate-expedition:session',
  /** Remembered username, so returning visitors keep their card identity. */
  username: 'gdgoc-pirate-quiz:username',
} as const;

/**
 * Username limit. The value is printed on the exported card, which is capped at
 * 1080×1350, so the practical ceiling is line length rather than the counter.
 */
export const MAX_USERNAME_LENGTH = 24;
