-- AgentPlus durable backend schema
-- Run this once in the Supabase SQL editor for the configured project.
create table if not exists public.agentplus_orders (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_visitors (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_sessions (
  token text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_memory (
  id integer primary key,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists agentplus_orders_created_at_idx on public.agentplus_orders (created_at desc);
create index if not exists agentplus_visitors_created_at_idx on public.agentplus_visitors (created_at desc);
create index if not exists agentplus_sessions_expires_at_idx on public.agentplus_sessions (expires_at);

-- The server uses the service-role key, so public browser access stays disabled.
alter table public.agentplus_orders enable row level security;
alter table public.agentplus_visitors enable row level security;
alter table public.agentplus_sessions enable row level security;
alter table public.agentplus_memory enable row level security;
