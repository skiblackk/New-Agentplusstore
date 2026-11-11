-- Additive production repair for tables missing from the connected Supabase project.
-- All existing AgentPlus rows are preserved. Core storefront tables already exist.
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
create table if not exists public.agentplus_research_reports (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.agentplus_analytics_events (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists agentplus_agents_created_at_idx on public.agentplus_agents (created_at desc);
create index if not exists agentplus_knowledge_created_at_idx on public.agentplus_knowledge (created_at desc);
create index if not exists agentplus_deployments_created_at_idx on public.agentplus_deployments (created_at desc);
create index if not exists agentplus_research_reports_created_at_idx on public.agentplus_research_reports (created_at desc);
create index if not exists agentplus_analytics_events_created_at_idx on public.agentplus_analytics_events (created_at desc);
alter table public.agentplus_agents enable row level security;
alter table public.agentplus_knowledge enable row level security;
alter table public.agentplus_deployments enable row level security;
alter table public.agentplus_research_reports enable row level security;
alter table public.agentplus_analytics_events enable row level security;

-- Shared fixed-window rate limiting; only the server-side service role may call its RPC.
create table if not exists public.agentplus_rate_limits (
  bucket text primary key,
  window_start bigint not null,
  hit_count integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.agentplus_rate_limits enable row level security;
revoke all on table public.agentplus_rate_limits from anon, authenticated;

create or replace function public.agentplus_consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start bigint;
  v_hits integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_bucket) > 128 then
    return false;
  end if;

  v_window_start := floor(extract(epoch from clock_timestamp()) / p_window_seconds)::bigint;
  insert into public.agentplus_rate_limits (bucket, window_start, hit_count, updated_at)
  values (p_bucket, v_window_start, 1, clock_timestamp())
  on conflict (bucket) do update
    set window_start = excluded.window_start,
        hit_count = case
          when public.agentplus_rate_limits.window_start = excluded.window_start
            then public.agentplus_rate_limits.hit_count + 1
          else 1
        end,
        updated_at = excluded.updated_at
  returning hit_count into v_hits;

  if random() < 0.01 then
    delete from public.agentplus_rate_limits
    where updated_at < clock_timestamp() - interval '7 days';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.agentplus_consume_rate_limit(text, integer, integer) from public;
revoke all on function public.agentplus_consume_rate_limit(text, integer, integer) from anon, authenticated;
grant execute on function public.agentplus_consume_rate_limit(text, integer, integer) to service_role;
