import { TRACK_IDS, type TrackId } from '@/features/characters/types';

/**
 * Typed route builders.
 *
 * `next.config.ts` sets `typedRoutes: true`, so every `router.push` and `Link`
 * href is checked against the generated route union. A bare template literal
 * widens to `string` and fails; going through a function whose return type is
 * the template-literal union keeps the check intact at every call site.
 */

export type ResultRoute = `/result/${TrackId}`;

/** `/team/A3F9B2` and friends. */
export type TeamRoute = `/team/${string}`;

/** The team hub. */
export const CREATE_GROUPS_ROUTE = '/create-groups' as const;

/** `/result/software-engineering` and friends. */
export function resultRoute(trackId: TrackId): ResultRoute {
  // The map lookup proves at compile time that `trackId` is a real track, so
  // the interpolation below is always one of the five generated routes.
  const known = TRACK_IDS.includes(trackId);
  if (!known) throw new Error(`Unknown track id: ${trackId}`);
  return `/result/${trackId}`;
}

/**
 * `/team/<join code>`.
 *
 * A template-literal return type rather than a widened `string`, so the
 * `typedRoutes` check still fires at the call site. The code itself is
 * arbitrary, hence `${string}` rather than the closed union `ResultRoute` uses.
 */
export function teamRoute(joinCode: string): TeamRoute {
  return `/team/${joinCode}`;
}

/** True when a string is one of the five result routes. */
export function isResultRoute(value: string): value is ResultRoute {
  return TRACK_IDS.some((track) => value === `/result/${track}`);
}

/** Extracts the track id from a result route, or null if it is not one. */
export function trackIdFromRoute(value: string): TrackId | null {
  for (const track of TRACK_IDS) {
    if (value === `/result/${track}`) return track;
  }
  return null;
}
