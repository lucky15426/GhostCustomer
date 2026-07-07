# Ghost Customer AI — Python Engine (FastAPI + LangGraph)

> The AI that becomes your customer before your customer becomes your problem.

This is the optional Python engine behind **Ghost Customer AI**. It runs the
canonical **8-agent pipeline** as a real [LangGraph](https://github.com/langchain-ai/langgraph)
`StateGraph`, crawls the target site (Firecrawl → plain fetch → mock), runs the
ghost-customer simulation swarm, and streams progress to the Next.js front end as
newline-delimited JSON (NDJSON).

**Zero-key guarantee:** with **no** `GEMINI_API_KEY` and **no** `FIRECRAWL_API_KEY`,
the engine runs entirely on a deterministic, seeded **mock engine**. The same URL
always produces the same result, so demos are reproducible and fully offline.

---

## Quick start

```bash
cd agents-py
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optional — leave keys blank to run on the mock engine
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive Swagger UI, or hit
http://localhost:8000/health.

Quick streaming smoke test:

```bash
curl -N -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{"url":"https://linear.app","personaCount":8,"competitorUrl":"https://asana.com","currentPrice":29}'
```

You'll see a stream of `status`, `analysis`, `persona`, `thought`, `simulation`,
`metric`, `objection`, `leak`, `insights`, `report`, and finally `done` events.

---

## Environment variables

Everything is **optional**. Copy `.env.example` → `.env`.

| Variable                        | Purpose                                                        | Fallback if unset                |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------- |
| `GEMINI_API_KEY`                | Enables real Gemini analysis + report narrative                | Deterministic mock engine        |
| `GEMINI_MODEL`                  | Model id (default `gemini-2.5-flash`)                          | `gemini-2.5-flash`               |
| `FIRECRAWL_API_KEY`             | Enables Firecrawl scraping                                     | Plain `httpx` fetch → mock       |
| `PYTHON_ENGINE_URL`             | Set in the **Next.js** app to point at this engine             | Next.js runs its own TS engine   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase persistence/auth (frontend; unused by this engine)    | —                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (frontend)                                   | —                                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role (frontend)                               | —                                |

The engine reports its capabilities at `GET /health`:

```json
{ "ok": true, "engine": "mock", "gemini": false, "firecrawl": false }
```

---

## Endpoints

| Method | Path                    | Body                                                                 | Returns                                   |
| ------ | ----------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| GET    | `/health`               | —                                                                    | `{ok, engine, gemini, firecrawl}`         |
| POST   | `/run`                  | `RunConfig` `{url, pricingUrl?, faqUrl?, competitorUrl?, personaCount, currentPrice?}` | **NDJSON stream** of `RunEvent` objects   |
| POST   | `/crawl`                | `{url}`                                                              | `{url, source, text, analysis}`           |
| POST   | `/generate-personas`    | `{url, personaCount}`                                                | `{personas: Persona[]}`                   |
| POST   | `/competitor-analysis`  | `{url, competitorUrl}`                                               | `CompetitorAnalysis`                      |
| POST   | `/pricing-simulation`   | `{url, currentPrice?, proposedPrice?}`                               | `PricingSimulation`                       |

All payloads use the **exact camelCase field names** from `src/lib/types.ts`, so the
JSON is drop-in compatible with the frontend.

### NDJSON `RunEvent` types (one JSON object per line)

```
status{phase,message,progress}   analysis{data}     persona{data,index,total}
thought{agent,text}              simulation{data}   metric{key,value}
objection{data}                  leak{data}         insights{data}
report{data}                     done{runId}        error{message}
```

---

## Wiring to the Next.js frontend (`/py/*` proxy)

The frontend already ships a conditional rewrite in `next.config.mjs`:

```js
async rewrites() {
  const py = process.env.PYTHON_ENGINE_URL;
  if (!py) return [];
  return [{ source: "/py/:path*", destination: `${py}/:path*` }];
}
```

So to route the web app through this engine:

1. Start the engine: `uvicorn main:app --port 8000`.
2. In the Next.js app's `.env.local`, set:
   ```
   PYTHON_ENGINE_URL=http://localhost:8000
   ```
3. Restart `next dev`. Now the browser can reach the engine at same-origin paths:

   | Frontend (proxied)        | → | Engine                       |
   | ------------------------- | - | ---------------------------- |
   | `/py/health`              | → | `GET  /health`               |
   | `/py/run`                 | → | `POST /run` (NDJSON stream)  |
   | `/py/crawl`               | → | `POST /crawl`                |
   | `/py/generate-personas`   | → | `POST /generate-personas`    |
   | `/py/competitor-analysis` | → | `POST /competitor-analysis`  |
   | `/py/pricing-simulation`  | → | `POST /pricing-simulation`   |

The TS API routes (`/api/run`, `/api/crawl`, …) can either run the built-in TS engine
**or** delegate to `/py/*` when `PYTHON_ENGINE_URL` is configured — the contract is
identical on both sides.

> NDJSON streaming note: this engine sets `X-Accel-Buffering: no` and
> `Cache-Control: no-transform` so reverse proxies (nginx on Render/Railway, Vercel
> rewrites) don't buffer the stream.

---

## The LangGraph node diagram

`graph.py` builds this exact `StateGraph` and `compile_graph()` returns the compiled
app (`GRAPH`). The streaming demo path (`run_pipeline`) re-runs the same node logic
with finer-grained events and pacing.

```
                       ┌──────────────────────┐
            START ───▶ │   website_analyzer    │   crawl + Gemini/mock analysis
                       └──────────┬───────────┘
                                  ▼
                       ┌──────────────────────┐
                       │   persona_generator   │   10 canonical roles
                       └──────────┬───────────┘
                                  ▼
                       ┌──────────────────────┐
                       │  customer_simulator   │   gap-penalty scoring swarm
                       └─────┬──────────┬──────┘
                  fan-out    │          │
                   ┌─────────▼───┐  ┌───▼──────────┐
                   │ sales_agent │  │ support_agent│
                   └─────────┬───┘  └───┬──────────┘
                  fan-in     │          │
                       ┌─────▼──────────▼─────┐
                       │  revenue_leak_agent   │   joins both branches
                       └──────────┬───────────┘
                                  ▼
                       ┌──────────────────────┐
                       │     insight_agent     │   aggregate + competitor
                       └──────────┬───────────┘
                                  ▼
                       ┌──────────────────────┐
                       │   report_generator    │   Gemini/mock narrative
                       └──────────┬───────────┘
                                  ▼
                                 END
```

* **Fan-out**: `customer_simulator` → `sales_agent` **and** `support_agent`.
* **Fan-in**: both → `revenue_leak_agent` (it asserts both branches completed).
* `sales_agent` and `support_agent` write to **disjoint** state keys (`sales`,
  `support`), so the default last-writer-wins reducer is safe under parallelism.

---

## Project layout

```
agents-py/
├── requirements.txt     # pinned deps (fastapi, langgraph, google-generativeai, ...)
├── main.py              # FastAPI app + endpoints (incl. NDJSON /run)
├── graph.py             # LangGraph StateGraph + async run_pipeline() generator
├── models.py            # Pydantic v2 models mirroring src/lib/types.ts (camelCase)
├── mock.py              # deterministic seeded engine (offline guarantee)
├── gemini.py            # google-generativeai wrapper (JSON mode, mock fallback)
├── crawl.py             # Firecrawl → plain fetch → mock crawler
├── Dockerfile           # python:3.12-slim image
├── .env.example         # env var template
└── README.md            # you are here
```

---

## Deploying (Render / Railway free tier)

The provided `Dockerfile` honors the platform-injected `$PORT`:

```dockerfile
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

* **Render**: New → Web Service → Docker → set env vars → deploy. Health check `/health`.
* **Railway**: New Project → Deploy from repo (root `agents-py/`) → set env vars.

Then set `PYTHON_ENGINE_URL=https://<your-service>.onrender.com` in the Vercel
project for the Next.js app to enable the `/py/*` proxy in production.

---

## Design notes

* **Determinism**: `mock.seed_for(url)` hashes the URL with SHA-256 → 64-bit seed,
  feeding a per-call `random.Random`. Same URL ⇒ identical output every time.
* **Gap-penalty scoring** (in `mock.simulate_one`): missing **SSO** hurts
  Enterprise Buyer & CTO purchase + trust; **unclear pricing** hurts budget-sensitive
  personas; **no free tier** hurts Student & Freelancer; **sparse FAQ** raises support
  dependency + confusion. The same detected gaps drive Insights, the ExecutiveReport,
  the CompetitorAnalysis, and the PricingSimulation — so every number agrees.
* **Pricing** uses a constant-elasticity demand model and scans a price grid for the
  revenue-maximizing `optimalPrice`.
* **Resilience**: every AI/network call degrades gracefully — Gemini timeout/parse
  errors and crawl failures all fall back to the mock, and `run_pipeline` wraps its
  body so it emits an `error` event instead of crashing the stream.
```
