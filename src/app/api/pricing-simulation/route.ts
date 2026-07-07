import { NextRequest } from "next/server";
import { mockPricing } from "@/lib/data/mock-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST { currentPrice, proposedPrice } -> PricingSimulation
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const current = Number(body?.currentPrice);
  const proposed = Number(body?.proposedPrice);
  if (!current || current <= 0 || !proposed || proposed <= 0) {
    return Response.json({ error: "currentPrice and proposedPrice must be positive numbers" }, { status: 400 });
  }
  return Response.json(mockPricing(current, proposed));
}
