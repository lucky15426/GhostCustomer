"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunPhase } from "@/lib/types";
import { AGENTS, agentStatus } from "./agent-meta";

export function PhaseRail({ phase }: { phase: RunPhase }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {AGENTS.map((agent, i) => {
        const status = agentStatus(agent, phase);
        const Icon = agent.icon;
        return (
          <div key={agent.name} className="flex items-center gap-2">
            <motion.div
              animate={status === "active" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ repeat: status === "active" ? Infinity : 0, duration: 1.6 }}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors",
                status === "active"
                  ? "border-slate-300 bg-slate-100"
                  : status === "done"
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-200 bg-transparent opacity-50",
              )}
            >
              <span
                className="grid h-6 w-6 place-items-center rounded-lg"
                style={{
                  background: status === "idle" ? "rgba(15,23,42,0.06)" : `${agent.color}22`,
                  color: status === "idle" ? "#94a3b8" : agent.color,
                }}
              >
                {status === "done" ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className="text-xs font-medium">{agent.short}</span>
              {status === "active" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: agent.color }} />
              )}
            </motion.div>
            {i < AGENTS.length - 1 && <span className="h-px w-3 bg-slate-200 max-sm:hidden" />}
          </div>
        );
      })}
    </div>
  );
}
