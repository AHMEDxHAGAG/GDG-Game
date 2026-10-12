-- GDGoC Pirate Identity Expedition — profiles + teams.
--
-- Apply this in the Supabase SQL Editor (Dashboard → SQL → New query), or with
-- `supabase db push`. It is idempotent enough to run twice in a dev project.
--
-- Model:
--   profiles     one row per Google-authenticated user, seeded by a trigger
--                from `raw_user_meta_data` (Google's `full_name`).
--   teams        a room. One row per group, addressed by a short join code.
--   team_members who is in a room and which of the five tracks they bring.
--
-- The five-unique-tracks rule is enforced in the database, not in the UI:
--   * `team_members_one_track_per_team` rejects a second member on a track.
--   * `team_members_cap_five` rejects the sixth member.
-- The UI mirrors both so a visitor gets a sentence instead of a stack trace.

-- ------------------------------------------------------------------ --
-- Extensions
-- ------------------------------------------------------------------ --

create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------------ --
-- Shared vocabulary
-- ------------------------------------------------------------------ --

-- The five track ids come from `src/features/characters/types.ts`. Keep the
-- two in step: a value here is written verbatim as `profiles.track_id` and
-- `team_members.track_id`, and read back as a `TrackId`.
--
-- A domain rather than a bare CHECK per column, so the vocabulary has exactly
-- one definition. Guarded because `CREATE DOMAIN` has no `IF NOT EXISTS` and
-- this file is meant to be re-runnable against a dev project.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'track_id' and typnamespace = 'public'::regnamespace) then
    create domain public.track_id as text
      check (
        value in (
          'software-engineering',
          'ai',
          'web-development',
          'data-science',
          'cybersecurity'
        )
      );
  end if;
end;
$$;

-- ------------------------------------------------------------------ --
-- Tables
-- ------------------------------------------------------------------ --

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Mirrors MAX_USERNAME_LENGTH in src/config/site.ts.
  display_name text not null check (char_length(display_name) between 1 and 24),
  -- What Google said, kept so the original is recoverable.
  google_name text,
  avatar_url text,
  -- The track this member brings to a room. Null until they finish the quiz.
  track_id public.track_id,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Created by the on_auth_user_created trigger.';

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  join_code text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.teams is
  'A room. Joined by join_code; renamed only by owner_id.';

create table if not exists public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id public.track_id not null,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- The core rule: five unique tracks per team. Two members cannot bring the
-- same track, so a room can never hold six people or two Software Engineers.
create unique index if not exists team_members_one_track_per_team
  on public.team_members (team_id, track_id);

create index if not exists team_members_by_user on public.team_members (user_id);

-- ------------------------------------------------------------------ --
-- Helpers
-- ------------------------------------------------------------------ --

-- `SECURITY INVOKER` on purpose: it only counts rows the caller can already
-- select through RLS. A SECURITY DEFINER here would silently widen access to
-- the whole table for no benefit.
create or replace function public.enforce_team_cap_five()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  existing integer;
begin
  select count(*) into existing
  from public.team_members
  where team_id = new.team_id;

  if existing >= 5 then
    raise exception 'team_full' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists team_members_cap_five on public.team_members;
create trigger team_members_cap_five
  before insert on public.team_members
  for each row execute function public.enforce_team_cap_five();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Seeds the profile from Google on first sign-in.
--
-- SECURITY DEFINER is required here and is safe: this is a trigger on
-- auth.users, so it is unreachable over the Data API, and it is revoked from
-- PUBLIC below. It reads `raw_user_meta_data` — fine for seeding a display
-- name, which is never an authorization input. Never read it in an RLS
-- policy; it is user-editable and travels in the JWT.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_google_name text := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  v_fallback text := coalesce(
    v_google_name,
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Pirate'
  );
