/**
 * Room shape, in one place.
 *
 * `ROOM_CAPACITY` is the number that appears in three places and only two of
 * them are in this repo: the `room_members_cap_four` trigger in the migration
 * and this constant. The trigger is what actually refuses a fifth person — this
 * only renders the empty seats and words the error. Keeping the two in step is
 * the whole job of the verification script in `tools/`, which asserts the cap
 * against a real database rather than trusting the number to match.
 *
 * Four people maximum. Teammates may share a track.
 */
export const ROOM_CAPACITY = 4;

/** Matches the `char_length` check on `rooms.name` in the migration. */
export const MAX_ROOM_NAME_LENGTH = 24;
