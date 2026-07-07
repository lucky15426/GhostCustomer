-- Minimal persistence table used by src/lib/store.ts.
-- Run this in the Supabase SQL Editor (Dashboard -> SQL -> New query -> Run).
-- Stores the full RunState as JSONB keyed by runId so completed runs are
-- durable and shareable across devices / serverless instances.

create table if not exists public.runs (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_runs_created_at on public.runs (created_at desc);

-- RLS on; only the service role (server) reads/writes. No public policies,
-- so the anon/public key cannot read other users' runs.
alter table public.runs enable row level security;
