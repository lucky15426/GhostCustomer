// ============================================================================
// Customer Swarm Orchestrator — the LangGraph-style pipeline (TypeScript edition)
//
//   Website Analyzer → Persona Generator → Customer Simulation Swarm
//        ├─→ Sales Agent ─┐
//        └─→ Support Agent┘→ Revenue Leak Agent → Insight Agent → Report Generator
//
// Implemented as an async generator that yields RunEvents. The /api/run route
// serializes these as newline-delimited JSON so the War Room can animate the
// swarm in real time. Mirrors agents-py/graph.py (the Python LangGraph engine).
// ============================================================================

import {
  buildInsights,
  buildReport,
  deriveSignals,
  buildCompetitor,
  demoStripeAnalysis,
  mockPersonas,
  mockSimulate,
} from "@/lib/data/mock-engine";
import { aiAnalyze, aiReport, engineName, isGeminiEnabled } from "@/lib/ai/gemini";
import { crawlSite } from "@/lib/crawl/crawler";
import { saveRun } from "@/lib/store";
import { avg, clamp, sleep } from "@/lib/utils";
import type {
  Persona,
  RunConfig,
  RunEvent,
  RunState,
  SimulationResult,
} from "@/lib/types";
import {
  analyzerThoughts,
  insightThoughts,
  leakThoughts,
  personaThoughts,
  reportThoughts,
  salesThoughts,
  simulatorThought,
  supportThoughts,
} from "./thoughts";

const STREAM_PERSONA_CAP = 120; // how many persona cards we stream to the grid
const SIM_FEED_CAP = 48; // how many individual sims we stream to the live feed
const THOUGHT_SAMPLE = 16; // simulator "thinking" lines

