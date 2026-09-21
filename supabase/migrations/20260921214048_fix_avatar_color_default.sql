-- Fix avatar_color default to match the first SnappyAvatar background id ("sky")
-- The old default '#6366f1' was a hex color that matched no SNAPPY_BACKGROUNDS id,
-- causing SnappyAvatar to silently fall back to the first background for all new users.
alter table public.tw_users
  alter column avatar_color set default 'sky';
