"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Users,
  ShieldCheck,
  DollarSign,
  Crown,
  Loader2,
  Swords,
  ChevronDown,
  Globe,
} from "lucide-react";

// ─── Film grain canvas ────────────────────────────────────────────────────────
function FilmGrainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    function draw() {
      if (!canvas || !ctx) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = Math.random() * 28;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 1, mixBlendMode: "multiply", opacity: 0.45,
      }}
    />
  );
}

const BATTLE_FEATURES = [
  {
    id: "conversion-duel",
    label: "CONVERSION DUEL",
    desc: "Ghosts choose which page feels more convincing.",
    link: "Learn more →",
    Icon: Users,
  },
  {
    id: "trust-battle",
    label: "TRUST BATTLE",
    desc: "Compares proof, testimonials, brand clarity, and credibility.",
    link: "Learn more →",
    Icon: ShieldCheck,
  },
  {
    id: "pricing-clash",
    label: "PRICING CLASH",
    desc: "Finds which pricing page creates less hesitation.",
    link: "Learn more →",
    Icon: DollarSign,
  },
];

export function Battle() {
  const [you, setYou] = useState("");
  const [comp, setComp] = useState("");
  const [loading, setLoading] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);

  const startBattle = () => {
    if (!you.trim() || !comp.trim()) return;
    setLoading(true);
    setBattleStarted(true);
    setTimeout(() => setLoading(false), 4500);
  };

  const lbl: React.CSSProperties = {
    fontFamily: "'Courier New',monospace", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,13,13,0.85)",
    display: "block",
  };

  const scoreRow = (label: string, left: number, right: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, width: 140, fontFamily: "'Courier New',monospace", fontSize: 11, color: "rgba(13,13,13,0.85)", fontWeight: 500 }}>
        <span style={{ color: "rgba(13,13,13,0.5)" }}>⚄</span> {label}
      </span>
      {/* Visual meter */}
      <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.1)", borderRadius: 999, display: "flex", overflow: "hidden", position: "relative" }}>
         <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "100%", background: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(13,13,13,0.85) 2px, rgba(13,13,13,0.85) 6px)` }} />
         <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: `${100 - left}%`, background: "rgba(220,218,210,0.95)" }} />
      </div>
      <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "rgba(13,13,13,0.85)", fontWeight: 600, width: 60, textAlign: "right" }}>
        {left} / 100
      </span>
    </div>
  );

  return (
    <>
      {/* ── Background ── */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, backgroundColor: "#c4c1ba", backgroundImage: "radial-gradient(ellipse 150% 150% at 50% 46%,#ccc9c2 0%,#bcb9b2 52%,#aaa79f 100%)" }} />
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 2, background: "radial-gradient(ellipse 110% 110% at 50% 50%,transparent 38%,rgba(0,0,0,0.28) 100%)", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 3, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)", pointerEvents: "none", animation: "gc-scan-drift 14s linear infinite" }} />
      <FilmGrainCanvas />
      {/* Corner marks */}
      {(["tl", "tr", "bl", "br"] as const).map((pos) => (
        <div key={pos} aria-hidden="true" style={{
          position: "fixed", zIndex: 4, width: 18, height: 18, pointerEvents: "none", opacity: 0.3,
          ...(pos === "tl" ? { top: 20, left: 20, borderTop: "1.5px solid #1a1917", borderLeft: "1.5px solid #1a1917" } : {}),
          ...(pos === "tr" ? { top: 20, right: 20, borderTop: "1.5px solid #1a1917", borderRight: "1.5px solid #1a1917" } : {}),
          ...(pos === "bl" ? { bottom: 20, left: 20, borderBottom: "1.5px solid #1a1917", borderLeft: "1.5px solid #1a1917" } : {}),
          ...(pos === "br" ? { bottom: 20, right: 20, borderBottom: "1.5px solid #1a1917", borderRight: "1.5px solid #1a1917" } : {}),
        }} />
      ))}

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes gc-scan-drift { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
        @keyframes gc-blink-block { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Main content, padding-top ensures it clears the global navbar */}
      <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", paddingTop: 140, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-8 items-start">
            {/* LEFT — Control panel & Hero text */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <div style={{
                background: "rgba(232,229,221,0.62)", border: "1px solid rgba(26,25,23,0.13)", borderRadius: 8,
                padding: "clamp(24px,3vw,36px)", boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset, 0 20px 60px -20px rgba(0,0,0,0.2)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", position: "relative"
              }}>
                <p style={{ ...lbl, marginBottom: 10 }}>COMPETITOR BATTLE ARENA</p>
                <h1 style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: "clamp(28px,3.8vw,44px)", fontWeight: 500, color: "#0d0d0d", letterSpacing: "-0.03em", lineHeight: 1.12, marginBottom: 16 }}>
                  Whose customers<br />convert better?
                </h1>
                <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 14, color: "rgba(13,13,13,0.7)", lineHeight: 1.6, marginBottom: 28 }}>
                  Send the swarm to both sites and watch which experience wins each customer segment.
                </p>

                <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg,rgba(0,0,0,0.12) 0%,transparent 100%)", marginBottom: 24 }} />

                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-5">
                  <div>
                    <label htmlFor="your-site" style={{ ...lbl, marginBottom: 6 }}>YOUR SITE</label>
                    <div style={{ position: "relative" }}>
                      <Globe style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(13,13,13,0.75)", pointerEvents: "none" }} />
                      <input
                        id="your-site"
                        type="text"
                        value={you}
                        onChange={(e) => setYou(e.target.value)}
                        placeholder="yourcompany.com"
                        className="placeholder:text-black/50"
                        style={{ fontFamily: "'Courier New',monospace", fontSize: 13, color: "#0d0d0d", background: "rgba(255,255,255,0.75)", border: "1px solid rgba(26,25,23,0.35)", borderRadius: 6, padding: "9px 14px 9px 36px", outline: "none", width: "100%", transition: "background 0.2s,border-color 0.2s", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ fontFamily: "'Courier New',monospace", fontSize: 22, fontWeight: 800, color: "rgba(13,13,13,0.8)", marginTop: 20, letterSpacing: "-0.05em" }}>
                    VS
                  </div>

                  <div>
                    <label htmlFor="comp-site" style={{ ...lbl, marginBottom: 6 }}>COMPETITOR</label>
                    <div style={{ position: "relative" }}>
                      <Globe style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(13,13,13,0.75)", pointerEvents: "none" }} />
                      <input
                        id="comp-site"
                        type="text"
                        value={comp}
                        onChange={(e) => setComp(e.target.value)}
                        placeholder="competitor.com"
                        className="placeholder:text-black/50"
                        style={{ fontFamily: "'Courier New',monospace", fontSize: 13, color: "#0d0d0d", background: "rgba(255,255,255,0.75)", border: "1px solid rgba(26,25,23,0.35)", borderRadius: 6, padding: "9px 14px 9px 36px", outline: "none", width: "100%", transition: "background 0.2s,border-color 0.2s", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-12 pt-1 mt-6">
                  <button
                    onClick={startBattle}
                    disabled={loading || !you.trim() || !comp.trim()}
                    style={{ flex: 1, minWidth: 150, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 14, fontWeight: 500, color: "#fff", background: "#0d0d0d", border: "1px solid #0d0d0d", borderRadius: 999, padding: "11px 24px", cursor: loading || !you.trim() || !comp.trim() ? "not-allowed" : "pointer", opacity: loading || !you.trim() || !comp.trim() ? 0.4 : 1, transition: "opacity 0.2s", letterSpacing: "-0.01em" }}
                  >
                    {loading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Swords style={{ width: 14, height: 14 }} />}
                    {loading ? "Simulating battle…" : "Start the battle"}
                  </button>

                  <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Courier New',monospace", fontSize: 12, color: "rgba(13,13,13,0.85)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.04em" }}>
                    Advanced options <span style={{ fontSize: 10 }}>▾</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* RIGHT — Battle Arena Machine */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}>
              <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "flex-end" }}>
                <Image
                  src="/images/battle-arena-terminal.png"
                  alt="Battle Arena Terminal"
                  width={720}
                  height={600}
                  style={{ width: "100%", maxWidth: "720px", height: "auto", display: "block", objectFit: "contain", filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.4)) drop-shadow(0 10px 20px rgba(0,0,0,0.15))", mixBlendMode: "multiply" }}
                  priority
                />
              </div>
            </motion.div>
          </div>

          {/* ════════════════════════════════════════════════
              Feature cards
          ═══════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12, marginTop: 28 }}>
            {BATTLE_FEATURES.map((card) => (
              <div key={card.id} style={{ background: "rgba(230,227,219,0.58)", border: "1px solid rgba(26,25,23,0.1)", borderRadius: 6, padding: "20px 20px 18px", boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,13,13,0.06)", border: "1px solid rgba(26,25,23,0.1)", borderRadius: 6, flexShrink: 0 }}>
                  <card.Icon style={{ width: 15, height: 15, color: "rgba(13,13,13,0.6)" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,13,13,0.85)", marginBottom: 6 }}>{card.label}</p>
                  <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 12, color: "rgba(13,13,13,0.85)", lineHeight: 1.5, marginBottom: 10 }}>{card.desc}</p>
                  <a href="#" style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.75)", textDecoration: "none", transition: "color 0.18s", fontWeight: 600 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,1)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,0.75)")}>
                    {card.link}
                  </a>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ════════════════════════════════════════════════
              Battle Report Preview
          ═══════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ marginTop: 40 }}>
            
            <p style={{ ...lbl, marginBottom: 16 }}>BATTLE REPORT PREVIEW</p>
            
            <div 
              className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-8 items-stretch"
              style={{ background: "rgba(232,229,221,0.62)", border: "1px solid rgba(26,25,23,0.13)", borderRadius: 12, padding: "32px", boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset", position: "relative" }}>
              {/* Screw heads */}
              {[[12, 12], [12, "calc(100% - 16px)"], ["calc(100% - 16px)", 12], ["calc(100% - 16px)", "calc(100% - 16px)"]].map((pos, i) => (
                <div key={i} className="hidden md:block" style={{ position: "absolute", top: pos[0], left: pos[1], width: 6, height: 6, borderRadius: "50%", background: "rgba(13,13,13,0.15)", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 1px 1px rgba(255,255,255,0.8) inset" }} />
              ))}

              {/* YOUR SITE stats */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 16, fontWeight: 600, color: "#0d0d0d" }}>YOUR SITE</p>
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "#fff", background: "#0d0d0d", padding: "2px 8px", borderRadius: 4 }}>{you || "yourcompany.com"}</span>
                </div>
                {scoreRow("Conversion Score", 72, 60)}
                {scoreRow("Trust Score", 68, 55)}
                {scoreRow("CTA Clarity", 74, 59)}
                {scoreRow("Pricing Friction", 54, 70)}
                {scoreRow("Drop-off Risk", 61, 66)}
              </div>

              {/* WINNER PREDICTION CARD */}
              <div style={{ background: "#0f1110", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 40px rgba(0,0,0,0.5), 0 20px 40px -10px rgba(0,0,0,0.4)" }}>
                {/* CRT screen effect overlays inside the card */}
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.3) 2px,rgba(0,0,0,0.3) 4px)", pointerEvents: "none", zIndex: 2 }} />
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(140,255,100,0.05) 0%, transparent 80%)", pointerEvents: "none", zIndex: 1 }} />
                
                <p style={{ position: "relative", zIndex: 5, fontFamily: "'Courier New',monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  WINNER PREDICTION <Crown style={{ width: 12, height: 12 }} />
                </p>
                <p style={{ position: "relative", zIndex: 5, fontFamily: "'Courier New',monospace", fontSize: 28, fontWeight: 800, color: "rgba(150,255,120,0.95)", letterSpacing: "0.05em", textShadow: "0 0 12px rgba(150,255,120,0.4)", marginBottom: 8 }}>
                  YOUR SITE
                </p>
                <p style={{ position: "relative", zIndex: 5, fontFamily: "'Courier New',monospace", fontSize: 13, color: "rgba(150,255,120,0.7)", marginBottom: 32 }}>
                  Leading by 12%
                </p>
                
                <div style={{ position: "relative", zIndex: 5, width: "100%", display: "flex", alignItems: "center", justifyItems: "space-between", justifyContent: "space-between", fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                  <span>Confidence <span style={{ letterSpacing: "-1px" }}>▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪</span></span>
                  <span>64%</span>
                </div>
                <div style={{ position: "relative", zIndex: 5, width: "100%", marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Courier New',monospace", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
                  <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: "rgba(150,255,120,0.8)", animation: "gc-blink-block 1s infinite" }} />
                  Running simulation...
                </div>
              </div>

              {/* COMPETITOR stats */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 16, fontWeight: 600, color: "#0d0d0d" }}>COMPETITOR</p>
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "#fff", background: "#0d0d0d", padding: "2px 8px", borderRadius: 4 }}>{comp || "competitor.com"}</span>
                </div>
                {scoreRow("Conversion Score", 60, 72)}
                {scoreRow("Trust Score", 55, 68)}
                {scoreRow("CTA Clarity", 59, 74)}
                {scoreRow("Pricing Friction", 70, 54)}
                {scoreRow("Drop-off Risk", 66, 61)}
              </div>
            </div>
          </motion.div>

          {/* ════════════════════════════════════════════════
              Footer status row
          ═══════════════════════════════════════════════ */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-10" style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "rgba(13,13,13,0.3)" }} />
              System online
            </span>
            <span>Need help? hello@ghostcustomer.ai</span>
            <span>Last battle: Never</span>
          </div>

        </div>
      </main>
    </>
  );
}
