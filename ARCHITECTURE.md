# 🏛️ Ghost Customer AI — Architecture

This document describes the canonical 8-agent graph, the end-to-end data flow, the
streaming NDJSON `RunEvent` protocol, the dual-engine (TypeScript ‖ Python) design, the
deterministic mock-engine fallback, and the shared data model.

---

## 1. The Agent Graph

The pipeline is a directed graph with one fan-out / fan-in. It is implemented **twice,
identically** — in TypeScript (`src/lib/agents/orchestrator.ts`) and in Python LangGraph
(`agents-py/graph.py`). Both produce the same `RunEvent` stream.

```
                           ┌───────────────────────────┐
                  START ──▶ │      Website Analyzer      │  crawl + Gemini/mock analysis
                           └─────────────┬─────────────┘
                                         ▼
                           ┌───────────────────────────┐
                           │      Persona Generator      │  10 canonical roles, seeded
                           └─────────────┬─────────────┘
                                         ▼
                           ┌───────────────────────────┐
                           │  Customer Simulation Swarm  │  per-persona gap-penalty scoring
                           └────────┬───────────┬───────┘
                          fan-out   │           │
                       ┌────────────▼──┐   ┌────▼─────────────┐
                       │  Sales Agent   │   │  Support Agent   │   run in parallel
                       │  (objections)  │   │  (FAQ/doc gaps)  │   disjoint state keys
                       └────────────┬──┘   └────┬─────────────┘
                          fan-in    │           │
                       ┌────────────▼───────────▼──────────┐
                       │        Revenue Leak Agent          │  joins both branches
                       └─────────────────┬─────────────────┘
                                         ▼
                           ┌───────────────────────────┐
                           │        Insight Agent        │  aggregate (+ optional competitor)
                           └─────────────┬─────────────┘
                                         ▼
                           ┌───────────────────────────┐
                           │       Report Generator      │  Gemini/mock narrative
                           └─────────────┬─────────────┘
                                         ▼
                                        END
```

| Node | Input | Output (state keys) |
|------|-------|---------------------|
| **Website Analyzer** | `url`, crawled text | `analysis: WebsiteAnalysis`, `source`, `engine` |
| **Persona Generator** | `url`, `personaCount` | `personas: Persona[]` |
| **Customer Simulation Swarm** | `analysis`, `personas` | `simulations: SimulationResult[]` |
| **Sales Agent** | `simulations` | `sales` (avg purchase, objection blockers) |
| **Support Agent** | `simulations` | `support` (avg support dependency, confusion) |
| **Revenue Leak Agent** | `sales` + `support` (fan-in join) | — (asserts both branches done) |
| **Insight Agent** | `analysis`, `simulations` | `insights: Insights`, `competitor?` |
| **Report Generator** | `analysis`, `insights`, `competitor?` | `report: ExecutiveReport` |

**Concurrency contract.** `Sales Agent` and `Support Agent` fan out from the simulator
and write to **disjoint** state keys (`sales` vs `support`). `Revenue Leak Agent` is the
fan-in join — in the LangGraph `StateGraph` it has incoming edges from both, so it cannot
fire until both branches complete (it asserts `"sales" in state and "support" in state`).
Because the branches never touch the same key, the default last-writer-wins reducer is
safe under parallelism.

---

## 2. Data Flow

