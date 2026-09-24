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

create table if not exists public.agentplus_whatsapp_clicks (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_subscribers (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_articles (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_push_subscriptions (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agentplus_settings (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.agentplus_notification_history (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

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

create index if not exists agentplus_orders_created_at_idx on public.agentplus_orders (created_at desc);
create index if not exists agentplus_visitors_created_at_idx on public.agentplus_visitors (created_at desc);
create index if not exists agentplus_sessions_expires_at_idx on public.agentplus_sessions (expires_at);
create index if not exists agentplus_whatsapp_clicks_created_at_idx on public.agentplus_whatsapp_clicks (created_at desc);
create unique index if not exists agentplus_subscribers_email_idx on public.agentplus_subscribers ((payload->>'email'));
create index if not exists agentplus_articles_created_at_idx on public.agentplus_articles (created_at desc);
create index if not exists agentplus_push_subscriptions_created_at_idx on public.agentplus_push_subscriptions (created_at desc);
create index if not exists agentplus_notification_history_created_at_idx on public.agentplus_notification_history (created_at desc);
create index if not exists agentplus_agents_created_at_idx on public.agentplus_agents (created_at desc);
create index if not exists agentplus_knowledge_created_at_idx on public.agentplus_knowledge (created_at desc);
create index if not exists agentplus_deployments_created_at_idx on public.agentplus_deployments (created_at desc);

-- The server uses the service-role key, so public browser access stays disabled.
alter table public.agentplus_orders enable row level security;
alter table public.agentplus_visitors enable row level security;
alter table public.agentplus_sessions enable row level security;
alter table public.agentplus_memory enable row level security;
alter table public.agentplus_whatsapp_clicks enable row level security;
alter table public.agentplus_subscribers enable row level security;
alter table public.agentplus_articles enable row level security;
alter table public.agentplus_push_subscriptions enable row level security;
alter table public.agentplus_settings enable row level security;
alter table public.agentplus_notification_history enable row level security;
alter table public.agentplus_agents enable row level security;
alter table public.agentplus_knowledge enable row level security;
alter table public.agentplus_deployments enable row level security;

create table if not exists public.agentplus_research_reports (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists agentplus_research_reports_created_at_idx on public.agentplus_research_reports (created_at desc);
alter table public.agentplus_research_reports enable row level security;
