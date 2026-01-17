-- Create chat_sessions table
create table public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null references auth_user(id) on delete cascade,
  title text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create chat_messages table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid not null references chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('user', 'bot')),
  text text not null,
  buttons jsonb,
  created_at timestamp with time zone default now()
);

-- Create indexes for performance
create index idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index idx_chat_messages_session_id on public.chat_messages(session_id);
create index idx_chat_sessions_created_at on public.chat_sessions(created_at desc);
create index idx_chat_messages_created_at on public.chat_messages(created_at asc);
