import { NextRequest } from "next/server";
import { getRun } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/report?runId=...  (server-store fallback; client also caches runs)
export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return Response.json({ error: "Missing runId" }, { status: 400 });
  const run = await getRun(runId);
  if (!run?.report) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ report: run.report, analysis: run.analysis, insights: run.insights });
}
