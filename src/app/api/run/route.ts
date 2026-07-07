import { NextRequest } from "next/server";
import { newRunId, runPipeline } from "@/lib/agents/orchestrator";
import { getRun } from "@/lib/store";
import { normalizeUrl } from "@/lib/utils";
import type { RunConfig } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseConfig(body: any): RunConfig {
  return {
    url: normalizeUrl(String(body?.url ?? "")),
    pricingUrl: body?.pricingUrl ? normalizeUrl(String(body.pricingUrl)) : undefined,
    faqUrl: body?.faqUrl ? normalizeUrl(String(body.faqUrl)) : undefined,
    competitorUrl: body?.competitorUrl ? normalizeUrl(String(body.competitorUrl)) : undefined,
    personaCount: Math.max(12, Math.min(500, Number(body?.personaCount) || 120)),
    currentPrice: body?.currentPrice ? Number(body.currentPrice) : undefined,
    isDemo: Boolean(body?.isDemo),
  };
}

// Streams the full multi-agent run as newline-delimited JSON (RunEvent per line).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const config = parseConfig(body);
  if (!config.url) {
    return new Response(JSON.stringify({ error: "Missing url" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const runId: string = body?.runId || newRunId();
  const fast = Boolean(body?.fast);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Tell the client its runId up front.
      controller.enqueue(encoder.encode(JSON.stringify({ type: "init", runId }) + "\n"));
      try {
        for await (const event of runPipeline(runId, config, { fast })) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "error", message: (err as Error).message }) + "\n"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

// Fallback read of a completed run (single-instance deploys). The client also
// caches runs in localStorage so page-to-page navigation works on serverless.
export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return Response.json({ error: "Missing runId" }, { status: 400 });
  const run = await getRun(runId);
  if (!run) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(run);
}
