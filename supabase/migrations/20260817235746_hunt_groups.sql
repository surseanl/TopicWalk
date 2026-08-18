-- Hunt mode groups: friends create a group via invite code and hunt each other's mascots.
-- tw_hunt_groups and tw_hunt_members are separate from the walk-mode tw_groups table.

-- Hunt groups
create table if not exists public.tw_hunt_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists tw_hunt_groups_invite_code_idx
  on public.tw_hunt_groups(invite_code);

alter table public.tw_hunt_groups enable row level security;

-- Any authenticated user can look up a group (needed to resolve invite codes)
create policy "tw_hunt_groups_select_authenticated" on public.tw_hunt_groups
  for select to authenticated
  using (true);

-- Authenticated users can create groups (must set created_by to themselves)
create policy "tw_hunt_groups_insert_authenticated" on public.tw_hunt_groups
  for insert to authenticated
  with check (created_by = auth.uid());

-- Hunt group members
create table if not exists public.tw_hunt_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.tw_hunt_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create index if not exists tw_hunt_members_user_id_idx on public.tw_hunt_members(user_id);
create index if not exists tw_hunt_members_group_id_idx on public.tw_hunt_members(group_id);

alter table public.tw_hunt_members enable row level security;

-- Any authenticated user can see group members (display names are public in the game)
create policy "tw_hunt_members_select_authenticated" on public.tw_hunt_members
  for select to authenticated
  using (true);

-- Users can add themselves to a group
create policy "tw_hunt_members_insert_self" on public.tw_hunt_members
  for insert to authenticated
  with check (user_id = auth.uid());

-- Users can remove themselves from a group
create policy "tw_hunt_members_delete_self" on public.tw_hunt_members
  for delete to authenticated
  using (user_id = auth.uid());

-- Add hunt_group_id to tw_mascots (separate from the legacy group_id column)
alter table public.tw_mascots
  add column if not exists hunt_group_id uuid references public.tw_hunt_groups(id) on delete cascade;

create index if not exists tw_mascots_hunt_group_id_idx
  on public.tw_mascots(hunt_group_id);

-- Fix the legacy tw_mascots.group_id column: drop FK (UUIDs from auth.users were
-- incorrectly stored here) and make it nullable so old rows don't block new inserts.
alter table public.tw_mascots
  drop constraint if exists tw_mascots_group_id_fkey,
  alter column group_id drop not null;
