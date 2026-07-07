"""
Ghost Customer AI — website crawler with graceful degradation.

`crawl_site(url)` returns `(text, source)` where source is one of
"firecrawl" | "fetch" | "mock":

    1. Firecrawl  — POST https://api.firecrawl.dev/v1/scrape (Bearer key,
                    formats=["markdown"]).            [needs FIRECRAWL_API_KEY]
    2. Plain GET  — httpx GET + a regex HTML->text strip.  [no key needed]
    3. None       — both failed; caller should use the mock analysis.

Nothing here raises to the caller; every failure path degrades to the next tier.
"""

from __future__ import annotations

import os
import re
from typing import Optional, Tuple

import httpx
from dotenv import load_dotenv

load_dotenv()

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "").strip()
FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape"

_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; GhostCustomerAI/1.0; +https://github.com/ghost-ai)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def firecrawl_enabled() -> bool:
    return bool(FIRECRAWL_API_KEY)


def _normalize_url(url: str) -> str:
    url = (url or "").strip()
    if url and not re.match(r"^https?://", url, re.IGNORECASE):
        url = "https://" + url
    return url


# ---------------------------------------------------------------------------
# Tier 1 — Firecrawl
# ---------------------------------------------------------------------------
def _try_firecrawl(url: str, timeout: float) -> Optional[str]:
    if not firecrawl_enabled():
        return None
    try:
        resp = httpx.post(
            FIRECRAWL_URL,
            headers={
                "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"url": url, "formats": ["markdown"]},
            timeout=timeout,
        )
        if resp.status_code != 200:
            return None
        body = resp.json()
        # Firecrawl v1 shape: {"success": true, "data": {"markdown": "..."}}
        data = body.get("data") or {}
        md = data.get("markdown") or data.get("content") or ""
        md = md.strip()
        return md or None
    except Exception:  # noqa: BLE001
        return None


# ---------------------------------------------------------------------------
# Tier 2 — plain fetch + HTML strip
# ---------------------------------------------------------------------------
def _strip_html(html: str) -> str:
    """Very small, dependency-free HTML -> text reducer."""
    # Drop scripts/styles/noscript wholesale.
    html = re.sub(r"(?is)<(script|style|noscript|svg|head)[^>]*>.*?</\1>", " ", html)
    # Turn block-level closers into newlines for some structure.
    html = re.sub(r"(?i)</(p|div|li|h[1-6]|section|header|footer|tr)>", "\n", html)
    html = re.sub(r"(?i)<br\s*/?>", "\n", html)
    # Strip all remaining tags.
    text = re.sub(r"(?s)<[^>]+>", " ", html)
    # Unescape a handful of common entities.
    for ent, ch in (
        ("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'),
        ("&#39;", "'"), ("&nbsp;", " "), ("&mdash;", "—"), ("&ndash;", "–"),
    ):
        text = text.replace(ent, ch)
    # Collapse whitespace.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()


def _try_fetch(url: str, timeout: float) -> Optional[str]:
    try:
        with httpx.Client(
            headers=_DEFAULT_HEADERS, follow_redirects=True, timeout=timeout
        ) as client:
            resp = client.get(url)
        if resp.status_code >= 400:
            return None
        ctype = resp.headers.get("content-type", "")
        if "html" not in ctype and "text" not in ctype:
            return None
        text = _strip_html(resp.text)
        return text or None
    except Exception:  # noqa: BLE001
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def crawl_site(url: str, *, timeout: float = 20.0) -> Tuple[Optional[str], str]:
    """
    Returns (text, source). `source` is "firecrawl" | "fetch" | "mock".
    On total failure returns (None, "mock") so the caller uses mock analysis.
    """
    norm = _normalize_url(url)
    if not norm:
        return None, "mock"

    md = _try_firecrawl(norm, timeout)
    if md:
        return md, "firecrawl"

    text = _try_fetch(norm, timeout)
    if text:
        return text, "fetch"

    return None, "mock"


# Async variant used by the streaming pipeline so we don't block the event loop.
async def crawl_site_async(url: str, *, timeout: float = 20.0) -> Tuple[Optional[str], str]:
    norm = _normalize_url(url)
    if not norm:
        return None, "mock"

    # Tier 1 — Firecrawl
    if firecrawl_enabled():
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    FIRECRAWL_URL,
                    headers={
                        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={"url": norm, "formats": ["markdown"]},
                )
            if resp.status_code == 200:
                data = (resp.json().get("data") or {})
                md = (data.get("markdown") or data.get("content") or "").strip()
                if md:
                    return md, "firecrawl"
        except Exception:  # noqa: BLE001
            pass

    # Tier 2 — plain fetch
    try:
        async with httpx.AsyncClient(
            headers=_DEFAULT_HEADERS, follow_redirects=True, timeout=timeout
        ) as client:
            resp = await client.get(norm)
        if resp.status_code < 400 and (
            "html" in resp.headers.get("content-type", "")
            or "text" in resp.headers.get("content-type", "")
        ):
            text = _strip_html(resp.text)
            if text:
                return text, "fetch"
    except Exception:  # noqa: BLE001
        pass

    return None, "mock"
