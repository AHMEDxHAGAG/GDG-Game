/**
 * Supabase connection settings.
 *
 * Both variables are optional. With neither set the app runs exactly as it did
 * before rooms existed: the quiz, the card and the gallery are all local, and
 * the team screens say plainly that rooms are not switched on rather than
 * throwing.
 *
 * Put the real values in `.env.local` — see `.env.example`.
 */

/** Project URL, e.g. `https://abcdefghijklm.supabase.co`. */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();

/**
 * Publishable (`sb_publishable_…`) key. Never the secret key — every
 * `NEXT_PUBLIC_` variable is shipped to the browser.
 *
 * It is used as an **anonymous** key. There is no login: the key authorises
 * the anonymous role, and the database grants that role nothing but `EXECUTE`
 * on the room functions.
 */
export const SUPABASE_PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
).trim();

/**
 * True when there is a project to talk to.
 *
 * Checked by address shape, not just truthiness: a half-pasted placeholder like
 * `your-project-url` must read as "not configured" rather than producing a
 * confusing DNS error on the first join.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('https://') && SUPABASE_PUBLISHABLE_KEY.length > 0;