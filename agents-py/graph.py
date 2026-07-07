"""
Ghost Customer AI — LangGraph pipeline.

This module defines the canonical 8-agent graph as a real LangGraph
`StateGraph`, plus an async generator `run_pipeline(config)` that re-runs the
same logic node-by-node and yields `RunEvent` dicts so FastAPI can stream
NDJSON, mirroring the pacing of the TS orchestrator.

Canonical graph (mirrored exactly):

    website_analyzer
          │
    persona_generator
          │
    customer_simulator
        ┌─┴─┐
   sales_agent  support_agent      (both run after the simulator)
        └─┬─┘
    revenue_leak_agent             (fan-in: waits for sales + support)
          │
    insight_agent
          │
    report_generator
          │
        END

LangGraph runs `sales_agent` and `support_agent` as a fan-out from the
simulator and fans them back into `revenue_leak_agent`. Because both write to
disjoint keys in the shared state, the default last-writer-wins reducer is safe.

The compiled graph is exposed via `compile_graph()` for batch/non-streaming use
and introspection. The streaming demo path uses `run_pipeline()` which gives us
fine-grained control over `thought`/`metric`/`persona` events and pacing.
"""

from __future__ import annotations

import asyncio
import uuid
from typing import Any, AsyncGenerator, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph

import crawl
import gemini
import mock
from models import (
    CompetitorAnalysis,
    ExecutiveReport,
    Insights,
    Persona,
    RunConfig,
    SimulationResult,
    WebsiteAnalysis,
)


# ---------------------------------------------------------------------------
# Shared graph state
# ---------------------------------------------------------------------------
class GraphState(TypedDict, total=False):
    # Inputs
    url: str
    config: Dict[str, Any]
    # Crawl
    crawled_text: Optional[str]
    source: str
    # Node outputs (typed objects, serialized only at the edges)
    analysis: WebsiteAnalysis
    personas: List[Persona]
    simulations: List[SimulationResult]
    sales: Dict[str, Any]
    support: Dict[str, Any]
    insights: Insights
    competitor: Optional[CompetitorAnalysis]
    report: ExecutiveReport
    engine: str  # "gemini" | "mock"


# ---------------------------------------------------------------------------
# Node implementations (pure-ish; each takes state, returns a partial update)
# ---------------------------------------------------------------------------
def _cfg(state: GraphState) -> RunConfig:
    return RunConfig.model_validate(state.get("config") or {"url": state.get("url", "")})


def node_website_analyzer(state: GraphState) -> Dict[str, Any]:
    cfg = _cfg(state)
    text, source = crawl.crawl_site(cfg.url)
    analysis = gemini.ai_analyze(text, cfg.url, source=source)
    return {
        "crawled_text": text,
        "source": source,
        "analysis": analysis,
        "engine": "gemini" if gemini.is_enabled() else "mock",
    }


def node_persona_generator(state: GraphState) -> Dict[str, Any]:
    cfg = _cfg(state)
    personas = mock.mock_personas(cfg.url, cfg.personaCount)
    return {"personas": personas}


def node_customer_simulator(state: GraphState) -> Dict[str, Any]:
    cfg = _cfg(state)
    sims = mock.mock_simulations(cfg.url, state["analysis"], state["personas"])
    return {"simulations": sims}


def node_sales_agent(state: GraphState) -> Dict[str, Any]:
    """Aggregates purchase-blocking objections. Writes only to `sales`."""
    sims = state["simulations"]
    avg_purchase = round(
        sum(s.purchaseProbability for s in sims) / max(len(sims), 1)
    )
    blockers = sorted(
        {s.topObjection for s in sims if s.verdict in ("Bounce", "Churn Risk", "Maybe")}
    )
    return {"sales": {"avgPurchase": avg_purchase, "objections": blockers}}


def node_support_agent(state: GraphState) -> Dict[str, Any]:
    """Aggregates support-dependency signals. Writes only to `support`."""
    sims = state["simulations"]
    avg_support = round(sum(s.supportDependency for s in sims) / max(len(sims), 1))
    avg_confusion = round(sum(s.confusionScore for s in sims) / max(len(sims), 1))
    return {"support": {"avgSupport": avg_support, "avgConfusion": avg_confusion}}


def node_revenue_leak_agent(state: GraphState) -> Dict[str, Any]:
    """Fan-in node: needs sales + support before quantifying leaks. The actual
    leak math lives in the insight aggregation, so here we simply assert both
    upstream branches completed (kept explicit for graph correctness)."""
    # No-op transform; presence of both keys proves the fan-in joined.
    assert "sales" in state and "support" in state
    return {}


