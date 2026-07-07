"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ghost, Mail, Lock, Loader2, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";

export function AuthDialog() {
  const { authOpen, closeAuth, user, signInWithPassword, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // close automatically once a session lands (password success / OAuth return)
  useEffect(() => {
    if (authOpen && user) closeAuth();
  }, [authOpen, user, closeAuth]);

  // reset transient state whenever the dialog opens/closes
  useEffect(() => {
    if (!authOpen) return;
    setError("");
    setInfo("");
    setBusy(false);
  }, [authOpen]);

  // Esc to close + lock background scroll while open
  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [authOpen, closeAuth]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    if (mode === "signin") {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) setError(error);
      // success path closes via the user effect above
    } else {
      const { error, needsConfirmation } = await signUp(email.trim(), password);
      if (error) setError(error);
      else if (needsConfirmation)
        setInfo("Check your inbox to confirm your email, then sign in.");
    }
    setBusy(false);
  }

  const isSignup = mode === "signup";

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={closeAuth}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-[0_30px_120px_-30px_rgba(30,20,70,0.18)] backdrop-blur-2xl"
          >
            {/* top hairline glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent" />

            <button
              onClick={closeAuth}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            {/* brand mark */}
            <div className="mb-5 flex flex-col items-center text-center">
              <span className="relative mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
                <Ghost className="h-6 w-6 text-slate-900" />
                <span
                  className="absolute -inset-2 rounded-3xl opacity-60 blur-lg"
                  style={{ background: "radial-gradient(circle, rgba(30,20,70,0.1), transparent 70%)" }}
                />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isSignup
                  ? "Start sending the customer swarm at your site."
                  : "Sign in to run simulations and save your reports."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="auth-password"
                    type="password"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? "At least 6 characters" : "••••••••"}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-ghost-rose">{error}</p>}
              {info && (
                <p className="flex items-start gap-2 text-sm text-ghost-emerald">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {info}
                </p>
              )}

              <Button type="submit" size="lg" disabled={busy} className="w-full">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {isSignup ? "Already have an account?" : "New to Ghost Customer?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(isSignup ? "signin" : "signup");
                  setError("");
                  setInfo("");
                }}
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                {isSignup ? "Sign in" : "Create one"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
