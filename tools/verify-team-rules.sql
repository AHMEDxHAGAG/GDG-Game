-- Run after all migrations: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f tools/verify-team-rules.sql
-- All fixtures and helper functions roll back. No assumptions about existing rooms.
\set ON_ERROR_STOP on
begin;
create temporary table fixtures (n integer, id uuid, token uuid) on commit drop;
insert into fixtures select n, gen_random_uuid(), gen_random_uuid() from generate_series(1, 6) n;

create function pg_temp.assert_true(label text, value boolean)
returns void language plpgsql as $$
begin
  if value is distinct from true then raise exception 'FAILED [%]', label; end if;
  raise notice 'ok [%]', label;
end;
$$;

create function pg_temp.expect_error(label text, stmt text, expected text)
returns void language plpgsql as $$
declare caught text; state text;
begin
  begin execute stmt;
  exception when others then caught := sqlerrm; state := sqlstate;
  end;
  if caught is null or (position(expected in caught) = 0 and state <> expected) then
    raise exception 'FAILED [%]: expected %, got % (%)', label, expected, caught, state;
  end if;
  raise notice 'ok [%]: %', label, expected;
end;
$$;

select public.claim_visitor(id, token, 'Pirate ' || n) from fixtures;
select id as owner_id, token as owner_token from fixtures where n = 1 \gset
select id as stranger_id, token as stranger_token from fixtures where n = 6 \gset
select (public.create_room(:'owner_id', :'owner_token', 'Test Crew', 'software-engineering')).id as room_id \gset
select join_code as code from public.rooms where id = :'room_id' \gset

select pg_temp.assert_true('creating a room preserves the personal name',
  (select display_name = 'Pirate 1' from public.visitors where id = :'owner_id'));
select public.join_room(id, token, :'code',
  case n when 2 then 'ai' when 3 then 'web-development' else 'data-science' end::public.track_id)
from fixtures where n between 2 and 4 order by n;
select pg_temp.assert_true('four distinct seats',
  jsonb_array_length(public.get_room(:'code') -> 'members') = 4);

select pg_temp.expect_error('fifth seat', format(
  'select public.join_room(%L, %L, %L, %L)', :'stranger_id', :'stranger_token', :'code', 'cybersecurity'), 'room_full');
select pg_temp.expect_error('duplicate membership', format(
  'select public.join_room(%L, %L, %L, %L)', :'owner_id', :'owner_token', :'code', 'ai'), 'already_joined');
select pg_temp.expect_error('blank room name', format(
  'select public.create_room(%L, %L, %L, %L)', :'owner_id', :'owner_token', ' ', 'ai'), 'invalid_name');

select (public.create_room(:'owner_id', :'owner_token', 'Other Crew', 'software-engineering')).join_code as other_code \gset
select pg_temp.expect_error('duplicate track', format(
  'select public.join_room(%L, %L, %L, %L)', :'stranger_id', :'stranger_token', :'other_code', 'software-engineering'), '23505');
select pg_temp.expect_error('unclaimed creator', format(
  'select public.create_room(%L, %L, %L, %L)', gen_random_uuid(), gen_random_uuid(), 'Crew', 'ai'), 'unknown_visitor');

-- Capture the public roster as an unauthenticated reader, then try using every
-- public identifier as authorization. The mutations must still be refused.
set local role anon;
select public.get_room(:'code') ->> 'owner_id' as exposed_owner \gset
select pg_temp.assert_true('public ID is not a credential', :'exposed_owner' = :'owner_id');
select pg_temp.assert_true('roster never includes credentials or hashes',
  public.get_room(:'code')::text !~ '(credential_hash|visitor_token)' and
  position(:'owner_token' in public.get_room(:'code')::text) = 0);
select pg_temp.assert_true('claim response never includes credentials',
  public.claim_visitor(:'owner_id', :'owner_token', 'Pirate 1') =
    jsonb_build_object('id', :'owner_id'::uuid, 'display_name', 'Pirate 1'));

select pg_temp.expect_error('cannot claim exposed ID with a different token', format(
  'select public.claim_visitor(%L, %L, %L)', :'exposed_owner', :'stranger_token', 'Hijacked'), 'unknown_visitor');
select pg_temp.expect_error('cannot use public ID itself as the token', format(
  'select public.rename_room(%L, %L, %L, %L)', :'exposed_owner', :'exposed_owner', :'room_id', 'Hijacked'), 'unknown_visitor');
select pg_temp.expect_error('cannot rename using another token', format(
  'select public.rename_room(%L, %L, %L, %L)', :'exposed_owner', :'stranger_token', :'room_id', 'Hijacked'), 'unknown_visitor');
select pg_temp.expect_error('cannot remove another member', format(
  'select public.leave_room(%L, %L, %L)', :'exposed_owner', :'stranger_token', :'room_id'), 'unknown_visitor');
select pg_temp.expect_error('cannot create under another ID', format(
  'select public.create_room(%L, %L, %L, %L)', :'exposed_owner', :'stranger_token', 'Hijacked', 'ai'), 'unknown_visitor');
select pg_temp.expect_error('cannot join under another ID', format(
  'select public.join_room(%L, %L, %L, %L)', :'exposed_owner', :'stranger_token', :'other_code', 'ai'), 'unknown_visitor');
select pg_temp.expect_error('null credentials are refused', format(
  'select public.leave_room(%L, null, %L)', :'exposed_owner', :'room_id'), 'unknown_visitor');
select pg_temp.expect_error('valid stranger cannot rename', format(
  'select public.rename_room(%L, %L, %L, %L)', :'stranger_id', :'stranger_token', :'room_id', 'Hijacked'), 'not_room_owner');

select pg_temp.assert_true('owner can rename',
  (public.rename_room(:'owner_id', :'owner_token', :'room_id', 'Renamed')).name = 'Renamed');
select pg_temp.assert_true('owner can leave', public.leave_room(:'owner_id', :'owner_token', :'room_id'));
select pg_temp.assert_true('leaving frees a seat', jsonb_array_length(public.get_room(:'code') -> 'members') = 3);
select public.join_room(:'stranger_id', :'stranger_token', :'code', 'software-engineering');

select pg_temp.expect_error('visitors remain private', 'select * from public.visitors', '42501');
select pg_temp.expect_error('rooms remain private', 'select * from public.rooms', '42501');
select pg_temp.expect_error('members remain private', 'select * from public.room_members', '42501');
select pg_temp.expect_error('helper remains private',
  format('select private.require_visitor(%L, %L)', :'owner_id', :'owner_token'), '42501');
select pg_temp.expect_error('generator remains private', 'select public.generate_join_code()', '42501');
select pg_temp.expect_error('legacy claim overload is gone',
  format('select public.claim_visitor(%L::uuid, %L::text)', :'owner_id', 'Hijacked'), '42883');
select pg_temp.assert_true('all legacy mutation overloads are gone',
  to_regprocedure('public.create_room(uuid,text,public.track_id)') is null and
  to_regprocedure('public.join_room(uuid,text,public.track_id)') is null and
  to_regprocedure('public.rename_room(uuid,uuid,text)') is null and
  to_regprocedure('public.leave_room(uuid,uuid)') is null);
select pg_temp.expect_error('get_room validates code shape', 'select public.get_room(''ZZZZZZ'')', 'invalid_code');
select pg_temp.expect_error('get_room rejects null', 'select public.get_room(null)', 'invalid_code');
select pg_temp.assert_true('get_room normalizes lowercase', public.get_room(lower(:'code')) ->> 'join_code' = :'code');
reset role;
rollback;
