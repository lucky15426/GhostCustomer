# 🚀 Ghost Customer AI — Deployment Guide

This covers everything from running locally with zero keys, to Docker Compose, to a full
production deploy: **Vercel** (web) + **Render/Railway** (Python engine) + **Supabase**
(persistence). Every external layer is optional — the app runs end-to-end on the
deterministic mock engine with no configuration at all.

---

## 1. Local Development

### 1a. Frontend only (zero keys — recommended for the demo)

```bash
npm install
npm run dev
# ▶ http://localhost:3000
```

No `.env` required. The Next.js TS engine runs the full 8-agent pipeline in-process on the
deterministic mock engine. Check status anytime:

```bash
curl http://localhost:3000/api/health
# { "ok": true, "engine": "mock", "gemini": false, "firecrawl": false, "pythonEngine": false, ... }
```

To enable the optional AI/crawl layers, copy the env template and fill in what you have:

```bash
cp .env.example .env.local
# set any of: GEMINI_API_KEY, GEMINI_MODEL, FIRECRAWL_API_KEY,
#             PYTHON_ENGINE_URL, NEXT_PUBLIC_SUPABASE_URL, ...
npm run dev
```

Useful scripts (from `package.json`): `npm run dev`, `npm run build`, `npm start`,
`npm run lint`, `npm run typecheck`.

### 1b. Python LangGraph engine (optional)

```bash
cd agents-py
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# ▶ http://localhost:8000/docs  (Swagger)   ▶ http://localhost:8000/health
```

Smoke test the NDJSON stream:

```bash
curl -N -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{"url":"https://linear.app","personaCount":8,"competitorUrl":"https://asana.com","currentPrice":29}'
```

Wire the frontend to it: set `PYTHON_ENGINE_URL=http://localhost:8000` in
`.env.local` and restart `next dev`. `next.config.mjs` then proxies `/py/*` → the engine.

---

## 2. Docker Compose

The Python engine ships a `Dockerfile` (`agents-py/Dockerfile`, `python:3.12-slim`, honors
`$PORT`). Create a `docker-compose.yml` at the repo root to run web + engine together:

```yaml
# docker-compose.yml  (repo root)
services:
  engine:
    build: ./agents-py
    ports:
      - "8000:8000"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY:-}
      GEMINI_MODEL: ${GEMINI_MODEL:-gemini-2.5-flash}
      FIRECRAWL_API_KEY: ${FIRECRAWL_API_KEY:-}
      PORT: "8000"
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').status==200 else 1)"]
      interval: 10s
      timeout: 3s
      retries: 5

  web:
    image: node:20-slim
    working_dir: /app
    command: sh -c "npm install && npm run build && npm start"
    volumes:
      - ./:/app
    ports:
      - "3000:3000"
    environment:
      PYTHON_ENGINE_URL: http://engine:8000
      GEMINI_API_KEY: ${GEMINI_API_KEY:-}
      GEMINI_MODEL: ${GEMINI_MODEL:-gemini-2.5-flash}
      FIRECRAWL_API_KEY: ${FIRECRAWL_API_KEY:-}
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:-}
    depends_on:
      engine:
        condition: service_healthy
```

```bash
docker compose up --build
# web   → http://localhost:3000
# engine→ http://localhost:8000
```

To run just the engine image:

```bash
docker build -t ghost-engine ./agents-py
docker run -p 8000:8000 --env-file agents-py/.env ghost-engine
```

> All env vars default to empty/mock above, so `docker compose up` works with no secrets.

---

## 3. Production: Web on Vercel

1. Push the repo to GitHub and **Import Project** in Vercel. Next.js 15 is auto-detected
   (build `next build`, output handled by the Vercel adapter).
2. **Project → Settings → Environment Variables** — add any of the optional vars (all may
   be left unset; the app still works on the mock engine):
   - `GEMINI_API_KEY`, `GEMINI_MODEL`
   - `FIRECRAWL_API_KEY`
   - `PYTHON_ENGINE_URL` (your Render/Railway URL — see §4)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy. The `/api/run` route streams NDJSON; it sets `no-transform` +
   `X-Accel-Buffering: no` so Vercel's edge doesn't buffer the live stream.

> **Note:** `/api/run` declares `runtime = "nodejs"`, `dynamic = "force-dynamic"`, and
> `maxDuration = 60`. For very large swarms keep `personaCount` reasonable (the stream caps
> the number of cards/sims it animates regardless) or route through the Python engine,
> which has no serverless time limit on Render/Railway.

---

## 4. Production: Python Engine on Render / Railway

The engine is a Docker service (`agents-py/Dockerfile`) that binds to the platform's
injected `$PORT`:

```dockerfile
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### Render
1. **New → Web Service → Build from Docker**, root directory `agents-py/`.
2. Health check path: `/health`.
3. Add env vars (`GEMINI_API_KEY`, `GEMINI_MODEL`, `FIRECRAWL_API_KEY`) — all optional.
4. Deploy → note the URL, e.g. `https://ghost-engine.onrender.com`.

### Railway
1. **New Project → Deploy from Repo**, root directory `agents-py/` (Dockerfile detected).
2. Add the same optional env vars.
3. Deploy → grab the public domain.

### Connect engine to web
Set `PYTHON_ENGINE_URL=https://<your-service>.onrender.com` in the **Vercel** project and
redeploy. The `/py/*` rewrite now points production traffic at the LangGraph engine. The
contract is identical, so nothing else changes.

