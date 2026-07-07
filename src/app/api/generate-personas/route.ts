import { NextRequest } from "next/server";
import { mockPersonas } from "@/lib/data/mock-engine";
import { normalizeUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST { url, count } -> Persona[]   (standalone persona preview)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = normalizeUrl(String(body?.url ?? "demo"));
  const count = Math.max(1, Math.min(500, Number(body?.count) || 12));
  return Response.json({ personas: mockPersonas(url, count) });
}
