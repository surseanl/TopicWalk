-- Add capture photo path to mascots table
alter table public.tw_mascots
  add column if not exists finder_photo_path text;
