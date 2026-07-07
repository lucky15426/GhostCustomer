import { NextRequest } from "next/server";
import { getRun } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/insights?runId=...  (server-store fallback; client also caches runs)
export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return Response.json({ error: "Missing runId" }, { status: 400 });
  const run = await getRun(runId);
  if (!run?.insights) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ insights: run.insights, analysis: run.analysis, config: run.config });
}
