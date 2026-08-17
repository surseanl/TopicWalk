-- Friend system: send/accept/decline requests, list friends

create table if not exists public.tw_friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table public.tw_friendships enable row level security;

-- Read own friendships (as requester or addressee)
create policy "tw_friendships_select" on public.tw_friendships
  for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Send a friend request (only as yourself)
create policy "tw_friendships_insert" on public.tw_friendships
  for insert to authenticated
  with check (requester_id = auth.uid());

-- Accept or decline (only addressee can change status)
create policy "tw_friendships_update" on public.tw_friendships
  for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

-- Cancel request or remove friend (either party)
create policy "tw_friendships_delete" on public.tw_friendships
  for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create index if not exists tw_friendships_requester_idx on public.tw_friendships(requester_id);
create index if not exists tw_friendships_addressee_idx on public.tw_friendships(addressee_id);
