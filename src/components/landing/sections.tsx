"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe, Users, Activity, DollarSign, LifeBuoy, TrendingDown,
  UserMinus, Swords, Clock, FileText, X, Check, ArrowRight, ArrowUpRight,
} from "lucide-react";
import { AGENTS } from "@/components/war-room/agent-meta";

const HEAD = { fontFamily: "var(--font-heading)" };

function reveal(i = 0) {
  return {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, delay: i * 0.06 },
  };
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">{children}</p>;
}

/* ── This is not a chatbot ───────────────────────────────────────────────── */
export function Differentiator() {
  const bad = ["Wait for customers to ask", "Answer after the damage is done", "See one conversation at a time", "Can't predict churn or lost revenue"];
  const good = ["Becomes hundreds of customers", "Finds problems before launch", "Simulates your whole market at once", "Predicts churn, conversion & revenue leaks"];
  return (
    <section className="container py-28">
      <motion.div {...reveal()} className="mx-auto max-w-2xl text-center">
        <Eyebrow>The difference</Eyebrow>
        <h2 className="mt-4 text-4xl tracking-tight text-slate-900 sm:text-5xl" style={HEAD}>
          This is not a chatbot.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-slate-500">
          Every other AI tool waits for a customer to complain, then answers. GhostCustomer does the opposite — it
          becomes the customer and finds the problem first.
        </p>
      </motion.div>

      <motion.div {...reveal(1)} className="mx-auto mt-14 grid max-w-3xl gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        <div className="bg-white p-7">
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
            <X className="h-4 w-4" /> Reactive chatbots
          </p>
          <ul className="space-y-2.5 text-sm text-slate-500">
            {bad.map((t) => (
              <li key={t} className="flex gap-2.5">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-7">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Check className="h-4 w-4" /> GhostCustomer
          </p>
          <ul className="space-y-2.5 text-sm text-slate-600">
            {good.map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

const FEATURES = [
  { icon: Globe, title: "Website Intelligence", desc: "Crawls and understands your site, pricing, FAQs, and trust signals." },
  { icon: Users, title: "Persona Generator", desc: "Creates 50–500 realistic customers across 10 archetypes." },
  { icon: Activity, title: "Customer Swarm", desc: "Each persona independently evaluates and scores your experience." },
  { icon: DollarSign, title: "Sales Agent", desc: "Acts as a buyer and finds unanswered objections and missing info." },
  { icon: LifeBuoy, title: "Support Stress Test", desc: "Throws hard tickets and edge cases at your FAQ and docs." },
  { icon: TrendingDown, title: "Revenue Leak Detector", desc: "Quantifies hidden conversion blockers and their dollar impact." },
  { icon: UserMinus, title: "Churn Prediction", desc: "Forecasts which segments will leave — and exactly why." },
  { icon: Swords, title: "Competitor Arena", desc: "Battles your site vs a rival across every customer segment." },
  { icon: Clock, title: "Pricing Time Machine", desc: "Simulates customer reactions to any price change." },
  { icon: FileText, title: "Executive Report", desc: "Board-ready insights, recommendations, and projected uplift." },
];

export function Features() {
  return (
    <section className="container py-28">
      <motion.div {...reveal()} className="mx-auto max-w-2xl text-center">
        <Eyebrow>Capabilities</Eyebrow>
        <h2 className="mt-4 text-4xl tracking-tight text-slate-900 sm:text-5xl" style={HEAD}>
          Ten ways to find problems first
        </h2>
        <p className="mt-4 text-[17px] text-slate-500">One simulation run powers every analysis below.</p>
      </motion.div>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            {...reveal(i % 5)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_-16px_rgba(15,23,42,0.22)]"
          >
            {/* soft corner glow on hover */}
            <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-slate-900/[0.04] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/80 transition-all duration-300 group-hover:from-slate-800 group-hover:to-slate-950 group-hover:text-white group-hover:ring-slate-900 group-hover:shadow-[0_6px_16px_-6px_rgba(15,23,42,0.5)]">
              <f.icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-4 text-[15px] font-semibold leading-snug tracking-tight text-slate-900">{f.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
            <span className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-slate-200 transition-colors duration-300 group-hover:bg-slate-900" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function AgentsShowcase() {
  // A signal travels through the pipeline on a loop, lighting each agent as it
  // "hands off" to the next — a live, repeating run of the swarm.
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % (AGENTS.length + 1)), 950);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="container py-28">
      <motion.div {...reveal()} className="mx-auto max-w-2xl text-center">
        <Eyebrow>Architecture</Eyebrow>
        <h2 className="mt-4 text-4xl tracking-tight text-slate-900 sm:text-5xl" style={HEAD}>
          A coordinated multi-agent brain
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-slate-500">
          Eight specialized agents — orchestrated with LangGraph — hand off work like a real research team.
        </p>
      </motion.div>

      <motion.div {...reveal(1)} className="mt-8 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live pipeline
        </span>
      </motion.div>

      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-4">
        {AGENTS.map((a, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <motion.div key={a.name} {...reveal(i)} className="flex items-center gap-3">
              <motion.div
                animate={{ scale: isActive ? 1.06 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className={`relative flex items-center gap-2.5 rounded-full border px-4 py-2.5 transition-colors duration-300 ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_10px_30px_-10px_rgba(15,23,42,0.55)]"
                    : isDone
                      ? "border-slate-200 bg-slate-50 text-slate-500"
                      : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {isActive && (
                  <motion.span
                    className="pointer-events-none absolute -inset-px rounded-full ring-2 ring-slate-900/10"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <a.icon className={`h-3.5 w-3.5 transition-colors duration-300 ${isActive ? "text-white" : isDone ? "text-slate-400" : "text-slate-400"}`} />
                <span className="text-sm font-medium">{a.name}</span>
                {isActive && (
                  <span className="relative ml-0.5 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                )}
              </motion.div>
              {i < AGENTS.length - 1 && (
                <ArrowRight
                  className={`h-4 w-4 transition-colors duration-300 max-md:hidden ${
                    i < active ? "text-slate-900" : "text-slate-300"
                  }`}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

const STEPS = [
  "Enter a website URL",
  "AI crawls & analyzes the business",
  "Generates hundreds of customer personas",
  "Runs the customer simulation swarm",
  "Sales & support agents stress-test it",
  "Detects revenue leaks & churn risks",
  "Delivers an executive report",
];

export function HowItWorks() {
  return (
    <section id="how" className="container py-28">
      <motion.div {...reveal()} className="mx-auto max-w-2xl text-center">
        <Eyebrow>The flow</Eyebrow>
        <h2 className="mt-4 text-4xl tracking-tight text-slate-900 sm:text-5xl" style={HEAD}>
          From URL to insight in 7 steps
        </h2>
      </motion.div>

      <div className="mx-auto mt-14 max-w-2xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {STEPS.map((step, i) => (
          <motion.div key={step} {...reveal(i)} className="flex items-center gap-5 px-6 py-5 transition-colors hover:bg-slate-50/80">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 font-mono text-[13px] font-semibold text-white">
              {i + 1}
            </span>
            <span className="font-medium text-slate-800">{step}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="container py-32">
      <motion.div {...reveal()} className="mx-auto max-w-3xl text-center">
        <Eyebrow>Get started</Eyebrow>
        <h2 className="mt-5 text-4xl tracking-tight text-slate-900 sm:text-6xl" style={HEAD}>
          See your customers before they&apos;re real.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-slate-500">
          Run a full simulation in under a minute. No signup, no API key required — it works on the demo engine out of
          the box.
        </p>
        <div className="mt-9 flex justify-center">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-black"
          >
            Launch the swarm
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
