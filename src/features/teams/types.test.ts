import { describe, expect, it } from 'vitest';

import {
  classifyRoomError,
  sortMembers,
  toRoomWithRoster,
  toTrackId,
  type RoomMember,
} from '@/features/teams/types';

describe('classifyRoomError', () => {
  it('reads the marker out of a raised exception', () => {
    for (const code of [
      'unknown_visitor',
      'invalid_name',
      'invalid_code',
      'room_not_found',
      'room_full',
      'already_joined',
      'not_room_owner',
    ] as const) {
      expect(classifyRoomError({ message: code })).toBe(code);
    }
  });

  /*
   * Postgres puts the RAISE text in `message` and the detail line in `details`,
   * but not always in that order and not always both populated. Whichever one
   * PostgREST happened to fill is the one we have to read.
   */
  it('finds the marker when it only appears in the detail line', () => {
    expect(classifyRoomError({ message: 'failed', details: 'room_full' })).toBe('room_full');
  });

  /*
   * The one-track-per-room rule is an index, not a RAISE, so it comes back as a
   * bare unique violation with no marker of ours in the payload. It is also the
   * refusal a visitor is most likely to hit — four of five tracks taken is easy
   * to reach by accident — so it has to read as "that track is taken" rather
   * than "something went wrong".
   */
  it('maps a unique violation to track_taken', () => {
    expect(classifyRoomError({ code: '23505' })).toBe('track_taken');
    expect(
      classifyRoomError({
        code: '23505',
        message: 'duplicate key value violates unique constraint "room_members_one_track_per_room"',
      }),
    ).toBe('track_taken');
  });

  it('falls back to something honest when nothing is recognised', () => {
    expect(classifyRoomError({ code: '57014', message: 'statement timeout' })).toBe('unexpected');
    expect(classifyRoomError(null)).toBe('unexpected');
  });
});

describe('toTrackId', () => {
  it('passes the five real tracks through', () => {
    expect(toTrackId('software-engineering')).toBe('software-engineering');
    expect(toTrackId('cybersecurity')).toBe('cybersecurity');
  });

  /*
   * The column is a Postgres domain over five values, so a sixth can only mean
   * the database is ahead of this build. Rendering a card for a persona that
   * does not exist would throw further down; nulling it leaves one unlabelled
   * seat instead.
   */
  it('rejects anything the app has no character for', () => {
    expect(toTrackId('quantum-computing')).toBeNull();
    expect(toTrackId('')).toBeNull();
    expect(toTrackId(null)).toBeNull();
    expect(toTrackId(undefined)).toBeNull();
    expect(toTrackId(7)).toBeNull();
  });
});

describe('toRoomWithRoster', () => {
  const payload = {
    id: 'room-1',
    name: 'طاقم القبطان',
    join_code: 'A3F9B2',
    owner_id: 'visitor-1',
    members: [
      { visitor_id: 'visitor-1', name: 'Ahmed', track_id: 'ai', joined_at: '2026-01-01' },
      { visitor_id: 'visitor-2', name: 'Mona', track_id: 'web-development', joined_at: '2026-01-02' },
    ],
  };

  it('maps a good payload', () => {
    const roster = toRoomWithRoster(payload, 'visitor-1');
    expect(roster?.room).toEqual({
      id: 'room-1',
      name: 'طاقم القبطان',
      joinCode: 'A3F9B2',
      ownerId: 'visitor-1',
      isOwner: true,
    });
    expect(roster?.members).toHaveLength(2);
    expect(roster?.members[0]?.isOwner).toBe(true);
  });

  it('reports ownership relative to whoever is looking', () => {
    expect(toRoomWithRoster(payload, 'visitor-2')?.room.isOwner).toBe(false);
    expect(toRoomWithRoster(payload, 'visitor-9')?.room.isOwner).toBe(false);
  });

  /*
   * The payload crosses a network boundary from a SECURITY DEFINER function, so
   * it is untrusted input. Every field is read defensively: a room whose header
   * is unreadable is null so the scene shows "no such room", and a single
   * unrecognised member is skipped rather than taking the roster with it.
   */
  it('rejects a payload missing its header', () => {
    expect(toRoomWithRoster(null, 'visitor-1')).toBeNull();
    expect(toRoomWithRoster({ ...payload, id: undefined }, 'visitor-1')).toBeNull();
    expect(toRoomWithRoster({ ...payload, join_code: 42 }, 'visitor-1')).toBeNull();
    expect(toRoomWithRoster('nonsense', 'visitor-1')).toBeNull();
  });

  it('skips a member with an unknown track but keeps the rest', () => {
    const roster = toRoomWithRoster(
      {
        ...payload,
        members: [
          { visitor_id: 'visitor-1', name: 'Ahmed', track_id: 'ai', joined_at: '2026-01-01' },
          { visitor_id: 'visitor-3', name: 'Ghost', track_id: 'quantum-computing', joined_at: '2026-01-02' },
          { visitor_id: 'visitor-2', name: 'Mona', track_id: 'web-development', joined_at: '2026-01-03' },
        ],
      },
      'visitor-1',
    );
    expect(roster?.members.map((m) => m.name)).toEqual(['Ahmed', 'Mona']);
  });

  it('copes with an empty or missing member list', () => {
    expect(toRoomWithRoster({ ...payload, members: [] }, 'visitor-1')?.members).toEqual([]);
    expect(toRoomWithRoster({ ...payload, members: null }, 'visitor-1')?.members).toEqual([]);
  });
});

describe('sortMembers', () => {
  const member = (over: Partial<RoomMember>): RoomMember => ({
    visitorId: 'u',
    name: 'Pirate',
    trackId: 'ai',
    joinedAt: '2026-01-01T00:00:00.000Z',
    isOwner: false,
    ...over,
  });

  it('puts the owner first', () => {
    const later = member({ visitorId: 'b', joinedAt: '2026-02-01T00:00:00.000Z' });
    const owner = member({ visitorId: 'a', isOwner: true, joinedAt: '2026-03-01T00:00:00.000Z' });
    expect(sortMembers([later, owner]).map((m) => m.visitorId)).toEqual(['a', 'b']);
  });

  it('orders everyone else by arrival', () => {
    const sorted = sortMembers([
      member({ visitorId: 'c', joinedAt: '2026-03-01T00:00:00.000Z' }),
      member({ visitorId: 'a', joinedAt: '2026-01-01T00:00:00.000Z' }),
      member({ visitorId: 'b', joinedAt: '2026-02-01T00:00:00.000Z' }),
    ]);
    expect(sorted.map((m) => m.visitorId)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input', () => {
    const input = [
      member({ visitorId: 'b', joinedAt: '2026-02-01T00:00:00.000Z' }),
      member({ visitorId: 'a', joinedAt: '2026-01-01T00:00:00.000Z' }),
    ];
    const copy = [...input];
    sortMembers(input);
    expect(input).toEqual(copy);
  });
});