"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Radio } from "lucide-react";
import type { AgentName } from "@/lib/types";
import { AGENT_BY_NAME } from "./agent-meta";

export interface Thought {
  id: number;
  agent: AgentName;
  text: string;
}

export function AgentStream({ thoughts }: { thoughts: Thought[] }) {
  return (
    <div className="flex h-full flex-col rounded-2xl glass">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Radio className="h-4 w-4 text-ghost-cyan animate-pulse" />
        <span className="text-sm font-semibold">Live agent reasoning</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{thoughts.length} events</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: "30rem" }}>
        <AnimatePresence initial={false}>
          {thoughts.map((t) => {
            const meta = AGENT_BY_NAME[t.agent];
            const Icon = meta?.icon ?? Radio;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex gap-2.5 rounded-xl bg-slate-50 p-2.5"
              >
                <span
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                  style={{ background: `${meta?.color ?? "#8b5cf6"}22`, color: meta?.color ?? "#8b5cf6" }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold" style={{ color: meta?.color }}>
                    {t.agent}
                  </p>
                  <p className="text-xs leading-snug text-slate-900 font-medium">{t.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {thoughts.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-slate-800 font-semibold">Waiting for the swarm to wake up…</p>
        )}
      </div>
    </div>
  );
}
