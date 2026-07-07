-- ============================================================================
-- Ghost Customer AI — Supabase Postgres schema (pgvector)
-- ============================================================================
-- "The AI that becomes your customer before your customer becomes your problem."
--
-- HOW TO RUN
-- ----------
-- 1. Open your Supabase project -> SQL Editor -> "New query".
-- 2. Paste this entire file and click "Run".  It is idempotent: every object
--    uses "if not exists" / "drop ... if exists" so you can re-run it safely.
-- 3. (CLI alternative) supabase db reset, or:
--       psql "$SUPABASE_DB_URL" -f supabase/schema.sql
--
-- The script:
--   * enables the pgcrypto + vector extensions,
--   * creates every domain table (profiles, projects, crawled_pages, documents,
--     personas, simulations, insights, reports, competitor_analysis),
--   * mirrors the TypeScript contract in src/lib/types.ts (jsonb for rich nested
--     data, first-class columns for the key scores you filter / sort on),
--   * adds FK indexes, ivfflat ANN indexes on the 768-dim embedding columns,
--     and query indexes,
--   * enables Row Level Security with owner-only (auth.uid()) policies,
--   * auto-creates a profiles row whenever a new auth.users row appears.
--
-- Embeddings are vector(768) to match Gemini text-embedding-004 (768 dims).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists vector;      -- pgvector: vector(768), ivfflat

-- ===========================================================================
-- profiles  (mirror of auth.users — public, app-facing identity row)
-- ===========================================================================
create table if not exists public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'App-facing user profile, 1:1 with auth.users.';

