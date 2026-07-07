import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Browser Supabase client (anon/publishable key) — used only for AUTH on the
// client. Server writes still go through the service-role client in supabase.ts.
//
// `authConfigured` is false unless a valid project URL + anon key are present,
// so the whole auth layer degrades gracefully (the app stays fully usable with
// no sign-in wall) when Supabase isn't configured.
// ---------------------------------------------------------------------------

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const authConfigured = /^https:\/\/.+\.supabase\.co\/?$/.test(url) && anon.length > 20;

let cached: SupabaseClient | null = null;

/** Returns the singleton browser client, or null when unconfigured / on the server. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!authConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!cached) {
    cached = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // completes OAuth / magic-link redirects
      },
    });
  }
  return cached;
}
