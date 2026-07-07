// ---------------------------------------------------------------------------
// Website content acquisition with three tiers of graceful degradation:
//   1. Firecrawl (FIRECRAWL_API_KEY) — clean markdown extraction
//   2. Plain server-side fetch + HTML→text strip
//   3. null → callers decide (analysis endpoints fail honestly; a full swarm
//      run keeps going on the clearly-labelled mock engine)
//
// Each tier retries once on a transient miss, and the plain-fetch tier sends a
// real browser User-Agent so sites that bot-block a crawler UA (Stripe, etc.)
// still return content — this is what keeps a request from silently degrading
// to mock data when the live crawl could actually have succeeded.
// ---------------------------------------------------------------------------

import { sleep } from "@/lib/utils";

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

// A real-content crawl must clear this; below it the page is effectively empty
// (bot wall, JS-only shell) and we treat the tier as a miss, not a success.
const MIN_CONTENT_CHARS = 60;

// How long to let the page fully render before the UI-Roast screenshot, so we
// capture the real page — not a splash/loading state. Tunable via env.
const SCREENSHOT_WAIT_MS = Number(process.env.SCREENSHOT_WAIT_MS) || 6500;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), ms),
      ),
    ]);
  } catch {
    return null;
  }
}

export interface CrawlResult {
  text: string | null;
  source: "firecrawl" | "fetch" | "none";
}

export async function crawlSite(url: string): Promise<CrawlResult> {
  // Tier 1: Firecrawl (retry once — transient 5xx / timeouts are common)
  if (FIRECRAWL_KEY) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const fc = await withTimeout(firecrawl(url), 28000);
      if (fc && fc.trim().length >= MIN_CONTENT_CHARS)
        return { text: fc, source: "firecrawl" };
      if (attempt === 0) await sleep(700);
    }
  }
  // Tier 2: plain fetch with a real browser UA (retry once)
  for (let attempt = 0; attempt < 2; attempt++) {
    const html = await withTimeout(plainFetch(url), 14000);
    if (html && html.trim().length >= MIN_CONTENT_CHARS)
      return { text: html, source: "fetch" };
    if (attempt === 0) await sleep(500);
  }
  // Tier 3: nothing — the caller decides (honest error vs. labelled mock)
  return { text: null, source: "none" };
}

/** Capture a full-page screenshot via Firecrawl. Returns a hosted image URL,
 *  or null if no key / capture failed (caller surfaces an honest error). */
export async function screenshotSite(url: string): Promise<string | null> {
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await withTimeout(
      fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${FIRECRAWL_KEY}` },
        body: JSON.stringify({
          url,
          formats: ["screenshot@fullPage"],
          timeout: 90000,
          // Wait for the page to settle, then an extra in-page wait + a scroll to
          // trigger lazy content, THEN screenshot — so we never roast a loader.
          waitFor: SCREENSHOT_WAIT_MS,
          actions: [
            { type: "wait", milliseconds: SCREENSHOT_WAIT_MS },
            { type: "scroll", direction: "down" },
            { type: "wait", milliseconds: 1200 },
            { type: "scroll", direction: "up" },
            { type: "wait", milliseconds: 600 },
            { type: "screenshot", fullPage: true },
          ],
        }),
      }),
      90000
    );
    if (!res || !res.ok) return null;
    const data = await res.json();
    // the in-page screenshot action lands in actions.screenshots; fall back to
    // the format-level screenshot fields.
    return (
      data?.data?.actions?.screenshots?.[data.data.actions.screenshots.length - 1] ??
      data?.data?.screenshot ??
      data?.screenshot ??
      null
    );
  } catch {
    return null;
  }
}

async function firecrawl(url: string): Promise<string | null> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.markdown ?? data?.markdown ?? null;
}

async function plainFetch(url: string): Promise<string | null> {
  // A real desktop-Chrome UA + full header set — a crawler-looking UA gets a
  // 403 / bot wall from many marketing sites (Stripe, etc.), which used to push
  // the request onto the mock engine even though the page is publicly readable.
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const html = await res.text();
  return htmlToText(html);
}

/** Minimal, dependency-free HTML → readable text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|li|h[1-6]|tr|article|header|footer)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 20000);
}
