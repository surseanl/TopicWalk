-- Color Walk: albums for grouping multiple photos per walk session
-- Replaces per-submission reactions/ratings with album-level equivalents

-- ── tw_albums ─────────────────────────────────────────────────────────────────

create table if not exists public.tw_albums (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  display_name text not null default '',
  color_name   text not null,
  color_hex    text not null,
  group_id     uuid,            -- null = private; user UUID = shared to feed
  created_at   timestamptz not null default now()
);

alter table public.tw_albums enable row level security;

create policy "tw_albums_select" on public.tw_albums
  for select to anon, authenticated using (true);

create policy "tw_albums_insert" on public.tw_albums
  for insert to authenticated
  with check (user_id = auth.uid()::text);

create policy "tw_albums_update" on public.tw_albums
  for update to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create index if not exists tw_albums_group_idx   on public.tw_albums(group_id);
create index if not exists tw_albums_user_idx    on public.tw_albums(user_id);
create index if not exists tw_albums_created_idx on public.tw_albums(created_at desc);

-- ── album_id on submissions ───────────────────────────────────────────────────

alter table public.tw_submissions
  add column if not exists album_id uuid references public.tw_albums(id) on delete cascade;

create index if not exists tw_submissions_album_idx on public.tw_submissions(album_id);

-- ── tw_album_reactions ────────────────────────────────────────────────────────

create table if not exists public.tw_album_reactions (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid references public.tw_albums(id) on delete cascade not null,
  user_id    text not null,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique(album_id, user_id)
);

alter table public.tw_album_reactions enable row level security;

create policy "tw_album_reactions_select" on public.tw_album_reactions
  for select to anon, authenticated using (true);

create policy "tw_album_reactions_insert" on public.tw_album_reactions
  for insert to authenticated
  with check (user_id = auth.uid()::text);

create policy "tw_album_reactions_delete" on public.tw_album_reactions
  for delete to authenticated
  using (user_id = auth.uid()::text);

create index if not exists tw_album_reactions_album_idx on public.tw_album_reactions(album_id);

-- ── tw_album_ratings ──────────────────────────────────────────────────────────

create table if not exists public.tw_album_ratings (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid references public.tw_albums(id) on delete cascade not null,
  user_id    text not null,
  score      numeric(2,1) not null
             check (score >= 1 and score <= 5 and (score * 2) = floor(score * 2)),
  created_at timestamptz not null default now(),
  unique(album_id, user_id)
);

alter table public.tw_album_ratings enable row level security;

create policy "tw_album_ratings_select" on public.tw_album_ratings
  for select to anon, authenticated using (true);

create policy "tw_album_ratings_insert" on public.tw_album_ratings
  for insert to authenticated
  with check (user_id = auth.uid()::text);

create policy "tw_album_ratings_update" on public.tw_album_ratings
  for update to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create index if not exists tw_album_ratings_album_idx on public.tw_album_ratings(album_id);
