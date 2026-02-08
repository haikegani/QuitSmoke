
-- Таблицы Supabase

create table puffs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  created_at timestamp default now()
);

create table quit_plan (
  user_id uuid primary key,
  start_limit int,
  daily_step int,
  start_date date,
  min_limit int default 0
);