export async function* runPipeline(
  runId: string,
  config: RunConfig,
  opts: { fast?: boolean } = {},
): AsyncGenerator<RunEvent, void, unknown> {
  const pace = (ms: number) => (opts.fast ? Promise.resolve() : sleep(ms));
  const count = clamp(config.personaCount, 12, 500);
  // Speed Run demo: short-circuit ALL outbound network (no crawl, no Firecrawl,
  // no LLM) and serve deterministic Stripe data so the demo can't fail offline.
  const isDemo = Boolean(config.isDemo);

  const state: RunState = {
    runId,
    config: { ...config, personaCount: count },
    phase: "queued",
    createdAt: Date.now(),
    personas: [],
    simulations: [],
    engine: isDemo ? "mock" : engineName(),
  };
  await saveRun(state);

  try {
    // ---- 1. Website Analyzer ----------------------------------------------
    yield {
      type: "status",
      phase: "analyzing",
      message: isDemo ? "Speed Run — loading the Stripe demo dataset…" : "Crawling and analyzing the website…",
      progress: 5,
    };
    let analysis;
    if (isDemo) {
      // simulate ~1.8s of "processing" so it feels real, then seed instantly
      await sleep(1800);
      analysis = demoStripeAnalysis();
    } else {
      const crawl = await crawlSite(config.url);
      analysis = await aiAnalyze(config, crawl.text, crawl.source);
    }
    const signals = deriveSignals(analysis);
    state.analysis = analysis;
    // reflect what actually happened: real AI analysis vs mock fallback
    state.engine = isDemo ? "mock" : analysis.source === "mock" ? "mock" : "gemini";
    yield { type: "analysis", data: analysis };
    // Be honest in the war room when we couldn't read the live site: keep the
    // swarm running on an estimated baseline rather than failing the demo, but
    // never present it as a real crawl. (Skipped in demo — it's intentional.)
    if (!isDemo && analysis.source === "mock") {
      yield {
        type: "thought",
        agent: "Website Analyzer",
        text: "Live crawl unavailable for this URL right now — running on an estimated baseline so the swarm still completes. Re-run for real-site data.",
      };
    }
    for (const t of analyzerThoughts(analysis, signals)) {
      yield { type: "thought", ...t };
      await pace(200);
    }

    // ---- 2. Persona Generator ---------------------------------------------
    yield { type: "status", phase: "generating_personas", message: `Generating ${count} virtual customers…`, progress: 18 };
    for (const t of personaThoughts(count)) {
      yield { type: "thought", ...t };
      await pace(160);
    }
    const personas = mockPersonas(config.url, count);
    state.personas = personas;
    const streamPersonas = personas.slice(0, STREAM_PERSONA_CAP);
    const pDelay = opts.fast ? 0 : Math.max(6, Math.round(700 / streamPersonas.length));
    for (let i = 0; i < streamPersonas.length; i++) {
      yield { type: "persona", data: streamPersonas[i], index: i, total: count };
      if (i % 4 === 0) await pace(pDelay * 4);
    }

    // ---- 3. Customer Simulation Swarm -------------------------------------
    yield { type: "status", phase: "simulating", message: "Running the customer swarm…", progress: 34 };
    const sims: SimulationResult[] = personas.map((p) => mockSimulate(p, analysis, signals));
    state.simulations = sims;

    const feed = pickFeed(sims, SIM_FEED_CAP);
    const thoughtIdx = new Set(spread(feed.length, THOUGHT_SAMPLE));
    const sDelay = opts.fast ? 0 : Math.max(40, Math.round(7000 / feed.length));
    for (let i = 0; i < feed.length; i++) {
      yield { type: "simulation", data: feed[i] };
      if (thoughtIdx.has(i)) yield { type: "thought", ...simulatorThought(feed[i]) };
      // animate the live counters over a growing prefix of the FULL swarm
      const prefix = sims.slice(0, Math.ceil(((i + 1) / feed.length) * sims.length));
      yield { type: "metric", key: "avgPurchase", value: avg(prefix.map((s) => s.purchaseProbability)) };
      yield { type: "metric", key: "avgConfusion", value: avg(prefix.map((s) => s.confusionScore)) };
      yield { type: "metric", key: "simulated", value: prefix.length };
      yield { type: "status", phase: "simulating", message: `Simulated ${prefix.length}/${count} customers…`, progress: clamp(34 + ((i + 1) / feed.length) * 34) };
      await pace(sDelay);
    }

    // ---- 4 + 5. Sales Agent ∥ Support Agent -------------------------------
    yield { type: "status", phase: "sales_support", message: "Sales & Support agents stress-testing…", progress: 70 };
    const insights = buildInsights(analysis, personas, sims);
    state.insights = insights;
    for (const t of salesThoughts(analysis, signals)) {
      yield { type: "thought", ...t };
      await pace(170);
    }
    for (const o of insights.salesObjections.filter((x) => !x.answeredOnSite)) {
      yield { type: "objection", data: o };
      await pace(120);
    }
    for (const t of supportThoughts(signals)) {
      yield { type: "thought", ...t };
      await pace(170);
    }

    // ---- 6. Revenue Leak Agent --------------------------------------------
    yield { type: "status", phase: "revenue_churn", message: "Detecting revenue leaks & churn risk…", progress: 80 };
    for (const t of leakThoughts(insights.revenueLeaks.length)) {
      yield { type: "thought", ...t };
      await pace(160);
    }
    for (const l of insights.revenueLeaks) {
      yield { type: "leak", data: l };
      await pace(200);
    }

    // ---- 7. Insight Agent --------------------------------------------------
    yield { type: "status", phase: "synthesizing", message: "Synthesizing insights…", progress: 88 };
    for (const t of insightThoughts()) {
      yield { type: "thought", ...t };
      await pace(160);
    }
    yield { type: "metric", key: "conversionRisk", value: insights.conversionRiskScore };
    yield { type: "metric", key: "estUplift", value: insights.estConversionUplift };
    yield { type: "insights", data: insights };

    // ---- optional: Competitor Battle (real crawl + AI analysis of the rival)
    if (config.competitorUrl && !isDemo) {
      const compCrawl = await crawlSite(config.competitorUrl);
      const compAnalysis = await aiAnalyze(
        { url: config.competitorUrl, personaCount: 0 },
        compCrawl.text,
        compCrawl.source,
      );
      state.competitor = buildCompetitor(config.url, config.competitorUrl, analysis, compAnalysis);
    }

    // ---- 8. Report Generator ----------------------------------------------
    yield { type: "status", phase: "reporting", message: "Writing the executive report…", progress: 94 };
    for (const t of reportThoughts()) {
      yield { type: "thought", ...t };
      await pace(150);
    }
    const report = isDemo
      ? buildReport(analysis, insights, state.competitor)
      : await aiReport(analysis, insights, state.competitor);
    state.report = report;
    yield { type: "report", data: report };

    state.phase = "done";
    await saveRun(state);
    yield { type: "status", phase: "done", message: "Simulation complete.", progress: 100 };
    yield { type: "done", runId };
  } catch (err) {
    const message = (err as Error).message || "Unknown error";
    state.phase = "error";
    state.error = message;
    await saveRun(state);
    yield { type: "error", message };
  }
}

/** Build a representative live feed: interleave converts, fence-sitters,
 *  churn-risks, and bounces so the stream feels alive and balanced. */
function pickFeed(sims: SimulationResult[], cap: number): SimulationResult[] {
  if (sims.length <= cap) return sims;
  const buckets = {
    Convert: sims.filter((s) => s.verdict === "Convert"),
    Maybe: sims.filter((s) => s.verdict === "Maybe"),
    "Churn Risk": sims.filter((s) => s.verdict === "Churn Risk"),
    Bounce: sims.filter((s) => s.verdict === "Bounce"),
  };
  const out: SimulationResult[] = [];
  let i = 0;
  const order = Object.values(buckets);
  while (out.length < cap) {
    const b = order[i % order.length];
    const next = b.shift();
    if (next) out.push(next);
    i++;
    if (order.every((x) => x.length === 0)) break;
  }
  return out.slice(0, cap);
}

/** N evenly spread indices across a range of length len. */
function spread(len: number, n: number): number[] {
  if (len <= n) return Array.from({ length: len }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(Math.floor((i * len) / n));
  return out;
}

// Helper used by /api/run to also synthesize a fresh run object synchronously.
export function newRunId(): string {
  try {
    return "run_" + crypto.randomUUID().slice(0, 8);
  } catch {
    return "run_" + Math.random().toString(36).slice(2, 10);
  }
}
