-- Add GPS path, duration, and distance to walk albums
alter table public.tw_albums
  add column if not exists path jsonb,
  add column if not exists duration_seconds integer,
  add column if not exists distance_meters integer;