-- ===========================================================================
-- projects  (one analysis target = one website run)
--   Stores RunConfig + the WebsiteAnalysis result + run lifecycle.
-- ===========================================================================
create table if not exists public.projects (
  id              uuid        primary key default gen_random_uuid(),
  owner_id        uuid        not null references public.profiles (id) on delete cascade,

  -- RunConfig
  url             text        not null,
  pricing_url     text,
  faq_url         text,
  competitor_url  text,
  persona_count   integer     not null default 50,
  current_price   numeric,

  -- Run lifecycle
  -- RunPhase: queued|analyzing|generating_personas|simulating|sales_support|
  --           revenue_churn|synthesizing|reporting|done|error
  phase           text        not null default 'queued',
  engine          text        not null default 'mock',  -- 'gemini' | 'mock'
  error           text,

  -- WebsiteAnalysis (first-class fields you sort / display on; rest in jsonb)
  title           text,
  tagline         text,
  category        text,
  target_audience text,
  tone_of_voice   text,
  content_score   integer,                              -- 0-100
  source          text,                                  -- 'firecrawl'|'fetch'|'mock'
  analysis        jsonb,                                 -- full WebsiteAnalysis blob

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.projects is 'A single ghost-customer run: config + WebsiteAnalysis + lifecycle.';

-- ===========================================================================
-- crawled_pages  (raw + cleaned pages from Firecrawl / fetch / mock crawl)
-- ===========================================================================
create table if not exists public.crawled_pages (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references public.projects (id) on delete cascade,
  owner_id     uuid        not null references public.profiles (id) on delete cascade,

  url          text        not null,
  title        text,
  content      text,                                     -- cleaned markdown/text
  raw_html     text,
  source       text,                                     -- 'firecrawl'|'fetch'|'mock'
  status_code  integer,
  metadata     jsonb       not null default '{}'::jsonb,
  embedding    vector(768),                              -- Gemini text-embedding-004

  created_at   timestamptz not null default now()
);

comment on table public.crawled_pages is 'Crawled site pages with pgvector embeddings for retrieval.';

-- ===========================================================================
-- documents  (uploaded / derived knowledge chunks: FAQs, docs, pricing pages)
-- ===========================================================================
create table if not exists public.documents (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references public.projects (id) on delete cascade,
  owner_id     uuid        not null references public.profiles (id) on delete cascade,

  kind         text,                                     -- 'faq'|'doc'|'pricing'|'page'|...
  title        text,
  content      text        not null,
  chunk_index  integer     not null default 0,
  metadata     jsonb       not null default '{}'::jsonb,
  embedding    vector(768),

  created_at   timestamptz not null default now()
);

comment on table public.documents is 'Chunked knowledge documents with embeddings for RAG over the site.';

-- ===========================================================================
-- personas  (Persona domain type)
-- ===========================================================================
create table if not exists public.personas (
  id                 uuid        primary key default gen_random_uuid(),
  project_id         uuid        not null references public.projects (id) on delete cascade,
  owner_id           uuid        not null references public.profiles (id) on delete cascade,

  -- Persona fields
  name               text        not null,
  avatar_seed        text,
  age                integer,
  role               text,                               -- PersonaRole
  archetype          text,
  company_size       integer,
  industry           text,
  budget_sensitivity text,                               -- 'Low'|'Medium'|'High'
  technical_skill    text,                               -- Level
  purchase_intent    text,                               -- Level
  goals              jsonb       not null default '[]'::jsonb,
  frustrations       jsonb       not null default '[]'::jsonb,
  objections         jsonb       not null default '[]'::jsonb,
  quote              text,
  emoji              text,
  accent             text,                               -- hex color

  created_at         timestamptz not null default now()
);

comment on table public.personas is 'Generated virtual customers (ghosts) for a project.';

-- ===========================================================================
-- simulations  (SimulationResult domain type — one row per persona run)
-- ===========================================================================
create table if not exists public.simulations (
  id                   uuid        primary key default gen_random_uuid(),
  project_id           uuid        not null references public.projects (id) on delete cascade,
  persona_id           uuid        references public.personas (id) on delete cascade,
  owner_id             uuid        not null references public.profiles (id) on delete cascade,

  persona_name         text,
  role                 text,                             -- PersonaRole

  -- All scores 0-100 (first-class for aggregation / charts)
  interest_score       integer,
  confusion_score      integer,
  purchase_probability integer,
  support_dependency   integer,
  churn_risk           integer,
  trust_score          integer,

  verdict              text,                             -- 'Convert'|'Maybe'|'Churn Risk'|'Bounce'
  top_objection        text,
  reasoning            text,
  journey              jsonb       not null default '[]'::jsonb,  -- JourneyStep[]

  created_at           timestamptz not null default now()
);

comment on table public.simulations is 'Per-persona simulation outcomes with scores + journey.';

-- ===========================================================================
-- insights  (Insights domain type — one synthesized row per project)
-- ===========================================================================
create table if not exists public.insights (
  id                       uuid        primary key default gen_random_uuid(),
  project_id               uuid        not null references public.projects (id) on delete cascade,
  owner_id                 uuid        not null references public.profiles (id) on delete cascade,

  headline                 text,
  avg_purchase_probability numeric,
  avg_confusion            numeric,
  avg_churn_risk           numeric,
  conversion_risk_score    numeric,                      -- 0-100 (higher = worse)
  est_conversion_uplift    numeric,                      -- % uplift if fixes applied

  verdict_breakdown        jsonb       not null default '{}'::jsonb,  -- Record<Verdict, number>
  role_breakdown           jsonb       not null default '[]'::jsonb,
  sales_objections         jsonb       not null default '[]'::jsonb,
  support_gaps             jsonb       not null default '[]'::jsonb,
  revenue_leaks            jsonb       not null default '[]'::jsonb,
  churn_risks              jsonb       not null default '[]'::jsonb,
  heatmap                  jsonb       not null default '[]'::jsonb,
  top_questions            jsonb       not null default '[]'::jsonb,

  created_at               timestamptz not null default now()
);

comment on table public.insights is 'Aggregated cross-persona insights for a project.';

-- ===========================================================================
-- reports  (ExecutiveReport domain type — one row per project)
-- ===========================================================================
create table if not exists public.reports (
  id                 uuid        primary key default gen_random_uuid(),
  project_id         uuid        not null references public.projects (id) on delete cascade,
  owner_id           uuid        not null references public.profiles (id) on delete cascade,

  executive_summary  text,
  projected_uplift   text,
  key_findings       jsonb       not null default '[]'::jsonb,
  conversion_risks   jsonb       not null default '[]'::jsonb,
  churn_risks        jsonb       not null default '[]'::jsonb,
  revenue_leaks      jsonb       not null default '[]'::jsonb,
  customer_questions jsonb       not null default '[]'::jsonb,
  competitor_notes   jsonb       not null default '[]'::jsonb,
  recommendations    jsonb       not null default '[]'::jsonb,

  created_at         timestamptz not null default now()
);

comment on table public.reports is 'Executive-ready report generated for a project.';

-- ===========================================================================
-- competitor_analysis  (CompetitorAnalysis domain type)
-- ===========================================================================
create table if not exists public.competitor_analysis (
  id                  uuid        primary key default gen_random_uuid(),
  project_id          uuid        not null references public.projects (id) on delete cascade,
  owner_id            uuid        not null references public.profiles (id) on delete cascade,

  you_url             text,
  you_title           text,
  you_score           numeric,
  competitor_url      text,
  competitor_title    text,
  competitor_score    numeric,
  winner              text,                              -- 'you'|'competitor'|'tie'
  reason              text,
  dimensions          jsonb       not null default '[]'::jsonb,
  persona_preferences jsonb       not null default '[]'::jsonb,

  created_at          timestamptz not null default now()
);

comment on table public.competitor_analysis is 'Head-to-head arena comparison vs a competitor site.';

-- ===========================================================================
-- INDEXES
-- ===========================================================================

-- Foreign-key indexes ------------------------------------------------------
create index if not exists idx_projects_owner             on public.projects (owner_id);

create index if not exists idx_crawled_pages_project      on public.crawled_pages (project_id);
create index if not exists idx_crawled_pages_owner        on public.crawled_pages (owner_id);

create index if not exists idx_documents_project          on public.documents (project_id);
create index if not exists idx_documents_owner            on public.documents (owner_id);

create index if not exists idx_personas_project           on public.personas (project_id);
create index if not exists idx_personas_owner             on public.personas (owner_id);

create index if not exists idx_simulations_project        on public.simulations (project_id);
create index if not exists idx_simulations_persona        on public.simulations (persona_id);
create index if not exists idx_simulations_owner          on public.simulations (owner_id);

create index if not exists idx_insights_project           on public.insights (project_id);
create index if not exists idx_insights_owner             on public.insights (owner_id);

create index if not exists idx_reports_project            on public.reports (project_id);
create index if not exists idx_reports_owner              on public.reports (owner_id);

create index if not exists idx_competitor_project         on public.competitor_analysis (project_id);
create index if not exists idx_competitor_owner           on public.competitor_analysis (owner_id);

-- Query indexes ------------------------------------------------------------
create index if not exists idx_projects_created           on public.projects (created_at desc);
create index if not exists idx_simulations_verdict        on public.simulations (project_id, verdict);

-- ANN (pgvector) indexes — cosine distance ---------------------------------
-- ivfflat needs ANALYZE'd data to choose centroids well; lists=100 is a sane
-- starting point for the free tier. Set probes at query time:
--   set ivfflat.probes = 10;
create index if not exists idx_crawled_pages_embedding
  on public.crawled_pages using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists idx_documents_embedding
  on public.documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ===========================================================================
-- updated_at trigger helper
-- ===========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Auto-provision a profiles row for every new auth.users row
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- ROW LEVEL SECURITY  (owner-only via auth.uid())
-- ===========================================================================
alter table public.profiles            enable row level security;
alter table public.projects             enable row level security;
alter table public.crawled_pages        enable row level security;
alter table public.documents            enable row level security;
alter table public.personas             enable row level security;
alter table public.simulations          enable row level security;
alter table public.insights             enable row level security;
alter table public.reports              enable row level security;
alter table public.competitor_analysis  enable row level security;

-- ---- profiles: a user can only see / edit their own profile --------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ---- owner-only policies for every project-scoped table ------------------
-- Each table carries owner_id; a row is visible/writable only by its owner.

-- projects
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = owner_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = owner_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = owner_id);

