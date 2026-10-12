import { TRACK_IDS, isTrackId, type TrackId } from '@/features/characters/types';

/** A room, as the app reads it. Mirrors the `rooms` row plus the caller's role. */
export interface Room {
  readonly id: string;
  readonly name: string;
  readonly joinCode: string;
  /** The visitor who created it; the only one allowed to rename it. */
  readonly ownerId: string;
  readonly isOwner: boolean;
}

/** One member and the track they bring. */
export interface RoomMember {
  readonly visitorId: string;
  readonly name: string;
  readonly trackId: TrackId;
  readonly joinedAt: string;
  readonly isOwner: boolean;
}

/** A room plus its roster, as `get_room` returns it. */
export interface RoomWithRoster {
  readonly room: Room;
  readonly members: RoomMember[];
}

/**
 * Why a create/join attempt failed, in a form the UI can speak.
 *
 * Postgres raises these as message text on a custom SQLSTATE, so this is the
 * wire format: the call returns the code and the scene picks the sentence.
 * Adding a database error means adding a code here and an Arabic string in
 * `content/ui.ts` — not touching the component.
 */
export type RoomErrorCode =
  | 'unknown_visitor'
  | 'invalid_name'
  | 'invalid_code'
  | 'room_not_found'
  | 'room_full'
  | 'track_taken'
  | 'already_joined'
  | 'not_room_owner'
  | 'unexpected';

export type RoomResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: RoomErrorCode };

/** Postgres unique-violation SQLSTATE. */
const UNIQUE_VIOLATION = '23505';

/**
 * PostgREST wraps a raised exception as
 * `{ code, message, details, hint }`. A trigger or constraint violation is the
 * interesting part, so both the message and the details are scanned for the
 * marker the migration raises by name.
 */
export function classifyRoomError(error: {
  code?: string;
  message?: string;
  details?: string;
} | null): RoomErrorCode {
  if (!error) return 'unexpected';
  const haystack = `${error.message ?? ''} ${error.details ?? ''}`;
  const known: RoomErrorCode[] = [
    'unknown_visitor',
    'invalid_name',
    'invalid_code',
    'room_not_found',
    'room_full',
    'already_joined',
    'not_room_owner',
  ];
  const matched = known.find((code) => haystack.includes(code));
  if (matched) return matched;

  /*
   * The one-track-per-room rule is an index, not a RAISE, so it comes back as a
   * bare unique violation with none of our markers in the payload. It still has
   * to read as "that track is taken" rather than "something went wrong",
   * because it is the single most likely refusal a visitor hits — more likely
   * than a full room, because four of the five tracks being taken is easy to
   * reach by accident.
   */
  if (
    error.code === UNIQUE_VIOLATION ||
    haystack.includes('room_members_one_track_per_room')
  ) {
    return 'track_taken';
  }
  return 'unexpected';
}

/**
 * Narrows a value that came back from the database to a `TrackId`.
 *
 * The column is a Postgres domain over a fixed five-value list, so a value
 * outside it means the database is ahead of this build. Nulling it here leaves
 * one unlabelled seat instead of rendering a card for a persona that does not
 * exist.
 */
export function toTrackId(value: unknown): TrackId | null {
  return isTrackId(value) && (TRACK_IDS as readonly string[]).includes(value) ? value : null;
}

/**
 * The `members` array from `get_room`, as displayable members.
 *
 * The database already orders it owner-first, but the sort is repeated here so
 * the client is correct on its own terms rather than depending on a `jsonb_agg`
 * ordering clause staying put.
 */
export function toRoomWithRoster(
  payload: unknown,
  viewerId: string,
): RoomWithRoster | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const raw = payload as Record<string, unknown>;

  const id = raw.id;
  const name = raw.name;
  const joinCode = raw.join_code;
  const ownerId = raw.owner_id;
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof joinCode !== 'string' ||
    typeof ownerId !== 'string'
  ) {
    return null;
  }

  const rawMembers = Array.isArray(raw.members) ? raw.members : [];

  const members: RoomMember[] = [];
  for (const entry of rawMembers) {
    if (typeof entry !== 'object' || entry === null) continue;
    const member = entry as Record<string, unknown>;
    const trackId = toTrackId(member.track_id);
    if (!trackId) continue;
    const visitorId = member.visitor_id;
    if (typeof visitorId !== 'string') continue;
    members.push({
      visitorId,
      name: typeof member.name === 'string' ? member.name : 'Pirate',
      trackId,
      joinedAt: typeof member.joined_at === 'string' ? member.joined_at : '',
      isOwner: visitorId === ownerId,
    });
  }

  return {
    room: { id, name, joinCode, ownerId, isOwner: ownerId === viewerId },
    members: sortMembers(members),
  };
}

/** Owner first, then arrival order. */
export function sortMembers(members: readonly RoomMember[]): RoomMember[] {
  return [...members].sort((a, b) => {
    if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
    return a.joinedAt.localeCompare(b.joinedAt);
  });
}