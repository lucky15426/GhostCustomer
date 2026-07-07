"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { HeatmapPoint, RoastRegion, Persona } from "@/lib/types";
import { clamp } from "@/lib/utils";

// Strict severity → Tailwind colour (per spec): high=red, medium=yellow, low=blue.
const DOT: Record<HeatmapPoint["severity"], { bg: string; ring: string; text: string }> = {
  high: { bg: "bg-red-500", ring: "bg-red-500/40", text: "text-red-600" },
  medium: { bg: "bg-yellow-500", ring: "bg-yellow-500/40", text: "text-yellow-600" },
  low: { bg: "bg-blue-500", ring: "bg-blue-500/40", text: "text-blue-600" },
};

/** Convert Gemini-vision roast regions (boxes, 0-1000) into heatmap points
 *  (centre of each box, normalized to 0-100 %, clamped so nothing escapes). */
export function regionsToHeatmap(regions: RoastRegion[]): HeatmapPoint[] {
  return regions.map((r) => {
    const [ymin, xmin, ymax, xmax] = r.box;
    return {
      x: clamp(((xmin + xmax) / 2) / 10, 0, 100),
      y: clamp(((ymin + ymax) / 2) / 10, 0, 100),
      severity: r.severity === "critical" ? "high" : (r.severity as HeatmapPoint["severity"]),
      label: r.label,
      why: r.why,
    };
  });
}

export function HeatmapOverlay({
  screenshotUrl,
  points,
  personas = [],
}: {
  screenshotUrl: string;
  points: HeatmapPoint[];
  personas?: Persona[];
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative w-full overflow-hidden rounded-xl ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={screenshotUrl} alt="Heatmap of the analyzed page" className="block w-full select-none" />

      {/* subtle darken so dots pop on light pages */}
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      {points.map((p, i) => {
        // clamp again defensively in case the AI hallucinated out-of-range coords
        const x = clamp(p.x, 0, 100);
        const y = clamp(p.y, 0, 100);
        const c = DOT[p.severity] ?? DOT.low;
        const persona = p.personaId ? personas.find((pp) => pp.id === p.personaId) : undefined;
        const below = y < 20; // flip tooltip below the dot when near the top edge
        const active = hover === i;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${y}%`, left: `${x}%`, zIndex: active ? 30 : 10 }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          >
            {/* pulsing ring */}
            <motion.span
              className={`absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full ${c.ring}`}
              animate={{ scale: [1, 2.1, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: (i % 6) * 0.18 }}
            />
            {/* solid dot */}
            <span
              className={`relative grid h-4 w-4 cursor-pointer place-items-center rounded-full ${c.bg} ring-2 ring-white/80 shadow-[0_0_14px_rgba(0,0,0,0.5)]`}
            >
              <span className="text-[9px] font-bold text-black/80">{i + 1}</span>
            </span>

            {/* tooltip */}
            {active && (
              <motion.div
                initial={{ opacity: 0, y: below ? -6 : 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.14 }}
                className={`absolute left-1/2 w-60 -translate-x-1/2 ${below ? "top-7" : "bottom-7"}`}
              >
                <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-left shadow-[0_20px_60px_-20px_rgba(30,20,70,0.18)] backdrop-blur-xl">
                  <div className="mb-1 flex items-center gap-2">
                    {persona ? (
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs"
                        style={{ background: `${persona.accent}33` }}
                      >
                        {persona.emoji}
                      </span>
                    ) : (
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.bg}`} />
                    )}
                    <p className="truncate text-sm font-semibold text-slate-900">{p.label}</p>
                  </div>
                  {persona && (
                    <p className={`mb-1 text-[11px] font-medium ${c.text}`}>
                      {persona.name} · {persona.role}
                    </p>
                  )}
                  <p className="text-xs leading-snug text-slate-500">{p.why}</p>
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
