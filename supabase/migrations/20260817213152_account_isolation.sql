-- Account isolation: replace blanket open-to-all policies with per-user access rules
-- on submissions, reactions, ratings, and game-photos storage.

-- ── tw_submissions ────────────────────────────────────────────────────────────

drop policy if exists "tw_submissions_all" on public.tw_submissions;

-- Users can read their own submissions (archive) and friends' feed submissions.
-- A submission is visible to a friend when group_id equals the poster's UUID
-- and an accepted friendship exists between them.
create policy "tw_submissions_select" on public.tw_submissions
  for select to authenticated
  using (
    user_id = auth.uid()::text
    or (
      group_id is not null
      and (
        group_id = auth.uid()
        or exists (
          select 1 from public.tw_friendships
          where status = 'accepted'
            and (
              (requester_id = auth.uid() and addressee_id = group_id)
              or (addressee_id = auth.uid() and requester_id = group_id)
            )
        )
      )
    )
  );

-- Users may only insert as themselves; group_id must be null (archive) or their own UUID (feed).
create policy "tw_submissions_insert" on public.tw_submissions
  for insert to authenticated
  with check (
    user_id = auth.uid()::text
    and (group_id is null or group_id = auth.uid())
  );

-- Users may only delete their own submissions.
create policy "tw_submissions_delete" on public.tw_submissions
  for delete to authenticated
  using (user_id = auth.uid()::text);

-- ── tw_reactions ──────────────────────────────────────────────────────────────

drop policy if exists "tw_reactions_all" on public.tw_reactions;

-- Any authenticated user can read reactions (displayed on the shared feed).
create policy "tw_reactions_select" on public.tw_reactions
  for select to authenticated
  using (true);

-- Users may only add reactions as themselves.
create policy "tw_reactions_insert" on public.tw_reactions
  for insert to authenticated
  with check (user_id = auth.uid()::text);

-- Users may only remove their own reactions.
create policy "tw_reactions_delete" on public.tw_reactions
  for delete to authenticated
  using (user_id = auth.uid()::text);

-- ── tw_ratings ────────────────────────────────────────────────────────────────

drop policy if exists "tw_ratings_all" on public.tw_ratings;

-- Any authenticated user can read ratings (displayed on the shared feed).
create policy "tw_ratings_select" on public.tw_ratings
  for select to authenticated
  using (true);

-- Users may only rate as themselves.
create policy "tw_ratings_insert" on public.tw_ratings
  for insert to authenticated
  with check (user_id = auth.uid()::text);

-- Users may only update their own rating.
create policy "tw_ratings_update" on public.tw_ratings
  for update to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Users may only delete their own rating.
create policy "tw_ratings_delete" on public.tw_ratings
  for delete to authenticated
  using (user_id = auth.uid()::text);

-- ── game-photos storage ───────────────────────────────────────────────────────
-- Photos are uploaded to {userId}/{timestamp}.ext so we can scope by folder.

drop policy if exists "game_photos_insert" on storage.objects;
drop policy if exists "game_photos_delete" on storage.objects;

-- Authenticated users may only upload into their own subfolder.
create policy "game_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'game-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may only delete files from their own subfolder.
create policy "game_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'game-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
