-- Add friend_code to tw_users: a 6-character uppercase hex code derived from the user's UUID.
-- Allows users to share or type a short code to add each other as friends.

alter table public.tw_users
  add column if not exists friend_code text;

-- Populate existing users from their UUID (first 6 hex chars, uppercased)
update public.tw_users
  set friend_code = upper(substring(replace(id::text, '-', '') from 1 for 6))
  where friend_code is null;

alter table public.tw_users
  alter column friend_code set not null;

create unique index if not exists tw_users_friend_code_key
  on public.tw_users(friend_code);
