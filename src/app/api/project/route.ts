import { NextRequest } from "next/server";
import { newRunId } from "@/lib/agents/orchestrator";
import { engineName } from "@/lib/ai/gemini";
import { normalizeUrl } from "@/lib/utils";
import type { RunConfig } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validates input and mints a runId. The client then opens the streaming run
// at /api/run with this id + config. (Stateless on purpose so it works on
// serverless; the War Room is the source of truth for the run.)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = normalizeUrl(String(body?.url ?? ""));
  if (!url) return Response.json({ error: "A website URL is required" }, { status: 400 });

  const config: RunConfig = {
    url,
    pricingUrl: body?.pricingUrl ? normalizeUrl(String(body.pricingUrl)) : undefined,
    faqUrl: body?.faqUrl ? normalizeUrl(String(body.faqUrl)) : undefined,
    competitorUrl: body?.competitorUrl ? normalizeUrl(String(body.competitorUrl)) : undefined,
    personaCount: Math.max(12, Math.min(500, Number(body?.personaCount) || 120)),
    currentPrice: body?.currentPrice ? Number(body.currentPrice) : undefined,
    isDemo: Boolean(body?.isDemo),
  };

  return Response.json({ runId: newRunId(), config, engine: config.isDemo ? "mock" : engineName() });
}
