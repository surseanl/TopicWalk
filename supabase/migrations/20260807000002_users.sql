-- tw_users: maps Supabase Auth user IDs to usernames.
-- Passwords are hashed by Supabase Auth (bcrypt) — never stored here.

create table if not exists public.tw_users (
  id       uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

alter table public.tw_users enable row level security;

-- Anyone (including pre-login) can check username availability
create policy "tw_users_read" on public.tw_users
  for select to anon, authenticated using (true);

-- Each user can only insert their own row (enforced by auth.uid())
create policy "tw_users_insert_own" on public.tw_users
  for insert to authenticated with check (id = auth.uid());

-- Fast case-insensitive username lookup (login + availability check)
create index if not exists tw_users_username_lower_idx
  on public.tw_users (lower(username));