begin
  insert into public.profiles (id, display_name, google_name, avatar_url)
  values (
    new.id,
    left(v_fallback, 24),
    v_google_name,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Six hex characters from an unambiguous alphabet — `0-9A-F` has no I/O/1/0
-- lookalikes to mistype when reading a code off a projector. 16.7M values, and
-- the unique constraint plus the retry in `create_team` make a collision a
-- non-event.
create or replace function public.generate_join_code()
returns text
language sql
volatile
set search_path = public
as $$
  select upper(substring(encode(extensions.gen_random_bytes(8), 'hex') from 1 for 6));
$$;

-- ------------------------------------------------------------------ --
-- RPCs
--
-- Both are SECURITY DEFINER because the caller must act on rows RLS would
-- otherwise hide: `join_team` looks a team up by a code nobody is a member of
-- yet, and `create_team` writes a row the caller has no direct INSERT policy
-- for. Both re-check `auth.uid()` themselves and are revoked from anon and
-- PUBLIC below, so they are reachable only by a signed-in user.
-- ------------------------------------------------------------------ --

create or replace function public.create_team(p_name text, p_track_id public.track_id)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_team public.teams;
  v_name text := left(btrim(coalesce(p_name, '')), 24);
  v_code text;
  v_attempt integer := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if char_length(v_name) = 0 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  -- Backstop for any account created before this migration ran.
  insert into public.profiles (id, display_name)
  values (v_user, 'Pirate')
  on conflict (id) do nothing;

  loop
    v_code := public.generate_join_code();
    exit when not exists (select 1 from public.teams where join_code = v_code);
    v_attempt := v_attempt + 1;
    if v_attempt > 5 then
      raise exception 'code_collision' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.teams (name, join_code, owner_id)
  values (v_name, v_code, v_user)
  returning * into v_team;

  insert into public.team_members (team_id, user_id, track_id)
  values (v_team.id, v_user, p_track_id);

  update public.profiles set track_id = p_track_id where id = v_user;

  return v_team;
end;
$$;

create or replace function public.join_team(p_code text, p_track_id public.track_id)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_team public.teams;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if char_length(v_code) = 0 then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;

  select * into v_team
  from public.teams
  where join_code = v_code;

  if not found then
    raise exception 'team_not_found' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.team_members
    where team_id = v_team.id and user_id = v_user
  ) then
    raise exception 'already_joined' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.team_members where team_id = v_team.id
  ) >= 5 then
    raise exception 'team_full' using errcode = 'P0001';
  end if;

  -- A duplicate (team_id, track_id) raises 23505, which the app reads as
  -- "that track is already taken in this room".
  insert into public.team_members (team_id, user_id, track_id)
  values (v_team.id, v_user, p_track_id);

  update public.profiles set track_id = p_track_id where id = v_user;

  return v_team;
end;
$$;

create or replace function public.rename_team(p_team_id uuid, p_name text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_team public.teams;
  v_name text := left(btrim(coalesce(p_name, '')), 24);
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if char_length(v_name) = 0 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  -- Ownership is re-checked here rather than leaning on the UPDATE policy:
  -- a SECURITY DEFINER function does not go through the caller's RLS.
  if not exists (
    select 1 from public.teams
    where id = p_team_id and owner_id = v_user
  ) then
    raise exception 'not_team_owner' using errcode = '42501';
  end if;

  update public.teams set name = v_name where id = p_team_id returning * into v_team;
  return v_team;
end;
$$;

-- ------------------------------------------------------------------ --
-- Grants
--
-- Postgres grants EXECUTE to PUBLIC on every new function, and Supabase adds
-- default privileges for `anon`/`authenticated` on top. Either one is enough to
-- make the SECURITY DEFINER RPCs above a public API reachable without a login,
-- so both are closed down first and only then re-opened for signed-in users.
--
-- `PUBLIC` is spelled in caps and quoted on purpose. Unquoted lowercase
-- `public` is the *schema*, so `revoke … from public` silently revokes from
-- nothing and every caller keeps EXECUTE.
-- ------------------------------------------------------------------ --

revoke execute on function public.create_team(text, public.track_id) from PUBLIC, anon;
revoke execute on function public.join_team(text, public.track_id) from PUBLIC, anon;
revoke execute on function public.rename_team(uuid, text) from PUBLIC, anon;
-- Trigger functions are unreachable as RPCs, but there is no reason to leave
-- them callable by anyone either.
revoke execute on function public.handle_new_user() from PUBLIC, anon, authenticated;
revoke execute on function public.enforce_team_cap_five() from PUBLIC, anon, authenticated;
revoke execute on function public.touch_updated_at() from PUBLIC, anon, authenticated;
revoke execute on function public.generate_join_code() from PUBLIC, anon;

grant execute on function public.create_team(text, public.track_id) to authenticated;
grant execute on function public.join_team(text, public.track_id) to authenticated;
grant execute on function public.rename_team(uuid, text) to authenticated;

-- Close the door for the next function too, not just the ones above it.
alter default privileges in schema public revoke execute on functions from PUBLIC, anon;
alter default privileges in schema public
  grant execute on functions to authenticated, service_role;

-- `anon` gets no table access at all.
revoke all on table public.profiles from anon;
revoke all on table public.teams from anon;
revoke all on table public.team_members from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.teams to authenticated;
grant select, insert, delete on table public.team_members to authenticated;

-- ------------------------------------------------------------------ --
-- RLS helpers
--
-- These three predicates decide membership. They live in a `private` schema
-- and are SECURITY DEFINER for one specific reason.
--
-- A policy on `team_members` that asks "is this row's team one I belong to?"
-- has to read `team_members` — the table it governs. Postgres detects that as
-- infinite recursion and rejects the query outright:
--
--     ERROR: infinite recursion detected in policy for relation "team_members"
--
-- (It only shows up for a real request. `postgres` has BYPASSRLS, so testing
-- the same policies as the database owner silently passes.)
--
-- SECURITY DEFINER runs the body as the owner — `postgres`, which bypasses RLS
-- — so the subquery is evaluated once, out of band, and the policy no longer
-- references itself.
--
-- That is also why these must stay out of an exposed schema. Postgres grants
-- EXECUTE to PUBLIC on new functions, so each one is revoked below and granted
-- only to `authenticated`. `private` is not in the Data API's search path, so
-- they are not reachable over RPC either. Each returns a boolean about the
-- caller's *own* rights, so there is nothing to leak even if one were.
-- ------------------------------------------------------------------ --

create schema if not exists private;

revoke all on schema private from PUBLIC, anon, authenticated;

-- `search_path = ''` disables name resolution entirely, so nothing on the
-- caller's search path can shadow `public.team_members` or `auth.uid`.
create or replace function private.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = p_team_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.is_team_owner(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.teams
    where id = p_team_id
      and owner_id = (select auth.uid())
  );
$$;

create or replace function private.shares_team_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members as mine
    join public.team_members as theirs on theirs.team_id = mine.team_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user_id
  );
