"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function Background() {
  const pathname = usePathname();

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 22 });
  const sy = useSpring(my, { stiffness: 60, damping: 22 });

  const x1 = useTransform(sx, [0, 1], [-22, 22]);
  const y1 = useTransform(sy, [0, 1], [-18, 18]);
  const x2 = useTransform(sx, [0, 1], [16, -16]);
  const y2 = useTransform(sy, [0, 1], [12, -12]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  // The homepage uses the full-screen Mainframe video as its own background.
  if (pathname === "/") return null;

  // Light SaaS background for every app page.
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#fbfbfd]" />

      <motion.div style={{ x: x1, y: y1 }} className="absolute inset-0">
        <div
          className="absolute -right-[10%] top-[2%] h-[46rem] w-[46rem] rounded-full blur-[150px]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.1) 50%, transparent 70%)",
            animation: "ambient-drift 22s ease-in-out infinite",
            mixBlendMode: "multiply",
          }}
        />
        <div
          className="absolute right-[18%] bottom-[8%] h-[38rem] w-[38rem] rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
            animation: "ambient-drift 26s ease-in-out infinite reverse",
          }}
        />
      </motion.div>

      <motion.div style={{ x: x2, y: y2 }} className="absolute inset-0">
        <div
          className="absolute -left-[10%] bottom-[-10%] h-[42rem] w-[42rem] rounded-full blur-[160px]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.14) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)",
            animation: "ambient-drift 28s ease-in-out infinite",
            mixBlendMode: "multiply",
          }}
        />
      </motion.div>

      <div className="absolute inset-0 grid-bg-light opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute inset-0 grain opacity-[0.012] mix-blend-overlay" />
    </div>
  );
}
