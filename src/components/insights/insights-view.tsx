"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Swords,
  Zap,
  TrendingDown,
  TrendingUp,
  UserMinus,
  LifeBuoy,
  Activity,
  Users,
  LayoutGrid,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { RunState } from "@/lib/types";
import { fetchRun } from "@/lib/client/cache";
import { hostOf, cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { VerdictDonut, RoleBar, ConfusionRadar, RiskGauge, Sparkline, PALETTE } from "./charts";
import { Heatmap } from "./heatmap";
import { RevenueLeakCard, ChurnCard, ObjectionCard, SupportGapCard } from "./risk-cards";
import { PersonaCard } from "@/components/persona/persona-card";
import { BrandedSpinner } from "@/components/shared/cinematic-loader";

const HEAD = { fontFamily: "var(--font-heading)" };
const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

function reveal(i = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.2, 0.7, 0.2, 1] },
  };
}

/* Gentle deterministic micro-series for the KPI sparklines (illustrative). */
function makeSpark(value: number, seed: number): number[] {
  const n = 12;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wave = Math.sin((t * 3 + seed * 1.7) * Math.PI) * (value * 0.1 + 3);
    const base = value * (0.72 + 0.28 * t);
    out.push(Math.max(1, base + wave));
  }
  out[n - 1] = Math.max(1, value);
  return out;
}

/* ── Warm "liquid glass" page backdrop (overrides the cool global bg) ──────── */
function WarmBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[#ECEAE6]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 46rem at 50% -12%, rgba(255,255,255,0.7), transparent 62%), radial-gradient(46rem 38rem at 88% 4%, rgba(124,132,184,0.06), transparent 60%), radial-gradient(44rem 40rem at 4% 100%, rgba(95,154,134,0.05), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 grain-warm opacity-[0.05] mix-blend-multiply" />
    </div>
  );
}

/* ── KPI card: icon · metric · trend · sparkline, lots of air ─────────────── */
function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  accent: string;
  index: number;
}) {
  const spark = makeSpark(value, index);
  const delta = spark[0] ? Math.round(((spark[spark.length - 1] - spark[0]) / spark[0]) * 100) : 0;
  const up = delta >= 0;
  return (
    <motion.div {...reveal(index)} className="ceramic lift rounded-[26px] p-5">
      <div className="flex items-center justify-between">
        <span className="glass-lg grid h-10 w-10 place-items-center rounded-2xl" style={{ color: accent }}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span
          className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
          style={{ color: up ? "#4a7d6b" : PALETTE.warmOrange }}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta)}%
        </span>
      </div>
      <p className="mt-5 text-[34px] font-semibold leading-none tracking-tight text-slate-900" style={HEAD}>
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
      <p className="mt-1.5 text-sm text-slate-800 font-semibold">{label}</p>
      <div className="mt-3 h-9">
        <Sparkline data={spark} color={accent} />
      </div>
    </motion.div>
  );
}

