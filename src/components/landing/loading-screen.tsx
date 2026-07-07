"use client";

import { useState, useEffect, useRef } from "react";

// ─── Boot sequence lines ──────────────────────────────────────────────────────
const BOOT_LINES = [
  "> booting customer intelligence...",
  "> scanning user behaviour...",
  "> preparing simulation engine...",
];

export default function LoadingScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("ghostai_loading_complete");
    }
    return true;
  });
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ── Grain canvas ─────────────────────────────────────────────────────────────
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
        img.data[i + 3] = Math.random() * 22; // very faint
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(drawGrain);
    }
    drawGrain();
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Lock body scroll only while the loader is visible ────────────────────────
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  // ── SNAPPY Progress and Fadeout logic ─────────────────────────────────────────
  useEffect(() => {
    // Drive the progress bar from 0% to 100% over exactly 1800ms (1.8s)
    const total = 1800;
    const tick  = 25;
    let elapsed = 0;

    function triggerFadeout() {
      window.scrollTo({ top: 0, behavior: "instant" });
      sessionStorage.setItem("ghostai_loading_complete", "true");
      
      // Start the typewriter on the landing page immediately
      window.dispatchEvent(new CustomEvent("ghostloader:complete"));
      window.dispatchEvent(new Event("landing-loading-complete")); // For navbar
      
      setFading(true);
      setTimeout(() => setVisible(false), 900);
    }

    function waitForVideo() {
      const video = document.querySelector("video") as HTMLVideoElement | null;

      if (video && video.readyState >= 2) {
        triggerFadeout();
        return;
      }

      if (video) {
        const fallback = setTimeout(triggerFadeout, 200);
        video.addEventListener(
          "loadeddata",
          () => {
            clearTimeout(fallback);
            triggerFadeout();
          },
          { once: true }
        );
        return;
      }

      triggerFadeout();
    }

    const t = setInterval(() => {
      elapsed += tick;
      const raw   = Math.min(elapsed / total, 1);
      const eased = 1 - Math.pow(1 - raw, 2.5);
      setProgress(Math.floor(eased * 100));
      
      if (elapsed >= total) {
        clearInterval(t);
        setProgress(100);
        
        // Brief 100ms visual settle before starting fade-out
        setTimeout(waitForVideo, 100);
      }
    }, tick);

    return () => clearInterval(t);
  }, []);

  if (!visible) return null;

  // ── Calculate Typewriter content dynamically from progress (0 - 100) ──────────
  const totalChars = BOOT_LINES.reduce((sum, line) => sum + line.length, 0);
  const charsToShow = Math.floor((progress / 100) * totalChars);

  const visibleLines: string[] = [];
  let typingLine = "";
  let charsLeft = charsToShow;

  for (const line of BOOT_LINES) {
    if (charsLeft >= line.length) {
      visibleLines.push(line);
      charsLeft -= line.length;
    } else {
      typingLine = line.slice(0, charsLeft);
      charsLeft = 0;
      break;
    }
  }

  return (
    <div
      className="gc-loader"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.9s cubic-bezier(0.4,0,0.2,1)" }}
      aria-live="polite"
      aria-label="Loading GhostCustomer"
    >
      {/* Animated film grain canvas */}
      <canvas ref={canvasRef} className="gc-loader__grain" aria-hidden="true" />

      {/* CRT scanlines */}
      <div className="gc-loader__scanlines" aria-hidden="true" />

      {/* Vignette */}
      <div className="gc-loader__vignette" aria-hidden="true" />

      {/* Horizontal CRT sweep line */}
      <div className="gc-loader__sweep" aria-hidden="true" />

      {/* Corner decoration marks */}
      <div className="gc-loader__corner gc-loader__corner--tl" aria-hidden="true" />
      <div className="gc-loader__corner gc-loader__corner--tr" aria-hidden="true" />
      <div className="gc-loader__corner gc-loader__corner--bl" aria-hidden="true" />
      <div className="gc-loader__corner gc-loader__corner--br" aria-hidden="true" />

      {/* Main content */}
      <div className="gc-loader__content">

        {/* Brand */}
        <div className="gc-loader__brand">
          <span className="gc-loader__brand-name">GhostCustomer</span>
          <span className="gc-loader__brand-cursor" aria-hidden="true">_</span>
        </div>

        {/* Tagline */}
        <p className="gc-loader__tagline">
          MEETING YOUR CUSTOMERS BEFORE REALITY DOES.
        </p>

        {/* Divider */}
        <div className="gc-loader__divider" aria-hidden="true" />

        {/* Terminal lines */}
        <div className="gc-loader__terminal" role="log">
          {visibleLines.map((line, i) => (
            <div key={i} className="gc-loader__line gc-loader__line--done">
              {line}
            </div>
          ))}
          {visibleLines.length < BOOT_LINES.length && (
            <div className="gc-loader__line gc-loader__line--active">
              {typingLine}
              <span className="gc-loader__block-cursor" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div
          className="gc-loader__bar-wrap"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="gc-loader__bar-track">
            <div className="gc-loader__bar-fill" style={{ width: `${progress}%` }} />
            <div
              className="gc-loader__bar-glint"
              style={{
                left: `calc(${progress}% - 2px)`,
                opacity: progress > 0 && progress < 100 ? 1 : 0,
              }}
            />
          </div>
          <span className="gc-loader__bar-pct">{progress}%</span>
        </div>

        {/* Status */}
        <p className="gc-loader__status">
          {progress < 100 ? "INITIALIZING GHOST INTELLIGENCE" : "SYSTEM READY —"}
        </p>
      </div>

      <style>{`
        .gc-loader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          will-change: opacity;
          /* Layered grey textured background */
          background-color: #cac7c0;
          background-image:
            radial-gradient(ellipse 160% 160% at 50% 46%, #d4d1cb 0%, #bfbcb6 52%, #aeaba5 100%);
        }

        /* ── Film grain ──────────────────────────────────────────────────── */
        .gc-loader__grain {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          mix-blend-mode: multiply;
          opacity: 0.52;
        }

        /* ── Scanlines ────────────────────────────────────────────────────── */
        .gc-loader__scanlines {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.042) 2px,
            rgba(0,0,0,0.042) 4px
          );
          pointer-events: none;
          animation: gc-scan-drift 10s linear infinite;
        }

        @keyframes gc-scan-drift {
          0%   { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }

        /* ── Vignette ─────────────────────────────────────────────────────── */
        .gc-loader__vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 105% 105% at 50% 50%,
            transparent 38%,
            rgba(0,0,0,0.32) 100%
          );
          pointer-events: none;
        }

        /* ── CRT sweep ─────────────────────────────────────────────────────── */
        .gc-loader__sweep {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.0) 20%,
            rgba(255,255,255,0.22) 50%,
            rgba(255,255,255,0.0) 80%,
            transparent 100%
          );
          animation: gc-sweep 5s linear infinite;
          pointer-events: none;
        }

        @keyframes gc-sweep {
          0%   { top: -2px;  opacity: 0.5; }
          4%   { opacity: 1; }
          96%  { opacity: 0.7; }
          100% { top: 100%; opacity: 0; }
        }

        /* ── Corner marks ─────────────────────────────────────────────────── */
        .gc-loader__corner {
          position: absolute;
          width: 18px;
          height: 18px;
          pointer-events: none;
          opacity: 0.35;
        }
        .gc-loader__corner--tl {
          top: 20px; left: 20px;
          border-top: 1.5px solid #1a1917;
          border-left: 1.5px solid #1a1917;
        }
        .gc-loader__corner--tr {
          top: 20px; right: 20px;
          border-top: 1.5px solid #1a1917;
          border-right: 1.5px solid #1a1917;
        }
        .gc-loader__corner--bl {
          bottom: 20px; left: 20px;
          border-bottom: 1.5px solid #1a1917;
          border-left: 1.5px solid #1a1917;
        }
        .gc-loader__corner--br {
          bottom: 20px; right: 20px;
          border-bottom: 1.5px solid #1a1917;
          border-right: 1.5px solid #1a1917;
        }

        /* ── Content ──────────────────────────────────────────────────────── */
        .gc-loader__content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: min(520px, 86vw);
        }

        /* ── Brand ────────────────────────────────────────────────────────── */
        .gc-loader__brand {
          display: flex;
          align-items: baseline;
          gap: 0;
          margin-bottom: 10px;
        }

        .gc-loader__brand-name {
          font-family: 'Courier New', Courier, monospace;
          font-size: clamp(26px, 5vw, 44px);
          font-weight: 700;
          color: #0d0d0d;
          letter-spacing: -0.01em;
          line-height: 1;
          text-shadow:
            1px 1px 0 rgba(255,255,255,0.3),
            0 0 50px rgba(0,0,0,0.1);
        }

        .gc-loader__brand-cursor {
          font-family: 'Courier New', Courier, monospace;
          font-size: clamp(26px, 5vw, 44px);
          font-weight: 700;
          color: #0d0d0d;
          line-height: 1;
          animation: gc-blink 1.1s step-end infinite;
        }

        @keyframes gc-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }

        /* ── Tagline ──────────────────────────────────────────────────────── */
        .gc-loader__tagline {
          font-family: 'Courier New', Courier, monospace;
          font-size: clamp(9px, 1.35vw, 11.5px);
          font-weight: 400;
          color: #38352f;
          letter-spacing: 0.18em;
          margin-bottom: 22px;
          opacity: 0.8;
        }

        /* ── Divider ──────────────────────────────────────────────────────── */
        .gc-loader__divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(0,0,0,0.18) 0%, transparent 100%);
          margin-bottom: 22px;
        }

        /* ── Terminal ─────────────────────────────────────────────────────── */
        .gc-loader__terminal {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-height: 102px;
          margin-bottom: 28px;
          width: 100%;
        }

        .gc-loader__line {
          font-family: 'Courier New', Courier, monospace;
          font-size: clamp(11px, 1.65vw, 13.5px);
          color: #1a1917;
          letter-spacing: 0.02em;
          line-height: 1.65;
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .gc-loader__line--done {
          opacity: 0.6;
        }

        .gc-loader__line--active {
          opacity: 1;
          color: #0a0a09;
          font-weight: 600;
        }

        /* Block cursor inside active line */
        .gc-loader__block-cursor {
          display: inline-block;
          width: 9px;
          height: 13px;
          background: #0d0d0d;
          margin-left: 2px;
          vertical-align: middle;
          animation: gc-blink 0.7s step-end infinite;
          flex-shrink: 0;
        }

        /* ── Progress bar ─────────────────────────────────────────────────── */
        .gc-loader__bar-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          margin-bottom: 11px;
        }

        .gc-loader__bar-track {
          position: relative;
          flex: 1;
          height: 10px;
          background: rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.28);
          overflow: visible;
          box-shadow:
            inset 0 1px 3px rgba(0,0,0,0.2),
            0 1px 0 rgba(255,255,255,0.28);
        }

        .gc-loader__bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #0d0d0d;
          transition: width 0.12s linear;
          /* diagonal hatch over fill */
          background-image:
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,0.07) 3px,
              rgba(255,255,255,0.07) 6px
            );
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Glint tick at the leading edge */
        .gc-loader__bar-glint {
          position: absolute;
          top: -3px;
          width: 3px;
          height: calc(100% + 6px);
          background: rgba(255,255,255,0.6);
          transition: left 0.12s linear, opacity 0.3s;
          filter: blur(1px);
          pointer-events: none;
        }

        .gc-loader__bar-pct {
          font-family: 'Courier New', Courier, monospace;
          font-size: clamp(10px, 1.4vw, 11.5px);
          color: #1a1917;
          font-weight: 700;
          min-width: 36px;
          letter-spacing: 0.05em;
          text-align: right;
          opacity: 0.85;
          flex-shrink: 0;
        }

        /* ── Status ───────────────────────────────────────────────────────── */
        .gc-loader__status {
          font-family: 'Courier New', Courier, monospace;
          font-size: clamp(8px, 1.15vw, 10px);
          color: #38352f;
          letter-spacing: 0.24em;
          opacity: 0.65;
        }

        /* ── Mobile ───────────────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .gc-loader__terminal { min-height: 80px; }
          .gc-loader__line { white-space: normal; }
          .gc-loader__corner { display: none; }
        }
      `}</style>
    </div>
  );
}
