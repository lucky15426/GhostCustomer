"use client";

import { motion } from "framer-motion";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";

/**
 * Wrap protected page content. Behaviour:
 *  - auth not configured  -> render children (the demo stays fully open)
 *  - configured + signed-in -> render children
 *  - configured + signed-out -> a polished "sign in to continue" panel
 */
export function AuthGate({
  children,
  title = "Sign in to continue",
  subtitle = "Create a free account or sign in to launch the customer swarm and save your reports.",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { user, loading, configured, openAuth } = useAuth();

  if (!configured || user) return <>{children}</>;

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="container flex min-h-[70vh] max-w-xl items-center justify-center py-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-8 text-center shadow-[0_30px_120px_-40px_rgba(30,20,70,0.18)] backdrop-blur-2xl"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent" />
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
          <Lock className="h-6 w-6 text-slate-900" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{subtitle}</p>
        <Button onClick={openAuth} size="lg" className="mt-6">
          Sign in or create account
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
