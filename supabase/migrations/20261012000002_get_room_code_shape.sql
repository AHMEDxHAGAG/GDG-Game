-- Align `get_room` with `join_room` on join-code validation.
--
-- Why a separate migration rather than editing ...001: ...001 has already been
-- applied three times. Editing it would make the file disagree with what is
-- live, and a fresh environment replaying it would diverge from the database
-- everyone is testing against. This file moves the database forward from where
-- it actually is.

begin;

create or replace function public.get_room(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_members jsonb;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  -- Same check `join_room` makes, for the same reason. `get_room` is callable by
  -- any anon key holder — the code is the only credential — so it cannot assume
  -- the client ran `normalizeJoinCode` first, even though the app does. Without
  -- this, a mistyped code reports `room_not_found`, which reads as "no such
  -- room" rather than "that is not a code", and sends the visitor looking for a
  -- room that never existed instead of retyping the six characters.
  if v_code !~ '^[0-9A-F]{6}$' then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;

  select * into v_room
  from public.rooms
  where join_code = v_code;

  if not found then
    raise exception 'room_not_found' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'visitor_id', m.visitor_id,
             'name', v.display_name,
             'track_id', m.track_id,
             'joined_at', m.joined_at
           )
           -- Owner first, then arrival order — the same order the roster is
           -- sorted into on the client, so the payload is already displayable.
           order by (m.visitor_id = v_room.owner_id) desc, m.joined_at
         ), '[]'::jsonb)
  into v_members
  from public.room_members m
  join public.visitors v on v.id = m.visitor_id
  where m.room_id = v_room.id;

  return jsonb_build_object(
    'id', v_room.id,
    'name', v_room.name,
    'join_code', v_room.join_code,
    'owner_id', v_room.owner_id,
    'created_at', v_room.created_at,
    'members', v_members
  );
end;
$$;

-- `create or replace` preserves existing privileges, but this function is the
-- one entry point anon uses to read a roster, so the grant is asserted rather
-- than assumed: losing it would break every room screen rather than fail loudly
-- at deploy time.
revoke execute on function public.get_room(text) from PUBLIC;
grant execute on function public.get_room(text) to anon;

commit;