/* ── Floating panel for charts ────────────────────────────────────────────── */
function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("ceramic lift rounded-[26px] p-6", className)}>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "revenue", label: "Revenue leaks", icon: TrendingDown },
  { id: "churn", label: "Churn", icon: UserMinus },
  { id: "sales", label: "Sales & support", icon: LifeBuoy },
  { id: "heatmap", label: "Confusion", icon: Activity },
  { id: "personas", label: "Personas", icon: Users },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function InsightsView({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunState | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionId>("overview");

  useEffect(() => {
    fetchRun(runId).then((r) => {
      setRun(r);
      setLoading(false);
    });
  }, [runId]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <WarmBackdrop />
        <BrandedSpinner label="Loading customer intelligence…" />
      </div>
    );
  }

  if (!run?.insights) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <WarmBackdrop />
        <p className="text-lg font-semibold text-slate-900">No insights found for this run.</p>
        <p className="max-w-md text-sm text-slate-800 font-semibold">
          The run may have expired from the demo cache. Start a fresh simulation to generate insights.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black"
        >
          Run a new simulation
        </Link>
      </div>
    );
  }

  const ins = run.insights;
  const analysis = run.analysis;
  const personasWithSims = run.personas.map((p) => ({
    persona: p,
    sim: run.simulations.find((s) => s.personaId === p.id),
  }));

  const counts: Partial<Record<SectionId, number>> = {
    revenue: ins.revenueLeaks.length,
    churn: ins.churnRisks.length,
  };

  return (
    <div className="relative min-h-screen">
      <WarmBackdrop />

      <div className="container max-w-7xl pb-24 pt-28">
        {/* Header */}
        <motion.div {...reveal(0)} className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="glass-lg inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-800">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: PALETTE.mutedEmerald }} />
              Customer Intelligence
            </span>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-[42px]" style={HEAD}>
              {analysis?.title ?? hostOf(run.config.url)}
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-slate-900 font-semibold">{ins.headline}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/report/${runId}`}
              className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_-12px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-black"
            >
              <FileText className="h-4 w-4" /> Executive report
            </Link>
            <Link
              href={`/simulation/${runId}`}
              className="glass-lg inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5"
            >
              Replay run
            </Link>
          </div>
        </motion.div>

        {/* Body: sidebar + section content */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[212px_minmax(0,1fr)]">
          {/* Sidebar nav */}
          <motion.aside
            {...reveal(1)}
            className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:self-start lg:overflow-visible lg:pb-0"
          >
            {SECTIONS.map((s) => {
              const active = section === s.id;
              const count = counts[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className="relative flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm transition-colors lg:w-full"
                >
                  {active && (
                    <>
                      <motion.span layoutId="nav-active" className="glass-lg absolute inset-0 -z-10 rounded-2xl" transition={SPRING} />
                      <motion.span
                        layoutId="nav-bar"
                        className="absolute left-0 top-1/2 hidden h-5 w-[3px] -translate-y-1/2 rounded-full lg:block"
                        style={{ background: PALETTE.slateBlue }}
                        transition={SPRING}
                      />
                    </>
                  )}
                  <s.icon className={cn("h-4 w-4 transition-colors", active ? "text-slate-950" : "text-slate-600")} />
                  <span className={cn("whitespace-nowrap transition-colors", active ? "font-bold text-slate-950" : "text-slate-800 font-semibold")}>
                    {s.label}
                  </span>
                  {count != null && (
                    <span
                      className={cn(
                        "ml-auto hidden rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums lg:inline-block",
                        active ? "bg-slate-900/8 text-slate-600" : "bg-slate-900/5 text-slate-400",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.aside>

          {/* Section content */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {section === "overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <KpiCard icon={Target} label="Avg purchase intent" value={ins.avgPurchaseProbability} suffix="%" accent={PALETTE.softTeal} index={0} />
                      <KpiCard icon={Activity} label="Avg confusion" value={ins.avgConfusion} suffix="%" accent={PALETTE.slateBlue} index={1} />
                      <KpiCard icon={UserMinus} label="Avg churn risk" value={ins.avgChurnRisk} suffix="%" accent={PALETTE.deepNavy} index={2} />
                      <KpiCard icon={TrendingUp} label="Est. conversion uplift" value={ins.estConversionUplift} suffix="%" accent={PALETTE.mutedEmerald} index={3} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <Panel title="Verdict breakdown">
                        <VerdictDonut data={ins.verdictBreakdown} />
                      </Panel>
                      <Panel title="Conversion risk">
                        <RiskGauge value={ins.conversionRiskScore} />
                      </Panel>
                      <Panel title="Confusion radar">
                        <ConfusionRadar zones={ins.heatmap} />
                      </Panel>
                    </div>

                    <Panel title="Purchase intent by segment">
                      <RoleBar data={ins.roleBreakdown} />
                    </Panel>
                  </div>
                )}

                {section === "revenue" &&
                  (ins.revenueLeaks.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {ins.revenueLeaks.map((l, i) => (
                        <RevenueLeakCard
                          key={l.title}
                          leak={l}
                          i={i}
                          context={{ title: analysis?.title, category: analysis?.category, tone: analysis?.toneOfVoice }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty>No major revenue leaks detected — nice.</Empty>
                  ))}

                {section === "churn" &&
                  (ins.churnRisks.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {ins.churnRisks.map((c, i) => (
                        <ChurnCard key={c.segment + i} churn={c} i={i} />
                      ))}
                    </div>
                  ) : (
                    <Empty>No high-churn segments detected.</Empty>
                  ))}

                {section === "sales" && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-slate-900">Unanswered buying questions</h3>
                      <div className="space-y-4">
                        {ins.salesObjections.map((o, i) => (
                          <ObjectionCard key={o.question} obj={o} i={i} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-slate-900">Support stress test</h3>
                      <div className="space-y-4">
                        {ins.supportGaps.map((g, i) => (
                          <SupportGapCard key={g.scenario} gap={g} i={i} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section === "heatmap" && (
                  <div className="space-y-6">
                    <Heatmap zones={ins.heatmap} />
                    <div className="ceramic rounded-[26px] p-6">
                      <h3 className="mb-3 text-sm font-bold text-slate-900">Top questions customers asked</h3>
                      <div className="flex flex-wrap gap-2">
                        {ins.topQuestions.map((q) => (
                          <span
                            key={q}
                            className="rounded-full border border-white/60 bg-white/55 px-3 py-1.5 text-sm text-slate-900 font-semibold"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section === "personas" && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {personasWithSims.slice(0, 60).map(({ persona, sim }, i) => (
                      <PersonaCard key={persona.id} persona={persona} sim={sim} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer CTAs */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <CtaCard href={`/report/${runId}`} icon={FileText} label="Executive report" accent={PALETTE.slateBlue} />
              <CtaCard href="/arena" icon={Swords} label="Battle a competitor" accent={PALETTE.warmAmber} />
              <CtaCard href="/pricing-lab" icon={Zap} label="Simulate a price change" accent={PALETTE.mutedEmerald} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtaCard({ href, icon: Icon, label, accent }: { href: string; icon: LucideIcon; label: string; accent: string }) {
  return (
    <Link href={href} className="glass-lg lift group flex items-center gap-3 rounded-2xl px-4 py-3.5">
      <Icon className="h-5 w-5" style={{ color: accent }} />
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="ceramic rounded-[26px] p-10 text-center text-sm text-slate-800 font-bold">{children}</div>;
}
