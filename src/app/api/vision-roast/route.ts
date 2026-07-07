import { NextRequest } from "next/server";
import { screenshotSite } from "@/lib/crawl/crawler";
import { aiVisionRoast, isVisionEnabled } from "@/lib/ai/gemini";
import { normalizeUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST { url } -> VisionRoast (real screenshot + Gemini/Groq Vision). No mock fallback.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = normalizeUrl(String(body?.url ?? ""));
  if (!url) return Response.json({ error: "A website URL is required" }, { status: 400 });

  if (!isVisionEnabled()) {
    return Response.json(
      { error: "Visual Roast needs a GEMINI_API_KEY or GROQ_API_KEY — it uses real vision, not mock data." },
      { status: 503 },
    );
  }

  const screenshotUrl = await screenshotSite(url);
  if (!screenshotUrl) {
    return Response.json(
      { error: "Couldn't capture a screenshot. A FIRECRAWL_API_KEY and a publicly reachable URL are required." },
      { status: 502 },
    );
  }

  const roast = await aiVisionRoast(screenshotUrl);
  if (!roast) {
    return Response.json(
      { error: "Both vision models are busy right now. Please try again in a moment." },
      { status: 502 },
    );
  }

  return Response.json({ screenshotUrl, source: `${roast.engine ?? "gemini"}-vision`, ...roast });
}
