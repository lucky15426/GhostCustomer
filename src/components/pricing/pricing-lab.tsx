"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Activity, DollarSign, AlertTriangle, ChevronDown } from "lucide-react";

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

export function PricingLab() {
  const [current, setCurrent] = useState("29");
  const [proposed, setProposed] = useState("49");
  const [loading, setLoading] = useState(false);

  const lbl: React.CSSProperties = {
    fontFamily: "'Courier New',monospace", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,13,13,0.85)",
    display: "block",
  };

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

      <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", paddingTop: 140, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          
          {/* HERO SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-start mb-16">
            
            {/* LEFT: Text & Console */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <p style={{ ...lbl, marginBottom: 16 }}>PRICING TIME MACHINE</p>
              <h1 style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 500, color: "#0d0d0d", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
                Change your price.<br />See the future.
              </h1>
              <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 15, color: "rgba(13,13,13,0.7)", lineHeight: 1.6, marginBottom: 40, maxWidth: 480 }}>
                Simulate how every customer segment reacts to a price change — before you risk a single real customer.
              </p>

              {/* CONSOLE CARD */}
              <div style={{
                background: "rgba(232,229,221,0.62)", border: "1px solid rgba(26,25,23,0.13)", borderRadius: 12,
                padding: "clamp(24px,3vw,32px)", boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset, 0 20px 60px -20px rgba(0,0,0,0.2)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)"
              }}>
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  {/* Current Price */}
                  <div className="flex-1 w-full text-center sm:text-left">
                    <label style={{ ...lbl, marginBottom: 8, display: "block", textAlign: "center" }}>CURRENT PRICE ($/MO)</label>
                    <input
                      type="text"
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      style={{
                        width: "100%", textAlign: "center", fontFamily: "'Courier New',monospace", fontSize: 28, fontWeight: 700,
                        background: "rgba(215,212,204,0.4)", border: "1px solid rgba(26,25,23,0.2)", borderRadius: 8, padding: "12px",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)", color: "#0d0d0d", outline: "none"
                      }}
                    />
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex-shrink-0 text-slate-400 max-sm:rotate-90">
                    <ArrowRight className="w-6 h-6" />
                  </div>

                  {/* Proposed Price */}
                  <div className="flex-1 w-full text-center sm:text-left">
                    <label style={{ ...lbl, marginBottom: 8, display: "block", textAlign: "center" }}>PROPOSED PRICE ($/MO)</label>
                    <input
                      type="text"
                      value={proposed}
                      onChange={(e) => setProposed(e.target.value)}
                      style={{
                        width: "100%", textAlign: "center", fontFamily: "'Courier New',monospace", fontSize: 28, fontWeight: 700,
                        background: "rgba(255,255,255,0.6)", border: "1px solid rgba(26,25,23,0.3)", borderRadius: 8, padding: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)", color: "#0d0d0d", outline: "none"
                      }}
                    />
                  </div>
                  
                  {/* Simulate Button */}
                  <div className="flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0 sm:pt-[24px]">
                    <button
                      onClick={() => setLoading(true)}
                      style={{
                        background: "#1a1917", color: "#f7f6f2", fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif",
                        fontSize: 14, fontWeight: 500, padding: "0 28px", height: 52, borderRadius: 999, border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", width: "100%", transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#000")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1917")}
                    >
                      {loading ? "Simulating..." : "Simulate"}
                    </button>
                  </div>
                </div>

                {/* Settings Row */}
                <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 50%,transparent)", marginBottom: 20 }} />
                <div className="flex flex-wrap gap-6 justify-between px-2">
                  <div>
                    <label style={{ ...lbl, fontSize: 8, marginBottom: 4 }}>Customer Segment</label>
                    <div style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 13, color: "rgba(13,13,13,0.7)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      All Segments <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...lbl, fontSize: 8, marginBottom: 4 }}>Billing Cycle</label>
                    <div style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 13, color: "rgba(13,13,13,0.7)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      Monthly <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...lbl, fontSize: 8, marginBottom: 4 }}>Simulation Mode</label>
                    <div style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 13, color: "rgba(13,13,13,0.7)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      Balanced <ChevronDown className="w-3 h-3 opacity-60" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Image */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="pt-8 lg:pt-0 lg:mt-8 lg:-mr-12">
              <div className="relative bg-transparent flex justify-center lg:justify-end">
                <img
                  src="/pricing-forecast-control-panel.png"
                  alt="Pricing Forecast Control Panel"
                  className="w-full object-contain drop-shadow-2xl"
                  style={{ maxWidth: 880 }}
                />
              </div>
            </motion.div>
          </div>

          {/* FEATURE CARDS */}
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            {[
              { title: "Conversion Shift", desc: "See how signups may rise or fall with the new price.", Icon: Activity },
              { title: "Revenue Forecast", desc: "Estimate MRR impact across simulated customer segments.", Icon: DollarSign },
              { title: "Churn Risk", desc: "Spot whether the new price creates drop-off or resistance.", Icon: AlertTriangle },
            ].map((card, i) => (
              <div key={i} style={{ background: "#c4c1ba", border: "1.5px solid #1a1917", borderRadius: 6, padding: "16px 20px", boxShadow: "inset 1.5px 1.5px 0 rgba(255,255,255,0.4), inset -1.5px -1.5px 0 rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#d2cfc6", border: "1.5px solid #1a1917", borderRadius: "50%", flexShrink: 0, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.5)" }}>
                  <card.Icon style={{ width: 14, height: 14, color: "#1a1917", strokeWidth: 2.5 }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1a1917", marginBottom: 6 }}>{card.title}</p>
                  <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 13, color: "rgba(26,25,23,0.85)", lineHeight: 1.4, fontWeight: 500 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* REPORT PREVIEW */}
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}>
            <p style={{ ...lbl, marginBottom: 12 }}>FORECAST REPORT PREVIEW</p>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ background: "#c4c1ba", border: "2px solid #1a1917", borderRadius: 8, overflow: "hidden", boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.4), inset -2px -2px 0 rgba(0,0,0,0.15), 0 12px 24px rgba(0,0,0,0.2)" }}>
              
              {/* Left */}
              <div style={{ padding: "28px 32px", borderRight: "2px solid #1a1917", background: "rgba(0,0,0,0.04)", boxShadow: "inset -2px 0 10px rgba(0,0,0,0.05)" }}>
                <p style={{ ...lbl, color: "#1a1917", marginBottom: 24, fontSize: 11, fontWeight: 800 }}>CURRENT PLAN</p>
                <div className="space-y-5">
                  <div className="flex justify-between"><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, color: "rgba(26,25,23,0.8)", fontWeight: 600 }}>Price:</span><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 800, color: "#1a1917" }}>$29</span></div>
                  <div className="flex justify-between"><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, color: "rgba(26,25,23,0.8)", fontWeight: 600 }}>Conversion Rate:</span><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 800, color: "#1a1917" }}>6.2%</span></div>
                  <div className="flex justify-between"><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, color: "rgba(26,25,23,0.8)", fontWeight: 600 }}>Revenue / Visitor:</span><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 800, color: "#1a1917" }}>$1.80</span></div>
                  <div className="flex justify-between"><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, color: "rgba(26,25,23,0.8)", fontWeight: 600 }}>Trust Sensitivity:</span><span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 800, color: "#1a1917" }}>Low</span></div>
                </div>
              </div>

              {/* Center (Terminal) */}
              <div style={{ padding: "28px 32px", background: "#0a0a0a", borderRight: "2px solid #1a1917", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 40px rgba(0,0,0,0.9)" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.04) 2px,rgba(255,255,255,0.04) 4px)", pointerEvents: "none" }} />
                <p style={{ ...lbl, color: "#32cd32", marginBottom: 24, fontSize: 11, fontWeight: 800, textShadow: "0 0 8px rgba(50,205,50,0.5)" }}>FUTURE PROJECTION</p>
                <div className="space-y-5" style={{ fontFamily: "'Courier New',monospace", color: "#32cd32", textShadow: "0 0 6px rgba(50,205,50,0.4)" }}>
                  <div className="flex justify-between"><span style={{ fontSize: 13, opacity: 0.9 }}>Proposed Price:</span><span style={{ fontSize: 13, fontWeight: 800 }}>$49</span></div>
                  <div className="flex justify-between"><span style={{ fontSize: 13, opacity: 0.9 }}>Conversion Delta:</span><span style={{ fontSize: 13, fontWeight: 800 }}>-1.4%</span></div>
                  <div className="flex justify-between"><span style={{ fontSize: 13, opacity: 0.9 }}>Revenue Delta:</span><span style={{ fontSize: 13, fontWeight: 800 }}>+18%</span></div>
                  <div className="flex justify-between"><span style={{ fontSize: 13, opacity: 0.9 }}>Confidence:</span><span style={{ fontSize: 13, fontWeight: 800 }}>67%</span></div>
                  <div className="pt-4 mt-4 border-t border-[#32cd32]/30 text-xs font-bold text-[#32cd32]/90">
                    &gt; Recommendation: Recommended with caution
                  </div>
                </div>
              </div>

              {/* Right */}
              <div style={{ padding: "28px 32px", background: "rgba(0,0,0,0.04)", boxShadow: "inset 2px 0 10px rgba(0,0,0,0.05)" }}>
                <p style={{ ...lbl, color: "#1a1917", marginBottom: 24, fontSize: 11, fontWeight: 800 }}>GHOST SEGMENT REACTIONS</p>
                <div className="space-y-6">
                  <div><span style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "rgba(26,25,23,0.8)", fontWeight: 600, display: "block", marginBottom: 4 }}>Price-sensitive users:</span><span style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 14, fontWeight: 600, color: "#1a1917" }}>Strong resistance</span></div>
                  <div><span style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "rgba(26,25,23,0.8)", fontWeight: 600, display: "block", marginBottom: 4 }}>High-intent users:</span><span style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 14, fontWeight: 600, color: "#1a1917" }}>Moderate acceptance</span></div>
                  <div><span style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "rgba(26,25,23,0.8)", fontWeight: 600, display: "block", marginBottom: 4 }}>Enterprise buyers:</span><span style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 14, fontWeight: 600, color: "#1a1917" }}>Positive value alignment</span></div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* FOOTER ROW */}
          <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-black/10 pt-6" style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" /> System online
            </div>
            <div>Need help? hello@ghostcustomer.ai</div>
            <div>Last simulation: Never</div>
          </div>

        </div>
      </main>
    </>
  );
}

