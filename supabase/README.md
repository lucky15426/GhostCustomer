# Supabase — Ghost Customer AI

> "The AI that becomes your customer before your customer becomes your problem."

This directory holds the Postgres schema (with **pgvector**) that backs the
Ghost Customer AI platform: projects, crawled pages, embeddings, generated
personas, simulation results, insights, executive reports, and competitor
analyses.

Everything is designed to run on the **Supabase free tier**, and the whole
product still works with **no keys** — the Python engine falls back to a
deterministic seeded mock, so the database is optional for local demos but
required for persistence and auth.

---

## Files

| File         | Purpose                                                             |
| ------------ | ------------------------------------------------------------------- |
| `schema.sql` | Complete, **idempotent** schema: extensions, tables, indexes, RLS.  |
| `README.md`  | This file.                                                          |

---

## How to run it

### Option A — Supabase SQL Editor (recommended)

1. Open your project at [app.supabase.com](https://app.supabase.com).
2. Go to **SQL Editor → New query**.
3. Paste the entire contents of [`schema.sql`](./schema.sql).
4. Click **Run**.

The script is **idempotent** — every object uses `if not exists` /
`drop ... if exists`, so you can paste and run it as many times as you like
without errors.

### Option B — Supabase CLI / psql

```bash
# With the Supabase CLI (uses your linked project's local/remote db)
supabase db reset            # for a clean local dev db, then it applies migrations
# or apply this file directly:
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
```

`$SUPABASE_DB_URL` is the connection string from
**Project Settings → Database → Connection string (URI)**.

---

## What the script does

1. **Enables extensions**
   - `pgcrypto` → `gen_random_uuid()` for UUID primary keys.
   - `vector` (pgvector) → `vector(768)` embedding columns + `ivfflat` ANN indexes.
2. **Creates the tables** (all under `public`):
   `profiles`, `projects`, `crawled_pages`, `documents`, `personas`,
   `simulations`, `insights`, `reports`, `competitor_analysis`.
3. **Adds indexes**: every FK, key query indexes
   (`simulations(project_id)`, `personas(project_id)`, verdict, created_at),
   and `ivfflat (… vector_cosine_ops)` ANN indexes on both embedding columns.
4. **Enables Row Level Security** on every user-data table with **owner-only**
   policies driven by `auth.uid()`.
5. **Auto-provisions a `profiles` row** for every new `auth.users` row via a
   `security definer` trigger, and keeps `updated_at` fresh on `profiles` and
   `projects`.

---

## Data model

```
auth.users
   └─ profiles (1:1, id = auth.users.id)
        └─ projects (owner_id)            ← RunConfig + WebsiteAnalysis + lifecycle
             ├─ crawled_pages   (embedding vector(768))
             ├─ documents       (embedding vector(768))
             ├─ personas
             ├─ simulations     (→ personas via persona_id)
             ├─ insights        (1 per project)
             ├─ reports         (1 per project)
             └─ competitor_analysis
```

Every project-scoped table carries an `owner_id` (FK → `profiles.id`,
`on delete cascade`). This lets RLS policies stay a single, fast
`auth.uid() = owner_id` check without joins, and guarantees a deleted user or
project tears down all dependent rows.

### Column strategy

The schema mirrors the TypeScript contract in
[`src/lib/types.ts`](../src/lib/types.ts):

- **First-class columns** for the scalar values you filter, sort, or chart on
  (e.g. `purchase_probability`, `confusion_score`, `churn_risk`, `verdict`,
  `content_score`, `conversion_risk_score`).
- **`jsonb` columns** for rich nested structures that map 1:1 to the domain
  types (e.g. `journey`, `pricing_tiers`/`analysis`, `sales_objections`,
  `revenue_leaks`, `role_breakdown`, `recommendations`, `dimensions`).

This keeps aggregate queries (averages, verdict breakdowns, role rollups) fast
while preserving the full structured payload for the UI.

### Table → domain type map

| Table                  | Domain type(s)                                  |
| ---------------------- | ----------------------------------------------- |
| `profiles`             | (auth identity)                                 |
| `projects`             | `RunConfig` + `WebsiteAnalysis` + `RunState`    |
| `crawled_pages`        | crawl output (Firecrawl / fetch / mock)         |
| `documents`            | chunked knowledge for RAG                       |
| `personas`             | `Persona`                                       |
| `simulations`          | `SimulationResult`                              |
| `insights`             | `Insights`                                      |
| `reports`              | `ExecutiveReport`                               |
| `competitor_analysis`  | `CompetitorAnalysis`                            |

---

## Embeddings & vector search

- Embedding columns are **`vector(768)`** to match **Gemini
  `text-embedding-004`** (768 dimensions).
- ANN indexes use **`ivfflat` with `vector_cosine_ops`**, `lists = 100` — a
  good default for free-tier data volumes.
- `ivfflat` chooses centroids from existing rows, so **build the index after
  you have a meaningful amount of data** (or `REINDEX` later) for best recall.
- Tune recall vs. speed at query time:

  ```sql
  set ivfflat.probes = 10;  -- higher = better recall, slower

  select id, content,
         1 - (embedding <=> $1) as cosine_similarity
  from documents
  where project_id = $2
  order by embedding <=> $1   -- <=> is cosine distance
  limit 8;
  ```

> RLS still applies to vector queries — users only ever search their own rows.

---

## Row Level Security

RLS is **enabled on all nine tables**. Policies:

- `profiles`: a user can only see/insert/update/delete the row where
  `id = auth.uid()`.
- Every other table: `auth.uid() = owner_id` for `select`, `insert`
  (`with check`), `update` (both `using` and `with check`), and `delete`.

The **`service_role` key bypasses RLS** — the Python engine and the Next.js
server routes use `SUPABASE_SERVICE_ROLE_KEY` for writes during a run, while
the browser uses the anon key and is fully constrained by these policies.

---

## Environment variables

The schema itself needs none, but the surrounding system uses:

| Variable                        | Used by                                  |
| ------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Web client + server                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser (RLS-constrained)                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Python engine + server writes (bypasses RLS) |
| `GEMINI_API_KEY`                | Embeddings + agent LLM (Gemini 2.5 Flash) |
| `GEMINI_MODEL` (`gemini-2.5-flash`) | Agent LLM                            |
| `FIRECRAWL_API_KEY`             | Crawl (plain-fetch fallback if absent)   |
| `PYTHON_ENGINE_URL`            | Web → engine bridge                       |

> **No keys? Still works.** Without `GEMINI_API_KEY` / `FIRECRAWL_API_KEY` the
> engine runs a deterministic seeded mock; without Supabase keys the app runs
> in-memory for a single session.

---

## Re-running / resetting

- Re-running `schema.sql` is safe — tables are created only if missing, and
  policies/triggers are dropped and recreated.
- To wipe app data (keeping auth users), truncate `projects` and let cascades
  clear the children:

  ```sql
  truncate public.projects cascade;
  ```
