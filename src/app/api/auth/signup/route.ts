import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-side sign-up using the Supabase ADMIN API (service role) to create a
// PRE-CONFIRMED user. The project requires email confirmation, but the built-in
// mailer is rate-limited (free tier) — so client-side signUp leaves users unable
// to confirm and therefore unable to sign in. Creating the user with
// email_confirm:true sidesteps that entirely; the client then signs in normally.
export async function POST(req: NextRequest) {
  if (!supabase) {
    return Response.json({ error: "Auth is not configured on the server." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message || "Sign-up failed.";
    const exists = /already.*(registered|exists)|duplicate|been registered/i.test(msg);
    // If the account already exists, that's fine — the client will just sign in.
    return Response.json(
      { error: exists ? "Account already exists — signing you in." : msg, code: exists ? "exists" : "error" },
      { status: exists ? 409 : 400 },
    );
  }

  return Response.json({ ok: true, userId: data.user?.id });
}
