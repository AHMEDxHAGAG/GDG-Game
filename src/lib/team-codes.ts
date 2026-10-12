/**
 * Team join codes.
 *
 * Six characters from `0-9A-F`, generated in Postgres by
 * `public.generate_join_code()`. The alphabet deliberately has no `I`, `O`,
 * `1` or `0`-lookalikes: a code gets read aloud across a room and typed by
 * someone holding a phone, so "is that a one or an ell?" has to be an
 * impossible question.
 */

export const JOIN_CODE_LENGTH = 6;

const JOIN_CODE_PATTERN = /^[0-9A-F]{6}$/;

/**
 * Cleans up what a visitor pasted or typed.
 *
 * Strips spaces and punctuation and upper-cases, so `a3 f-9b2`, `A3F9B2` and
 * `a3f9b2` are the same code. `null` means "that cannot be a code" — the caller
 * shows the field error instead of sending a doomed request.
 */
export function normalizeJoinCode(raw: string): string | null {
  const compact = raw.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  return JOIN_CODE_PATTERN.test(compact) ? compact : null;
}

/** Uppercase, spaced for legibility: `A3F9B2` → `A3 F9 B2`. */
export function formatJoinCode(code: string): string {
  return code.replace(/(.{2})(?=.)/g, '$1 ');
}