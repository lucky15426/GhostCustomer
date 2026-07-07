# Ghost Customer AI

### The AI that becomes your customer before your customer becomes your problem.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3-F55036)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash_Vision-4285F4?logo=googlegemini&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![Firecrawl](https://img.shields.io/badge/Firecrawl-crawl_+_screenshot-FF7A00)

Live demo: https://ghost-ai-omega.vercel.app

---

## What is this, in plain words

Ghost Customer AI is a tool that **creates hundreds of pretend customers** using AI and sends them to look at a website. Each pretend customer ("ghost") behaves like a real type of buyer (a startup founder, a CTO, a student, an enterprise buyer, and so on). They read the homepage, the pricing, the features, and try to "buy".

Then the tool tells the business owner, in plain numbers and words:

- How many of these customers would buy, hesitate, or leave.
- What confused them.
- What questions they had that the website never answered.
- Where the business is quietly losing sales ("revenue leaks").
- Which customer groups are most likely to cancel later ("churn").

The whole point: **find the problems on your website before real customers find them and walk away.**

It is **not a chatbot**. A chatbot answers questions after a customer asks. This tool *becomes* the customer and finds the problems first.

---

## The problem it solves

When you launch a website or a new pricing page, you usually only learn what is wrong **after** it has already cost you money: bad reviews, support tickets, refunds, people leaving. By then the damage is done.

Ghost Customer AI lets you test the experience **before launch**, with a simulated crowd of customers, so you can fix the issues first.

---

## How it works (step by step)

1. You enter a website URL (for example, your own site).
2. The tool **reads and understands** the site (it crawls the page text and, for the UI Roast, takes a screenshot).
3. It **creates customer personas** across 10 common buyer types.
4. It runs the **customer swarm**: every persona walks the funnel (Landing, Pricing, Features, Onboarding, Support) and gets scored.
5. **Sales and Support agents** stress-test the site (find unanswered buying questions and weak support content).
6. It **detects revenue leaks and churn risks** and adds up the impact.
7. It shows everything **live** in a "war room", then produces an **executive report** with prioritized fixes.

You watch it happen in real time, then read a clear summary you could hand to a manager.

---

## Main features

- **Customer Swarm** - spins up 12 to 500 AI personas, each simulating a full buying journey.
- **Live War Room** - a real-time view of the swarm: animated customer nodes, live agent reasoning, growing metrics, and problems appearing as they are found.
- **Website Analysis** - reads the site and extracts the value proposition, calls to action, pricing tiers, FAQs, trust signals, and a 0 to 100 clarity score.
- **Conversion + Confusion + Churn scoring** - per persona: purchase intent, confusion, trust, and a verdict (Convert, Maybe, Churn Risk, Bounce).
- **Sales Objection Mining** - the exact buyer questions the site never answers.
- **Support Stress Test** - where FAQ and docs are too thin.
- **Revenue Leak Detector** - names each leak, how many customers it affects, and the estimated conversion loss, with a suggested fix.
- **Churn Prediction** - which customer groups are most likely to leave, and why.
- **Visual UI Roast** (`/roast`) - takes a real screenshot of the page and asks an AI vision model to act like a first-time customer: where the eye lands first, what is confusing, with boxes drawn directly on the screenshot.
- **Auto-Fix** - for each revenue leak, the AI writes ready-to-paste improved copy/markup that addresses the problem.
- **Competitor Battle Arena** (`/arena`) - crawls and analyzes both your site and a competitor for real, then shows which customer segments prefer which site, and why.
- **Pricing Time Machine** (`/pricing-lab`) - simulate a price change and see the predicted effect on conversion and revenue.
- **Executive Report** (`/report/[runId]`) - a clean narrative with prioritized recommendations, exportable to PDF or Markdown.

---

## How the AI is set up (and why)

The app uses the right tool for each job, and always has a safe backup so it never breaks:

