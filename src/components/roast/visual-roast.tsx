"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Loader2,
  Eye,
  Crosshair,
  Flame,
  SquareDashedMousePointer,
  ArrowRight,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { VisionRoast } from "@/lib/types";
import { HeatmapOverlay, regionsToHeatmap } from "@/components/roast/heatmap-overlay";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const SAMPLES = ["stripe.com", "linear.app", "notion.so", "vercel.com", "figma.com"];

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/roast", label: "UI Roast" },
  { href: "/arena", label: "Battle Arena" },
  { href: "/pricing-lab", label: "Pricing Lab" },
];

const SEV: Record<string, { c: string; label: string }> = {
  high: { c: "#fb7185", label: "High friction" },
  medium: { c: "#fbbf24", label: "Medium" },
  low: { c: "#d6d6da", label: "Minor" },
};

const FEATURE_CARDS = [
  {
    id: "visual-clarity",
    label: "VISUAL CLARITY",
    desc: "Checks if your message is clear within 3 seconds.",
    link: "Learn more →",
    Icon: Eye,
  },
  {
    id: "cta-focus",
    label: "CTA FOCUS",
    desc: "Evaluates button visibility, placement, and impact.",
    link: "Learn more →",
    Icon: Target,
  },
  {
    id: "friction-zones",
    label: "FRICTION ZONES",
    desc: "Finds confusing areas where users hesitate or drop off.",
    link: "Learn more →",
    Icon: Zap,
  },
];

const ROAST_PREVIEW_NOTES = [
  { n: "01", title: "Hero message is unclear", desc: "The value prop isn't instantly obvious." },
  { n: "02", title: "CTA blends into the background", desc: "Low contrast and not visually dominant." },
  { n: "03", title: "Pricing link is hard to notice", desc: "Important navigation is getting ignored." },
  { n: "04", title: "Trust signals missing above fold", desc: "No logos, testimonials, or credibility cues." },
];

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

// ─── CRT monitor — uses user's cinematic image, no text overlay ──────────────
function CRTVisionMonitor() {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", width: "100%", borderRadius: 8, overflow: "hidden", boxShadow: "0 32px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.08)" }}>
        <Image
          src="/new-image.jpeg"
          alt="Ghost Vision System — AI vision terminal CRT monitor"
          width={900}
          height={900}
          style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
          priority
        />
        {/* Soft vignette to blend into the page background */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 100% at 50% 50%,transparent 52%,rgba(0,0,0,0.28) 100%)", pointerEvents: "none" }} />
      </div>

      {/* Label strip below the image */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, padding: "0 4px" }}>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: "rgba(13,13,13,0.7)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>GHOST VISION SYSTEM</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Courier New',monospace", fontSize: 9, color: "rgba(13,13,13,0.7)", letterSpacing: "0.12em", fontWeight: 600 }}>
          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "rgba(100,200,80,0.85)", boxShadow: "0 0 4px rgba(100,200,80,0.65)", animation: "gc-blink-block 2s ease-in-out infinite" }} />
          ACTIVE
        </span>
      </div>
    </div>
  );
}


