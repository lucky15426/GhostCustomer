"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { AGENTS } from "@/components/war-room/agent-meta";
import { CustomerSwarm, type SwarmNode } from "@/components/swarm/customer-swarm";
import { EASE } from "@/lib/motion";

const BOOT_LINES = [
  "Initializing simulation engine…",
  "Scanning website…",
  "Generating personas…",
  "Creating market model…",
  "Running simulations…",
  "Detecting revenue leaks…",
  "Predicting churn…",
  "Generating executive report…",
];

/** Minimal black-and-white boot sequence: a rotating white particle sphere. */
export function CinematicLoader({ progress = 0, label }: { progress?: number; label?: string }) {
  const [lit, setLit] = useState(0);
  const [line, setLine] = useState(0);

  const nodes: SwarmNode[] = useMemo(() => {
    const shades = ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"];
    return Array.from({ length: 260 }, (_, i) => ({ id: `l${i}`, color: shades[i % shades.length] }));
  }, []);

  useEffect(() => {
    const a = setInterval(() => setLit((l) => (l + 1) % (AGENTS.length + 1)), 280);
    const b = setInterval(() => setLine((l) => (l + 1) % BOOT_LINES.length), 1500);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  const pct = Math.max(4, Math.round(progress));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(16px)" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-white"
    >
      <div className="absolute left-1/2 top-1/2 h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/[0.03] blur-[160px] anim-glow-pulse" />
      <div className="absolute inset-0 grain opacity-[0.06] mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_44%,rgba(15,23,42,0.06))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" style={{ animation: "scan-line 4.5s linear infinite" }} />

      <div className="relative flex flex-col items-center">
        {/* rotating white particle sphere */}
        <div className="relative">
          <Ghost className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
          <div className="w-[360px] max-w-[78vw]">
            <CustomerSwarm nodes={nodes} variant="sphere" height={320} />
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
          className="mt-2 text-center text-base font-semibold uppercase tracking-[0.34em] text-slate-900"
        >
          Ghost <span className="gradient-text">Customer</span> AI
        </motion.h1>

        <motion.p
          key={label ?? line}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2.5 h-5 text-center text-sm text-slate-500"
        >
          {label || BOOT_LINES[line]}
        </motion.p>

        {/* 8-stage pipeline, monochrome */}
        <div className="mt-5 flex items-center gap-2.5">
          {AGENTS.map((a, i) => (
            <motion.span
              key={a.name}
              animate={{
                scale: i === lit ? 1.8 : 1,
                opacity: i <= lit || lit === AGENTS.length ? 1 : 0.25,
              }}
              transition={{ duration: 0.25 }}
              className="h-1.5 w-1.5 rounded-full bg-slate-900"
            />
          ))}
        </div>

        <div className="mt-6 flex w-72 items-center gap-3">
          <div className="h-px flex-1 bg-slate-200">
            <motion.div
              className="h-px bg-slate-900"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ boxShadow: "0 0 10px rgba(15,23,42,0.3)" }}
            />
          </div>
          <span className="w-10 text-right font-mono text-sm font-semibold text-slate-500">{pct}%</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Compact branded spinner for in-page loading states. */
export function BrandedSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-14 w-14">
        <div
          className="absolute inset-0 rounded-2xl anim-spin-slow"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg 220deg, rgba(15,23,42,0.85) 330deg, transparent 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
          }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <Ghost className="h-6 w-6 text-slate-500 anim-glow-pulse" />
        </div>
      </div>
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}
