-- Run this in the Supabase dashboard's SQL Editor (anon key alone can't run DDL).
-- Creates the scheduled_tasks table used by the timetable, which doesn't
-- exist yet (every timetable save currently 404s).

create table if not exists public.scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  date date not null,
  title text not null,
  h integer not null,
  m integer not null,
  duration integer not null default 15,
  completed boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists scheduled_tasks_user_date_idx on public.scheduled_tasks (user_id, date);

alter table public.scheduled_tasks enable row level security;

-- No login/auth system exists yet, so this mirrors the already-open
-- policy the `tasks` table effectively has today. Anyone holding the
-- public anon key can read/write this table under this policy.
drop policy if exists "anon full access (no auth yet)" on public.scheduled_tasks;
create policy "anon full access (no auth yet)" on public.scheduled_tasks
  for all to anon using (true) with check (true);


-- Optional: only needed if you want an "add department" admin UI later.
-- Right now INSERT/UPDATE/DELETE on departments fail with 42501 for anon;
-- there's no UI feature that needs this today, so leave commented out
-- unless you're adding one.
-- create policy "anon manage departments (no auth yet)" on public.departments
--   for all to anon using (true) with check (true);


-- Optional: only needed if you want stickyColor/priority/isToday to survive
-- a page reload. Right now they're UI-only (kept out of every Supabase
-- write on purpose, see toDbTaskPayload() in test.html) since these columns
-- don't exist on `tasks`. If you add them, tell me and I'll wire the app's
-- read/write mapping to include them.
-- alter table public.tasks
--   add column if not exists sticky_color text,
--   add column if not exists priority text,
--   add column if not exists is_today boolean default false;
