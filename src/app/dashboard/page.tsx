"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp,
  Settings2,
  Info,
  AlertTriangle,
  Ghost,
  ShieldCheck,
  Tag,
  FileText,
} from "lucide-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type SwarmSize = 60 | 120 | 250 | 500;
type SimMode = "Standard" | "Deep Scan" | "Adversarial";

// ─── Nav data (matches landing page) ─────────────────────────────────────────
const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/roast",     label: "UI Roast"    },
  { href: "/arena",     label: "Battle Arena" },
  { href: "/pricing-lab", label: "Pricing Lab" },
];

const SWARM_SIZES: SwarmSize[] = [60, 120, 250, 500];
const SIM_MODES:  SimMode[]   = ["Standard", "Deep Scan", "Adversarial"];

// ─── Terminal log lines ────────────────────────────────────────────────────────
const TERMINAL_LINES: { text: string; delay: number; dim?: boolean; head?: boolean }[] = [
  { text: "GHOST SIMULATION TERMINAL v1.0",   delay: 0,    head: true },
  { text: "> Initializing swarm...",           delay: 320  },
  { text: "> 120 ghosts ready",               delay: 700  },
  { text: "> Entering site: yourcompany.com", delay: 1080 },
  { text: "> Scanning landing page...",        delay: 1440 },
  { text: "",                                 delay: 1640, dim: true },
  { text: "> Analyzing hero section... OK",   delay: 1900 },
  { text: "> Checking value clarity... MEDIUM",delay: 2340 },
  { text: "> Pricing friction detected",       delay: 2760 },
  { text: "> UI confusion: MEDIUM",           delay: 3140 },
  { text: "> Trust signals: LOW",             delay: 3500 },
  { text: "> CTAs found: 2",                  delay: 3840 },
  { text: "> Conversion leak: 32%",           delay: 4200 },
  { text: "",                                 delay: 4400, dim: true },
  { text: "> Generating ghost notes...",       delay: 4800 },
  { text: "> Simulation in progress...",       delay: 5400 },
];

