import type { RunState } from "./types";
import { supabase, RUNS_TABLE } from "./supabase";

// ---------------------------------------------------------------------------
// Run store: durable (Supabase) with an in-memory write-through cache.
//
// - saveRun  -> writes memory immediately + upserts to Supabase (best-effort).
// - getRun   -> memory first; on a different serverless instance (memory miss)
//               it reads from Supabase, so completed runs are durable and
//               shareable across devices/instances.
// If Supabase is not configured / a table is missing / it errors, everything
// falls back to memory so the app never breaks. Persistence requires the
// `runs` table (see supabase/runs.sql).
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __ghostRunStore: Map<string, RunState> | undefined;
}

const mem: Map<string, RunState> =
  globalThis.__ghostRunStore ?? (globalThis.__ghostRunStore = new Map());

const MAX_RUNS = 30;

function evict() {
  if (mem.size > MAX_RUNS) {
    const oldest = [...mem.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) mem.delete(oldest.runId);
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error("supabase timeout")), ms)),
    ]);
  } catch {
    return null;
  }
}

export async function saveRun(run: RunState): Promise<void> {
  mem.set(run.runId, run);
  evict();
  if (!supabase) return;
  await withTimeout(
    (async () => {
      const { error } = await supabase
        .from(RUNS_TABLE)
        .upsert({ id: run.runId, data: run, created_at: new Date(run.createdAt).toISOString() }, { onConflict: "id" });
      if (error) console.warn("[supabase] saveRun:", error.message);
    })(),
    6000,
  );
}

export async function getRun(runId: string): Promise<RunState | undefined> {
  const local = mem.get(runId);
  if (local) return local;
  if (!supabase) return undefined;
  const fromDb = await withTimeout(
    (async () => {
      const { data, error } = await supabase.from(RUNS_TABLE).select("data").eq("id", runId).maybeSingle();
      if (error) {
        console.warn("[supabase] getRun:", error.message);
        return null;
      }
      return (data?.data as RunState) ?? null;
    })(),
    6000,
  );
  if (fromDb) mem.set(runId, fromDb);
  return fromDb ?? undefined;
}

export function listRuns(): RunState[] {
  return [...mem.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteRun(runId: string): Promise<void> {
  mem.delete(runId);
  if (supabase) await withTimeout(supabase.from(RUNS_TABLE).delete().eq("id", runId) as unknown as Promise<unknown>, 4000);
}
