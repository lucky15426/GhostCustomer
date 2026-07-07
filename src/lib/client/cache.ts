import type { RunState } from "@/lib/types";

// Client-side run cache. Guarantees the Insights / Arena / Report pages can
// read a completed run after navigation, even on stateless serverless hosting.

const runKey = (id: string) => `ghost:run:${id}`;
const LAST_KEY = "ghost:last";

export function saveRunCache(run: RunState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(runKey(run.runId), JSON.stringify(run));
    localStorage.setItem(LAST_KEY, run.runId);
  } catch {
    /* quota / private mode — non-fatal */
  }
}

export function loadRunCache(runId: string): RunState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(runKey(runId));
    return raw ? (JSON.parse(raw) as RunState) : null;
  } catch {
    return null;
  }
}

export function loadLastRunId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

/** Load from local cache, falling back to the server store. */
export async function fetchRun(runId: string): Promise<RunState | null> {
  const cached = loadRunCache(runId);
  if (cached) return cached;
  try {
    const res = await fetch(`/api/run?runId=${encodeURIComponent(runId)}`);
    if (!res.ok) return null;
    return (await res.json()) as RunState;
  } catch {
    return null;
  }
}