// ─── Insight cards ────────────────────────────────────────────────────────────
const INSIGHT_CARDS = [
  {
    id: "conversion-leak",
    label: "CONVERSION LEAK",
    value: "32%",
    sub: "● High",
    desc: "Estimated conversions slipping away due to friction and confusion.",
    link: "View full analysis →",
    href: "#",
    Icon: AlertTriangle,
  },
  {
    id: "ui-confusion",
    label: "UI CONFUSION",
    value: "Medium",
    sub: "● Issue level",
    desc: "Users are moderately confused by layout and flow.",
    link: "View heatmap →",
    href: "#",
    Icon: Ghost,
  },
  {
    id: "trust-score",
    label: "TRUST SCORE",
    value: "42 / 100",
    sub: "● Low",
    desc: "Better trust signals could significantly lift conversions.",
    link: "See trust breakdown →",
    href: "#",
    Icon: ShieldCheck,
  },
  {
    id: "pricing-friction",
    label: "PRICING FRICTION",
    value: "High",
    sub: "● Impact",
    desc: "Pricing clarity and value alignment need immediate attention.",
    link: "View pricing roast →",
    href: "#",
    Icon: Tag,
  },
  {
    id: "ghost-notes",
    label: "GHOST NOTES",
    value: "12",
    sub: "● Key insights",
    desc: "AI-generated notes from real (ghost) user behavior.",
    link: "Read all notes →",
    href: "#",
    Icon: FileText,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Animated film-grain canvas (matches loading-screen.tsx exactly)
// ═══════════════════════════════════════════════════════════════════════════════
function FilmGrainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    function drawGrain() {
      if (!canvas || !ctx) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i]     = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = Math.random() * 28; // slightly more visible than loader
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(drawGrain);
    }

    drawGrain();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        mixBlendMode: "multiply",
        opacity: 0.48,
      }}
    />
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Realistic Terminal Panel (replaces cartoon CRT)
// ═══════════════════════════════════════════════════════════════════════════════
function TerminalPanel() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    TERMINAL_LINES.forEach((line, idx) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, idx]);
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      }, line.delay + 600); // slight stagger so panel animates in first
    });
  }, []);

  return (
    <div
      id="terminal-panel"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        // Slightly darker than the page, like a heavy recessed instrument panel
        background: "linear-gradient(180deg, #1a1916 0%, #141310 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.5), 0 24px 64px -16px rgba(0,0,0,0.55)",
        borderRadius: 6,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Muted status dots */}
          {["rgba(255,255,255,0.12)", "rgba(255,255,255,0.12)", "rgba(255,255,255,0.12)"].map((c, i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          GHOST SIMULATION TERMINAL
        </span>
        <span
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.1em",
          }}
        >
          v1.0
        </span>
      </div>

      {/* Scanlines overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.14) 2px, rgba(0,0,0,0.14) 4px)",
          pointerEvents: "none",
          zIndex: 10,
          animation: "gc-scan-drift 12s linear infinite",
        }}
      />

      {/* Phosphor glow layer */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(180,255,130,0.025) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Terminal text area */}
      <div
        ref={scrollRef}
        style={{
          padding: "20px 20px 24px",
          minHeight: 340,
          maxHeight: 380,
          overflowY: "auto",
          position: "relative",
          zIndex: 6,
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          #terminal-panel [data-scroll]::-webkit-scrollbar { display: none; }
          @keyframes gc-scan-drift {
            0%   { background-position: 0 0; }
            100% { background-position: 0 40px; }
          }
          @keyframes gc-blink-block {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0; }
          }
        `}</style>

        {TERMINAL_LINES.map((line, idx) => {
          const visible = visibleLines.includes(idx);
          if (!visible) return null;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "clamp(11px, 1.4vw, 12.5px)",
                lineHeight: 1.75,
                letterSpacing: "0.025em",
                color: line.head
                  ? "rgba(200,255,160,0.88)"
                  : line.dim
                    ? "transparent"
                    : "rgba(175,240,120,0.72)",
                textShadow: line.head
                  ? "0 0 10px rgba(180,255,120,0.45)"
                  : line.dim
                    ? "none"
                    : "0 0 7px rgba(160,230,100,0.28)",
                marginBottom: line.head ? 10 : 0,
                fontWeight: line.head ? 700 : 400,
              }}
            >
              {line.text || "\u00A0"}
              {/* Blinking cursor on last line */}
              {idx === TERMINAL_LINES.length - 1 && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: "0.85em",
                    background: "rgba(180,255,120,0.8)",
                    marginLeft: 3,
                    verticalAlign: "middle",
                    animation: "gc-blink-block 0.9s step-end infinite",
                    boxShadow: "0 0 5px rgba(180,255,120,0.5)",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom status strip */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          SIMULATION IN PROGRESS
        </span>
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(180,255,120,0.65)",
            boxShadow: "0 0 5px rgba(180,255,120,0.5)",
            animation: "gc-blink-block 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main dashboard page
// ═══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router     = useRouter();
  const [url,          setUrl]         = useState("");
  const [competitorUrl,setCompetitor]  = useState("");
  const [pricingUrl,   setPricing]     = useState("");
  const [currentPrice, setPrice]       = useState("");
  const [count,        setCount]       = useState<SwarmSize>(120);
  const [simMode,      setSimMode]     = useState<SimMode>("Standard");
  const [advanced,     setAdvanced]    = useState(false);
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState("");

  async function launch(targetUrl: string, opts?: { isDemo?: boolean }) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          competitorUrl:  opts?.isDemo ? undefined : competitorUrl || undefined,
          pricingUrl:     opts?.isDemo ? undefined : pricingUrl    || undefined,
          personaCount:   opts?.isDemo ? 250 : count,
          currentPrice:   opts?.isDemo ? undefined : currentPrice ? Number(currentPrice) : undefined,
          isDemo:         opts?.isDemo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create run");
      sessionStorage.setItem(`ghost:pending:${data.runId}`, JSON.stringify(data.config));
      router.push(`/simulation/${data.runId}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  // Shared styles for pill inputs/buttons
  const pillInput: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 13,
    color: "#0d0d0d",
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(26,25,23,0.25)",
    borderRadius: 6,
    padding: "9px 14px",
    outline: "none",
    width: "100%",
    transition: "background 0.2s, border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(13,13,13,0.65)",
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  };

  return (
    <AuthGate subtitle="Create a free account or sign in to launch the customer swarm, run UI Roasts, and save your reports.">

      {/* ── Background: matches loading-screen exactly ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundColor: "#c4c1ba",
          backgroundImage:
            "radial-gradient(ellipse 150% 150% at 50% 46%, #ccc9c2 0%, #bcb9b2 52%, #aaa79f 100%)",
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          background:
            "radial-gradient(ellipse 110% 110% at 50% 50%, transparent 38%, rgba(0,0,0,0.28) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Scanlines */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none",
          animation: "gc-scan-drift 14s linear infinite",
        }}
      />

      {/* Film grain canvas */}
      <FilmGrainCanvas />

      {/* Corner marks (like loader) */}
      {(["tl","tr","bl","br"] as const).map((pos) => (
        <div
          key={pos}
          aria-hidden="true"
          style={{
            position: "fixed",
            zIndex: 4,
            width: 18,
            height: 18,
            pointerEvents: "none",
            opacity: 0.3,
            ...(pos === "tl" ? { top: 20, left: 20, borderTop: "1.5px solid #1a1917", borderLeft: "1.5px solid #1a1917" }  : {}),
            ...(pos === "tr" ? { top: 20, right: 20, borderTop: "1.5px solid #1a1917", borderRight: "1.5px solid #1a1917" } : {}),
            ...(pos === "bl" ? { bottom: 20, left: 20, borderBottom: "1.5px solid #1a1917", borderLeft: "1.5px solid #1a1917" }  : {}),
            ...(pos === "br" ? { bottom: 20, right: 20, borderBottom: "1.5px solid #1a1917", borderRight: "1.5px solid #1a1917" } : {}),
          }}
        />
      ))}

      {/* ── Global style injections ── */}
      <style>{`
        @keyframes gc-scan-drift {
          0%   { background-position: 0 0;    }
          100% { background-position: 0 40px; }
        }
        @keyframes gc-blink-block {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>

      {/* ── Page shell ── */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>

        {/* ── Main content ── */}
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "clamp(100px, 14vw, 128px) 32px 64px",
          }}
        >

          {/* ── 2-column hero layout ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
              gap: 32,
              alignItems: "start",
            }}
          >

            {/* ── LEFT: Simulation control panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                id="simulation-control-panel"
                style={{
                  background: "rgba(232,229,221,0.62)",
                  border: "1px solid rgba(26,25,23,0.13)",
                  borderRadius: 8,
                  padding: "clamp(24px, 3vw, 36px)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.55) inset, 0 20px 60px -20px rgba(0,0,0,0.2)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                {/* SIMULATION CONTROL label */}
                <p style={labelStyle}>
                  Simulation Control
                </p>

                {/* Heading */}
                <h1
                  style={{
                    fontFamily: "var(--font-heading), 'Helvetica Neue', Arial, sans-serif",
                    fontSize: "clamp(22px, 3vw, 30px)",
                    fontWeight: 500,
                    color: "#0d0d0d",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.18,
                    marginBottom: 10,
                  }}
                >
                  Run a customer swarm
                </h1>

                {/* Support text */}
                <p
                  style={{
                    fontFamily: "var(--font-heading), 'Helvetica Neue', Arial, sans-serif",
                    fontSize: 14,
                    color: "rgba(13,13,13,0.72)",
                    lineHeight: 1.55,
                    marginBottom: 28,
                  }}
                >
                  Drop in a website. Unleash hundreds of ghost customers to reveal what&apos;s quietly costing you conversions.
                </p>

                {/* Thin rule */}
                <div
                  style={{
                    width: "100%",
                    height: 1,
                    background: "linear-gradient(90deg, rgba(0,0,0,0.12) 0%, transparent 100%)",
                    marginBottom: 24,
                  }}
                />

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (url.trim()) launch(url.trim());
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: 22 }}
                >
                  {/* URL Input */}
                  <div id="website-url-section">
                    <label htmlFor="sim-url" style={labelStyle}>
                      Website URL
                    </label>
                    <div style={{ position: "relative" }}>
                      <Globe
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 14,
                          height: 14,
                          color: "rgba(13,13,13,0.5)",
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        id="sim-url"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="yourcompany.com"
                        autoFocus
                        style={{ ...pillInput, paddingLeft: 36 }}
                      />
                    </div>
                  </div>

                  {/* Ghost Swarm Size */}
                  <div id="swarm-size-section">
                    <div style={labelStyle}>
                      Ghost Swarm Size
                      <Info style={{ width: 10, height: 10, opacity: 0.5 }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {SWARM_SIZES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          id={`swarm-size-${s}`}
                          onClick={() => setCount(s)}
                          style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: 12,
                            fontWeight: count === s ? 700 : 500,
                            color: count === s ? "#fff" : "rgba(13,13,13,0.75)",
                            background: count === s ? "#0d0d0d" : "rgba(255,255,255,0.55)",
                            border: count === s ? "1px solid #0d0d0d" : "1px solid rgba(26,25,23,0.25)",
                            borderRadius: 999,
                            padding: "6px 16px",
                            cursor: "pointer",
                            transition: "all 0.18s",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {s} ghosts
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulation Mode */}
                  <div id="sim-mode-section">
                    <div style={labelStyle}>
                      Simulation Mode
                      <Info style={{ width: 10, height: 10, opacity: 0.5 }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {SIM_MODES.map((m) => (
                        <button
                          key={m}
                          type="button"
                          id={`sim-mode-${m.toLowerCase().replace(/\s+/g, "-")}`}
                          onClick={() => setSimMode(m)}
                          style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: 12,
                            fontWeight: simMode === m ? 700 : 500,
                            color: simMode === m ? "#fff" : "rgba(13,13,13,0.75)",
                            background: simMode === m ? "#0d0d0d" : "rgba(255,255,255,0.55)",
                            border: simMode === m ? "1px solid #0d0d0d" : "1px solid rgba(26,25,23,0.25)",
                            borderRadius: 999,
                            padding: "6px 16px",
                            cursor: "pointer",
                            transition: "all 0.18s",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced options row */}
                  <div
                    id="advanced-options-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(26,25,23,0.08)",
                      paddingTop: 16,
                    }}
                  >
                    <button
                      type="button"
                      id="advanced-options-toggle"
                      onClick={() => setAdvanced((v) => !v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: 12,
                        color: "rgba(13,13,13,0.62)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        letterSpacing: "0.04em",
                        transition: "color 0.18s",
                      }}
                    >
                      {advanced ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                      Advanced options
                    </button>
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: 11,
                        color: "rgba(13,13,13,0.52)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        letterSpacing: "0.06em",
                      }}
                    >
                      Configure settings <Settings2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>

                  {/* Advanced fields */}
                  <AnimatePresence>
                    {advanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          {[
                            { id: "comp-url",       label: "Competitor URL",     val: competitorUrl, set: setCompetitor, ph: "competitor.com" },
                            { id: "pricing-url",    label: "Pricing Page URL",   val: pricingUrl,    set: setPricing,    ph: "yourcompany.com/pricing" },
                            { id: "current-price",  label: "Current Price ($/mo)", val: currentPrice, set: setPrice, ph: "29", type: "number" },
                          ].map((f) => (
                            <div key={f.id} style={{ gridColumn: f.id === "current-price" ? "span 1" : undefined }}>
                              <label htmlFor={f.id} style={labelStyle}>{f.label}</label>
                              <input
                                id={f.id}
                                type={f.type || "text"}
                                value={f.val}
                                onChange={(e) => f.set(e.target.value)}
                                placeholder={f.ph}
                                style={pillInput}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
                  {error && (
                    <p
                      style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: 12,
                        color: "#5c1a1a",
                        marginTop: -8,
                      }}
                    >
                      {error}
                    </p>
                  )}

                  {/* CTA buttons — landing-page pill style */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, paddingTop: 4 }}>
                    <button
                      id="run-simulation-btn"
                      type="submit"
                      disabled={loading || !url.trim()}
                      style={{
                        flex: 1,
                        minWidth: 160,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontFamily: "var(--font-heading), 'Helvetica Neue', Arial, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#fff",
                        background: "#0d0d0d",
                        border: "1px solid #0d0d0d",
                        borderRadius: 999,
                        padding: "11px 28px",
                        cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                        opacity: loading || !url.trim() ? 0.4 : 1,
                        transition: "opacity 0.2s",
                        letterSpacing: "-0.01em",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {loading
                        ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                        : <span style={{ fontSize: 15 }}>✦</span>}
                      {loading ? "Launching swarm…" : "Run simulation"}
                    </button>

                    <button
                      id="speed-run-demo-btn"
                      type="button"
                      disabled={loading}
                      onClick={() => launch("stripe.com", { isDemo: true })}
                      title="Bulletproof offline demo — seeded Stripe data, no network needed"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        fontFamily: "var(--font-heading), 'Helvetica Neue', Arial, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "rgba(13,13,13,0.7)",
                        background: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(26,25,23,0.16)",
                        borderRadius: 999,
                        padding: "11px 24px",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.4 : 1,
                        transition: "background 0.2s, border-color 0.2s",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Zap style={{ width: 13, height: 13 }} />
                      Speed Run Demo
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>

            {/* ── RIGHT: Terminal panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              style={{ width: "100%" }}
            >
              <TerminalPanel />
            </motion.div>
          </div>

          {/* ── Insight cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
            id="insight-cards"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
              gap: 12,
              marginTop: 28,
            }}
          >
            {INSIGHT_CARDS.map((card) => (
              <div
                key={card.id}
                id={`insight-${card.id}`}
                style={{
                  background: "rgba(230,227,219,0.58)",
                  border: "1px solid rgba(26,25,23,0.1)",
                  borderRadius: 6,
                  padding: "18px 18px 16px",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset",
                  transition: "background 0.2s, border-color 0.2s",
                  backdropFilter: "blur(4px)",
                }}
              >
                {/* Label */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(13,13,13,0.62)",
                    }}
                  >
                    {card.label}
                  </span>
                  <Info style={{ width: 9, height: 9, color: "rgba(13,13,13,0.35)", flexShrink: 0 }} />
                </div>

                {/* Value + icon */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-heading), 'Helvetica Neue', Arial, sans-serif",
                      fontSize: "clamp(19px, 2.5vw, 24px)",
                      fontWeight: 500,
                      color: "#0d0d0d",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {card.value}
                  </span>
                  <card.Icon
                    style={{
                      width: 22,
                      height: 22,
                      color: "rgba(13,13,13,0.28)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                </div>

                {/* Sub label */}
                <p
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 10,
                    color: "rgba(13,13,13,0.65)",
                    marginBottom: 8,
                    letterSpacing: "0.02em",
                  }}
                >
                  {card.sub}
                </p>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "var(--font-heading), 'Helvetica Neue', Arial, sans-serif",
                    fontSize: 11,
                    color: "rgba(13,13,13,0.62)",
                    lineHeight: 1.5,
                    marginBottom: 12,
                  }}
                >
                  {card.desc}
                </p>

                {/* Link */}
                <Link
                  href={card.href}
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 10,
                    color: "rgba(13,13,13,0.55)",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                    transition: "color 0.18s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,0.9)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,0.55)")}
                >
                  {card.link}
                </Link>
              </div>
            ))}
          </motion.div>

          {/* ── Footer status bar ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            id="dashboard-footer"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 28,
              paddingTop: 18,
              borderTop: "1px solid rgba(26,25,23,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 20,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                color: "rgba(13,13,13,0.58)",
                letterSpacing: "0.06em",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "rgba(13,13,13,0.55)",
                  }}
                />
                System online
              </span>
              <span>Last run: Never</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                color: "rgba(13,13,13,0.58)",
                letterSpacing: "0.04em",
              }}
            >
              Need help?
              <a
                href="mailto:hello@ghostcustomer.ai"
                style={{
                  color: "rgba(13,13,13,0.7)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  transition: "color 0.18s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,1)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(13,13,13,0.7)")}
              >
                hello@ghostcustomer.ai
              </a>
            </div>
          </motion.div>

        </div>
      </div>

      {/* @keyframes for loader spin (for Loader2) */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

    </AuthGate>
  );
}
