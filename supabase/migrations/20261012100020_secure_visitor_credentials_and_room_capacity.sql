-- Public roster IDs are identifiers, not credentials. Legacy IDs were exposed;
-- never allow callers to adopt them by presenting that ID alone. Existing rows
-- get an unknowable token hash, while the client starts a fresh v2 identity.
-- No visitor/room data is deleted. Deploy this migration with the updated client.
begin;

alter table public.visitors add column credential_hash bytea not null
  default sha256(convert_to(gen_random_uuid()::text, 'UTF8'));
alter table public.visitors alter column credential_hash drop default;

-- Remove the insecure overloads, not just their PUBLIC grants: anon had direct
-- EXECUTE grants and PostgREST could otherwise continue exposing the old API.
drop function public.claim_visitor(uuid, text);
drop function public.create_room(uuid, text, public.track_id);
drop function public.join_room(uuid, text, public.track_id);
drop function public.rename_room(uuid, uuid, text);
drop function public.leave_room(uuid, uuid);

create schema if not exists private;
revoke all on schema private from PUBLIC, anon, authenticated;

create or replace function private.require_visitor(p_visitor_id uuid, p_visitor_token uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_visitor_token is null or not exists (
    select 1 from public.visitors
    where id = p_visitor_id
      and credential_hash = sha256(convert_to(p_visitor_token::text, 'UTF8'))
  ) then
    raise exception 'unknown_visitor' using errcode = '42501';
  end if;
end;
$$;
revoke all on function private.require_visitor(uuid, uuid) from PUBLIC, anon, authenticated;

create function public.claim_visitor(p_visitor_id uuid, p_visitor_token uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(btrim(coalesce(p_name, '')), 24);
  v_hash bytea := sha256(convert_to(p_visitor_token::text, 'UTF8'));
  v_id uuid;
begin
  if p_visitor_id is null or p_visitor_token is null or p_visitor_id = p_visitor_token then
    raise exception 'unknown_visitor' using errcode = '42501';
  end if;
  if char_length(v_name) = 0 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  -- The conflict predicate also handles concurrent first claims: a losing
  -- claimant with a different token cannot replace the winning credential/name.
  insert into public.visitors (id, display_name, credential_hash)
  values (p_visitor_id, v_name, v_hash)
  on conflict (id) do update set display_name = excluded.display_name
    where public.visitors.credential_hash = excluded.credential_hash
  returning id into v_id;
  if v_id is null then
    raise exception 'unknown_visitor' using errcode = '42501';
  end if;
  -- Never return the table composite: it now contains a credential hash.
  return jsonb_build_object('id', v_id, 'display_name', v_name);
end;
$$;

create or replace function public.enforce_room_cap_four()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if TG_OP = 'UPDATE' then
    if old.room_id = new.room_id then return new; end if;
  end if;
  -- One serialization point shared by every insertion path. The count runs
  -- after acquiring this lock, so a waiting join sees the committed new seat.
  perform 1 from public.rooms where id = new.room_id for update;
  if (select count(*) from public.room_members where room_id = new.room_id) >= 4 then
    raise exception 'room_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger room_members_cap_four on public.room_members;
create trigger room_members_cap_four
  before insert or update of room_id on public.room_members
  for each row execute function public.enforce_room_cap_four();

create function public.create_room(
  p_visitor_id uuid, p_visitor_token uuid, p_name text, p_track_id public.track_id
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_name text := left(btrim(coalesce(p_name, '')), 24);
  v_attempt integer := 0;
begin
  perform private.require_visitor(p_visitor_id, p_visitor_token);
  if char_length(v_name) = 0 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  -- Claiming is a separate operation: p_name names the room, not its owner.
  loop
    begin
      insert into public.rooms (name, join_code, owner_id)
      values (v_name, public.generate_join_code(), p_visitor_id)
      returning * into v_room;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 5 then
        raise exception 'code_collision' using errcode = 'P0001';
      end if;
    end;
  end loop;
  insert into public.room_members (room_id, visitor_id, track_id)
  values (v_room.id, p_visitor_id, p_track_id);
  update public.visitors set track_id = p_track_id where id = p_visitor_id;
  return v_room;
end;
$$;

create function public.join_room(
  p_visitor_id uuid, p_visitor_token uuid, p_code text, p_track_id public.track_id
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  perform private.require_visitor(p_visitor_id, p_visitor_token);
  if v_code !~ '^[0-9A-F]{6}$' then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  -- Lock before any membership/capacity check, not only before the insert.
  select * into v_room from public.rooms where join_code = v_code for update;
  if not found then
    raise exception 'room_not_found' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.room_members
    where room_id = v_room.id and visitor_id = p_visitor_id
  ) then
    raise exception 'already_joined' using errcode = 'P0001';
  end if;
  if (select count(*) from public.room_members where room_id = v_room.id) >= 4 then
    raise exception 'room_full' using errcode = 'P0001';
  end if;
  insert into public.room_members (room_id, visitor_id, track_id)
  values (v_room.id, p_visitor_id, p_track_id);
  update public.visitors set track_id = p_track_id where id = p_visitor_id;
  return v_room;
end;
$$;

create function public.rename_room(
  p_visitor_id uuid, p_visitor_token uuid, p_room_id uuid, p_name text
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_name text := left(btrim(coalesce(p_name, '')), 24);
begin
  perform private.require_visitor(p_visitor_id, p_visitor_token);
  if char_length(v_name) = 0 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  update public.rooms set name = v_name
  where id = p_room_id and owner_id = p_visitor_id
  returning * into v_room;
  if not found then
    raise exception 'not_room_owner' using errcode = '42501';
  end if;
  return v_room;
end;
$$;

create function public.leave_room(p_visitor_id uuid, p_visitor_token uuid, p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_visitor(p_visitor_id, p_visitor_token);
  -- Use the same room lock as joining, so leaving cannot race a seat count.
  perform 1 from public.rooms where id = p_room_id for update;
  delete from public.room_members where room_id = p_room_id and visitor_id = p_visitor_id;
  return found;
end;
$$;

-- get_room deliberately keeps its public ID-only roster shape. These IDs are
-- now unusable as mutation credentials; neither tokens nor hashes are returned.
comment on table public.visitors is
  'Public device IDs and names. Mutations require a separate device token; only its SHA-256 hash is stored.';

revoke all on function public.claim_visitor(uuid, uuid, text) from PUBLIC, anon, authenticated;
revoke all on function public.create_room(uuid, uuid, text, public.track_id) from PUBLIC, anon, authenticated;
revoke all on function public.join_room(uuid, uuid, text, public.track_id) from PUBLIC, anon, authenticated;
revoke all on function public.rename_room(uuid, uuid, uuid, text) from PUBLIC, anon, authenticated;
revoke all on function public.leave_room(uuid, uuid, uuid) from PUBLIC, anon, authenticated;
revoke all on function public.enforce_room_cap_four() from PUBLIC, anon, authenticated;

grant execute on function public.claim_visitor(uuid, uuid, text) to anon, authenticated;
grant execute on function public.create_room(uuid, uuid, text, public.track_id) to anon, authenticated;
grant execute on function public.join_room(uuid, uuid, text, public.track_id) to anon, authenticated;
grant execute on function public.rename_room(uuid, uuid, uuid, text) to anon, authenticated;
grant execute on function public.leave_room(uuid, uuid, uuid) to anon, authenticated;

-- Future functions must opt in, instead of inheriting blanket anonymous access.
alter default privileges in schema public revoke execute on functions from PUBLIC, anon, authenticated;

notify pgrst, 'reload schema';
commit;
