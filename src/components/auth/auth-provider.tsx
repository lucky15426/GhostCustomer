"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authConfigured, getSupabaseBrowser } from "@/lib/supabase-browser";
import { AuthContext, type AuthState } from "@/components/auth/auth-context";
import { AuthDialog } from "@/components/auth/auth-dialog";

const redirectTo = () => (typeof window !== "undefined" ? window.location.origin : undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = getSupabaseBrowser();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authConfigured);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const signInWithPassword = useCallback<AuthState["signInWithPassword"]>(
    async (email, password) => {
      if (!client) return { error: "Sign-in is not configured." };
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    [client],
  );

  const signUp = useCallback<AuthState["signUp"]>(
    async (email, password) => {
      if (!client) return { error: "Sign-up is not configured." };
      // Create a pre-confirmed user server-side (bypasses email confirmation +
      // the built-in mailer's rate limit), then sign in to start the session.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json().catch(() => ({}));
      // 409 = account already exists -> fall through and just sign in
      if (!res.ok && payload?.code !== "exists") {
        return { error: payload?.error || "Sign-up failed." };
      }
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    },
    [client],
  );

  const signInWithOAuth = useCallback<AuthState["signInWithOAuth"]>(
    async (provider) => {
      if (!client) return { error: "OAuth sign-in is not configured." };
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectTo() },
      });
      return { error: error?.message };
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (client) await client.auth.signOut();
  }, [client]);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured: authConfigured,
      authOpen,
      openAuth,
      closeAuth,
      signInWithPassword,
      signUp,
      signInWithOAuth,
      signOut,
    }),
    [session, loading, authOpen, openAuth, closeAuth, signInWithPassword, signUp, signInWithOAuth, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {authConfigured && <AuthDialog />}
    </AuthContext.Provider>
  );
}