def node_insight_agent(state: GraphState) -> Dict[str, Any]:
    cfg = _cfg(state)
    insights = mock.mock_insights(cfg.url, state["analysis"], state["simulations"])
    competitor = None
    if cfg.competitorUrl:
        competitor = mock.mock_competitor(cfg.url, cfg.competitorUrl)
    return {"insights": insights, "competitor": competitor}


def node_report_generator(state: GraphState) -> Dict[str, Any]:
    cfg = _cfg(state)
    report = gemini.ai_report(
        cfg.url, state["analysis"], state["insights"], state.get("competitor")
    )
    return {"report": report}


# ---------------------------------------------------------------------------
# Graph wiring
# ---------------------------------------------------------------------------
def compile_graph():
    """Build and compile the canonical StateGraph. Returns the compiled app."""
    g = StateGraph(GraphState)

    g.add_node("website_analyzer", node_website_analyzer)
    g.add_node("persona_generator", node_persona_generator)
    g.add_node("customer_simulator", node_customer_simulator)
    g.add_node("sales_agent", node_sales_agent)
    g.add_node("support_agent", node_support_agent)
    g.add_node("revenue_leak_agent", node_revenue_leak_agent)
    g.add_node("insight_agent", node_insight_agent)
    g.add_node("report_generator", node_report_generator)

    g.add_edge(START, "website_analyzer")
    g.add_edge("website_analyzer", "persona_generator")
    g.add_edge("persona_generator", "customer_simulator")

    # Fan-out: sales + support both run after the simulator.
    g.add_edge("customer_simulator", "sales_agent")
    g.add_edge("customer_simulator", "support_agent")

    # Fan-in: revenue_leak_agent waits for BOTH branches.
    g.add_edge("sales_agent", "revenue_leak_agent")
    g.add_edge("support_agent", "revenue_leak_agent")

    g.add_edge("revenue_leak_agent", "insight_agent")
    g.add_edge("insight_agent", "report_generator")
    g.add_edge("report_generator", END)

    return g.compile()


# Module-level singleton so importers can `from graph import GRAPH`.
GRAPH = compile_graph()


def run_graph(config: Dict[str, Any]) -> GraphState:
    """Synchronous, non-streaming full run via the compiled LangGraph."""
    url = config.get("url", "")
    return GRAPH.invoke({"url": url, "config": config})  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Streaming pipeline — yields RunEvent dicts mirroring the TS orchestrator.
