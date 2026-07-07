"use client";

import { useId } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
} from "recharts";
import type { HeatmapZone, Insights, Verdict } from "@/lib/types";

/* ── Muted premium palette (Apple Health / Linear analytics) ──────────────── */
export const PALETTE = {
  slateBlue: "#64748b",
  softIndigo: "#7c84b8",
  mutedPurple: "#8b82b0",
  deepNavy: "#334155",
  mutedEmerald: "#5f9a86",
  softTeal: "#6aa6a0",
  warmAmber: "#d2a15e",
  warmOrange: "#c47f4f",
  grey: "#cbd1da",
};

// Verdicts stay in one cool, restrained family so the donut reads as a single
// calm object rather than a pie of competing colours.
const VERDICT_COLORS: Record<Verdict, string> = {
  Convert: PALETTE.softTeal,
  Maybe: PALETTE.softIndigo,
  "Churn Risk": PALETTE.deepNavy,
  Bounce: PALETTE.slateBlue,
};

const TOOLTIP = {
  contentStyle: {
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: 14,
    fontSize: 12,
    color: "#1e2430",
    boxShadow: "0 12px 34px -18px rgba(40,38,52,0.4)",
  },
  itemStyle: { color: "#1e2430" },
  labelStyle: { color: "#7a8294" },
};

/* ── Donut: thin ring, muted blue→indigo, soft shadow, center value ───────── */
export function VerdictDonut({ data }: { data: Record<Verdict, number> }) {
  const entries = (Object.entries(data) as [Verdict, number][]).filter(([, v]) => v > 0);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const chart = entries.map(([name, value]) => ({ name, value }));
  return (
    <div className="relative h-56">
      <div className="absolute inset-0" style={{ filter: "drop-shadow(0 8px 10px rgba(47,53,80,0.14))" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chart}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={86}
              paddingAngle={3}
              cornerRadius={7}
              stroke="none"
            >
              {chart.map((d) => (
                <Cell key={d.name} fill={VERDICT_COLORS[d.name as Verdict] ?? PALETTE.slateBlue} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP} formatter={(v: any) => [`${v} (${Math.round((Number(v) / total) * 100)}%)`, ""]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-semibold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
          {total}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">customers</span>
      </div>
    </div>
  );
}

/* ── Bars: rounded, mostly grey, only strong values get a muted blue accent ─ */
export function RoleBar({ data }: { data: Insights["roleBreakdown"] }) {
  const chart = [...data].sort((a, b) => a.purchaseProbability - b.purchaseProbability);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 16 }}>
          <defs>
            <linearGradient id="bar-accent" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={PALETTE.slateBlue} />
              <stop offset="100%" stopColor={PALETTE.softIndigo} />
            </linearGradient>
          </defs>
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9aa1b0", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="role"
            width={120}
            tick={{ fill: "#5b6373", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...TOOLTIP} cursor={{ fill: "rgba(100,116,139,0.06)" }} formatter={(v: any) => [`${v}%`, "Purchase intent"]} />
          <Bar dataKey="purchaseProbability" radius={[8, 8, 8, 8]} barSize={14} animationDuration={900}>
            {chart.map((d) => (
              <Cell key={d.role} fill={d.purchaseProbability >= 60 ? "url(#bar-accent)" : PALETTE.grey} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Radar: very light grid, single muted blue fill at 20% ────────────────── */
export function ConfusionRadar({ zones }: { zones: HeatmapZone[] }) {
  const chart = zones.map((z) => ({ zone: z.zone.replace(/ \/.*/, ""), confusion: z.confusion }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chart} outerRadius="72%">
          <PolarGrid stroke="rgba(51,65,85,0.10)" />
          <PolarAngleAxis dataKey="zone" tick={{ fill: "#5b6373", fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="confusion" stroke={PALETTE.slateBlue} strokeWidth={1.5} fill={PALETTE.slateBlue} fillOpacity={0.2} />
          <Tooltip {...TOOLTIP} formatter={(v: any) => [`${v}/100`, "Confusion"]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Gauge: semi-circle, warm amber→muted orange, thin stroke ─────────────── */
export function RiskGauge({ value }: { value: number }) {
  const data = [{ name: "risk", value, fill: "url(#gauge-warm)" }];
  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="80%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
          <defs>
            <linearGradient id="gauge-warm" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={PALETTE.warmAmber} />
              <stop offset="100%" stopColor={PALETTE.warmOrange} />
            </linearGradient>
          </defs>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "rgba(51,65,85,0.06)" }} dataKey="value" cornerRadius={20} animationDuration={1000} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-7 flex flex-col items-center justify-center">
        <span className="text-[40px] font-semibold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
          {value}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">conversion risk</span>
      </div>
    </div>
  );
}

/* ── Sparkline: tiny, one accent colour, very thin stroke, soft area ──────── */
export function Sparkline({ data, color = PALETTE.slateBlue }: { data: number[]; color?: string }) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const w = 100;
  const h = 32;
  const pad = 2.5;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (d - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
