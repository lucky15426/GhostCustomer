"use client";

import { motion } from "framer-motion";
import type { HeatmapZone } from "@/lib/types";

// Calm slate → deep navy as confusion rises (no hot red — stays Apple-Health calm).
function heatColor(c: number): string {
  if (c >= 70) return "#334155";
  if (c >= 50) return "#4a5568";
  if (c >= 35) return "#64748b";
  return "#94a3b8";
}

export function Heatmap({ zones }: { zones: HeatmapZone[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {zones.map((z, i) => {
        const color = heatColor(z.confusion);
        return (
          <motion.div
            key={z.zone}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.45 }}
            className="ceramic lift relative overflow-hidden rounded-[22px] p-4"
          >
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{z.zone}</p>
              <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                {z.confusion}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{z.note}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${z.confusion}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
