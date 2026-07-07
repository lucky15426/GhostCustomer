"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";

export function UserMenu() {
  const { user, loading, configured, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Auth not configured → keep the nav clean, show nothing.
  if (!configured) return null;

  if (loading) {
    return <span className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" aria-hidden />;
  }

  if (!user) {
    return (
      <button
        onClick={openAuth}
        className="rounded-xl px-3.5 py-2 text-sm font-medium text-black transition hover:bg-slate-100"
      >
        Sign in
      </button>
    );
  }

  const email = user.email ?? "Account";
  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100"
        aria-label="Account menu"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_20px_70px_-25px_rgba(30,20,70,0.18)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-900">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <User2 className="h-3 w-3" /> Signed in
                </p>
                <p className="truncate text-sm font-medium text-slate-900">{email}</p>
              </div>
            </div>
            <div className="my-1 h-px bg-slate-200" />
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
