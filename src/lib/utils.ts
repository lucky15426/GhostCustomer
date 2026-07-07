import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic 32-bit hash — lets the mock engine produce stable-but-varied
 *  results per URL so two different sites never look identical in a demo. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded PRNG (mulberry32). Same seed → same sequence. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickMany<T>(rng: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function shortId(seed?: number): string {
  const base = (seed ?? Math.floor(performance.now() * 1000)) >>> 0;
  return base.toString(36).padStart(6, "0").slice(0, 8);
}

export function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    return new URL(u).toString();
  } catch {
    return u;
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function severityColor(s: string): string {
  switch (s) {
    case "critical":
      return "#6f6f77";
    case "high":
      return "#a6a6ae";
    case "medium":
      return "#d6d6da";
    default:
      return "#f2f2f4";
  }
}

export function verdictColor(v: string): string {
  switch (v) {
    case "Convert":
      return "#f2f2f4"; // signal green
    case "Maybe":
      return "#a6a6ae"; // signal amber
    case "Churn Risk":
      return "#6f6f77"; // signal red
    default:
      return "#8a8a8a"; // Bounce — graphite grey
  }
}

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundType=gradientLinear&radius=20`;
}
