import { NextRequest } from "next/server";
import { aiAutoFix, isGeminiEnabled } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { problem:{title,cause,fix}, context:{title,category,tone,audience} } -> AutoFix. No mock.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const problem = body?.problem;
  if (!problem?.title) return Response.json({ error: "A problem.title is required" }, { status: 400 });

  if (!isGeminiEnabled()) {
    return Response.json(
      { error: "Auto-Fix needs a Gemini API key (GEMINI_API_KEY) — it generates real copy, not mock data." },
      { status: 503 },
    );
  }

  const fix = await aiAutoFix(problem, body?.context ?? {});
  if (!fix) {
    return Response.json({ error: "Auto-Fix generation failed (model busy). Please try again." }, { status: 502 });
  }
  return Response.json(fix);
}
