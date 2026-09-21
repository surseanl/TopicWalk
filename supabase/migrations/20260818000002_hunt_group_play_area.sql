-- Add play area columns to tw_hunt_groups so the leader can define a geographic boundary
-- radius_miles: play area size (5 or 10), center_lat/lng: where the group was created

alter table public.tw_hunt_groups
  add column if not exists radius_miles integer not null default 5,
  add column if not exists center_lat double precision,
  add column if not exists center_lng double precision;
