-- Solo hunt walk sessions
-- Records a walk taken during solo hunt: the two objects, GPS path, stats, and photo paths.

create table if not exists public.tw_solo_walks (
  id               uuid        primary key default gen_random_uuid(),
  user_id          text        not null default auth.uid()::text,
  created_at       timestamptz not null default now(),
  ended_at         timestamptz,
  object_1         jsonb       not null,
  object_2         jsonb       not null,
  path             jsonb       not null default '[]'::jsonb,
  distance_meters  integer     not null default 0,
  duration_seconds integer     not null default 0,
  photo_paths      text[]      not null default '{}'
);

alter table public.tw_solo_walks enable row level security;

create policy "solo_walks_select_own"
  on public.tw_solo_walks for select to authenticated
  using (user_id = auth.uid()::text);

create policy "solo_walks_insert_own"
  on public.tw_solo_walks for insert to authenticated
  with check (user_id = auth.uid()::text);

create policy "solo_walks_update_own"
  on public.tw_solo_walks for update to authenticated
  using (user_id = auth.uid()::text);

create index if not exists tw_solo_walks_user_id_idx
  on public.tw_solo_walks (user_id);
