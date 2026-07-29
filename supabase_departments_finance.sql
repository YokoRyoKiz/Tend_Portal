-- Run this in the Supabase dashboard's SQL Editor (anon key alone can't run DDL).
-- Adds cumulative sales/investment figures to departments, shown and
-- editable on the top page's department cards.

alter table public.departments
  add column if not exists total_sales numeric not null default 0,
  add column if not exists total_investment numeric not null default 0;
