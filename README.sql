
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

create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null,
  sender_id uuid not null,
  sender_email text not null,
  sender_username text,
  receiver_id uuid not null,
  receiver_email text not null,
  text text not null,
  reactions jsonb default '[]',
  created_at timestamp default now(),
  updated_at timestamp default now(),
  foreign key (sender_id) references auth.users(id) on delete cascade,
  foreign key (receiver_id) references auth.users(id) on delete cascade
);

-- Индексы для быстрого поиска по chat_id
create index idx_messages_chat_id on messages(chat_id);
create index idx_messages_sender_id on messages(sender_id);
create index idx_messages_receiver_id on messages(receiver_id);
create index idx_messages_created_at on messages(created_at);
