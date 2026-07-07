"use client";

import { motion } from "framer-motion";
import { Users, Cpu, ShieldAlert, Rocket, ShieldCheck, Check, Lock } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/animated-number";

const HEAD = { fontFamily: "var(--font-heading)" };

export function TrustSection() {
  const stats = [
    { icon: Users, value: 840, suffix: "K+", decimals: 0, label: "Customer Simulations Run", desc: "Ghost agents deployed to evaluate customer funnels" },
    { icon: Cpu, value: 1.8, suffix: "M+", decimals: 1, label: "AI Predictions Generated", desc: "Intent, clarity, and objection metrics analyzed" },
    { icon: ShieldAlert, value: 12.4, suffix: "K+", decimals: 1, label: "Churn Risks Identified", desc: "Pre-launch friction and customer drop-off points caught" },
    { icon: Rocket, value: 3.2, suffix: "K+", decimals: 1, label: "Product Launches Analyzed", desc: "High-value SaaS releases stress-tested" },
  ];

  const badges = [
    { label: "SOC2 Type II", info: "Certified Compliance", icon: ShieldCheck },
    { label: "GDPR Compliant", info: "Complete Data Privacy", icon: Check },
    { label: "AES-256", info: "Enterprise Encryption", icon: Lock },
    { label: "ISO 27001", info: "Security Standard", icon: ShieldCheck },
  ];

  return (
    <section className="border-b border-slate-200 bg-white py-24">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400"
          >
            Trusted at scale
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-4xl tracking-tight text-slate-900 sm:text-5xl"
            style={HEAD}
          >
            Pre-launch simulation at global scale
          </motion.h2>
        </div>

        {/* Stats — hairline-bordered grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-2xl font-semibold tracking-tight text-slate-900">
                    <AnimatedNumber value={s.value} suffix={s.suffix} decimals={s.decimals} />
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-medium text-slate-900">{s.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Security credentials */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 border-t border-slate-200 pt-10">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Enterprise Security Core</span>
          <div className="flex flex-wrap justify-center gap-x-9 gap-y-4">
            {badges.map((b, idx) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.3 }}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-semibold text-slate-900">{b.label}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">{b.info}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
