import { sleep } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Groq client (OpenAI-compatible) for fast, generous-quota TEXT generation:
// website analysis, executive report, auto-fix copy. Vision (UI Roast) stays on
// Gemini. Returns null on any failure so callers fall back (Gemini -> mock).
// ---------------------------------------------------------------------------

const KEY = process.env.GROQ_API_KEY;
const PRIMARY = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MODELS = [...new Set([PRIMARY, "llama-3.1-8b-instant"])];
// Multimodal models for the Visual UI Roast fallback (Llama 4 sees images).
const VISION_PRIMARY = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const VISION_MODELS = [...new Set([VISION_PRIMARY, "meta-llama/llama-4-maverick-17b-128e-instruct"])];
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export function groqEnabled(): boolean {
  return Boolean(KEY);
}

/** Vision uses the same key — separate accessor so callers read intent clearly. */
export function groqVisionEnabled(): boolean {
  return Boolean(KEY);
}

/** Best-effort JSON parse: strip code fences, else carve out the outermost {...}. */
function parseLooseJSON<T>(content: string): T | null {
  const cleaned = stripFences(content);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* fall through to substring extraction */
  }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1)) as T;
    } catch {
      /* give up */
    }
  }
  return null;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("groq timeout")), ms)),
  ]);
}

function stripFences(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) return t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return t;
}

/**
 * Call Groq expecting strict JSON (OpenAI-compatible json_object mode).
 * NOTE: json_object mode requires the word "JSON" in the prompt — all our
 * prompts already say "Return STRICT JSON". Returns null on total failure.
 */
export async function groqJSON<T>(prompt: string, timeoutMs = 22000): Promise<T | null> {
  if (!KEY) return null;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await withTimeout(
          fetch(ENDPOINT, {
            method: "POST",
            headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
              response_format: { type: "json_object" },
              temperature: 0.3,
            }),
          }),
          timeoutMs,
        );
        if (!res.ok) {
          const txt = (await res.text().catch(() => "")).slice(0, 140);
          throw new Error(`${res.status} ${txt}`);
        }
        const data = await res.json();
        const content: string = data?.choices?.[0]?.message?.content ?? "";
        return JSON.parse(stripFences(content)) as T;
      } catch (err) {
        const msg = ((err as Error).message || "").slice(0, 140);
        console.warn(`[groq] ${model} attempt ${attempt + 1} failed: ${msg}`);
        if (/429|quota|rate limit|too many|resource exhausted/i.test(msg)) break; // next model
        const transient = /5\d\d|timeout|unavailable|fetch failed|ECONN|ETIMEDOUT/i.test(msg);
        if (transient && attempt === 0) {
          await sleep(800);
          continue;
        }
        break;
      }
    }
  }
  return null;
}

/**
 * Multimodal Groq call: send a prompt + an image (base64 data URI) and expect
 * JSON back. Used as the Visual UI Roast fallback when Gemini Vision is busy or
 * out of quota. json_object mode isn't reliable on the vision models, so we ask
 * for JSON in the prompt and parse loosely. Returns null on total failure.
 */
export async function groqVisionJSON<T>(
  prompt: string,
  imageDataUri: string,
  timeoutMs = 30000,
): Promise<T | null> {
  if (!KEY) return null;
  for (const model of VISION_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await withTimeout(
          fetch(ENDPOINT, {
            method: "POST",
            headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageDataUri } },
                  ],
                },
              ],
              temperature: 0.4,
            }),
          }),
          timeoutMs,
        );
        if (!res.ok) {
          const txt = (await res.text().catch(() => "")).slice(0, 160);
          throw new Error(`${res.status} ${txt}`);
        }
        const data = await res.json();
        const content: string = data?.choices?.[0]?.message?.content ?? "";
        const parsed = parseLooseJSON<T>(content);
        if (parsed) return parsed;
        throw new Error("unparseable JSON");
      } catch (err) {
        const msg = ((err as Error).message || "").slice(0, 140);
        console.warn(`[groq-vision] ${model} attempt ${attempt + 1} failed: ${msg}`);
        if (/429|quota|rate limit|too many|resource exhausted/i.test(msg)) break; // next model
        const transient = /5\d\d|timeout|unavailable|fetch failed|ECONN|ETIMEDOUT|unparseable/i.test(msg);
        if (transient && attempt === 0) {
          await sleep(800);
          continue;
        }
        break;
      }
    }
  }
  return null;
}
