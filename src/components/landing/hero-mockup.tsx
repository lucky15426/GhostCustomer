"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Flame, Terminal, TrendingUp, X, ShoppingBag, Search } from "lucide-react";

// White landscape tablets fanned into a 3D deck that rotates toward the cursor,
// matching front_page.jpeg. Front tablet = a light e-commerce simulation with
// floating personas; the other three are dark analytics dashboards. All CSS/SVG
// (razor-sharp at any size) and transform-only (smooth).
const LAYOUT = [
  { tx: -58, ty: 54, s: 1.0, z: 40, op: 1 },
  { tx: 46, ty: 16, s: 0.9, z: 30, op: 0.97 },
  { tx: 140, ty: -22, s: 0.8, z: 20, op: 0.93 },
  { tx: 226, ty: -60, s: 0.72, z: 10, op: 0.88 },
];

export function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const mvx = useMotionValue(0);
  const mvy = useMotionValue(0);
  const rotateY = useSpring(useTransform(mvx, [-0.5, 0.5], [-17, -33]), { stiffness: 80, damping: 16 });
  const rotateX = useSpring(useTransform(mvy, [-0.5, 0.5], [13, 1]), { stiffness: 80, damping: 16 });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mvx.set((e.clientX - r.left) / r.width - 0.5);
        mvy.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mvx.set(0);
        mvy.set(0);
      }}
      className="relative mx-auto h-[470px] w-full max-w-[600px] [perspective:1800px]"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/25 blur-[130px]" />

      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="absolute inset-0">
        {LAYOUT.map((c, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{ zIndex: c.z, transform: `translate(-50%, -50%) translate(${c.tx}px, ${c.ty}px) scale(${c.s})` }}
          >
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: c.op, y: [0, -6, 0] }}
              transition={{
                opacity: { duration: 0.7, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 6 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: 0.9 + i * 0.4 },
              }}
              whileHover={{ y: -16, transition: { duration: 0.3 } }}
              style={{ willChange: "transform" }}
            >
              <Tablet>
                <Screen index={i} />
              </Tablet>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/** Static crisp tablet stack for tablet/mobile (below the copy). */
export function MobileMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute right-0 top-3 w-[80%] rotate-3 opacity-80">
        <Tablet>
          <Screen index={1} />
        </Tablet>
      </div>
      <div className="relative mt-16 -rotate-1">
        <Tablet>
          <Screen index={0} />
        </Tablet>
      </div>
    </div>
  );
}

/** White iPad-style landscape bezel + 16:10 screen. */
function Tablet({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[344px] cursor-pointer select-none rounded-[22px] bg-gradient-to-br from-white via-slate-50 to-slate-200 p-[5px] shadow-[0_46px_92px_-30px_rgba(70,45,140,0.6)] ring-1 ring-black/[0.06] xl:w-[372px]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[17px] ring-1 ring-black/10">{children}</div>
    </div>
  );
}

function Screen({ index }: { index: number }) {
  if (index === 0) return <CommerceScreen />;
  if (index === 1) return <HeatmapScreen />;
  if (index === 2) return <LogsScreen />;
  return <FrictionScreen />;
}

const DOT: Record<string, string> = { violet: "bg-violet-500", amber: "bg-amber-400", emerald: "bg-emerald-400", cyan: "bg-cyan-400" };

