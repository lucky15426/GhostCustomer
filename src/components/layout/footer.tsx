"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

export function Footer() {
  const [lastScan, setLastScan] = useState("2026.06.30 12:44:18 UTC");

  useEffect(() => {
    // Set a static or current timestamp for realism
    setLastScan("2026.06.30 12:44:18 UTC");
  }, []);

  return (
    <footer className="footer-retro relative px-8 py-10 text-black overflow-hidden z-10 no-print">
      
      {/* ── Atmospheric Background Styles ── */}
      <style>{`
        .footer-retro {
          position: relative;
          overflow: hidden;
          border-top: 1.5px solid rgba(0, 0, 0, 0.16);
          border-bottom: 1.5px solid rgba(0, 0, 0, 0.16);
          background:
            radial-gradient(circle at 75% 35%, rgba(255, 255, 255, 0.35), transparent 35%),
            radial-gradient(circle at 20% 70%, rgba(0, 0, 0, 0.08), transparent 42%),
            linear-gradient(180deg, #dedbd2 0%, #d2cfc6 100%);
          max-height: 440px;
        }

        .footer-retro::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.07;
          background-image:
            repeating-linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.18) 0px,
              rgba(0, 0, 0, 0.18) 1px,
              transparent 1px,
              transparent 5px
            );
          mix-blend-mode: multiply;
          z-index: 1;
        }

        .footer-retro::after {
          content: "";
          position: absolute;
          right: 12%;
          top: 10%;
          width: 360px;
          height: 260px;
          pointer-events: none;
          opacity: 0.05;
          filter: blur(20px);
          background:
            radial-gradient(circle at center, rgba(0, 0, 0, 0.35), transparent 65%);
          z-index: 1;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.9); }
        }
        .footer-status-dot {
          animation: pulse-dot 1.8s infinite ease-in-out;
        }
        .footer-link-hover {
          transition: text-shadow 0.15s ease-in-out, opacity 0.15s ease-in-out;
        }
        .footer-link-hover:hover {
          text-shadow: 
            1.5px 0 rgba(0, 0, 0, 0.55), 
            -1.5px 0 rgba(255, 255, 255, 0.65);
          opacity: 1;
        }
      `}</style>

      {/* ── Film Grain Overlay (Beige concrete texture noise) ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025] mix-blend-overlay z-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Faint Technical Blueprint - Logo Watermark (No TV/CRT frame) ── */}
      <div 
        className="absolute pointer-events-none z-0 select-none opacity-[0.07] transition-opacity"
        style={{
          right: "22%",
          top: "46%",
          transform: "translateY(-50%)",
          width: "220px",
          height: "220px",
        }}
      >
        <img 
          src="/ghost.png" 
          alt="Ghost Watermark"
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{
            filter: "brightness(0)", // Force to dark silhouette so it is visible on concrete beige
          }}
        />
      </div>



      {/* ── Strong Corner Brackets ── */}
      {(["tl", "tr", "bl", "br"] as const).map((pos) => (
        <div
          key={pos}
          aria-hidden="true"
          className="absolute w-4 h-4 pointer-events-none opacity-45 border-black z-20"
          style={{
            ...(pos === "tl" ? { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 } : {}),
            ...(pos === "tr" ? { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 } : {}),
            ...(pos === "bl" ? { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 } : {}),
            ...(pos === "br" ? { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 } : {}),
          }}
        />
      ))}

      {/* ── Footer Columns Container ── */}
      <div className="relative max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1px_0.8fr_1px_1fr] gap-8 md:gap-4 items-stretch mb-10">
          
          {/* LEFT COLUMN: Brand & Description */}
          <div className="flex flex-col space-y-4 pr-4">
            <div>
              {/* Bracketed theme label */}
              <div 
                className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-black/60 mb-2 inline-block font-semibold"
                style={{ letterSpacing: "0.22em" }}
              >
                [ MULTI-AGENT CUSTOMER SIMULATION ]
              </div>
              <h2 className="text-[24px] md:text-[26px] font-sans font-semibold tracking-tight text-black leading-none" style={{ letterSpacing: "-0.04em" }}>
                GhostCustomer <span className="inline-block origin-center scale-90 text-black/75">✶</span>
              </h2>
            </div>
            
            <p className="text-[13px] md:text-[14px] text-black/75 font-sans leading-relaxed max-w-xs">
              Simulate customers before reality does. Find gaps, conversion leaks, and UX friction instantly.
            </p>

            {/* Retro prediction statement box */}
            <div className="border border-black/15 bg-black/[0.03] px-3.5 py-2.5 rounded font-mono text-[9px] tracking-wider text-black/70 w-fit flex items-start gap-2 mt-5">
              <span className="h-1.5 w-1.5 rounded-full bg-black/50 mt-1 animate-pulse shrink-0" />
              <span>SYSTEM DESIGNED TO PREDICT.<br />NOT JUST ANALYTICS.</span>
            </div>
          </div>

          {/* Divider Line 1: Circuit styled divider with notch */}
          <div className="hidden md:flex flex-col items-center py-2 opacity-20">
            <svg width="2" height="100%" viewBox="0 0 2 120" fill="none" className="stroke-black flex-1" preserveAspectRatio="none">
              <path d="M1 0 L1 45 L0 50 L0 70 L1 75 L1 120" strokeWidth="1.5" />
            </svg>
          </div>

          {/* CENTER COLUMN: Navigation links */}
          <div className="flex flex-col space-y-4 md:pl-6">
            <span 
              className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-black/65 font-bold"
              style={{ letterSpacing: "0.22em" }}
            >
              NAVIGATION_
            </span>
            <div className="flex flex-col space-y-3">
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "UI Roast", href: "/roast" },
                { label: "Battle Arena", href: "/arena" },
                { label: "Pricing Lab", href: "/pricing-lab" }
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="footer-link-hover text-[14px] md:text-[15px] font-sans font-medium text-black/85 hover:underline w-fit flex items-center gap-1 group"
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-[11px] text-black/50 tracking-normal select-none transition-transform group-hover:translate-x-1">&gt;</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Divider Line 2: Simple vertical separator line */}
          <div className="hidden md:block w-px bg-black/15 py-2 my-2 opacity-60" />

          {/* RIGHT COLUMN: System status & contact */}
          <div className="flex flex-col space-y-4 md:items-end md:pl-4">
            <div className="flex flex-col space-y-4 w-full md:max-w-xs md:items-end">
              <span 
                className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-black/65 font-bold md:text-right"
                style={{ letterSpacing: "0.22em" }}
              >
                SYSTEM STATUS_
              </span>
              
              {/* Online status tag */}
              <div className="flex items-center gap-2 border border-black/25 bg-black/[0.02] px-3.5 py-1.5 rounded w-fit">
                <span className="footer-status-dot h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="font-mono text-[12px] tracking-[0.14em] font-bold text-black/85">
                  SYSTEM ONLINE
                </span>
              </div>

              {/* Contact Email */}
              <a 
                href="mailto:hello@ghostcustomer.ai" 
                className="footer-link-hover font-sans text-[13px] md:text-[14px] text-black/85 hover:underline md:text-right flex items-center gap-2 w-fit mt-1"
              >
                <Mail className="h-3.5 w-3.5 text-black/60" strokeWidth={2} />
                <span>hello@ghostcustomer.ai</span>
              </a>
            </div>
          </div>

        </div>

        {/* ── Bottom row separator line with coordinate plus signs ── */}
        <div className="w-full h-px bg-black/15 mb-6 relative">
          <div className="absolute top-[-5px] left-[35%] text-[9px] font-mono text-black/35 select-none font-bold">+</div>
          <div className="absolute top-[-5px] left-[65%] text-[9px] font-mono text-black/35 select-none font-bold">+</div>
        </div>

        {/* ── Bottom row (Metadata & Copyright) ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-[11px] md:text-[12px] text-black/70 uppercase tracking-[0.12em] relative z-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>SYSTEM v1.0.0</span>
            <span className="text-black/30 font-light font-sans">||||||</span>
            <span className="hidden md:inline text-black/35 font-bold">+</span>
            <span>LAST SCAN: {lastScan}</span>
            <span className="hidden md:inline text-black/35 font-bold">+</span>
          </div>
          <div className="md:text-right text-[10px] md:text-[11px] leading-relaxed">
            © 2026 GHOSTCUSTOMER. ALL GHOST SIMULATIONS ARE FICTIONAL UNTIL THEY CONVERT.
          </div>
        </div>

      </div>
    </footer>
  );
}
