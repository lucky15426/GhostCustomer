"use client";

import { Activity, ShoppingCart, BrainCircuit, AlertTriangle } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/animated-number";

function Tile({
  icon,
  label,
  value,
  suffix = "",
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-4">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-30" style={{ background: color }} />
      <div className="relative flex items-center gap-2 text-xs text-slate-800 font-bold">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="relative mt-1 font-mono text-3xl font-bold" style={{ color }}>
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
    </div>
  );
}

export function MetricTicker({
  simulated,
  avgPurchase,
  avgConfusion,
  conversionRisk,
}: {
  simulated: number;
  avgPurchase: number;
  avgConfusion: number;
  conversionRisk: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile icon={<Activity className="h-4 w-4" />} label="Customers simulated" value={simulated} color="#334155" />
      <Tile icon={<ShoppingCart className="h-4 w-4" />} label="Avg purchase intent" value={avgPurchase} suffix="%" color="#0f172a" />
      <Tile icon={<BrainCircuit className="h-4 w-4" />} label="Avg confusion" value={avgConfusion} suffix="%" color="#475569" />
      <Tile icon={<AlertTriangle className="h-4 w-4" />} label="Conversion risk" value={conversionRisk} suffix="/100" color="#1e293b" />
    </div>
  );
}
