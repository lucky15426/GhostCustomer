"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroMockup, MobileMockup } from "@/components/landing/hero-mockup";
import { fadeUp, stagger, EASE } from "@/lib/motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-28 sm:pt-32">
      {/* soft lavender / purple gradient glows (matches the reference) */}
      <div className="pointer-events-none absolute right-[-5%] top-[-10%] -z-10 h-[520px] w-[520px] rounded-full bg-violet-400/30 blur-[130px]" />
      <div className="pointer-events-none absolute right-[18%] top-1/3 -z-10 h-[440px] w-[440px] rounded-full bg-fuchsia-300/20 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-[-18%] left-[-10%] -z-10 h-[560px] w-[560px] rounded-full bg-violet-400/25 blur-[130px]" />

      <div className="container grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-8 xl:gap-12">
        {/* ── Left column: Copy ── */}
        <motion.div variants={stagger(0.1, 0.05)} initial="hidden" animate="show" className="relative z-10">
          {/* Headline — all black, like the reference */}
          <motion.h1
            variants={fadeUp}
            className="text-[2.9rem] font-extrabold uppercase leading-[0.98] tracking-tight text-slate-900 sm:text-[3.6rem] md:text-[4rem] lg:text-[4.1rem] xl:text-[4.6rem]"
          >
            Meet your
            <br />
            customers
            <br />
            before reality
            <br />
            does.
          </motion.h1>

          {/* Description — reference copy */}
          <motion.p variants={fadeUp} className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-slate-500">
            Experience your product through the eyes of hyper-realistic AI personas, uncovering deep insights,
            detecting friction points, and optimizing user journeys in real-time before launch.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link href="/dashboard">
              <button
                id="hero-start-simulation"
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-8px_rgba(124,58,237,0.7)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <span className="relative z-10">Start Simulation</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </Link>

            <Link href="#how">
              <button
                id="hero-watch-demo"
                className="rounded-xl border border-violet-300 bg-white/60 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-violet-700 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50"
              >
                Watch Demo
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Right column: rotatable tablet deck (desktop) ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
          className="relative hidden items-center justify-center lg:flex"
        >
          <HeroMockup />
        </motion.div>

        {/* ── Mobile / tablet: stacked tablets below the copy ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative flex items-center justify-center pt-2 lg:hidden"
        >
          <MobileMockup />
        </motion.div>
      </div>
    </section>
  );
}