# ---------------------------------------------------------------------------
async def run_pipeline(config: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Drive the same node logic as the compiled graph, but emit granular events
    for the live "war room" UI. Pacing uses small sleeps so the stream feels
    alive; tune `_PACE` to slow/speed the demo.

    Event types (one JSON object per NDJSON line):
      status, analysis, persona, thought, simulation, metric, leak,
      objection, insights, report, done, error
    """
    _PACE = 0.04  # seconds between cosmetic events
    cfg = RunConfig.model_validate(config or {})
    run_id = config.get("runId") or f"run_{uuid.uuid4().hex[:10]}"
    engine = "gemini" if gemini.is_enabled() else "mock"

    try:
        # -- 0) queued -------------------------------------------------------
        yield _status("queued", "Spinning up ghost customer swarm...", 2)
        await asyncio.sleep(_PACE)

        # -- 1) Website Analyzer --------------------------------------------
        yield _status("analyzing", "Crawling and analyzing the site...", 8)
        yield _thought("Website Analyzer", f"Fetching {cfg.url} ...")
        text, source = await crawl.crawl_site_async(cfg.url)
        yield _thought(
            "Website Analyzer",
            f"Crawl source: {source}. "
            + (f"{len(text)} chars of content." if text else "Using deterministic mock."),
        )
        analysis = gemini.ai_analyze(text, cfg.url, source=source)
        yield {"type": "analysis", "data": analysis.model_dump()}
        yield _metric("contentScore", analysis.contentScore)
        yield _thought(
            "Website Analyzer",
            f"Category: {analysis.category}; {len(analysis.detectedFeatures)} features, "
            f"{len(analysis.faqs)} FAQs, {len(analysis.pricingTiers)} pricing tiers.",
        )
        await asyncio.sleep(_PACE)

        # -- 2) Persona Generator -------------------------------------------
        yield _status("generating_personas", "Generating virtual customers...", 22)
        personas = mock.mock_personas(cfg.url, cfg.personaCount)
        for i, p in enumerate(personas):
            yield {
                "type": "persona",
                "data": p.model_dump(),
                "index": i,
                "total": len(personas),
            }
            yield _thought("Persona Generator", f"Spawned {p.name} — {p.role} {p.emoji}")
            await asyncio.sleep(_PACE)

        # -- 3) Customer Simulation Swarm -----------------------------------
        yield _status("simulating", "Ghosts are browsing your site...", 42)
        sims: List[SimulationResult] = []
        for p in personas:
            s = mock.simulate_one(cfg.url, analysis, p)
            sims.append(s)
            yield {"type": "simulation", "data": s.model_dump()}
            yield _thought(
                "Customer Simulator",
                f"{s.personaName} ({s.role}) → {s.verdict} "
                f"(purchase {s.purchaseProbability}, churn {s.churnRisk}).",
            )
            await asyncio.sleep(_PACE)

        # Live aggregate metrics.
        avg_purchase = round(sum(s.purchaseProbability for s in sims) / max(len(sims), 1))
        avg_churn = round(sum(s.churnRisk for s in sims) / max(len(sims), 1))
        yield _metric("avgPurchaseProbability", avg_purchase)
        yield _metric("avgChurnRisk", avg_churn)

        # -- 4) Sales || Support (fan-out) ----------------------------------
        yield _status("sales_support", "Sales & Support agents reviewing objections...", 62)
        yield _thought(
            "Sales Agent",
            f"Avg purchase intent {avg_purchase}/100; cataloguing deal-blockers.",
        )
        avg_support = round(sum(s.supportDependency for s in sims) / max(len(sims), 1))
        yield _thought(
            "Support Agent",
            f"Avg support dependency {avg_support}/100; checking FAQ/doc coverage.",
        )
        await asyncio.sleep(_PACE)

        # -- 5) Revenue Leak Agent (fan-in) + 6) Insight Agent --------------
        yield _status("revenue_churn", "Quantifying revenue leaks & churn risk...", 76)
        insights = mock.mock_insights(cfg.url, analysis, sims)

        for obj in insights.salesObjections:
            yield {"type": "objection", "data": obj.model_dump()}
            yield _thought(
                "Sales Agent",
                f"Objection: \"{obj.question}\" — answered on site: {obj.answeredOnSite}.",
            )
            await asyncio.sleep(_PACE)

        for leak in insights.revenueLeaks:
            yield {"type": "leak", "data": leak.model_dump()}
            yield _thought(
                "Revenue Leak Agent",
                f"{leak.title} — ~{leak.estConversionLoss}pp conversion loss.",
            )
            await asyncio.sleep(_PACE)

        yield _thought(
            "Churn Agent",
            f"Top churn segments: "
            + ", ".join(c.segment for c in insights.churnRisks[:3]) + ".",
        )

        # -- 6) Insight Agent emits the aggregate ---------------------------
        yield _status("synthesizing", "Synthesizing insights...", 86)
        competitor = None
        if cfg.competitorUrl:
            competitor = mock.mock_competitor(cfg.url, cfg.competitorUrl)
            yield _thought(
                "Insight Agent",
                f"Competitor head-to-head: winner = {competitor.winner}.",
            )
        yield {"type": "insights", "data": insights.model_dump()}
        yield _metric("conversionRiskScore", insights.conversionRiskScore)
        await asyncio.sleep(_PACE)

        # -- 7) Report Generator --------------------------------------------
        yield _status("reporting", "Writing the executive report...", 94)
        report = gemini.ai_report(cfg.url, analysis, insights, competitor)
        yield {"type": "report", "data": report.model_dump()}
        yield _thought("Report Generator", "Executive report ready.")
        await asyncio.sleep(_PACE)

        # -- done ------------------------------------------------------------
        yield _status("done", "Run complete.", 100)
        yield {"type": "done", "runId": run_id}

    except Exception as exc:  # noqa: BLE001 — never crash the stream
        yield {"type": "error", "message": f"{type(exc).__name__}: {exc}"}


# ---------------------------------------------------------------------------
# Tiny event builders (keep the generator readable)
# ---------------------------------------------------------------------------
def _status(phase: str, message: str, progress: int) -> Dict[str, Any]:
    return {"type": "status", "phase": phase, "message": message, "progress": progress}


def _thought(agent: str, text: str) -> Dict[str, Any]:
    return {"type": "thought", "agent": agent, "text": text}


def _metric(key: str, value: float) -> Dict[str, Any]:
    return {"type": "metric", "key": key, "value": value}
