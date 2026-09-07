-- Snappy mascot customization: let users personalize their hunt map marker
-- snappy_color: fill color of the circle marker on the map
-- snappy_accessory: optional emoji displayed inside the marker

alter table public.tw_users
  add column if not exists snappy_color text not null default '#22c55e',
  add column if not exists snappy_accessory text not null default '';
