"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SoftAurora from "@/components/ui/soft-aurora";
import Aurora from "@/components/ui/aurora";

// Dashboard palette: Mint Green · Electric Cyan · Cyber Purple
const MINT = "#4ade80";
const CYAN = "#22d3ee";
const PURPLE = "#a855f7";

/** Roaming ghost PNG: wanders organically across the viewport over a 32s loop.
 *  Framer Motion x/y must be plain numbers (pixels) — calc() is not supported.
 *  The element is centered via negative margin and then translated by pixel offsets. */
function RoamingGhost() {
  return (
    <motion.div
      className="pointer-events-none absolute z-[1]"
      // Centre the element at 50/50 using margin offset so x/y=0 means "dead centre"
      style={{ left: "50%", top: "50%", marginLeft: -96, marginTop: -96 }}
      animate={{
        // Plain pixel keyframes — roughly ±30 vw / ±25 vh at 1920×1080
        x: [0, 260, 90, -300, -140, 210, 0],
        y: [0, -180, 240, 130, -220, 90, 0],
        rotate: [0, 9, -5, 16, -10, 4, 0],
        scale: [1, 1.1, 0.92, 1.05, 0.96, 1.08, 1],
        opacity: [0.35, 0.50, 0.30, 0.45, 0.25, 0.40, 0.35],
      }}
      transition={{
        duration: 32,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ghost.png"
        alt=""
        className="h-48 w-48 select-none drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        draggable={false}
      />
    </motion.div>
  );
}


export function LandingEffects() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const interval = 50;
    const exitDuration = 1200;
    let elapsed = 0;
    let completeTimer: ReturnType<typeof setTimeout>;
    let revealNavbarTimer: ReturnType<typeof setTimeout>;

    const timer = setInterval(() => {
      elapsed += interval;
      const rawProgress = elapsed / duration;
      const easedProgress = Math.pow(rawProgress, 0.8);
      const currentProgress = Math.min(100, Math.floor(easedProgress * 100));
      setProgress(currentProgress);

      if (elapsed >= duration) {
        clearInterval(timer);
        completeTimer = setTimeout(() => {
          setIsLoading(false);
          revealNavbarTimer = setTimeout(() => {
            window.dispatchEvent(new Event("landing-loading-complete"));
          }, exitDuration);
        }, 300);
      }
    }, interval);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
      clearTimeout(revealNavbarTimer);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0F19] overflow-hidden w-screen h-[100dvh]"
          >
            {/* Aurora — keeps the existing animated shader */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-100">
              <Aurora
                colorStops={[CYAN, PURPLE, MINT]}
                blend={0.75}
                amplitude={1.4}
                speed={0.8}
              />
            </div>

            {/* Ambient glow orbs — dashboard palette at low opacity */}
            <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
              <div
                className="absolute -top-[15%] -left-[8%] w-[45%] h-[45%] rounded-full blur-[140px]"
                style={{ background: CYAN, opacity: 0.13 }}
              />
              <div
                className="absolute -top-[15%] -right-[8%] w-[45%] h-[45%] rounded-full blur-[140px]"
                style={{ background: PURPLE, opacity: 0.15 }}
              />
              <div
                className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full blur-[140px]"
                style={{ background: MINT, opacity: 0.10 }}
              />
            </div>

            {/* Roaming Ghost element */}
            <RoamingGhost />

            {/* Content */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className="relative z-10 mb-8 font-sans text-5xl font-semibold tracking-widest md:text-7xl lg:text-8xl"
            >
              <span className="bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 bg-clip-text text-transparent">
                GHOST AI
              </span>
            </motion.h1>

            <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mb-4 flex flex-col items-center gap-3 w-full"
              >
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400">
                  Initializing Agent Swarm...
                </span>
              </motion.div>

              {/* 2px gradient progress bar — Emerald → Purple */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="w-48 h-[2px] rounded-full overflow-hidden relative mb-4"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    background: "linear-gradient(to right, #34d399, #a78bfa)",
                    boxShadow: "0 0 8px rgba(52,211,153,0.5)",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="font-mono text-xs tracking-widest"
                style={{ color: `${CYAN}99` }}
              >
                {progress.toString().padStart(3, "0")}%
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="pointer-events-none fixed inset-0 z-10 opacity-60 mix-blend-screen transition-opacity duration-1000">
          <SoftAurora
            speed={0.8}
            scale={1.2}
            brightness={1.2}
            color1="#3b82f6"
            color2="#ffffff"
            noiseFrequency={2.0}
            noiseAmplitude={1.2}
            bandHeight={0.6}
            bandSpread={1.2}
            octaveDecay={0.15}
            layerOffset={0}
            colorSpeed={1.5}
            enableMouseInteraction={false}
            mouseInfluence={0.25}
          />
        </div>
      )}
    </>
  );
}

