import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cross-origin policy for /api/*.
// Same-origin requests (the app calling its own API) send no Origin header and
// need no CORS headers. Cross-origin requests are allowed ONLY for origins
// explicitly listed in ALLOWED_ORIGINS (comma-separated) — never "*".
const ALLOWED = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function applyCors(res: NextResponse, origin: string | null): NextResponse {
  if (origin && ALLOWED.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
  return res;
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  // Preflight
  if (req.method === "OPTIONS") {
    return applyCors(new NextResponse(null, { status: 204 }), origin);
  }
  return applyCors(NextResponse.next(), origin);
}

export const config = { matcher: "/api/:path*" };
