'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import { normalizeJoinCode } from '@/lib/team-codes';
import { classifyRoomError, toRoomWithRoster, type Room, type RoomResult, type RoomWithRoster } from '@/features/teams/types';

/**
 * Every room operation the app performs.
 *
 * All of them go through the database RPCs, because `anon` — the role this code
 * runs as — has no table privileges at all. That is the whole access model: the
 * capacity and device credentials are checked where they cannot be skipped, and
 * the client only ever renders the verdict.
 *
 * Public visitor IDs identify roster members. Mutations additionally require a
 * separate device token, whose hash is validated by the database.
 */

/** True when there is no project configured, so nothing can be recorded. */
function unavailable<T>(): RoomResult<T> {
  return { ok: false, error: 'unexpected' };
}

function result<T>(
  outcome: { data: unknown; error: { code?: string; message?: string; details?: string } | null },
  map: (data: unknown) => T,
): RoomResult<T> {
  if (outcome.error) return { ok: false, error: classifyRoomError(outcome.error) };
  try {
    return { ok: true, data: map(outcome.data) };
  } catch {
    // A shape the app cannot read is reported as "something went wrong" rather
    // than crashing the screen.
    return { ok: false, error: 'unexpected' };
  }
}

function toRoom(data: unknown): Room {
  if (typeof data !== 'object' || data === null) throw new Error('room-missing');
  const row = data as Record<string, unknown>;
  const id = row.id;
  const name = row.name;
  const joinCode = row.join_code;
  const ownerId = row.owner_id;
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof joinCode !== 'string' ||
    typeof ownerId !== 'string'
  ) {
    throw new Error('room-malformed');
  }
  return { id, name, joinCode, ownerId, isOwner: false };
}

/** Names the visitor. Idempotent: the same id and name is a no-op server-side. */
export async function claimVisitor(
  visitorId: string,
  visitorToken: string,
  name: string,
): Promise<RoomResult<{ displayName: string }>> {
  const supabase = getSupabaseClient();
  if (!supabase) return unavailable();
  const outcome = await supabase.rpc('claim_visitor', {
    p_visitor_id: visitorId, p_visitor_token: visitorToken, p_name: name,
  });
  return result(outcome, (data) => {
    const displayName = (data as { display_name?: unknown } | null)?.display_name;
    if (typeof displayName !== 'string' || displayName.length === 0) {
      throw new Error('visitor-malformed');
    }
    return { displayName };
  });
}

export async function createRoom(
  visitorId: string,
  visitorToken: string,
  name: string,
  trackId: string,
): Promise<RoomResult<Room>> {
  const supabase = getSupabaseClient();
  if (!supabase) return unavailable();
  const outcome = await supabase.rpc('create_room', {
    p_visitor_id: visitorId,
    p_visitor_token: visitorToken,
    p_name: name,
    p_track_id: trackId,
  });
  return result(outcome, toRoom);
}

export async function joinRoom(
  visitorId: string,
  visitorToken: string,
  code: string,
  trackId: string,
): Promise<RoomResult<Room>> {
  const supabase = getSupabaseClient();
  if (!supabase) return unavailable();

  // Normalised here so a pasted `a3 f9 b2` works, and so an impossible code
  // fails on the field rather than on a round trip.
  const normalized = normalizeJoinCode(code);
  if (!normalized) return { ok: false, error: 'invalid_code' };

  const outcome = await supabase.rpc('join_room', {
    p_visitor_id: visitorId,
    p_visitor_token: visitorToken,
    p_code: normalized,
    p_track_id: trackId,
  });
  return result(outcome, toRoom);
}

/** The room and its roster. Readable by anyone holding the six-character code. */
export async function loadRoom(
  code: string,
  viewerId: string,
): Promise<RoomResult<RoomWithRoster>> {
  const supabase = getSupabaseClient();
  if (!supabase) return unavailable();

  const normalized = normalizeJoinCode(code);
  if (!normalized) return { ok: false, error: 'invalid_code' };

  const outcome = await supabase.rpc('get_room', { p_code: normalized });
  return result(outcome, (data) => {
    const roster = toRoomWithRoster(data, viewerId);
    if (!roster) throw new Error('room-malformed');
    return roster;
  });
}

export async function renameRoom(
  visitorId: string,
  visitorToken: string,
  roomId: string,
  name: string,
): Promise<RoomResult<Room>> {
  const supabase = getSupabaseClient();
  if (!supabase) return unavailable();
  const outcome = await supabase.rpc('rename_room', {
    p_visitor_id: visitorId,
    p_visitor_token: visitorToken,
    p_room_id: roomId,
    p_name: name,
  });
  return result(outcome, toRoom);
}

export async function leaveRoom(
  visitorId: string,
  visitorToken: string,
  roomId: string,
): Promise<RoomResult<boolean>> {
  const supabase = getSupabaseClient();
  if (!supabase) return unavailable();
  const outcome = await supabase.rpc('leave_room', {
    p_visitor_id: visitorId,
    p_visitor_token: visitorToken,
    p_room_id: roomId,
  });
  return result(outcome, (data) => data === true);
}
