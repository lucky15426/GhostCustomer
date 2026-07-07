import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client (service role — bypasses RLS for our own writes).
// Null unless a VALID https Supabase URL + service-role key are configured, so a
// missing/misconfigured project degrades gracefully to the in-memory store.
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

const configured = /^https:\/\/.+\.supabase\.co\/?$/.test(url) && key.length > 20;

export const supabase: SupabaseClient | null = configured
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export const supabaseConfigured = configured;
export const RUNS_TABLE = "runs";
