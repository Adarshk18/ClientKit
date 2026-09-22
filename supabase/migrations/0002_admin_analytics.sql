-- Admin / product analytics for Client Kit founder dashboard.
-- Run this in the Supabase SQL editor after 0001_init.sql (or `supabase db push`).
-- Inserts happen only via the service role (server). Anon/authenticated have no access.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text,
  meta jsonb,
  workspace_id uuid references public.workspaces (id) on delete set null,
  ip text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_name_created_idx
  on public.analytics_events (name, created_at desc);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);

alter table public.analytics_events enable row level security;

-- Deny all for anon + authenticated. Service role bypasses RLS.
revoke all on public.analytics_events from anon, authenticated;
grant select, insert, update, delete on public.analytics_events to service_role;

-- No policies on purpose: without policies + RLS enabled, non-service roles cannot access rows.
