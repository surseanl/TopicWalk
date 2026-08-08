-- Add email column to tw_users so login can resolve username → email for Supabase Auth
alter table public.tw_users
  add column if not exists email text not null default '';

alter table public.tw_users
  alter column email drop default;
