import { NextRequest } from "next/server";
import { aiAnalyze } from "@/lib/ai/gemini";
import { crawlSite } from "@/lib/crawl/crawler";
import { normalizeUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { url } -> WebsiteAnalysis  (standalone crawl + analyze)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = normalizeUrl(String(body?.url ?? ""));
  if (!url) return Response.json({ error: "url is required" }, { status: 400 });

  const crawl = await crawlSite(url);
  // No real content could be read (site blocks automated access, JS-only shell,
  // or transient outage). Fail honestly instead of silently returning mock data.
  if (!crawl.text) {
    return Response.json(
      {
        error:
          "Couldn't read that site right now — it may be blocking automated access or temporarily unavailable. Try again, or use a different URL.",
        source: "none",
      },
      { status: 502 },
    );
  }

  const analysis = await aiAnalyze({ url, personaCount: 0 }, crawl.text, crawl.source);
  return Response.json(analysis);
}