// ─── Roast preview placeholder ────────────────────────────────────────────────
function RoastPreview() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
      {/* Screenshot placeholder */}
      <div style={{
        background: "rgba(20,18,16,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6,
        overflow: "hidden", minHeight: 260,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 48px -12px rgba(0,0,0,0.5)",
      }}>
        {/* Mock browser bar */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ display: "block", width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />)}
          <span style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginLeft: 8 }} />
        </div>
        {/* Mock page content */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Fake nav */}
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            {[60, 40, 40, 50].map((w, i) => <span key={i} style={{ height: 6, width: w, background: "rgba(255,255,255,0.08)", borderRadius: 3 }} />)}
          </div>
          {/* Hero area */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: 16 }}>
            <div style={{ height: 20, width: "70%", background: "rgba(255,255,255,0.14)", borderRadius: 3, marginBottom: 8 }} />
            <div style={{ height: 20, width: "55%", background: "rgba(255,255,255,0.14)", borderRadius: 3, marginBottom: 12 }} />
            <div style={{ height: 12, width: "80%", background: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 6 }} />
            <div style={{ height: 12, width: "65%", background: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ height: 28, width: 80, background: "rgba(255,255,255,0.18)", borderRadius: 14 }} />
              <span style={{ height: 28, width: 60, background: "rgba(255,255,255,0.06)", borderRadius: 14 }} />
            </div>
          </div>
          {/* Feature strips */}
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: 48, background: "rgba(255,255,255,0.04)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        </div>

        {/* Annotation overlays */}
        {ROAST_PREVIEW_NOTES.slice(0, 3).map((_, i) => (
          <div key={i}
            style={{
              position: "absolute",
              top: `${[32, 48, 60][i]}%`,
              left: `${[10, 30, 15][i]}%`,
              width: `${[40, 35, 45][i]}%`,
              height: `${[12, 8, 10][i]}%`,
              border: "1.5px solid rgba(251,113,133,0.55)",
              background: "rgba(251,113,133,0.06)",
              borderRadius: 3,
            }}
          >
            <span style={{ position: "absolute", top: -8, left: -8, display: "grid", width: 16, height: 16, placeItems: "center", borderRadius: "50%", background: "rgba(251,113,133,0.85)", fontFamily: "'Courier New',monospace", fontSize: 8, color: "#0d0d0d", fontWeight: 700 }}>{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Notes panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ROAST_PREVIEW_NOTES.map((note) => (
          <div key={note.n} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "rgba(232,229,221,0.55)", border: "1px solid rgba(26,25,23,0.1)", borderRadius: 6, boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10, fontWeight: 700, color: "rgba(13,13,13,0.6)", letterSpacing: "0.06em", flexShrink: 0, marginTop: 2 }}>{note.n}</span>
            <div>
              <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 13, fontWeight: 600, color: "#0d0d0d", marginBottom: 3 }}>{note.title}</p>
              <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 11, color: "rgba(13,13,13,0.85)", lineHeight: 1.5 }}>{note.desc}</p>
            </div>
          </div>
        ))}

        {/* Preview CTA */}
        <div style={{ padding: "14px 16px", background: "rgba(232,229,221,0.35)", border: "1px solid rgba(26,25,23,0.08)", borderRadius: 6 }}>
          <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 12, color: "rgba(13,13,13,0.85)", lineHeight: 1.5, marginBottom: 12 }}>
            This is just a preview. Run a full roast to get the complete analysis with annotated screenshot and actionable fixes.
          </p>
          <button style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 13, fontWeight: 500, color: "#fff", background: "#0d0d0d", border: "1px solid #0d0d0d", borderRadius: 999, padding: "9px 20px", cursor: "pointer" }}>
            Run full roast
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function VisualRoast() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VisionRoast | null>(null);
  const [view, setView] = useState<"annotated" | "heatmap">("annotated");

  const heatmapPoints = useMemo(() => (result ? regionsToHeatmap(result.regions) : []), [result]);

  async function roast(target: string) {
    if (!target.trim()) return;
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/vision-roast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: target }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Roast failed");
      setResult(data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  // Shared label style
  const lbl: React.CSSProperties = {
    fontFamily: "'Courier New',monospace", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,13,13,0.85)",
    marginBottom: 8, display: "block",
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
        #vision-terminal [data-scroll]::-webkit-scrollbar { display:none; }
      `}</style>

      {/* ── Page shell ── */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>

        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(100px,14vw,128px) 32px 64px" }}>

          {/* ════════════════════════════════════════════════
              Hero — 2-column
          ═══════════════════════════════════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: 32, alignItems: "start" }}>

            {/* LEFT — Control panel */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <div style={{
                background: "rgba(232,229,221,0.62)", border: "1px solid rgba(26,25,23,0.13)", borderRadius: 8,
                padding: "clamp(24px,3vw,36px)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset,0 20px 60px -20px rgba(0,0,0,0.2)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              }}>
                {/* Label */}
                <p style={{ ...lbl, marginBottom: 10 }}>AI Vision Roast</p>

                {/* Heading */}
                <h1 style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 500, color: "#0d0d0d", letterSpacing: "-0.03em", lineHeight: 1.12, marginBottom: 14 }}>
                  Let an AI customer<br />look at your page.
                </h1>

                {/* Body */}
                <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 14, color: "rgba(13,13,13,0.7)", lineHeight: 1.6, marginBottom: 28 }}>
                  We screenshot your site and a Gemini-vision &quot;ghost&quot; tells you where its eye goes, what confuses it, and where it gets stuck — drawn right on the page.
                </p>

                <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg,rgba(0,0,0,0.12) 0%,transparent 100%)", marginBottom: 24 }} />

                <form onSubmit={(e) => { e.preventDefault(); roast(url); }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* URL input */}
                  <div>
                    <label htmlFor="roast-url" style={lbl}>Enter Website URL</label>
                    <div style={{ position: "relative" }}>
                      <Globe style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(13,13,13,0.75)", pointerEvents: "none" }} />
                      <input
                        id="roast-url"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="yourcompany.com"
                        autoFocus
                        className="placeholder:text-black/50"
                        style={{ fontFamily: "'Courier New',monospace", fontSize: 13, color: "#0d0d0d", background: "rgba(255,255,255,0.75)", border: "1px solid rgba(26,25,23,0.35)", borderRadius: 6, padding: "9px 14px 9px 36px", outline: "none", width: "100%", transition: "background 0.2s,border-color 0.2s", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* Sample pills */}
                  <div>
                    <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.75)", letterSpacing: "0.1em", marginBottom: 8, display: "block", fontWeight: 600 }}>TRY EXAMPLES</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {SAMPLES.map((s) => (
                        <button key={s} type="button" onClick={() => { setUrl(s); roast(s); }}
                          style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "rgba(13,13,13,0.9)", fontWeight: 500, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(26,25,23,0.25)", borderRadius: 999, padding: "4px 13px", cursor: "pointer", transition: "all 0.18s" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "#5c1a1a" }}>{error}</p>}

                  {/* CTAs */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, paddingTop: 4 }}>
                    <button
                      id="roast-submit-btn"
                      type="submit"
                      disabled={loading || !url.trim()}
                      style={{ flex: 1, minWidth: 150, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 14, fontWeight: 500, color: "#fff", background: "#0d0d0d", border: "1px solid #0d0d0d", borderRadius: 999, padding: "11px 24px", cursor: loading || !url.trim() ? "not-allowed" : "pointer", opacity: loading || !url.trim() ? 0.4 : 1, transition: "opacity 0.2s", letterSpacing: "-0.01em" }}
                    >
                      {loading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <span style={{ fontSize: 15 }}>◈</span>}
                      {loading ? "Looking…" : "Roast my UI"}
                    </button>
                    <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Courier New',monospace", fontSize: 12, color: "rgba(13,13,13,0.85)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.04em" }}>
                      Advanced options <span style={{ fontSize: 10 }}>▾</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>

            {/* RIGHT — Vision terminal */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}>
              <CRTVisionMonitor />
            </motion.div>
          </div>

          {/* ════════════════════════════════════════════════
              Feature cards
          ═══════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 12, marginTop: 28 }}>
            {FEATURE_CARDS.map((card) => (
              <div key={card.id} id={`feature-${card.id}`}
                style={{ background: "rgba(230,227,219,0.58)", border: "1px solid rgba(26,25,23,0.1)", borderRadius: 6, padding: "20px 20px 18px", boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,13,13,0.06)", border: "1px solid rgba(26,25,23,0.1)", borderRadius: 6, flexShrink: 0 }}>
                  <card.Icon style={{ width: 15, height: 15, color: "rgba(13,13,13,0.6)" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,13,13,0.85)", marginBottom: 6 }}>{card.label}</p>
                  <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 12, color: "rgba(13,13,13,0.85)", lineHeight: 1.5, marginBottom: 10 }}>{card.desc}</p>
                  <Link href="#" style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.75)", textDecoration: "none", transition: "color 0.18s", fontWeight: 600 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,1)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,0.75)")}>
                    {card.link}
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ════════════════════════════════════════════════
              Loading state
          ═══════════════════════════════════════════════ */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 28, padding: "24px 28px", background: "rgba(230,227,219,0.58)", border: "1px solid rgba(26,25,23,0.1)", borderRadius: 6, textAlign: "center" }}>
              <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite", color: "rgba(13,13,13,0.4)", margin: "0 auto 10px" }} />
              <p style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "rgba(13,13,13,0.58)", letterSpacing: "0.04em" }}>
                Letting the page fully load, capturing screenshot, asking the ghost to react…<br />
                <span style={{ opacity: 0.6 }}>This takes ~10–30s so we roast the real page, not a loading screen.</span>
              </p>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════
              Result
          ═══════════════════════════════════════════════ */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* First impression card */}
              <div style={{ background: "rgba(232,229,221,0.62)", border: "1px solid rgba(26,25,23,0.13)", borderRadius: 8, padding: "24px 28px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset" }}>
                <div style={{ maxWidth: 600 }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,13,13,0.55)", marginBottom: 8 }}>First Impression</p>
                  <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 17, fontWeight: 500, color: "#0d0d0d", lineHeight: 1.45 }}>"{result.roast}"</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: 38, fontWeight: 700, color: "#0d0d0d", lineHeight: 1 }}>{result.clarityScore}</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.5)", letterSpacing: "0.12em" }}>clarity / 100</p>
                </div>
              </div>

              {/* Screenshot + annotations */}
              <div style={{ background: "rgba(232,229,221,0.62)", border: "1px solid rgba(26,25,23,0.13)", borderRadius: 8, padding: "20px", boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset" }}>
                {/* View toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(26,25,23,0.15)", borderRadius: 999, padding: 3, width: "fit-content" }}>
                  {(["annotated", "heatmap"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setView(v)}
                      style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: "0.06em", color: view === v ? "#0d0d0d" : "rgba(13,13,13,0.5)", background: view === v ? "rgba(13,13,13,0.08)" : "transparent", border: view === v ? "1px solid rgba(26,25,23,0.15)" : "1px solid transparent", borderRadius: 999, padding: "5px 14px", cursor: "pointer", transition: "all 0.18s" }}>
                      {v === "annotated" ? <SquareDashedMousePointer style={{ width: 11, height: 11 }} /> : <Flame style={{ width: 11, height: 11 }} />}
                      {v === "annotated" ? "Annotated" : "Ghost Heatmap"}
                    </button>
                  ))}
                </div>

                <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: 4, border: "1px solid rgba(26,25,23,0.1)" }}>
                  {view === "heatmap" ? (
                    <HeatmapOverlay screenshotUrl={result.screenshotUrl} points={heatmapPoints} />
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result.screenshotUrl} alt="Screenshot" style={{ display: "block", width: "100%" }} />
                      {result.regions.map((r, i) => {
                        const [ymin, xmin, ymax, xmax] = r.box;
                        const sev = SEV[r.severity] ?? SEV.low;
                        return (
                          <div key={i} title={`${r.label}: ${r.why}`}
                            style={{ position: "absolute", top: `${ymin / 10}%`, left: `${xmin / 10}%`, width: `${Math.max(0, (xmax - xmin) / 10)}%`, height: `${Math.max(0, (ymax - ymin) / 10)}%`, border: `1.5px solid ${sev.c}`, background: `${sev.c}18`, borderRadius: 3 }}>
                            <span style={{ position: "absolute", top: -8, left: -8, display: "grid", width: 16, height: 16, placeItems: "center", borderRadius: "50%", background: sev.c, fontFamily: "'Courier New',monospace", fontSize: 8, fontWeight: 700, color: "#0d0d0d" }}>{i + 1}</span>
                          </div>
                        );
                      })}
                      {result.firstLook && (
                        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                          style={{ top: `${result.firstLook.y / 10}%`, left: `${result.firstLook.x / 10}%` }}>
                          <span className="absolute inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full" style={{ background: "rgba(13,13,13,0.2)" }} />
                          <Crosshair className="relative h-6 w-6 -translate-x-1/2 -translate-y-1/2 drop-shadow" style={{ color: "#0d0d0d" }} />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Legend */}
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 16px" }}>
                  {view === "annotated" ? (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.55)" }}>
                        <Crosshair style={{ width: 10, height: 10 }} /> eye lands here
                      </span>
                      {Object.values(SEV).map((s) => (
                        <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.55)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: s.c, display: "inline-block" }} /> {s.label}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "rgba(13,13,13,0.5)" }}>Hover a dot for the objection</span>
                  )}
                </div>
              </div>

              {/* Region list */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 10 }}>
                {result.regions.map((r, i) => {
                  const sev = SEV[r.severity] ?? SEV.low;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "rgba(230,227,219,0.55)", border: "1px solid rgba(26,25,23,0.1)", borderRadius: 6, boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset" }}>
                      <span style={{ display: "grid", width: 20, height: 20, placeItems: "center", borderRadius: "50%", background: sev.c, fontFamily: "'Courier New',monospace", fontSize: 8, fontWeight: 700, color: "#0d0d0d", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 13, fontWeight: 500, color: "#0d0d0d", marginBottom: 3 }}>{r.label}</p>
                        <p style={{ fontFamily: "var(--font-heading),'Helvetica Neue',Arial,sans-serif", fontSize: 11, color: "rgba(13,13,13,0.62)", lineHeight: 1.5 }}>{r.why}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════
              Roast preview (shown when no result yet)
          ═══════════════════════════════════════════════ */}
          {!result && !loading && (
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
              style={{ marginTop: 28 }}>
              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <p style={{ fontFamily: "'Courier New',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(13,13,13,0.85)" }}>Roast Preview</p>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(0,0,0,0.18) 0%,transparent 100%)" }} />
              </div>
              <div style={{ background: "rgba(232,229,221,0.62)", border: "1px solid rgba(26,25,23,0.13)", borderRadius: 8, padding: "24px", boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset", position: "relative" }}>
                <RoastPreview />
              </div>
            </motion.div>
          )}

          {/* ── Footer ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 36, paddingTop: 18, borderTop: "1px solid rgba(26,25,23,0.12)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, fontFamily: "'Courier New',monospace", fontSize: 11, color: "rgba(13,13,13,0.85)", letterSpacing: "0.06em", fontWeight: 500 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "rgba(13,13,13,0.75)" }} />
                System online
              </span>
              <span>Need help? <a href="mailto:hello@ghostcustomer.ai" style={{ color: "rgba(13,13,13,1)", textDecoration: "underline", textUnderlineOffset: 3 }}>hello@ghostcustomer.ai</a></span>
              <span>Last run: Never</span>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
