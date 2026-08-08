-- TopicWalk v2: no-auth group-based game tables

create table if not exists public.tw_groups (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz not null default now()
);
alter table public.tw_groups enable row level security;
create policy "tw_groups_anon" on public.tw_groups
  for all to anon using (true) with check (true);

create table if not exists public.tw_submissions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.tw_groups(id) on delete cascade not null,
  user_id text not null,
  display_name text not null,
  topic_category text not null,
  topic_label text not null,
  photo_path text not null,
  submitted_at timestamptz not null default now()
);
alter table public.tw_submissions enable row level security;
create policy "tw_submissions_anon" on public.tw_submissions
  for all to anon using (true) with check (true);
create index if not exists tw_submissions_group_idx on public.tw_submissions(group_id);
create index if not exists tw_submissions_date_idx on public.tw_submissions(submitted_at);

create table if not exists public.tw_reactions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.tw_submissions(id) on delete cascade not null,
  user_id text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(submission_id, user_id)
);
alter table public.tw_reactions enable row level security;
create policy "tw_reactions_anon" on public.tw_reactions
  for all to anon using (true) with check (true);

create table if not exists public.tw_mascots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.tw_groups(id) on delete cascade not null,
  hider_user_id text not null,
  hider_name text not null,
  photo_path text not null,
  lat double precision not null,
  lng double precision not null,
  hidden_at timestamptz not null default now(),
  found_at timestamptz,
  finder_user_id text,
  finder_name text
);
alter table public.tw_mascots enable row level security;
create policy "tw_mascots_anon" on public.tw_mascots
  for all to anon using (true) with check (true);
create index if not exists tw_mascots_group_idx on public.tw_mascots(group_id);

-- Storage bucket for game photos
insert into storage.buckets (id, name, public)
values ('game-photos', 'game-photos', true)
on conflict (id) do nothing;

create policy "game_photos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'game-photos');

create policy "game_photos_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'game-photos');

create policy "game_photos_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'game-photos');
