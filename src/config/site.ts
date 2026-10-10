/**
 * Event / brand configuration.
 *
 * Everything an organiser may need to change for a different campus, event or
 * deployment lives here. Nothing in `src/components` hardcodes copy.
 */

const env = process.env;

/**
 * Absolute URL used by the projector screen's QR code.
 *
 * Defaults to this deployment's own origin so a fresh `npm run dev` produces a
 * working QR code without inventing a production address. Override with
 * `NEXT_PUBLIC_SITE_URL` before building for the real event.
 */
export const SITE_URL = (env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');

export const site = {
  organization: 'GDGoC',
  organizationLong: 'Google Developer Groups on Campus',
  campus: 'AASTMT Aswan',
  campusLong: 'Arab Academy for Science, Technology & Maritime Transport — Aswan',
  title: 'The Pirate Identity Expedition',
  titleAr: 'رحلة كشف القرصان',
  taglineAr: 'اكتشف القرصان اللي جواك',
  taglineEn: 'Discover Your Pirate Identity',
  themeColor: '#e8d3a3',
  /** Set to true to expose the developer-only result preview switcher. */
  showDevTools: env.NODE_ENV !== 'production' || env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true',
  /**
   * External community links. Intentionally disabled by default — the
   * expedition site owns those destinations and this app must not depend on
   * them. Flip a value to a real URL to enable the button.
   */
  communityLinks: {
    discord: null as string | null,
    whatsapp: null as string | null,
    website: null as string | null,
  },
} as const;

export const storageKeys = {
  session: 'gdgoc-pirate-expedition:session',
  nickname: 'gdgoc-pirate-expedition:nickname',
} as const;

export const MAX_MESSAGE_LENGTH = 600;
export const MAX_NICKNAME_LENGTH = 24;
