-- Add play-area radius and center to mascot rows
alter table public.tw_mascots
  add column if not exists radius_miles int,
  add column if not exists center_lat double precision,
  add column if not exists center_lng double precision;
