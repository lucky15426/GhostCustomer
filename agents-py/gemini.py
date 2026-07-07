"""
Ghost Customer AI — Gemini wrapper.

Thin, defensive wrapper around `google-generativeai` (model: gemini-2.5-flash).

Core contract
-------------
* `is_enabled()`            -> True only if GEMINI_API_KEY is set AND the SDK
                               imported cleanly.
* `generate_json(prompt)`   -> parsed `dict` (JSON mode) or `None` on any
                               error/timeout. NEVER raises to the caller.
* `ai_analyze(text, url)`   -> WebsiteAnalysis (Gemini if possible, else mock).
* `ai_report(...)`          -> ExecutiveReport (Gemini if possible, else mock).

CRITICAL DESIGN RULE: the engine must run with NO keys. Every AI helper falls
back to the deterministic mock so the pipeline always completes.
"""

from __future__ import annotations

import json
import os
from typing import List, Optional

from dotenv import load_dotenv

import mock
from models import ExecutiveReport, Insights, WebsiteAnalysis

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Soft import — the SDK may be absent in mock-only deployments.
try:  # pragma: no cover - import guard
    import google.generativeai as genai

    _SDK_OK = True
except Exception:  # noqa: BLE001
    genai = None  # type: ignore[assignment]
    _SDK_OK = False

_configured = False


def is_enabled() -> bool:
    """True if we have both a key and a working SDK."""
    return bool(_API_KEY) and _SDK_OK


def _ensure_configured() -> bool:
    global _configured
    if not is_enabled():
        return False
    if not _configured:
        try:
            genai.configure(api_key=_API_KEY)  # type: ignore[union-attr]
            _configured = True
        except Exception:  # noqa: BLE001
            return False
    return True


def generate_json(prompt: str, *, timeout: float = 45.0) -> Optional[dict]:
    """
    Run a JSON-mode generation and return a parsed dict, or None on any failure.

    We request `response_mime_type=application/json` so the model returns a raw
    JSON object. We still parse defensively in case of stray markdown fences.
    """
    if not _ensure_configured():
        return None
    try:
        model = genai.GenerativeModel(  # type: ignore[union-attr]
            GEMINI_MODEL,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.7,
            },
        )
        resp = model.generate_content(
            prompt,
            request_options={"timeout": timeout},
        )
        raw = (getattr(resp, "text", None) or "").strip()
        if not raw:
            return None
        return _safe_json(raw)
    except Exception:  # noqa: BLE001  (timeouts, quota, parse, network — all -> None)
        return None


