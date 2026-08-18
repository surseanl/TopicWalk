-- Drop the FK to tw_groups and make group_id nullable so submissions can be
-- saved as personal archive entries (group_id = null) or as feed entries
-- (group_id = owner's user UUID). The original design used group_id as a game
-- room FK; it now acts as a feed-visibility flag.

alter table public.tw_submissions
  drop constraint if exists tw_submissions_group_id_fkey,
  alter column group_id drop not null;

create index if not exists tw_submissions_user_idx
  on public.tw_submissions(user_id);
