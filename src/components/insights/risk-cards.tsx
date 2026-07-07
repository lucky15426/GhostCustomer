"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, UserMinus, HelpCircle, LifeBuoy, Wrench, Wand2, Loader2, Copy, Check } from "lucide-react";
import type { ChurnRisk, RevenueLeak, SalesObjection, SupportGap, AutoFix } from "@/lib/types";
import { PALETTE } from "./charts";

export interface FixContext {
  title?: string;
  category?: string;
  tone?: string;
}

/* ── Tiny frosted status pill — High amber · Medium blue · Low grey ───────── */
const SEVERITY_STYLE: Record<string, { bg: string; fg: string; ring: string; label: string }> = {
  critical: { bg: "rgba(196,127,79,0.16)", fg: "#a85f33", ring: "rgba(196,127,79,0.3)", label: "Critical" },
  high: { bg: "rgba(210,161,94,0.18)", fg: "#9a7333", ring: "rgba(210,161,94,0.34)", label: "High" },
  medium: { bg: "rgba(100,116,139,0.16)", fg: "#516079", ring: "rgba(100,116,139,0.3)", label: "Medium" },
  low: { bg: "rgba(120,128,140,0.12)", fg: "#6b7280", ring: "rgba(120,128,140,0.25)", label: "Low" },
};

function StatusPill({ s }: { s: string }) {
  const st = SEVERITY_STYLE[s] ?? SEVERITY_STYLE.low;
  return (
    <span
      className="glass-pill inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: st.bg, color: st.fg, borderColor: st.ring }}
    >
      {st.label}
    </span>
  );
}

/** Generative "Auto-Fix": calls the API to produce paste-ready copy/markup that
 *  overcomes a detected leak. Real generation, honest error on failure. */
