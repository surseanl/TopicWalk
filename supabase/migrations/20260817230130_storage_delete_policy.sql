-- Allow authenticated users to delete objects from game-photos bucket.
-- This is needed so the admin panel can remove inappropriate content.
drop policy if exists "game_photos_delete_authenticated" on storage.objects;
create policy "game_photos_delete_authenticated" on storage.objects
  for delete to authenticated
  using (bucket_id = 'game-photos');