-- crawled_pages
drop policy if exists "crawled_pages_select_own" on public.crawled_pages;
create policy "crawled_pages_select_own" on public.crawled_pages
  for select using (auth.uid() = owner_id);
drop policy if exists "crawled_pages_insert_own" on public.crawled_pages;
create policy "crawled_pages_insert_own" on public.crawled_pages
  for insert with check (auth.uid() = owner_id);
drop policy if exists "crawled_pages_update_own" on public.crawled_pages;
create policy "crawled_pages_update_own" on public.crawled_pages
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "crawled_pages_delete_own" on public.crawled_pages;
create policy "crawled_pages_delete_own" on public.crawled_pages
  for delete using (auth.uid() = owner_id);

-- documents
drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select using (auth.uid() = owner_id);
drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = owner_id);
drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = owner_id);

-- personas
drop policy if exists "personas_select_own" on public.personas;
create policy "personas_select_own" on public.personas
  for select using (auth.uid() = owner_id);
drop policy if exists "personas_insert_own" on public.personas;
create policy "personas_insert_own" on public.personas
  for insert with check (auth.uid() = owner_id);
drop policy if exists "personas_update_own" on public.personas;
create policy "personas_update_own" on public.personas
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "personas_delete_own" on public.personas;
create policy "personas_delete_own" on public.personas
  for delete using (auth.uid() = owner_id);

