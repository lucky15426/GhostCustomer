import type { RunEvent } from "@/lib/types";

export interface StreamRunBody {
  runId?: string;
  url: string;
  competitorUrl?: string;
  pricingUrl?: string;
  faqUrl?: string;
  personaCount?: number;
  currentPrice?: number;
  fast?: boolean;
  isDemo?: boolean;
}

/** POST to /api/run and invoke `onEvent` for each NDJSON event as it streams. */
export async function streamRun(
  body: StreamRunBody,
  onEvent: (e: RunEvent | { type: "init"; runId: string }) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => "Request failed");
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        onEvent(JSON.parse(line));
      } catch {
        // ignore malformed partials
      }
    }
  }
  const tail = buffer.trim();
  if (tail) {
    try {
      onEvent(JSON.parse(tail));
    } catch {
      /* noop */
    }
  }
}
