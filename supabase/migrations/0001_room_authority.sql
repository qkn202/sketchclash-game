-- =============================================================================
-- SketchClash — room authority via Supabase Postgres + RLS
-- Migration 0001
--
-- PURPOSE: move authoritative room state off "whichever client claims to be
-- host" and onto server-enforced rows. Pairs with the client-side room-token
-- gate (see README-backend.md). REQUIRES a Supabase project with the Postgres
-- schema created and (for the RLS to actually stop strangers) Supabase Auth
-- enabled so auth.uid() is a real identity — see the README for the decision.
--
-- NOT imported into src/ yet. This is an apply-ready starting point.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum for the six game modes (kept in sync with src/types.ts GameMode)
-- ---------------------------------------------------------------------------
do $$ begin
  create type sketchclash_mode as enum (
    'classic', 'dual_coop', 'all_draw', 'rush_draw', 'relay_phone', 'polyjuice_impostor'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- rooms: authoritative config + ownership + the channel-gate token
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  room_code     text not null primary key,       -- e.g. HOGWARTS7KQ2ZD
  owner_id      uuid not null default auth.uid(),-- creator (host), stable across reloads
  room_token    text not null default '',        -- high-entropy secret (client mints it)
  mode          sketchclash_mode not null default 'classic',
  draw_time     integer not null default 60,
  total_rounds  integer not null default 3,
  language      text not null default 'vi',
  custom_words  jsonb not null default '[]'::jsonb,
  max_players   integer not null default 20,
  -- Authoritative, server-owned lifecycle bits
  is_open       boolean not null default true,   -- can new members join?
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- room_members: the RLS membership key. (room_code, user_id) is the unit of
-- trust: a member may read the room; only owner (or promoted host) writes.
-- ---------------------------------------------------------------------------
create table if not exists public.room_members (
  room_code  text not null references public.rooms(room_code) on delete cascade,
  user_id    uuid not null default auth.uid(),
  display_name text not null default 'Pháp Sư',
  joined_at  timestamptz not null default now(),
  is_active  boolean not null default true,
  primary key (room_code, user_id)
);
create index if not exists room_members_active_idx
  on public.room_members (room_code) where is_active;

-- ---------------------------------------------------------------------------
-- room_state: authoritative GameState as jsonb + monotonic version.
-- The version column is what the client should use to reject stale snapshots
-- (supersedes the per-tab _seq dedupe that the audit flagged).
-- One row per room; a fresh snapshot per round/event.
-- ---------------------------------------------------------------------------
create table if not exists public.room_state (
  room_code  text not null primary key
             references public.rooms(room_code) on delete cascade,
  version    bigint  not null default 1,
  payload    jsonb   not null,
  updated_at timestamptz not null default now()
);
-- Monotonic per-room version guard: a write may never lower the version.
create or replace function public.bump_room_state_version()
returns trigger
language plpgsql
as $$
begin
  -- Allow first insert, then strictly increase on subsequent writes to a room.
  if (tg_op = 'UPDATE'
      and exists (select 1 from public.room_state r
                  where r.room_code = new.room_code and r.version > new.version))
  then
    raise exception 'stale room_state version: % <= %', new.version,
                    (select version from public.room_state
                     where room_code = new.room_code);
  end if;
  return new;
end;
$$;
drop trigger if exists room_state_version_guard on public.room_state;
create trigger room_state_version_guard
  before insert or update on public.room_state
  for each row execute function public.bump_room_state_version();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.rooms          enable row level security;
alter table public.room_members   enable row level security;
alter table public.room_state     enable row level security;

-- Helper: "am I an active member of this room?"
create or replace function public.is_room_member(a_room_code text, a_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_code = a_room_code and user_id = a_user and is_active
  );
$$;

-- Helper: "am I the owner of this room?"
create or replace function public.is_room_owner(a_room_code text, a_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms
    where room_code = a_room_code and owner_id = a_user
  );
$$;

-- A room row is readable by its owner and any active member. Writable by owner
-- only (config changes flow through the authoritative host, which is the owner
-- unless promotion is added).
create policy rooms_read_member on public.rooms
  for select using (auth.uid() is not null and
                    (is_room_owner(room_code, auth.uid()) or is_room_member(room_code, auth.uid())));
create policy rooms_write_owner on public.rooms
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy rooms_create_owner on public.rooms
  for insert with check (auth.uid() = owner_id);

-- Membership: only the owner may add/remove members (or a promoted host).
create policy members_insert_owner on public.room_members
  for insert with check (auth.uid() is not null and is_room_owner(room_code, auth.uid()));
create policy members_update_owner on public.room_members
  for update using (auth.uid() is not null and is_room_owner(room_code, auth.uid()))
  with check (auth.uid() is not null and is_room_owner(room_code, auth.uid()));
-- A member can read who's in their room (needed to render the roster).
create policy members_read_member on public.room_members
  for select using (auth.uid() is not null and is_room_member(room_code, auth.uid()));

-- Authoritative state: readable by members; writable only by owner/host, and
-- the version trigger rejects anything that lowers the per-room version.
create policy state_read_member on public.room_state
  for select using (auth.uid() is not null and is_room_member(room_code, auth.uid()));
create policy state_write_owner on public.room_state
  for update using (auth.uid() is not null and is_room_owner(room_code, auth.uid()));
create policy state_upsert_owner on public.room_state
  for insert with check (auth.uid() is not null and is_room_owner(room_code, auth.uid()));

-- ---------------------------------------------------------------------------
-- Realtime: allow members to subscribe to changes on the room's state.
-- (Supabase Realtime RLS mirrors the SELECT policy above.)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.room_state;
-- Optional: also stream membership changes so clients see joins/leaves live.
alter publication supabase_realtime add table public.room_members;

-- ============================================================================
-- Notes / follow-up client refactor (out of scope for this migration):
--  1. On create: insert rooms (owner_id = auth.uid(), room_token = client mint).
--  2. On join:   insert room_members (idempotent on (room_code,user_id)).
--  3. Read authoritative state from room_state where version is the highest,
--     rejecting stale snapshots (replaces per-tab _seq dedupe).
--  4. host = rooms.owner_id (or promoted host), NOT first game_state_sync.
-- ============================================================================