$$;

revoke execute on function private.is_team_member(uuid) from PUBLIC, anon;
revoke execute on function private.is_team_owner(uuid) from PUBLIC, anon;
revoke execute on function private.shares_team_with(uuid) from PUBLIC, anon;

grant execute on function private.is_team_member(uuid) to authenticated;
grant execute on function private.is_team_owner(uuid) to authenticated;
grant execute on function private.shares_team_with(uuid) to authenticated;

-- ------------------------------------------------------------------ --
-- RLS
--
-- Every table here is in the `public` schema, which is exposed through the Data
-- API. RLS is what decides which rows `anon`/`authenticated` can see, so it is
-- on for all three, always.
-- ------------------------------------------------------------------ --

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- profiles ---------------------------------------------------------------

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- Teammates' names are needed to render the roster, so a member can read the
-- profiles of anyone who shares a room with them — and nobody else.
drop policy if exists "profiles_select_teammates" on public.profiles;
create policy "profiles_select_teammates"
  on public.profiles for select to authenticated
  using (private.shares_team_with(profiles.id));

-- A user may only write their own row, and `with check` is what stops them
-- reassigning `id` to somebody else mid-update.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- The app upserts the profile when the visitor edits their name. An upsert is
-- an INSERT with an ON CONFLICT clause, so without this policy the insert
-- branch is refused by RLS and the edit silently does nothing.
--
-- It is safe because `with check` pins `id` to the caller: the only row
-- anybody can create is their own, which the `handle_new_user` trigger has
-- almost certainly created already. This exists for accounts predating the
-- trigger, not as a way to mint a row for someone else.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

-- teams ------------------------------------------------------------------

-- A row with no members yet is invisible to the policy below, including to the
-- person creating it. `teams_select_own` is what lets the in-flight create
-- transaction read its own new room back.
drop policy if exists "teams_select_members" on public.teams;
create policy "teams_select_members"
  on public.teams for select to authenticated
  using (private.is_team_member(teams.id));

drop policy if exists "teams_select_own" on public.teams;
create policy "teams_select_own"
  on public.teams for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "teams_insert_owner" on public.teams;
create policy "teams_insert_owner"
  on public.teams for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "teams_update_owner" on public.teams;
create policy "teams_update_owner"
  on public.teams for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- team_members -----------------------------------------------------------

drop policy if exists "team_members_select_members" on public.team_members;
create policy "team_members_select_members"
  on public.team_members for select to authenticated
  using (private.is_team_member(team_members.team_id));

-- The only path a client has to INSERT directly is bootstrapping its own room.
-- Everyone else joins through `join_team`. The cap-five trigger and the
-- one-track-per-team index still apply here.
drop policy if exists "team_members_insert_owner" on public.team_members;
create policy "team_members_insert_owner"
  on public.team_members for insert to authenticated
  with check (private.is_team_owner(team_members.team_id));

-- A member may leave; an owner may also remove a member.
drop policy if exists "team_members_delete_self_or_owner" on public.team_members;
create policy "team_members_delete_self_or_owner"
  on public.team_members for delete to authenticated
  using (
    team_members.user_id = (select auth.uid())
    or private.is_team_owner(team_members.team_id)
  );

-- ------------------------------------------------------------------ --
-- Realtime
--
-- Lets a room update as people walk in, without a refresh. Without this the
-- `supabase_realtime` publication simply does not exist yet.
-- ------------------------------------------------------------------ --

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table public.team_members;
  end if;
end;
$$;