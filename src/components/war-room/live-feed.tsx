"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TrendingDown, HelpCircle } from "lucide-react";
import type { RevenueLeak, SalesObjection, SimulationResult } from "@/lib/types";
import { severityColor, verdictColor } from "@/lib/utils";
import { PersonaGlyph } from "@/components/shared/persona-glyph";

export function SimFeed({ sims }: { sims: SimulationResult[] }) {
  const recent = sims.slice(-7).reverse();
  return (
    <div className="rounded-2xl glass p-4">
      <p className="mb-3 text-sm font-semibold">Latest verdicts</p>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {recent.map((s) => (
            <motion.div
              key={s.personaId}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5"
            >
              <PersonaGlyph name={s.personaName} accent={verdictColor(s.verdict)} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {s.personaName} <span className="text-slate-800 font-medium">· {s.role}</span>
                </p>
                <p className="truncate text-[11px] text-slate-800 font-medium">{s.topObjection}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: `${verdictColor(s.verdict)}22`, color: verdictColor(s.verdict) }}
              >
                {s.purchaseProbability}%
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {recent.length === 0 && <p className="py-6 text-center text-xs text-slate-800 font-medium">No verdicts yet…</p>}
      </div>
    </div>
  );
}

export function Discoveries({ leaks, objections }: { leaks: RevenueLeak[]; objections: SalesObjection[] }) {
  const items = [
    ...leaks.map((l) => ({ kind: "leak" as const, key: "l-" + l.title, l })),
    ...objections.map((o) => ({ kind: "obj" as const, key: "o-" + o.question, o })),
  ];
  return (
    <div className="rounded-2xl glass p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ghost-rose" />
        Problems discovered
      </p>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div
              key={it.key}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5"
            >
              {it.kind === "leak" ? (
                <>
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" style={{ color: severityColor(it.l.severity) }} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{it.l.title}</p>
                    <p className="text-[11px] text-slate-800 font-semibold">
                      ~{it.l.estConversionLoss}% conversion at risk · {it.l.affectedPct}% of customers
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-ghost-amber" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">“{it.o.question}”</p>
                    <p className="text-[11px] text-slate-800 font-semibold">Unanswered on the site</p>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && <p className="py-6 text-center text-xs text-slate-800 font-medium">Scanning for issues…</p>}
      </div>
    </div>
  );
}
