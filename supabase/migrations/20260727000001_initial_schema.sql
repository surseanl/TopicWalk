-- TopicWalk initial schema

-- profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- topics
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "topics_select_anon" on public.topics
  for select to anon using (true);

create policy "topics_select_auth" on public.topics
  for select to authenticated using (true);

-- photos
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.topics(id) not null,
  taken_on date not null,
  storage_path text not null,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

create index if not exists photos_user_id_idx on public.photos(user_id);
create index if not exists photos_taken_on_idx on public.photos(taken_on);

create policy "photos_select" on public.photos
  for select to authenticated using (auth.uid() = user_id);

create policy "photos_insert" on public.photos
  for insert to authenticated with check (auth.uid() = user_id);

create policy "photos_delete" on public.photos
  for delete to authenticated using (auth.uid() = user_id);

-- videos
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.topics(id) not null,
  taken_on date not null,
  storage_path text not null,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "videos_select" on public.videos
  for select to authenticated using (auth.uid() = user_id);

create policy "videos_insert" on public.videos
  for insert to authenticated with check (auth.uid() = user_id);

-- friendships
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);

create policy "friendships_select" on public.friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_insert" on public.friendships
  for insert to authenticated
  with check (auth.uid() = requester_id);

create policy "friendships_update" on public.friendships
  for update to authenticated
  using (auth.uid() = addressee_id);

create policy "friendships_delete" on public.friendships
  for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Storage RLS
create policy "photos_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos_view" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'photos');

create policy "photos_delete_storage" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "videos_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "videos_view" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'videos');

-- topic_for_date function
create or replace function public.topic_for_date(target_date date default current_date)
returns setof public.topics
language sql stable
as $$
  select * from public.topics
  order by sort_order
  limit 1
  offset ((extract(doy from target_date)::integer - 1) % (select count(*) from public.topics));
$$;

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- award points on photo insert
create or replace function public.award_photo_points()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set points = points + 10 where id = new.user_id;
  update public.photos set points_awarded = 10 where id = new.id;
  return new;
end;
$$;

create or replace trigger on_photo_inserted
  after insert on public.photos
  for each row execute procedure public.award_photo_points();
