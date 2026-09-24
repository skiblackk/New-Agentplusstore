-- AgentPlus platform expansion migration
-- Run this in the Supabase SQL Editor.

create table if not exists public.agentplus_agents (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_knowledge (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_deployments (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists agentplus_agents_created_at_idx
  on public.agentplus_agents (created_at desc);
create index if not exists agentplus_knowledge_created_at_idx
  on public.agentplus_knowledge (created_at desc);
create index if not exists agentplus_deployments_created_at_idx
  on public.agentplus_deployments (created_at desc);

alter table public.agentplus_agents enable row level security;
alter table public.agentplus_knowledge enable row level security;
alter table public.agentplus_deployments enable row level security;

create table if not exists public.agentplus_research_reports (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists agentplus_research_reports_created_at_idx
  on public.agentplus_research_reports (created_at desc);
alter table public.agentplus_research_reports enable row level security;
