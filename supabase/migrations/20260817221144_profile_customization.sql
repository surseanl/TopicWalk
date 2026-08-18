-- Add profile customization fields: bio text and avatar_color (preset hex color).
alter table public.tw_users
  add column if not exists bio text;

alter table public.tw_users
  add column if not exists avatar_color text not null default '#6366f1';

-- Allow users to update their own profile
drop policy if exists "tw_users_update_own" on public.tw_users;
create policy "tw_users_update_own" on public.tw_users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
