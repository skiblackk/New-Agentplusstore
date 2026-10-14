-- AgentPlus analytics event ledger
-- Run this once in the Supabase SQL editor for durable event storage.
create table if not exists public.agentplus_analytics_events (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists agentplus_analytics_events_created_at_idx
  on public.agentplus_analytics_events (created_at desc);

alter table public.agentplus_analytics_events enable row level security;