```
 ┌──────┐   crawl     ┌──────────┐   analyze    ┌──────────────────┐   spawn    ┌──────────┐
 │ URL  │ ──────────▶ │  text    │ ───────────▶ │ WebsiteAnalysis  │ ─────────▶ │ Persona[]│
 └──────┘ Firecrawl   └──────────┘  Gemini/mock └──────────────────┘  seeded    └────┬─────┘
            → fetch                                                                    │
            → mock                                                                     ▼
                                                                            ┌────────────────────┐
                                                                            │ Customer Swarm      │
                                                                            │ SimulationResult[]  │
                                                                            └─────────┬──────────┘
                                                            ┌─────────── fan-out ──────┴─── fan-out ──────────┐
                                                            ▼                                                 ▼
                                                   ┌──────────────┐                                  ┌──────────────┐
                                                   │ Sales Agent  │                                  │Support Agent │
                                                   │ objections   │                                  │ FAQ/doc gaps │
                                                   └──────┬───────┘                                  └──────┬───────┘
                                                          └──────────────── fan-in ───────────────────────┘
                                                                            ▼
                                                            ┌────────────────────────────┐
                                                            │ Revenue Leak Agent          │
                                                            │ leaks + churn quantification│
                                                            └──────────────┬─────────────┘
                                                                           ▼
                                                            ┌────────────────────────────┐
                                                            │ Insight Agent → Insights    │
                                                            │ (+ optional CompetitorAnalysis)
                                                            └──────────────┬─────────────┘
                                                                           ▼
                                                            ┌────────────────────────────┐
                                                            │ Report Generator           │
                                                            │ → ExecutiveReport           │
                                                            └─────────────────────────────┘
```

**Step by step:**

1. **URL → crawl.** `crawlSite(url)` tries Firecrawl (`FIRECRAWL_API_KEY`), then a plain
   `fetch` + dependency-free HTML→text strip, then gives up (text = `null`). The chosen
   tier is recorded as `source: "firecrawl" | "fetch" | "none"`.
2. **crawl → analyze.** `aiAnalyze` sends the (truncated) text to Gemini for structured
   extraction. No key, no text, or a malformed/timed-out response ⇒ `mockAnalyze`. The
   final `WebsiteAnalysis.source` reflects the real crawl tier (or `"mock"`).
3. **analyze → personas.** `mockPersonas(url, count)` deterministically spawns 12–500
   personas across the 10 canonical roles, seeded from the URL.
4. **personas → swarm.** Each persona runs through `mockSimulate` / `simulate_one`, which
   walks the funnel (`Landing → Pricing → Features → Onboarding → Support`) and applies
   **gap-penalty scoring** to produce per-stage sentiment and a final verdict.
5. **swarm → Sales ‖ Support.** Sales aggregates purchase-blocking objections; Support
   aggregates support dependency and confusion. They run as parallel branches.
6. **Sales/Support → Revenue/Churn.** The Revenue Leak Agent joins both branches; leak and
   churn math is computed during insight aggregation so every figure is consistent.
7. **→ Insight.** `buildInsights` / `mock_insights` produce the single `Insights` object
   the UI consumes (verdict breakdown, role breakdown, objections, support gaps, revenue
   leaks, churn risks, heatmap, top questions). If `competitorUrl` is set, a
   `CompetitorAnalysis` is attached.
8. **→ Report.** `aiReport` writes the `ExecutiveReport` narrative via Gemini (mock
   fallback), grounded only in the computed insights.

---

## 3. Streaming NDJSON `RunEvent` Protocol

