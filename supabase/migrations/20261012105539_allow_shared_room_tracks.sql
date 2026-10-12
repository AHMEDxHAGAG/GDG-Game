-- Multiple visitors may bring the same track into a room. Keep the existing
-- membership primary key, credential checks, and locked four-seat capacity rule.
-- The (room_id, visitor_id) primary key still covers room roster/capacity reads.
begin;

drop index if exists public.room_members_one_track_per_room;

commit;