function AutoFixPanel({ leak, context }: { leak: RevenueLeak; context?: FixContext }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [fix, setFix] = useState<AutoFix | null>(null);

  async function run() {
    if (fix) {
      setOpen((o) => !o);
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/autofix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: { title: leak.title, cause: leak.cause, fix: leak.fix },
          context: context ?? {},
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Auto-Fix failed");
      setFix(d);
      setOpen(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={run}
        disabled={loading}
        className="glass-lg group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Wand2 className="h-3.5 w-3.5" style={{ color: PALETTE.softIndigo }} />
        )}
        {loading ? "Generating fix…" : fix ? (open ? "Hide auto-fix" : "Show auto-fix") : "Fix it with AI"}
      </button>
      {err && <p className="mt-1.5 text-xs" style={{ color: PALETTE.warmOrange }}>{err}</p>}

      {loading && <FixSkeleton />}

      {fix && open && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-3">
          <p className="text-xs italic text-slate-800 font-medium">{fix.rationale}</p>
          {fix.variants.map((v, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200/70 bg-white/60 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-800">{v.heading}</p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                  {v.kind}
                </span>
              </div>

              {/* before → after */}
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Before</p>
                  <p className="text-xs text-slate-800 font-medium line-through decoration-slate-400">{leak.cause}</p>
                </div>
                <div
                  className="rounded-xl border p-2.5"
                  style={{ borderColor: "rgba(95,154,134,0.3)", background: "rgba(95,154,134,0.08)" }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#4a7d6b" }}>
                      After
                    </p>
                    <CopyButton text={v.copy} />
                  </div>
                  <p className="text-xs text-slate-800">{v.copy}</p>
                </div>
              </div>

              {v.html && (
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Paste-ready snippet</p>
                    <CopyButton text={v.html} label="Copy code" />
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-xl bg-slate-100/80 p-2.5 text-[10px] leading-snug text-slate-600">
                    {v.html}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/** Copy-to-clipboard with a brief confirmation. */
function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — no-op */
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 transition hover:bg-white"
    >
      {copied ? <Check className="h-3 w-3" style={{ color: "#4a7d6b" }} /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

/** Skeleton shown while the AI generates the fix. */
function FixSkeleton() {
  return (
    <div className="mt-3 space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200/70 bg-white/50 p-3.5">
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200/80" />
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Floating ceramic shell ───────────────────────────────────────────────── */
function Shell({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05, duration: 0.5 }}
      className="ceramic lift rounded-[24px] p-5"
    >
      {children}
    </motion.div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/55 p-2.5">
      <p className="text-lg font-semibold tracking-tight" style={{ color, fontFamily: "var(--font-heading)" }}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-800 font-semibold">{label}</p>
    </div>
  );
}

function FixNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-2xl p-3 text-xs"
      style={{ background: "rgba(95,154,134,0.1)", color: "#4a7d6b" }}
    >
      <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {children}
    </div>
  );
}

export function RevenueLeakCard({ leak, i, context }: { leak: RevenueLeak; i: number; context?: FixContext }) {
  return (
    <Shell i={i}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{ background: "rgba(196,127,79,0.12)", color: PALETTE.warmOrange }}
          >
            <TrendingDown className="h-[18px] w-[18px]" />
          </span>
          <p className="font-semibold leading-snug text-slate-900">{leak.title}</p>
        </div>
        <StatusPill s={leak.severity} />
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-900 font-medium">{leak.cause}</p>
      <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
        <Stat value={`${leak.estConversionLoss}%`} label="conv. at risk" color={PALETTE.warmOrange} />
        <Stat value={`${leak.affectedPct}%`} label="customers hit" color={PALETTE.warmAmber} />
        <Stat value={`${leak.estRevenueImpact}`} label="$ impact" color={PALETTE.slateBlue} />
      </div>
      <FixNote>{leak.fix}</FixNote>
      <AutoFixPanel leak={leak} context={context} />
    </Shell>
  );
}

export function ChurnCard({ churn, i }: { churn: ChurnRisk; i: number }) {
  return (
    <Shell i={i}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{ background: "rgba(51,65,85,0.1)", color: PALETTE.deepNavy }}
          >
            <UserMinus className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="font-semibold leading-snug text-slate-900">{churn.segment}</p>
            <p className="text-xs text-slate-800 font-semibold">{churn.category}</p>
          </div>
        </div>
        <span className="text-xl font-semibold tracking-tight" style={{ color: PALETTE.deepNavy, fontFamily: "var(--font-heading)" }}>
          {churn.riskPct}%
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-900 font-medium">{churn.reason}</p>
      <FixNote>{churn.fix}</FixNote>
    </Shell>
  );
}

export function ObjectionCard({ obj, i }: { obj: SalesObjection; i: number }) {
  return (
    <Shell i={i}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PALETTE.warmAmber }} />
          <p className="font-semibold leading-snug text-slate-900">“{obj.question}”</p>
        </div>
        <StatusPill s={obj.severity} />
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-900 font-medium">{obj.impact}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
          style={
            obj.answeredOnSite
              ? { background: "rgba(95,154,134,0.12)", color: "#4a7d6b", borderColor: "rgba(95,154,134,0.3)" }
              : { background: "rgba(196,127,79,0.14)", color: "#a85f33", borderColor: "rgba(196,127,79,0.3)" }
          }
        >
          {obj.answeredOnSite ? "Answered on site" : "Not answered"}
        </span>
        {obj.affectedRoles.slice(0, 3).map((r) => (
          <span key={r} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-800">
            {r}
          </span>
        ))}
      </div>
    </Shell>
  );
}

export function SupportGapCard({ gap, i }: { gap: SupportGap; i: number }) {
  return (
    <Shell i={i}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PALETTE.softTeal }} />
          <p className="font-semibold leading-snug text-slate-900">{gap.scenario}</p>
        </div>
        <StatusPill s={gap.severity} />
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-900 font-medium">{gap.risk}</p>
      <div className="mt-3.5 grid grid-cols-2 gap-4 text-xs">
        <Meter label="FAQ coverage" value={gap.faqCoverage} color={PALETTE.softTeal} />
        <Meter label="Doc quality" value={gap.docQuality} color={PALETTE.softIndigo} />
      </div>
    </Shell>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-slate-800 font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
