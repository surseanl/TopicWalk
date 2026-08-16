-- Extend game table RLS policies to also allow authenticated Supabase users.
-- The original policies only covered the anon role (pre-auth era).

drop policy if exists "tw_groups_anon" on public.tw_groups;
create policy "tw_groups_all" on public.tw_groups
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "tw_submissions_anon" on public.tw_submissions;
create policy "tw_submissions_all" on public.tw_submissions
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "tw_reactions_anon" on public.tw_reactions;
create policy "tw_reactions_all" on public.tw_reactions
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "tw_mascots_anon" on public.tw_mascots;
create policy "tw_mascots_all" on public.tw_mascots
  for all to anon, authenticated using (true) with check (true);
