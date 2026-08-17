-- Friend ratings: 1–5 stars (half-star steps) on walk submissions

create table if not exists public.tw_ratings (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid references public.tw_submissions(id) on delete cascade not null,
  user_id       text not null,
  score         numeric(2,1) not null check (score >= 1 and score <= 5 and (score * 2) = floor(score * 2)),
  created_at    timestamptz not null default now(),
  unique(submission_id, user_id)
);

alter table public.tw_ratings enable row level security;

create policy "tw_ratings_all" on public.tw_ratings
  for all to anon, authenticated using (true) with check (true);

create index if not exists tw_ratings_submission_idx on public.tw_ratings(submission_id);
