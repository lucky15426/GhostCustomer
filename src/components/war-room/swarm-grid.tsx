"use client";

import { useMemo } from "react";
import type { Persona, SimulationResult, Verdict } from "@/lib/types";
import { verdictColor } from "@/lib/utils";
import { CustomerSwarm, type SwarmNode } from "@/components/swarm/customer-swarm";

const LEGEND: { label: string; verdict: Verdict; color: string }[] = [
  { label: "Buyers", verdict: "Convert", color: "#f2f2f4" },
  { label: "Undecided", verdict: "Maybe", color: "#a6a6ae" },
  { label: "Churn risk", verdict: "Churn Risk", color: "#6f6f77" },
  { label: "Bounced", verdict: "Bounce", color: "#8a8a8a" },
];

export function SwarmGrid({
  personas,
  sims,
  total,
}: {
  personas: Persona[];
  sims: Record<string, SimulationResult>;
  total: number;
}) {
  const nodes: SwarmNode[] = useMemo(
    () =>
      personas.map((p) => {
        const sim = sims[p.id];
        return {
          id: p.id,
          color: sim ? verdictColor(sim.verdict) : "#3b3b52",
          name: p.name,
          role: p.role,
          verdict: sim?.verdict,
          intent: sim?.purchaseProbability,
        };
      }),
    [personas, sims],
  );

  const counts = useMemo(() => {
    const c: Record<Verdict, number> = { Convert: 0, Maybe: 0, "Churn Risk": 0, Bounce: 0 };
    for (const id in sims) c[sims[id].verdict]++;
    return c;
  }, [sims]);

  return (
    <div className="overflow-hidden rounded-2xl glass">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ghost-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ghost-emerald" />
          </span>
          <span className="text-sm font-semibold">Live customer swarm</span>
        </div>
        <span className="font-mono text-xs text-slate-900 font-semibold">
          {personas.length}/{total} active
        </span>
      </div>

      <CustomerSwarm nodes={nodes} height={360} interactive showAxis className="px-1" />

      {/* live verdict tallies */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-200 px-4 py-2.5">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full border border-black/15 shrink-0" style={{ background: l.color, boxShadow: `0 0 8px ${l.color}` }} />
            <span className="font-mono font-bold text-slate-950">
              {counts[l.verdict]}
            </span>
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
