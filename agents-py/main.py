"""
Ghost Customer AI — FastAPI engine.

Endpoints
---------
  GET  /health               -> {ok, engine, gemini, firecrawl}
  POST /run                  -> StreamingResponse NDJSON of RunEvent objects
  POST /competitor-analysis  -> CompetitorAnalysis
  POST /pricing-simulation   -> PricingSimulation
  POST /crawl                -> {url, source, text, analysis}
  POST /generate-personas    -> {personas: Persona[]}

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

The Next.js frontend proxies these via the `/py/*` rewrite when
PYTHON_ENGINE_URL is set (see README.md and next.config.mjs).
"""

from __future__ import annotations

import json
from typing import Any, AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

import crawl
import gemini
import mock
from graph import run_pipeline
from models import (
    CompetitorRequest,
    CrawlRequest,
    GeneratePersonasRequest,
    PricingRequest,
    RunConfig,
)

app = FastAPI(
    title="Ghost Customer AI — Engine",
    version="1.0.0",
    description="FastAPI + LangGraph engine that runs the 8-agent ghost-customer pipeline.",
)

# CORS — restricted to an allow-list (no wildcard). Set ALLOWED_ORIGINS as a
# comma-separated list (e.g. "https://your-app.vercel.app,http://localhost:3000").
import os

_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
if not _origins:
    _origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    """Lightweight readiness probe + capability flags for the frontend."""
    gemini_on = gemini.is_enabled()
    return {
        "ok": True,
        "engine": "gemini" if gemini_on else "mock",
        "gemini": gemini_on,
        "firecrawl": crawl.firecrawl_enabled(),
    }


# Convenience root.
@app.get("/")
def root() -> dict:
    return {"service": "ghost-customer-ai-engine", "docs": "/docs", "health": "/health"}


# ---------------------------------------------------------------------------
# /run — NDJSON streaming pipeline
# ---------------------------------------------------------------------------
async def _ndjson(config: dict) -> AsyncGenerator[bytes, None]:
    """Serialize each RunEvent dict as a single newline-delimited JSON line."""
    async for event in run_pipeline(config):
        yield (json.dumps(event, ensure_ascii=False) + "\n").encode("utf-8")


@app.post("/run")
async def run(config: RunConfig) -> StreamingResponse:
    """
    Stream the full pipeline as application/x-ndjson. The frontend reads this
    line-by-line to drive the live war-room UI.
    """
    return StreamingResponse(
        _ndjson(config.model_dump()),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",  # disable proxy buffering (nginx/Render)
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# /crawl — crawl + structured analysis
# ---------------------------------------------------------------------------
@app.post("/crawl")
async def crawl_endpoint(body: CrawlRequest) -> JSONResponse:
    text, source = await crawl.crawl_site_async(body.url)
    analysis = gemini.ai_analyze(text, body.url, source=source)
    return JSONResponse(
        {
            "url": body.url,
            "source": source,
            "text": (text or "")[:20000],
            "analysis": analysis.model_dump(),
        }
    )


# ---------------------------------------------------------------------------
# /generate-personas
# ---------------------------------------------------------------------------
@app.post("/generate-personas")
def generate_personas(body: GeneratePersonasRequest) -> JSONResponse:
    personas = mock.mock_personas(body.url, body.personaCount)
    return JSONResponse({"personas": [p.model_dump() for p in personas]})


# ---------------------------------------------------------------------------
# /competitor-analysis
# ---------------------------------------------------------------------------
@app.post("/competitor-analysis")
def competitor_analysis(body: CompetitorRequest) -> JSONResponse:
    result = mock.mock_competitor(body.url, body.competitorUrl)
    return JSONResponse(result.model_dump())


# ---------------------------------------------------------------------------
# /pricing-simulation
# ---------------------------------------------------------------------------
@app.post("/pricing-simulation")
def pricing_simulation(body: PricingRequest) -> JSONResponse:
    result = mock.mock_pricing(body.url, body.currentPrice, body.proposedPrice)
    return JSONResponse(result.model_dump())


# Allow `python main.py` for a quick local launch.
if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