---

## 5. Supabase (optional persistence + auth)

Without Supabase, runs live in an in-process `Map` (`src/lib/store.ts`) plus a client-side
`localStorage` cache — enough for the live demo and page-to-page navigation. To persist
across instances and add auth, enable Supabase.

### 5a. Create project & extension
1. Create a project at <https://supabase.com>.
2. In the SQL editor (or `supabase db`), enable pgvector: `create extension if not exists vector;`

### 5b. Load the schema
Save the following as `supabase/schema.sql` and run it in the Supabase SQL editor (or
`psql "$SUPABASE_DB_URL" -f supabase/schema.sql`):

```sql
-- Ghost Customer AI — Supabase schema
create extension if not exists vector;
create extension if not exists "pgcrypto";

-- One row per analyzed website / run configuration.
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  run_id        text unique not null,
  owner         uuid references auth.users (id) on delete set null,
  url           text not null,
  competitor_url text,
  persona_count int  not null default 120,
  current_price numeric,
  engine        text not null default 'mock',   -- 'gemini' | 'mock'
  phase         text not null default 'queued',
  analysis      jsonb,                            -- WebsiteAnalysis
  created_at    timestamptz not null default now()
);

-- One row per ghost-customer simulation result.
create table if not exists simulations (
  id           uuid primary key default gen_random_uuid(),
  run_id       text not null references projects (run_id) on delete cascade,
  persona_id   text not null,
  persona_name text not null,
  role         text not null,
  verdict      text not null,                     -- Convert|Maybe|Churn Risk|Bounce
  result       jsonb not null,                    -- full SimulationResult
  created_at   timestamptz not null default now()
);
create index if not exists simulations_run_idx on simulations (run_id);

-- Aggregated insights + report + optional competitor analysis per run.
create table if not exists insights (
  id           uuid primary key default gen_random_uuid(),
  run_id       text unique not null references projects (run_id) on delete cascade,
  insights     jsonb not null,                    -- Insights
  report       jsonb,                             -- ExecutiveReport
  competitor   jsonb,                             -- CompetitorAnalysis
  -- optional semantic search over findings (pgvector); dim matches your embedder
  embedding    vector(768),
  created_at   timestamptz not null default now()
);

-- Row Level Security (enable + scope to the authenticated owner).
alter table projects    enable row level security;
alter table simulations enable row level security;
alter table insights    enable row level security;

create policy "owner reads own projects" on projects
  for select using (owner is null or owner = auth.uid());
create policy "owner writes own projects" on projects
  for insert with check (owner is null or owner = auth.uid());

create policy "read sims by run" on simulations
  for select using (
    exists (select 1 from projects p where p.run_id = simulations.run_id
            and (p.owner is null or p.owner = auth.uid())));

create policy "read insights by run" on insights
  for select using (
    exists (select 1 from projects p where p.run_id = insights.run_id
            and (p.owner is null or p.owner = auth.uid())));
```

### 5c. Wire it up
Set in `.env.local` (and in Vercel for prod):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only — never exposed to client
```

Then swap the in-memory store for Supabase by implementing the same
`saveRun / getRun / listRuns / deleteRun` interface (`src/lib/store.ts`) against the
`projects` / `simulations` / `insights` tables. `auth.users` is provided by Supabase Auth;
the policies allow anonymous (owner `null`) rows so the demo keeps working pre-login.

---

## 6. Environment Variable Reference

Every variable is **optional**. Empty ⇒ the deterministic mock fallback for that layer.

| Variable | Used by | Purpose | Fallback if unset |
|----------|---------|---------|-------------------|
| `GEMINI_API_KEY` | web + engine | Real Gemini analysis of crawled content + report narrative. | Deterministic mock engine |
| `GEMINI_MODEL` | web + engine | Gemini model id. | `gemini-2.5-flash` |
| `FIRECRAWL_API_KEY` | web + engine | Firecrawl clean-markdown crawling. | Plain `fetch` → HTML strip → mock |
| `PYTHON_ENGINE_URL` | web (Next.js) | Enables the `/py/*` proxy to the FastAPI + LangGraph engine. | Built-in TS engine |
| `NEXT_PUBLIC_SUPABASE_URL` | web (client + server) | Supabase project URL. | In-memory store + `localStorage` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web (client) | Supabase public anon key (RLS-scoped). | — |
| `SUPABASE_SERVICE_ROLE_KEY` | web (server only) | Service-role key for privileged writes. **Never** ship to the client. | — |

> `GOOGLE_API_KEY` is also accepted by the TS Gemini client as an alias for
> `GEMINI_API_KEY`.

---

## 7. Post-Deploy Checklist

- [ ] `GET /api/health` (web) returns `ok: true` and the expected `engine`.
- [ ] `GET /health` (engine, if deployed) returns `{ ok, engine, gemini, firecrawl }`.
- [ ] `POST /api/run` streams NDJSON (`init` → `status` → … → `done`) — verify with
      `curl -N` that lines arrive incrementally (not buffered).
- [ ] War Room (`/simulation/[runId]`) animates live; Insights, Pricing Lab, Arena, and
      Report pages render.
- [ ] If `PYTHON_ENGINE_URL` is set, `/py/health` resolves through the web origin.
- [ ] If Supabase is enabled, a completed run appears in the `projects` / `simulations` /
      `insights` tables, and RLS policies permit your auth context.