`POST /api/run` returns a `ReadableStream` of **newline-delimited JSON** — one JSON object
per line. Response headers: `Content-Type: application/x-ndjson; charset=utf-8`,
`Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`, `Connection: keep-alive`
(so reverse proxies on Vercel/Render/Railway don't buffer the live stream).

The very first line is an `init` frame carrying the `runId`; thereafter the orchestrator's
events are serialized verbatim. Event types (mirrored in `src/lib/types.ts`):

| Type | Shape | Emitted by |
|------|-------|------------|
| `init` | `{ type, runId }` | `/api/run` wrapper (first line) |
| `status` | `{ type, phase, message, progress }` | every phase transition |
| `analysis` | `{ type, data: WebsiteAnalysis }` | Website Analyzer |
| `persona` | `{ type, data: Persona, index, total }` | Persona Generator |
| `thought` | `{ type, agent: AgentName, text }` | every agent (war-room flavor) |
| `simulation` | `{ type, data: SimulationResult }` | Customer Swarm |
| `metric` | `{ type, key, value }` | live counters (avgPurchase, avgConfusion, simulated, conversionRisk, estUplift…) |
| `objection` | `{ type, data: SalesObjection }` | Sales Agent |
| `leak` | `{ type, data: RevenueLeak }` | Revenue Leak Agent |
| `insights` | `{ type, data: Insights }` | Insight Agent |
| `report` | `{ type, data: ExecutiveReport }` | Report Generator |
| `done` | `{ type, runId }` | terminal success |
| `error` | `{ type, message }` | terminal failure (stream never crashes) |

`RunPhase` progression: `queued → analyzing → generating_personas → simulating →
sales_support → revenue_churn → synthesizing → reporting → done` (or `error`), with a
`progress` integer (0–100) carried on `status` events to drive the UI progress bar.

**Resilience:** both engines wrap the generator body in try/catch and emit a terminal
`error` event instead of throwing, so a partial run still renders. The client also caches
each run in `localStorage`, so navigating War Room → Insights → Report works even on
serverless deploys where the in-memory store doesn't persist between requests.

---

## 4. Dual-Engine Design (TS ‖ Python)

The same pipeline exists in two interchangeable engines that emit the **identical**
`RunEvent` NDJSON contract using the **exact same camelCase field names**:

| | TypeScript engine (default) | Python engine (optional) |
|---|---|---|
| Entry | `src/lib/agents/orchestrator.ts` → `runPipeline()` | `agents-py/graph.py` → `run_pipeline()` |
| Graph | async generator yielding `RunEvent` | LangGraph `StateGraph` (`compile_graph()` → `GRAPH`) + streaming generator |
| Crawl | `src/lib/crawl/crawler.ts` | `agents-py/crawl.py` |
| AI | `src/lib/ai/gemini.ts` (`@google/generative-ai`) | `agents-py/gemini.py` (`google-generativeai`) |
| Mock | `src/lib/data/mock-engine.ts` | `agents-py/mock.py` |
| Types | `src/lib/types.ts` (interfaces) | `agents-py/models.py` (Pydantic v2, camelCase) |
| Served by | Next.js API routes | FastAPI (`agents-py/main.py`) |

**Routing.** By default the Next.js API routes run the in-process TS engine. When
`PYTHON_ENGINE_URL` is set, `next.config.mjs` adds a rewrite:

```js
async rewrites() {
  const py = process.env.PYTHON_ENGINE_URL;
  if (!py) return [];
  return [{ source: "/py/:path*", destination: `${py}/:path*` }];
}
```

so the browser can reach the engine same-origin: `/py/run`, `/py/crawl`,
`/py/generate-personas`, `/py/competitor-analysis`, `/py/pricing-simulation`, `/py/health`.
Because the contract is identical on both sides, the TS routes can run locally **or**
delegate to `/py/*` with no client changes.

The Python `graph.py` exposes both:
- `compile_graph()` → a real compiled LangGraph `StateGraph` (`GRAPH`) for batch /
  introspection use via `run_graph(config)`.
- `run_pipeline(config)` → an async generator that re-runs the same node logic with
  finer-grained `thought` / `metric` / `persona` events and pacing for the live UI.

---

## 5. Deterministic Mock-Engine Fallback

> **Zero-key guarantee:** with no `GEMINI_API_KEY` and no `FIRECRAWL_API_KEY`, the entire
> pipeline runs on a deterministic, seeded mock engine. The same URL always produces the
> same result — demos are reproducible and fully offline.

- **Determinism:** the mock engine seeds a PRNG from a hash of the URL (Python:
  `mock.seed_for(url)` SHA-256 → 64-bit seed → per-call `random.Random`). Same URL ⇒
  identical personas, simulations, insights, and report every time.
- **Gap-penalty scoring** (the heart of the simulation): the analyzer detects gaps, and
  the swarm penalizes the personas those gaps actually hurt —
  - missing **SSO / security** → lowers purchase + trust for **Enterprise Buyer** & **CTO**,
  - **unclear pricing** → hurts budget-sensitive personas,
  - **no free tier** → hurts **Student** & **Freelancer**,
  - **sparse FAQ / thin docs** → raises **support dependency** + **confusion**.
  The _same_ detected gaps drive Insights, the ExecutiveReport, the CompetitorAnalysis,
  and the PricingSimulation — so every number on every screen agrees.
- **Pricing model:** a constant-elasticity demand curve scanned over a price grid to find
  the revenue-maximizing `optimalPrice`, plus per-segment churn reactions.
- **Graceful degradation everywhere:** each external call has a layered fallback —
  Firecrawl → fetch → mock for crawling; Gemini (timeout-guarded, JSON-validated) → mock
  for analysis and report. A failure at any layer silently drops to the next; the UI never
  sees a broken state.

---

## 6. Data Model

All types are defined once in `src/lib/types.ts` (TypeScript interfaces) and mirrored in
`agents-py/models.py` (Pydantic v2, **same camelCase field names**), so JSON is drop-in
compatible across both engines and the frontend.

| Type | Key fields |
|------|------------|
| **WebsiteAnalysis** | `url, title, tagline, category, valueProps[], ctas[], navItems[], pricingTiers[{name,price,period,highlights[]}], faqs[{q,a}], trustSignals[], missingTrustSignals[], onboardingSteps[], detectedFeatures[], targetAudience, toneOfVoice, contentScore(0–100), source("firecrawl"\|"fetch"\|"mock")` |
| **Persona** | `id, name, avatarSeed, age, role, archetype, companySize, industry, budgetSensitivity, technicalSkill, purchaseIntent, goals[], frustrations[], objections[], quote, emoji, accent(hex)` |
| **SimulationResult** | `personaId, personaName, role, interestScore, confusionScore, purchaseProbability, supportDependency, churnRisk, trustScore (all 0–100), verdict("Convert"\|"Maybe"\|"Churn Risk"\|"Bounce"), topObjection, reasoning, journey[{stage,sentiment(-100..100),note}]` |
| **Insights** | `headline, avgPurchaseProbability, avgConfusion, avgChurnRisk, conversionRiskScore, estConversionUplift, verdictBreakdown{}, roleBreakdown[], salesObjections[], supportGaps[], revenueLeaks[], churnRisks[], heatmap[], topQuestions[]` |
| **ExecutiveReport** | `executiveSummary, keyFindings[], conversionRisks[], churnRisks[], revenueLeaks[], customerQuestions[], competitorNotes[], recommendations[{title,detail,effort,impact}], projectedUplift` |
| **PricingSimulation** | `currentPrice, proposedPrice, expectedConversionChange, expectedRevenueChange, recommendation, segmentReactions[{role,reaction,willChurn}], optimalPrice, curve[{price,conversion,revenueIndex}]` |
| **CompetitorAnalysis** | `you{url,title,score}, competitor{url,title,score}, winner("you"\|"competitor"\|"tie"), reason, dimensions[{name,you,competitor,winner}], personaPreferences[{role,prefers,why}]` |
| **RunConfig** | `url, pricingUrl?, faqUrl?, competitorUrl?, personaCount, currentPrice?` |
| **RunState** | `runId, config, phase, createdAt, analysis?, personas[], simulations[], insights?, competitor?, report?, engine("gemini"\|"mock"), error?` |

**Canonical persona roles (10):** Startup Founder · CTO · Product Manager · Agency Owner ·
Student · Small Business Owner · Enterprise Buyer · Operations Manager · HR Manager ·
Freelancer.

**Supporting enums/types:** `Level = "Low"|"Medium"|"High"`, `Verdict`,
`JourneyStage = "Landing"|"Pricing"|"Features"|"Onboarding"|"Support"`,
`Severity = "low"|"medium"|"high"|"critical"`, and `ChurnRisk.category =
"Pricing"|"Onboarding"|"Missing Features"|"Poor Support"|"Complexity"`.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the Supabase schema that persists these objects.