def _safe_json(raw: str) -> Optional[dict]:
    """Parse JSON, tolerating ```json fences or leading/trailing prose."""
    try:
        return json.loads(raw)
    except Exception:  # noqa: BLE001
        # Strip code fences and retry on the first {...} block.
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```", 2)
            cleaned = cleaned[1] if len(cleaned) > 1 else raw
            if cleaned.lstrip().lower().startswith("json"):
                cleaned = cleaned.lstrip()[4:]
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start : end + 1])
            except Exception:  # noqa: BLE001
                return None
        return None


# ---------------------------------------------------------------------------
# High-level helpers — Gemini if possible, deterministic mock otherwise.
# ---------------------------------------------------------------------------
def ai_analyze(crawled_text: Optional[str], url: str, source: str = "mock") -> WebsiteAnalysis:
    """
    Turn raw crawled page text into a structured WebsiteAnalysis.

    If Gemini is unavailable OR returns something unusable, we fall back to the
    deterministic mock (stamped with the true `source` so the UI still shows
    whether the text was crawled).
    """
    if not crawled_text or not is_enabled():
        return mock.mock_analysis(url, source=source)

    prompt = _ANALYZE_PROMPT.format(
        url=url, text=crawled_text[:18000]  # keep well under token limits
    )
    data = generate_json(prompt)
    if not data:
        return mock.mock_analysis(url, source=source)

    # Validate against the schema; on any mismatch, fall back gracefully but
    # keep whatever good fields we can by merging onto a mock skeleton.
    try:
        data.setdefault("url", url)
        data["source"] = source if source in ("firecrawl", "fetch") else "mock"
        return WebsiteAnalysis.model_validate(data)
    except Exception:  # noqa: BLE001
        skeleton = mock.mock_analysis(url, source=source).model_dump()
        skeleton.update({k: v for k, v in data.items() if k in skeleton})
        try:
            return WebsiteAnalysis.model_validate(skeleton)
        except Exception:  # noqa: BLE001
            return mock.mock_analysis(url, source=source)


def ai_report(
    url: str,
    analysis: WebsiteAnalysis,
    insights: Insights,
    competitor=None,
) -> ExecutiveReport:
    """
    Produce a narrative ExecutiveReport. Gemini writes the prose when enabled;
    otherwise we use the deterministic mock report.
    """
    if not is_enabled():
        return mock.mock_report(url, analysis, insights, competitor)

    prompt = _REPORT_PROMPT.format(
        url=url,
        analysis=json.dumps(analysis.model_dump(), ensure_ascii=False)[:6000],
        insights=json.dumps(insights.model_dump(), ensure_ascii=False)[:8000],
    )
    data = generate_json(prompt)
    if not data:
        return mock.mock_report(url, analysis, insights, competitor)
    try:
        # Backfill competitor notes from the deterministic analysis if the
        # model omitted them but we have competitor data.
        if competitor and not data.get("competitorNotes"):
            data["competitorNotes"] = [
                f"Head-to-head winner: {competitor.winner} — {competitor.reason}"
            ]
        return ExecutiveReport.model_validate(data)
    except Exception:  # noqa: BLE001
        return mock.mock_report(url, analysis, insights, competitor)


# ---------------------------------------------------------------------------
# Prompts (kept terse + schema-locked; JSON mode does the heavy lifting)
# ---------------------------------------------------------------------------
_ANALYZE_PROMPT = """You are the Website Analyzer agent for "Ghost Customer AI".
Analyze the crawled landing page below and return ONLY a JSON object matching
this exact schema (camelCase keys, no extra keys):

{{
  "url": string,
  "title": string,
  "tagline": string,
  "category": string,
  "valueProps": string[],
  "ctas": string[],
  "navItems": string[],
  "pricingTiers": [{{"name": string, "price": string, "period": string|null, "highlights": string[]}}],
  "faqs": [{{"q": string, "a": string}}],
  "trustSignals": string[],
  "missingTrustSignals": string[],
  "onboardingSteps": string[],
  "detectedFeatures": string[],
  "targetAudience": string,
  "toneOfVoice": string,
  "contentScore": number,
  "source": "mock"
}}

contentScore is 0-100 overall clarity. missingTrustSignals are trust elements a
buyer would expect but that are absent (e.g. SOC 2, SLA, testimonials).

URL: {url}

CRAWLED PAGE TEXT:
{text}
"""

_REPORT_PROMPT = """You are the Report Generator agent for "Ghost Customer AI".
Write a sharp, executive-ready report based on the website analysis and the
aggregated insights. Return ONLY a JSON object matching this exact schema:

{{
  "executiveSummary": string,
  "keyFindings": string[],
  "conversionRisks": string[],
  "churnRisks": string[],
  "revenueLeaks": string[],
  "customerQuestions": string[],
  "competitorNotes": string[],
  "recommendations": [{{"title": string, "detail": string, "effort": "Low"|"Medium"|"High", "impact": "Low"|"Medium"|"High"}}],
  "projectedUplift": string
}}

Be specific and quantitative. Tie every recommendation to a revenue leak or
churn risk. Tone: confident, concise, board-room.

URL: {url}

WEBSITE ANALYSIS (JSON):
{analysis}

INSIGHTS (JSON):
{insights}
"""