| Job | What does it | Why |
|-----|--------------|-----|
| Read + analyze the site text | **Groq** (`llama-3.3-70b-versatile`) | Fast and has a generous free quota, so heavy text work does not hit limits. |
| Write the executive report + Auto-Fix copy | **Groq** (falls back to Gemini) | Same reason. |
| Look at the screenshot (UI Roast) | **Gemini 2.5 Flash** (vision) | Vision/multimodal understanding of the actual page image. |
| Crawl the page + take screenshots | **Firecrawl** | Clean content extraction and full-page screenshots. |
| If a model is unavailable | **Built-in deterministic engine** | Guarantees a complete, reproducible result so a live demo never fails. |

**Honesty built in:** every result is labeled with where it came from. `analysis.source` is `firecrawl` or `fetch` when the AI analyzed a real crawl, and `mock` only when every model was unavailable and it fell back to the built-in engine. The header badge shows "Gemini live" (real AI) or "Demo engine" (mock).

**Important honest note:** the AI reads the site and writes the report. The hundreds of per-persona scores are produced by a fast, rule-based engine that uses the real analysis as input. This is a deliberate choice: it keeps results fast, cheap, and reproducible instead of making hundreds of separate AI calls.

---

## The 8-agent pipeline

```
Website Analyzer  ->  Persona Generator  ->  Customer Simulation Swarm
        -> Sales Agent  +  Support Agent  (run together)
        -> Revenue Leak Agent  ->  Insight Agent  ->  Report Generator
```

- **Website Analyzer** - crawls the site and extracts structured information.
- **Persona Generator** - creates the ghost customers across 10 buyer types.
- **Customer Simulation Swarm** - each ghost walks the funnel and gets scored.
- **Sales Agent** - finds unanswered buying questions.
- **Support Agent** - finds support and documentation gaps.
- **Revenue Leak Agent** - turns the findings into quantified revenue leaks.
- **Insight Agent** - combines everything into one risk model.
- **Report Generator** - writes the final executive report.

A parallel Python version of this graph (FastAPI + LangGraph) lives in `agents-py/` for reference and self-hosting. The deployed app uses the built-in TypeScript engine.

---

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts, OGL (background visuals).
- **AI:** Groq (text) + Google Gemini 2.5 Flash (vision).
- **Crawling:** Firecrawl (crawl + screenshots), with a plain `fetch` fallback.
- **Database:** Supabase (Postgres) for saving runs.
- **Deploy:** Vercel (the Next.js app is both the website and the API/backend).

---

## Pages

| Route | What it shows |
|-------|---------------|
| `/` | Landing page. |
| `/dashboard` | Start a run: enter a URL, pick how many customers, optional extras. |
| `/simulation/[runId]` | The live War Room while the swarm runs. |
| `/insights/[runId]` | Full results: verdict breakdown, objections, leaks, churn, heatmap. |
| `/roast` | Visual UI Roast: screenshot with confusion boxes drawn on it. |
| `/arena` | Competitor Battle Arena: your site vs a rival. |
| `/pricing-lab` | Pricing Time Machine: simulate a price change. |
| `/report/[runId]` | Executive report with prioritized fixes. |

## API routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/run` | Runs the full pipeline and streams live updates. |
| POST | `/api/project` | Validates input and creates a run id. |
| POST | `/api/crawl` | Crawls + analyzes one URL. |
| POST | `/api/generate-personas` | Returns a list of personas. |
| POST | `/api/competitor-analysis` | Crawls + analyzes two sites and compares them. |
| POST | `/api/pricing-simulation` | Simulates a price change. |
| POST | `/api/vision-roast` | Screenshot + Gemini Vision roast. |
| POST | `/api/autofix` | Generates improved copy/markup for a problem. |
| GET | `/api/insights?runId=` | Reads a saved run's insights. |
| GET | `/api/report?runId=` | Reads a saved run's report. |
| GET | `/api/health` | Status, including which AI providers are configured. |

---

## Quick start (runs with zero API keys)

You do not need any API keys to try it. With no keys, the app uses the built-in deterministic engine and the full demo still works end to end.

```bash
npm install
npm run dev
# open http://localhost:3000
```

