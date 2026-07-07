"use client";

import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface SignUpResult {
  error?: string;
  /** True when Supabase requires the user to confirm via email before signing in. */
  needsConfirmation?: boolean;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  /** True until the initial session check resolves. */
  loading: boolean;
  /** Whether Supabase auth is configured at all (else the app is open). */
  configured: boolean;

  // modal control (a single shared dialog lives in the provider)
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;

  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signInWithOAuth: (provider: "google" | "github") => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
