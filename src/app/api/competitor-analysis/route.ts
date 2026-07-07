import { NextRequest } from "next/server";
import { aiAnalyze } from "@/lib/ai/gemini";
import { crawlSite } from "@/lib/crawl/crawler";
import { buildCompetitor } from "@/lib/data/mock-engine";
import { normalizeUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { url, competitorUrl } -> CompetitorAnalysis
// Both sites are crawled AND analyzed with Gemini (in parallel) so the
// head-to-head reflects two real sites — not a fabricated competitor.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = normalizeUrl(String(body?.url ?? ""));
  const competitorUrl = normalizeUrl(String(body?.competitorUrl ?? ""));
  if (!url || !competitorUrl) {
    return Response.json({ error: "Both url and competitorUrl are required" }, { status: 400 });
  }

  // crawl both, then analyze both — parallel to stay within the function budget
  const [youCrawl, compCrawl] = await Promise.all([crawlSite(url), crawlSite(competitorUrl)]);

  // A head-to-head is only fair if BOTH sites were really crawled. If either
  // side can't be read, fail honestly rather than pitting a real site against a
  // fabricated mock competitor (which would silently distort the result).
  const unreadable = [
    !youCrawl.text ? url : null,
    !compCrawl.text ? competitorUrl : null,
  ].filter(Boolean);
  if (unreadable.length) {
    return Response.json(
      {
        error: `Couldn't read ${unreadable.join(" and ")} right now — the site may block automated access or be temporarily unavailable. Try again or use a different URL so both sides are compared on real data.`,
        source: "none",
      },
      { status: 502 },
    );
  }

  const [youAnalysis, compAnalysis] = await Promise.all([
    aiAnalyze({ url, personaCount: 0 }, youCrawl.text, youCrawl.source),
    aiAnalyze({ url: competitorUrl, personaCount: 0 }, compCrawl.text, compCrawl.source),
  ]);

  const result = buildCompetitor(url, competitorUrl, youAnalysis, compAnalysis);
  return Response.json(result);
}
