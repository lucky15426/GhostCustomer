"use client";

import { useEffect, useRef, useState } from "react";

export interface SwarmNode {
  id: string;
  color: string; // 7-char hex
  name?: string;
  role?: string;
  verdict?: string;
  intent?: number; // 0-100 purchase probability
}

interface Particle {
  // beeswarm
  x: number;
  y: number;
  vx: number;
  vy: number;
  // sphere (unit vector)
  bx: number;
  by: number;
  bz: number;
  // projected (both modes) for hover
  sx: number;
  sy: number;
  depth: number;
  r: number;
  phase: number;
  color: string;
  node: SwarmNode;
  jitter: number;
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function intentOf(n: SwarmNode): number {
  if (typeof n.intent === "number") return n.intent;
  return 44 + (hashId(n.id) % 13);
}

/**
 * Living customer swarm. Two modes:
 *  - "beeswarm" (default): nodes flow to an x-position by purchase intent
 *    (left = won't buy → right = will buy) with repulsion. Readable distribution.
 *  - "sphere": a slowly-rotating "Customer Intelligence Core" — nodes on a
 *    projected 3D sphere with depth shading + parallax. Pure canvas, no Three.js.
 */
export function CustomerSwarm({
  nodes,
  height = 340,
  interactive = false,
  showAxis = false,
  variant = "beeswarm",
  className,
}: {
  nodes: SwarmNode[];
  height?: number;
  interactive?: boolean;
  showAxis?: boolean;
  variant?: "beeswarm" | "sphere";
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const partsRef = useRef<Particle[]>([]);
  const edgesRef = useRef<[number, number][]>([]);
  const rotRef = useRef({ ry: 0, rx: 0, tx: 0, ty: 0 });
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const sizeRef = useRef({ w: 0, h: height });
  const [hover, setHover] = useState<{ node: SwarmNode; x: number; y: number } | null>(null);

  // Reconcile particles + (for sphere) fibonacci positions and edges.
  useEffect(() => {
    const parts = partsRef.current;
    const { w, h } = sizeRef.current;
    const N = nodes.length;
    for (let i = 0; i < N; i++) {
      // fibonacci sphere unit vector
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const bx = Math.sin(phi) * Math.cos(theta);
      const by = Math.cos(phi);
      const bz = Math.sin(phi) * Math.sin(theta);
      if (parts[i]) {
        parts[i].color = nodes[i].color;
        parts[i].node = nodes[i];
        parts[i].bx = bx;
        parts[i].by = by;
        parts[i].bz = bz;
      } else {
        parts[i] = {
          x: (w || 500) * (0.3 + Math.random() * 0.4),
          y: (h || height) * (0.3 + Math.random() * 0.4),
          vx: 0,
          vy: 0,
          bx,
          by,
          bz,
          sx: 0,
          sy: 0,
          depth: 0,
          r: variant === "sphere" ? 0.9 + (hashId(nodes[i].id) % 8) / 11 : 2.8 + (hashId(nodes[i].id) % 10) / 6,
          phase: (hashId(nodes[i].id) % 628) / 100,
          color: nodes[i].color,
          node: nodes[i],
          jitter: (hashId(nodes[i].id) % 100) / 100 - 0.5,
        };
      }
    }
    parts.length = N;

    // Generate 3D connection lines (network mesh) if sphere variant is active
    if (variant === "sphere") {
      const edges: [number, number][] = [];
      for (let i = 0; i < N; i++) {
        let count = 0;
        for (let j = i + 1; j < N; j++) {
          const dx = parts[i].bx - parts[j].bx;
          const dy = parts[i].by - parts[j].by;
          const dz = parts[i].bz - parts[j].bz;
          const d2 = dx * dx + dy * dy + dz * dz;
          // Connect nodes that are close to each other
          if (d2 < 0.035) {
            edges.push([i, j]);
            count++;
            if (count >= 2) break; // Cap at 2 connections per node for a clean tech look
          }
        }
      }
      edgesRef.current = edges;
    } else {
      edgesRef.current = [];
    }
  }, [nodes, height, variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const PAD = 46;

    const resize = () => {
      const w = wrap.clientWidth;
      sizeRef.current = { w, h: height };
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let t = 0;
    const tick = () => {
      const { w, h } = sizeRef.current;
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      const parts = partsRef.current;
      const m = mouseRef.current;

      if (variant === "sphere") {
        drawSphere(ctx, parts, edgesRef.current, w, h, t, m, rotRef.current, interactive);
      } else {
        drawBeeswarm(ctx, parts, w, h, t, m, PAD, interactive);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, interactive, variant]);

  function onMove(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y, active: true };
    if (!interactive) return;
    let best: Particle | null = null;
    let bestD = 18 * 18;
    for (const p of partsRef.current) {
      const d = (p.sx - x) ** 2 + (p.sy - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    setHover(best ? { node: best.node, x: best.sx, y: best.sy } : null);
  }

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: "relative", height }}
      onPointerMove={onMove}
      onPointerLeave={() => {
        mouseRef.current.active = false;
        setHover(null);
      }}
    >
      {showAxis && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-2/5" style={{ background: "linear-gradient(90deg, rgba(251,113,133,0.06), transparent)" }} />
          <div className="absolute inset-y-0 right-0 w-2/5" style={{ background: "linear-gradient(270deg, rgba(110,231,183,0.07), transparent)" }} />
          <span className="absolute bottom-2 left-3 text-[10px] font-medium uppercase tracking-wider text-rose-600/80">Won&apos;t buy</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-900">purchase intent →</span>
          <span className="absolute bottom-2 right-3 text-[10px] font-medium uppercase tracking-wider text-emerald-600/90">Will buy</span>
        </div>
      )}
      <canvas ref={canvasRef} className="relative block" />
      {hover && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{ left: hover.x, top: hover.y - 12, minWidth: 150 }}
        >
          <p className="text-xs font-semibold text-slate-900">{hover.node.name}</p>
          <p className="text-[11px] text-slate-500">{hover.node.role}</p>
          {hover.node.verdict && (
            <p className="mt-0.5 text-[11px] font-medium" style={{ color: hover.node.color }}>
              {hover.node.verdict}
              {typeof hover.node.intent === "number" ? ` · ${hover.node.intent}% intent` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function drawBeeswarm(
  ctx: CanvasRenderingContext2D,
  parts: Particle[],
  w: number,
  h: number,
  t: number,
  m: { x: number; y: number; active: boolean },
  PAD: number,
  interactive: boolean,
) {
  const cy = h / 2;
  for (const p of parts) {
    const tx = PAD + (intentOf(p.node) / 100) * (w - 2 * PAD);
    const ty = cy + p.jitter * h * 0.5;
    p.vx += (tx - p.x) * 0.02;
    p.vy += (ty - p.y) * 0.012;
    p.vx += (Math.random() - 0.5) * 0.05;
    p.vy += (Math.random() - 0.5) * 0.05;
    if (interactive && m.active) {
      const dx = p.x - m.x;
      const dy = p.y - m.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 8000 && d2 > 1) {
        const f = (8000 - d2) / 8000;
        const d = Math.sqrt(d2);
        p.vx += (dx / d) * f * 0.8;
        p.vy += (dy / d) * f * 0.8;
      }
    }
  }
  let lines = 0;
  ctx.lineWidth = 1;
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    for (let j = i + 1; j < parts.length; j++) {
      const b = parts[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 784 && d2 > 0.5) {
        const d = Math.sqrt(d2);
        const f = ((28 - d) / 28) * 0.7;
        const nx = dx / d;
        const ny = dy / d;
        a.vx += nx * f;
        a.vy += ny * f;
        b.vx -= nx * f;
        b.vy -= ny * f;
      }
      if (d2 < 4200 && lines < 460) {
        const alpha = (1 - d2 / 4200) * 0.14;
        ctx.strokeStyle = `rgba(180,180,190,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        lines++;
      }
    }
  }
  for (const p of parts) {
    p.vx *= 0.9;
    p.vy *= 0.9;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 1.6) { p.vx = (p.vx / sp) * 1.6; p.vy = (p.vy / sp) * 1.6; }
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < PAD) { p.x = PAD; p.vx *= -0.4; }
    if (p.x > w - PAD) { p.x = w - PAD; p.vx *= -0.4; }
    if (p.y < 18) { p.y = 18; p.vy *= -0.4; }
    if (p.y > h - 18) { p.y = h - 18; p.vy *= -0.4; }
    p.sx = p.x;
    p.sy = p.y;
  }
  for (const p of parts) {
    const pr = p.r + Math.sin(t * 2 + p.phase) * 0.6;
    drawNode(ctx, p.x, p.y, pr, p.color, 1);
  }
  ctx.shadowBlur = 0;
}

function drawSphere(
  ctx: CanvasRenderingContext2D,
  parts: Particle[],
  edges: [number, number][],
  w: number,
  h: number,
  t: number,
  m: { x: number; y: number; active: boolean },
  rot: { ry: number; rx: number; tx: number; ty: number },
  interactive: boolean,
) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.42;
  const focal = 2.4;

  // slow auto-rotation + smoothed parallax toward mouse
  rot.ry += 0.0026;
  if (interactive && m.active) {
    rot.tx = (m.y / h - 0.5) * 0.7;
    rot.ty = (m.x / w - 0.5) * 0.7;
  } else {
    rot.tx *= 0.96;
    rot.ty *= 0.96;
  }
  rot.rx += (rot.tx - rot.rx) * 0.06;
  const ry = rot.ry + rot.ty;
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const cosX = Math.cos(rot.rx), sinX = Math.sin(rot.rx);

  for (const p of parts) {
    // rotate around Y then X
    let X = p.bx * cosY + p.bz * sinY;
    let Z = -p.bx * sinY + p.bz * cosY;
    let Y = p.by * cosX - Z * sinX;
    Z = p.by * sinX + Z * cosX;
    const persp = focal / (focal - Z);
    p.sx = cx + X * R * persp;
    p.sy = cy + Y * R * persp;
    p.depth = Z;
  }

  // edges (behind nodes), alpha by depth
  ctx.lineWidth = 0.8;
  for (let idx = 0; idx < edges.length; idx++) {
    const [i, j] = edges[idx];
    const a = parts[i];
    const b = parts[j];
    if (!a || !b) continue;
    const da = (a.depth + b.depth) / 2;
    const alpha = Math.max(0, (da + 1) / 2) * 0.18;
    const lineAlpha = (alpha * 0.4).toFixed(3);
    // Alternate between violet and cyan connecting lines
    ctx.strokeStyle = idx % 2 === 0 
      ? `rgba(139, 92, 246, ${lineAlpha})` 
      : `rgba(6, 182, 212, ${lineAlpha})`;
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }

  // draw back-to-front
  const order = parts.map((_, i) => i).sort((a, b) => parts[a].depth - parts[b].depth);
  for (const i of order) {
    const p = parts[i];
    const persp = focal / (focal - p.depth);
    const pr = (p.r + Math.sin(t * 1.6 + p.phase) * 0.5) * persp;
    const alpha = 0.35 + ((p.depth + 1) / 2) * 0.65;
    drawNode(ctx, p.sx, p.sy, pr, p.color, alpha);
  }
  ctx.shadowBlur = 0;
}

function drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.globalAlpha = alpha;
  const isColored = color !== "#ffffff" && !color.startsWith("#fff") && !color.startsWith("#f0") && !color.startsWith("#e2") && !color.startsWith("#cf") && !color.startsWith("#b6");
  
  // Real-time pulse effect for active nodes
  const pulse = isColored ? (Math.sin(Date.now() / 200) * 0.25 + 1.0) : 1.0;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * (isColored ? 5.5 : 2.0) * pulse;
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = isColored ? "#ffffff" : "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.4, r * (isColored ? 0.45 : 0.32)), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
