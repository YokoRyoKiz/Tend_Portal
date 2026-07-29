-- Run this in the Supabase dashboard's SQL Editor (anon key alone can't run DDL).
--
-- Current real state as of this writing (checked directly against the project):
--   - `initiatives` table already exists (created outside this script) but has
--     NO usable RLS policy, so the app's INSERT/UPDATE calls to it are rejected
--     with 42501. That's the one thing actually blocking the new feature.
--   - `tasks.initiative_id` (FK to initiatives) already exists.
--   - `departments.initiatives` (the old comma-separated text column) has
--     already been dropped.
--   - `departments.monthly_goal` still exists (harmless leftover, unused by
--     the app now).
-- This script is idempotent-safe to run as-is.

-- 1. THE MISSING PIECE: RLS policy so the app (anon key, no auth yet) can
--    actually read/write initiatives. Without this, creating a new monthly
--    goal or dragging a marker silently fails (logged to console only).
drop policy if exists "anon full access (no auth yet)" on public.initiatives;
create policy "anon full access (no auth yet)" on public.initiatives
  for all to anon using (true) with check (true);

-- 2. Make sure RLS is actually on (no-op if it already is)
alter table public.initiatives enable row level security;

-- 3. Backfill: turn each department's existing monthly_goal text into a real
--    main_goal row, then link any existing task whose free-text `initiative`
--    matches one of the new monthly_goal titles. Safe to run once; skips
--    departments that already have a main_goal so re-running won't duplicate.
do $$
declare
  dept record;
  main_goal_id uuid;
begin
  for dept in select id, name, monthly_goal from public.departments loop
    if not exists (select 1 from public.initiatives where department_id = dept.id and type = 'main_goal') then
      insert into public.initiatives (department_id, type, title, x, y)
      values (dept.id, 'main_goal', coalesce(nullif(dept.monthly_goal, ''), dept.name || 'の目標'), 700, 40)
      returning id into main_goal_id;
    end if;
  end loop;
end $$;

-- Link existing tasks to a monthly_goal row with a matching title in the same department
-- (only relevant if you still have tasks carrying the old free-text `initiative` value).
update public.tasks t
set initiative_id = i.id
from public.initiatives i
where i.department_id = t.department_id
  and i.type = 'monthly_goal'
  and i.title = t.initiative
  and t.initiative_id is null;

-- 4. Optional cleanup, once you've confirmed the app works end-to-end:
-- alter table public.departments drop column if exists monthly_goal;
-- alter table public.tasks drop column if exists initiative;

-- 5. `project` — a free-text grouping label for an initiative that spawns its
--    own family of tasks without needing to hang off a department's main_goal
--    (parent_id may be null for these). Nullable; no migration of existing
--    rows needed.
alter table public.initiatives
  add column if not exists project text;