-- simulations
drop policy if exists "simulations_select_own" on public.simulations;
create policy "simulations_select_own" on public.simulations
  for select using (auth.uid() = owner_id);
drop policy if exists "simulations_insert_own" on public.simulations;
create policy "simulations_insert_own" on public.simulations
  for insert with check (auth.uid() = owner_id);
drop policy if exists "simulations_update_own" on public.simulations;
create policy "simulations_update_own" on public.simulations
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "simulations_delete_own" on public.simulations;
create policy "simulations_delete_own" on public.simulations
  for delete using (auth.uid() = owner_id);

-- insights
drop policy if exists "insights_select_own" on public.insights;
create policy "insights_select_own" on public.insights
  for select using (auth.uid() = owner_id);
drop policy if exists "insights_insert_own" on public.insights;
create policy "insights_insert_own" on public.insights
  for insert with check (auth.uid() = owner_id);
drop policy if exists "insights_update_own" on public.insights;
create policy "insights_update_own" on public.insights
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "insights_delete_own" on public.insights;
create policy "insights_delete_own" on public.insights
  for delete using (auth.uid() = owner_id);

-- reports
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = owner_id);
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = owner_id);
drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own" on public.reports
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own" on public.reports
  for delete using (auth.uid() = owner_id);

-- competitor_analysis
drop policy if exists "competitor_select_own" on public.competitor_analysis;
create policy "competitor_select_own" on public.competitor_analysis
  for select using (auth.uid() = owner_id);
drop policy if exists "competitor_insert_own" on public.competitor_analysis;
create policy "competitor_insert_own" on public.competitor_analysis
  for insert with check (auth.uid() = owner_id);
drop policy if exists "competitor_update_own" on public.competitor_analysis;
create policy "competitor_update_own" on public.competitor_analysis
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "competitor_delete_own" on public.competitor_analysis;
create policy "competitor_delete_own" on public.competitor_analysis
  for delete using (auth.uid() = owner_id);

-- ===========================================================================
-- Done. Re-runnable. Re-running drops + recreates policies/triggers only.
-- ===========================================================================