function DarkScreen({ title, accent, icon, children }: { title: string; accent: keyof typeof DOT; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-[#0b0b14] text-zinc-100">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-100">
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[accent]}`} /> {title}
        </span>
        <span className="flex items-center gap-1.5">
          {icon}
          <span className="h-0.5 w-2 rounded bg-white/20" />
          <X className="h-2.5 w-2.5 text-white/25" />
        </span>
      </div>
      <div className="min-h-0 flex-1 p-2.5">{children}</div>
    </div>
  );
}

/* ── Front · light e-commerce simulation (landscape) ─────────────────────── */
function CommerceScreen() {
  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      {/* app title bar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-800">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Simulation Dashboard
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-2 rounded bg-slate-300" />
          <X className="h-2.5 w-2.5 text-slate-400" />
        </span>
      </div>

      {/* store nav */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5">
        <span className="text-[9px] font-extrabold tracking-tight text-slate-900">
          AURA<span className="text-violet-500">.</span>
        </span>
        <div className="flex items-center gap-2 text-[6px] font-semibold text-slate-400">
          <span>Shop</span><span>New</span><span>Sale</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Search className="h-2.5 w-2.5" />
          <ShoppingBag className="h-2.5 w-2.5" />
        </div>
      </div>

      {/* body */}
      <div className="relative min-h-0 flex-1 px-3 py-2">
        {/* hero row */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[12px] font-extrabold leading-[1.04] text-slate-900">
              Modern commerce
              <br />
              with discover
            </p>
            <p className="mt-1 text-[6px] leading-tight text-slate-400">Product Details — find your perfect fit with AI styling.</p>
            <span className="mt-1.5 inline-block w-fit rounded bg-slate-900 px-2 py-0.5 text-[6.5px] font-bold text-white">Shop now</span>
          </div>
          <div className="relative h-[58px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-slate-100 to-slate-200 ring-1 ring-black/5">
            {/* model in a blue shirt */}
            <div className="absolute bottom-0 left-1/2 h-12 w-12 -translate-x-1/2 rounded-t-[44%] bg-gradient-to-b from-sky-400 to-blue-600" />
            <div className="absolute bottom-9 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-amber-100" />
          </div>
        </div>

        {/* product readers */}
        <p className="mt-2 text-[7px] font-bold text-slate-700">Product Readers</p>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {["from-sky-100 to-sky-200", "from-rose-100 to-rose-200", "from-emerald-100 to-emerald-200", "from-amber-100 to-amber-200"].map((g, k) => (
            <div key={k} className={`h-9 rounded bg-gradient-to-br ${g} ring-1 ring-black/5`} />
          ))}
        </div>

        {/* heat blooms over the hero */}
        <span className="absolute right-[34%] top-2 h-6 w-6 animate-pulse rounded-full bg-red-500/55 blur-[5px]" />
        <span className="absolute right-[22%] top-5 h-5 w-5 animate-pulse rounded-full bg-orange-500/50 blur-[5px]" />
        <span className="absolute right-[14%] top-2 h-4 w-4 animate-pulse rounded-full bg-red-500/45 blur-[4px]" />

        {/* Happy Helen */}
        <div className="absolute left-2.5 top-[34%] flex items-center gap-1">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[9px] shadow ring-2 ring-emerald-400">🙂</span>
          <span className="rounded-md bg-slate-900 px-1 py-0.5 text-[6px] font-bold text-white shadow-sm">Happy Helen</span>
        </div>
        <span className="absolute left-3 top-[56%] flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[5.5px] font-bold text-white shadow">
          ★ High Engagement
        </span>

        {/* Skeptic Sam + confusion */}
        <div className="absolute right-[30%] top-7 flex items-center gap-1">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[9px] shadow ring-2 ring-rose-400">🤨</span>
          <span className="rounded-md bg-slate-900 px-1 py-0.5 text-[6px] font-bold text-white shadow-sm">Skeptic Sam</span>
        </div>
        <span className="absolute right-[8%] top-6 rounded bg-rose-500 px-1 py-0.5 text-[5.5px] font-bold text-white shadow">Confusion Detected!</span>
        <span className="absolute right-[26%] top-[40%] rounded border border-slate-200 bg-white px-2 py-0.5 text-[5.5px] font-bold text-slate-700 shadow">Checkout</span>

        {/* Confused Carl + pricing friction */}
        <div className="absolute bottom-1.5 right-2 w-[78px] rounded-lg bg-slate-900 p-1.5 text-white shadow-lg ring-1 ring-white/10">
          <div className="flex items-center gap-1">
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[6px]">😕</span>
            <p className="text-[6px] font-bold">Confused Carl</p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[6px]">
            <span className="text-slate-500 line-through">$50</span>
            <span className="font-bold text-emerald-400">$30</span>
            <span className="text-slate-400">/mo</span>
          </div>
          <span className="mt-1 flex w-fit items-center gap-0.5 rounded bg-amber-400 px-1 py-0.5 text-[5px] font-extrabold text-black">⚡ Potential Friction</span>
        </div>
      </div>
    </div>
  );
}

/* ── Heatmap Analytics (dark) ────────────────────────────────────────────── */
function HeatmapScreen() {
  return (
    <DarkScreen title="Heatmap Analytics" accent="amber" icon={<Flame className="h-2.5 w-2.5 text-amber-300/70" />}>
      <div className="flex h-full gap-2">
        <div className="relative flex-1 overflow-hidden rounded-lg border border-white/[0.06] bg-gradient-to-b from-[#191428] to-black/70 p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-400" /><div className="h-2 w-8 rounded bg-white/15" /></div>
            <div className="h-1.5 w-5 rounded bg-violet-400/50" />
          </div>
          <div className="h-3 w-2/3 rounded bg-gradient-to-r from-white/25 to-white/5" />
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {["from-fuchsia-500/30", "from-sky-500/30", "from-emerald-500/30"].map((g, k) => (
              <div key={k} className={`relative h-9 rounded border border-white/5 bg-gradient-to-br ${g} to-transparent`}>
                {k === 0 && (<><span className="absolute -right-1.5 -top-1.5 h-7 w-7 animate-pulse rounded-full bg-red-500/50 blur-md" /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" /></>)}
                {k === 2 && (<><span className="absolute -bottom-1.5 left-1/2 h-8 w-8 -translate-x-1/2 animate-pulse rounded-full bg-orange-500/40 blur-md" /><span className="absolute bottom-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-orange-400" /></>)}
              </div>
            ))}
          </div>
        </div>
        <div className="w-[34%] space-y-1.5">
          {[
            { c: "bg-red-500", t: "Confusing pricing", v: "45%" },
            { c: "bg-orange-400", t: "Checkout drop", v: "28%" },
            { c: "bg-amber-400", t: "Hidden support", v: "12%" },
          ].map((f) => (
            <div key={f.t} className="rounded-md border border-white/[0.06] bg-white/[0.02] p-1.5">
              <span className="flex items-center gap-1 text-[7px] text-zinc-300"><span className={`h-1.5 w-1.5 rounded-full ${f.c}`} />{f.t}</span>
              <span className="font-mono text-[7px] text-zinc-500">{f.v} drop-off</span>
            </div>
          ))}
        </div>
      </div>
    </DarkScreen>
  );
}

/* ── Persona Logs (dark) ─────────────────────────────────────────────────── */
function LogsScreen() {
  const logs = [
    { t: "10:23:45", c: "text-rose-400", m: "User 402 · Abandoned checkout" },
    { t: "10:23:51", c: "text-rose-400", m: "User 88 · High friction /product" },
    { t: "10:23:58", c: "text-emerald-400", m: "User 205 · Viewed pricing" },
    { t: "10:24:02", c: "text-sky-300", m: "User 41 · Session ended" },
  ];
  return (
    <DarkScreen title="Persona Logs" accent="emerald" icon={<Terminal className="h-2.5 w-2.5 text-emerald-300/70" />}>
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[9px]">😀</span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold text-zinc-100">Veepy Nolen</p>
          <p className="text-[6.5px] text-zinc-500">Power user · 5 sessions today</p>
        </div>
        <span className="flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[7px] font-bold text-rose-300"><Flame className="h-2.5 w-2.5" /> HIGH</span>
      </div>
      <div className="space-y-1 font-mono text-[8px] leading-relaxed">
        {logs.map((l) => (
          <div key={l.t} className="flex items-start gap-1.5">
            <span className="text-emerald-500/60">{l.t}</span><span className="text-zinc-600">&gt;</span><span className={l.c}>{l.m}</span>
          </div>
        ))}
        <div className="flex items-center gap-1"><span className="text-emerald-500/60">10:24:09</span><span className="text-zinc-600">&gt;</span><span className="inline-block h-2.5 w-1 animate-pulse bg-emerald-400" /></div>
      </div>
    </DarkScreen>
  );
}

/* ── Friction Scores (dark) ──────────────────────────────────────────────── */
function FrictionScreen() {
  return (
    <DarkScreen title="Friction Scores" accent="cyan" icon={<TrendingUp className="h-2.5 w-2.5 text-cyan-300/70" />}>
      <div className="relative flex h-full flex-col">
        <div className="relative flex-1">
          <span className="absolute left-[42%] top-0 z-10 rounded bg-cyan-500/20 px-1 py-0.5 font-mono text-[7px] font-bold text-cyan-300">+17.28</span>
          <span className="absolute right-[8%] top-3 z-10 rounded bg-fuchsia-500/20 px-1 py-0.5 font-mono text-[7px] font-bold text-fuchsia-300">-8.90</span>
          <svg viewBox="0 0 120 50" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="fill-cyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,211,238,0.4)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0)" />
              </linearGradient>
            </defs>
            {[12, 25, 38].map((y) => <line key={y} x1="0" y1={y} x2="120" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />)}
            <path d="M0,40 Q20,16 38,27 T74,11 T120,24 V50 H0 Z" fill="url(#fill-cyan)" />
            <path d="M0,40 Q20,16 38,27 T74,11 T120,24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
            <path d="M0,45 Q24,34 44,38 T84,27 T120,36" fill="none" stroke="rgba(217,70,239,0.85)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="74" cy="11" r="2.5" fill="#22d3ee" stroke="#0a0a12" strokeWidth="1" />
            <circle cx="84" cy="27" r="2.5" fill="#d946ef" stroke="#0a0a12" strokeWidth="1" />
          </svg>
        </div>
        <div className="flex justify-between font-mono text-[6.5px] text-zinc-600"><span>JAN</span><span>MAR</span><span>JUN</span><span>SEP</span><span>DEC</span></div>
        <div className="mt-1.5 flex items-center gap-3 border-t border-white/[0.06] pt-1.5 text-[7px]">
          <span className="flex items-center gap-1 text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Friction</span>
          <span className="flex items-center gap-1 text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" /> Sentiment</span>
        </div>
      </div>
    </DarkScreen>
  );
}
