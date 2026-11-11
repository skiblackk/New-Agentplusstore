-- Shared fixed-window rate limiting for public and administrative API routes.
-- Callers use a server-side Supabase service-role key; browser roles cannot invoke this RPC.
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
