-- In-app hunt group invites: one account can invite another directly without
-- using the system share sheet. Invites are stored here; recipients see them
-- in the Hunt tab and can accept or decline.

create table if not exists public.tw_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.tw_hunt_groups(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  from_display_name text not null,
  group_name text not null,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(group_id, to_user_id)
);

create index if not exists tw_invites_to_user_id_idx on public.tw_invites(to_user_id);

alter table public.tw_invites enable row level security;

-- Recipients can see invites addressed to them
create policy "tw_invites_select_recipient" on public.tw_invites
  for select to authenticated
  using (to_user_id = auth.uid());

-- Authenticated users can send invites (must be the sender)
create policy "tw_invites_insert_sender" on public.tw_invites
  for insert to authenticated
  with check (from_user_id = auth.uid());

-- Recipients and senders can delete invites (accept, decline, or cancel)
create policy "tw_invites_delete_involved" on public.tw_invites
  for delete to authenticated
  using (to_user_id = auth.uid() or from_user_id = auth.uid());
