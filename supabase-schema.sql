-- Optional Supabase starter schema for future cross-device sync.
-- This does not activate sync in the current local-only app.
create table public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.learner_progress enable row level security;
create policy "read own progress" on public.learner_progress
  for select using (auth.uid() = user_id);
create policy "insert own progress" on public.learner_progress
  for insert with check (auth.uid() = user_id);
create policy "update own progress" on public.learner_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