Go to `/dashboard`, paste any URL (for example `https://linear.app`), pick a customer count, and click run. You will see the live War Room and then a full report.

Add the API keys below to switch from the demo engine to real AI analysis.

---

## Environment variables (all optional)

Copy `.env.example` to `.env.local` and fill in what you have. Leave any blank to use the fallback.

| Variable | What it does | If blank |
|----------|--------------|----------|
| `GROQ_API_KEY` | Real AI for site analysis, report, and Auto-Fix. Get a free key at https://console.groq.com/keys | Falls back to Gemini, then the demo engine. |
| `GROQ_MODEL` | Groq model name. | `llama-3.3-70b-versatile` |
| `GEMINI_API_KEY` | Used for the Visual UI Roast (vision), and as the text fallback. Get a free key at https://aistudio.google.com/apikey | UI Roast is unavailable; text uses Groq or demo engine. |
| `GEMINI_MODEL` | Gemini model name. | `gemini-2.5-flash` |
| `FIRECRAWL_API_KEY` | Real crawling and screenshots. Get a free key at https://www.firecrawl.dev | Falls back to plain fetch, then demo content. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (to save runs). | Runs are kept in memory + browser cache only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key to read/write saved runs. | Same as above. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key (for future client features). | Not required today. |
| `ALLOWED_ORIGINS` | Comma-separated list of sites allowed to call the API from another domain. | Only same-origin calls are allowed. |
| `PYTHON_ENGINE_URL` | Optional URL of the Python engine. | The built-in engine is used. |

---

## Saving runs with Supabase (optional)

By default, completed runs are kept in server memory plus your browser cache. To make runs durable and shareable across devices, connect Supabase:

1. Create a project at https://supabase.com.
2. Open the SQL Editor and run the script in [`supabase/runs.sql`](supabase/runs.sql). It creates one table:
   ```sql
   create table if not exists public.runs (
     id text primary key,
     data jsonb not null,
     created_at timestamptz not null default now()
   );
   alter table public.runs enable row level security;
   ```
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment.

After this, opening a `/insights/[runId]` or `/report/[runId]` link works on any device, not just the one that ran it.

---

## Deploy to Vercel

The Next.js app is both the frontend and the backend (its API routes run as serverless functions), so it deploys as one project.

1. Import the repository at https://vercel.com.
2. Vercel auto-detects Next.js. No special settings needed.
3. In Project Settings, Environment Variables, add the keys you want (`GROQ_API_KEY`, `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, and the Supabase keys). With none, the site still works on the demo engine.
4. Deploy. Open `/api/health` to confirm which providers are active.

---

## How to tell real data from demo data

- The navbar badge: "Gemini live" means a real AI is configured; "Demo engine" means none is.
- After a run, the analysis `source` is `firecrawl` or `fetch` for real data, and `mock` for the demo fallback.
- If you connected Supabase, you can see every run in the `runs` table, including its `source`.

A common cause of demo (mock) results is a free-tier AI quota running out for the day. Adding a Groq key (or enabling billing on Gemini) fixes it.

---

## Project structure

```
src/
  app/                 Next.js pages and API routes
  components/          UI: war-room, insights, roast, arena, pricing, landing, ui
  lib/
    agents/            the 8-stage orchestrator (streams live events)
    ai/                groq.ts (text), gemini.ts (vision + fallback)
    crawl/             crawler + screenshots
    data/              the deterministic engine + persona seeds
    store.ts           run storage (Supabase + memory fallback)
    supabase.ts        Supabase client
agents-py/             optional Python FastAPI + LangGraph engine
supabase/              database schema and the runs table
presentation/          pitch deck, report, and audit PDFs
```

---

## Notes and limitations (honest)

- Per-persona scores come from a fast rule-based engine using the real analysis, not from a separate AI call per customer. This keeps it fast and reproducible.
- Free AI tiers have daily limits. If you hit them, the app falls back to the demo engine and clearly labels it. Use Groq (generous free tier) for text and add billing on Gemini if you need heavy vision use.
- The Python engine in `agents-py/` is optional and not used by the deployed site.
