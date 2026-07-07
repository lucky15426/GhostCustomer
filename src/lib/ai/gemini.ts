import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RunConfig, WebsiteAnalysis, ExecutiveReport, Insights, CompetitorAnalysis, RoastRegion, AutoFix } from "@/lib/types";
import { mockAnalyze, buildReport } from "@/lib/data/mock-engine";
import { sleep } from "@/lib/utils";
import { groqEnabled, groqJSON, groqVisionEnabled, groqVisionJSON } from "@/lib/ai/groq";

// ---------------------------------------------------------------------------
// Gemini client with graceful degradation.
//
// Everything here returns a valid result even when GEMINI_API_KEY is unset or
// the API errors — it falls back to the deterministic mock engine. AI is used
// where it adds the most value (understanding crawled site content and writing
// the executive narrative); per-persona scoring stays in the fast, grounded
// engine so a 200-customer swarm doesn't fan out into 200 fragile LLM calls.
// ---------------------------------------------------------------------------

// Primary model first, then resilient fallbacks. When the flagship model is
// overloaded (HTTP 503 "high demand"), we transparently retry on an alternate
// so real AI analysis survives transient spikes instead of dropping to mock.
const PRIMARY = process.env.GEMINI_MODEL || "gemini-2.5-flash";
// flash-lite has a separate quota and stays available when flash is rate-limited;
// 1.5-flash is 404 for current keys so it's intentionally NOT in the chain.
const MODELS = [...new Set([PRIMARY, "gemini-2.5-flash-lite", "gemini-2.0-flash"])];
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export function isGeminiEnabled(): boolean {
  return Boolean(KEY);
}

/** Visual UI Roast works if EITHER Gemini Vision or Groq Vision is available. */
export function isVisionEnabled(): boolean {
  return isGeminiEnabled() || groqVisionEnabled();
}

export function engineName(): "gemini" | "mock" {
  // "gemini" here means "a real LLM is available" (Groq or Gemini) vs "mock".
  return isGeminiEnabled() || groqEnabled() ? "gemini" : "mock";
}

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI | null {
  if (!KEY) return null;
  if (!client) client = new GoogleGenerativeAI(KEY);
  return client;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("gemini timeout")), ms)),
  ]);
}

/**
 * Call Gemini expecting strict JSON. Retries transient overloads (503/429/
 * timeout) and falls back across alternate models before giving up. Returns
 * null only when every model/attempt fails (then the caller uses the mock).
 */
export async function generateJSON<T>(prompt: string, timeoutMs = 30000): Promise<T | null> {
  // Prefer Groq for text generation (fast + generous free quota); fall back to
  // Gemini if Groq is unavailable/fails; the caller falls back to mock if both fail.
  if (groqEnabled()) {
    const g = await groqJSON<T>(prompt, Math.min(timeoutMs, 22000));
    if (g) return g;
  }

  const c = getClient();
  if (!c) return null;

  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = c.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
        });
        const res = await withTimeout(model.generateContent(prompt), timeoutMs);
        return JSON.parse(stripFences(res.response.text())) as T;
      } catch (err) {
        const msg = ((err as Error).message || "").slice(0, 140);
        console.warn(`[gemini] ${modelName} attempt ${attempt + 1} failed: ${msg}`);
        // 429 (rate limit/quota) won't clear in ~1s -> jump to the next model now
        if (/429|quota|rate limit|too many|resource exhausted/i.test(msg)) break;
        const transient = /503|overload|high demand|timeout|unavailable|fetch failed|ECONN|ETIMEDOUT/i.test(msg);
        if (transient && attempt === 0) {
          await sleep(900);
          continue; // retry same model once
        }
        break; // give up on this model, try the next
      }
    }
  }
  console.warn("[gemini] all models/attempts failed -> using mock engine");
  return null;
}

function stripFences(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  return t;
}

// ---------------------------------------------------------------------------
// AI-enhanced website analysis (from crawled content)
// ---------------------------------------------------------------------------
export async function aiAnalyze(
  config: RunConfig,
  crawledText: string | null,
  crawlSource: "firecrawl" | "fetch" | "none" = "none",
): Promise<WebsiteAnalysis> {
  const fallback = mockAnalyze(config); // fallback.source === "mock"
  if (!isGeminiEnabled() || !crawledText) return fallback;

  const prompt = `You are a B2B website analyst. Analyze the following website content and return STRICT JSON only.

URL: ${config.url}
CONTENT (may be truncated):
"""
${crawledText.slice(0, 12000)}
"""

Return JSON with this exact shape:
{
  "title": string,
  "tagline": string,
  "category": string,
  "valueProps": string[3],
  "ctas": string[],
  "navItems": string[],
  "pricingTiers": [{"name": string, "price": string, "period": string, "highlights": string[]}],
  "faqs": [{"q": string, "a": string}],
  "trustSignals": string[],
  "missingTrustSignals": string[],
  "onboardingSteps": string[],
  "detectedFeatures": string[],
  "targetAudience": string,
  "toneOfVoice": string,
  "contentScore": number  // 0-100, how clearly the site communicates value, pricing, trust
}
Be accurate to the content. If pricing or security info is absent, reflect that (empty arrays, low contentScore, list them in missingTrustSignals).`;

  const json = await generateJSON<Partial<WebsiteAnalysis>>(prompt);
  if (!json || !json.title) return fallback;

  // Merge AI output over a safe fallback so missing fields never break the UI.
  return {
    ...fallback,
    ...json,
    url: config.url,
    pricingTiers: json.pricingTiers?.length ? json.pricingTiers : fallback.pricingTiers,
    faqs: json.faqs ?? fallback.faqs,
    valueProps: json.valueProps?.length ? json.valueProps : fallback.valueProps,
    detectedFeatures: json.detectedFeatures?.length ? json.detectedFeatures : fallback.detectedFeatures,
    trustSignals: json.trustSignals ?? fallback.trustSignals,
    missingTrustSignals: json.missingTrustSignals ?? fallback.missingTrustSignals,
    contentScore: typeof json.contentScore === "number" ? json.contentScore : fallback.contentScore,
    // honest provenance: real AI analysis of a real crawl, or plain fetch
    source: crawlSource === "none" ? "fetch" : crawlSource,
  } as WebsiteAnalysis;
}

// ---------------------------------------------------------------------------
// AI-enhanced executive report narrative
// ---------------------------------------------------------------------------
export async function aiReport(
  analysis: WebsiteAnalysis,
  insights: Insights,
  competitor?: CompetitorAnalysis,
): Promise<ExecutiveReport> {
  const fallback = buildReport(analysis, insights, competitor);
  if (!isGeminiEnabled()) return fallback;

  const prompt = `You are a principal growth strategist writing an executive report for the business "${analysis.title}" (${analysis.category}).
Use ONLY the data below. Return STRICT JSON matching the schema. Be specific, quantitative, and board-ready.

DATA:
${JSON.stringify(
    {
      avgPurchaseProbability: insights.avgPurchaseProbability,
      avgConfusion: insights.avgConfusion,
      conversionRiskScore: insights.conversionRiskScore,
      verdictBreakdown: insights.verdictBreakdown,
      roleBreakdown: insights.roleBreakdown,
      revenueLeaks: insights.revenueLeaks,
      churnRisks: insights.churnRisks,
      unansweredQuestions: insights.salesObjections.filter((o) => !o.answeredOnSite).map((o) => o.question),
    },
    null,
    2,
  )}

Schema:
{
  "executiveSummary": string,  // 3-4 sentences
  "keyFindings": string[4],
  "conversionRisks": string[],
  "churnRisks": string[],
  "revenueLeaks": string[],
  "customerQuestions": string[],
  "competitorNotes": string[],
  "recommendations": [{"title": string, "detail": string, "effort": "Low"|"Medium"|"High", "impact": "Low"|"Medium"|"High"}],
  "projectedUplift": string
}`;

  const json = await generateJSON<ExecutiveReport>(prompt, 22000);
  if (!json || !json.executiveSummary) return fallback;
  return {
    ...fallback,
    ...json,
    recommendations: json.recommendations?.length ? json.recommendations : fallback.recommendations,
    customerQuestions: json.customerQuestions?.length ? json.customerQuestions : fallback.customerQuestions,
  };
}

// ---------------------------------------------------------------------------
// AI "live thought" for the war-room stream (optional flavor; falls back to "")
// ---------------------------------------------------------------------------
export async function aiThought(agent: string, context: string): Promise<string | null> {
  if (!isGeminiEnabled()) return null;
  const json = await generateJSON<{ thought: string }>(
    `You are the "${agent}" inside a customer-simulation engine. In ONE punchy sentence (max 18 words), narrate what you just observed. Context: ${context}. Return JSON {"thought": string}.`,
    8000,
  );
  return json?.thought ?? null;
}

// ---------------------------------------------------------------------------
// Visual Roast — Gemini Vision over a real screenshot.
// Returns null on any failure (caller surfaces an honest error; never mock).
// ---------------------------------------------------------------------------
export interface VisionRoastData {
  roast: string;
  clarityScore: number;
  firstLook?: { x: number; y: number };
  regions: RoastRegion[];
  engine?: "gemini" | "groq";
}

export async function aiVisionRoast(screenshotUrl: string): Promise<VisionRoastData | null> {
  // fetch the screenshot bytes -> base64 (shared by both vision engines)
  let b64 = "";
  let mime = "image/png";
  try {
    const r = await withTimeout(fetch(screenshotUrl), 30000);
    if (!r.ok) return null;
    mime = r.headers.get("content-type") || "image/png";
    const ab = await r.arrayBuffer();
    b64 = Buffer.from(ab).toString("base64");
  } catch {
    return null;
  }

  const prompt = `You are a first-time, slightly impatient potential customer landing on this web page for the first time. Be brutally honest but specific.

Return STRICT JSON only:
{
  "roast": string,            // <= 2 sentences, blunt first-impression of the page
  "clarityScore": number,     // 0-100, how clearly the page communicates value + next action
  "firstLook": { "x": number, "y": number },  // where your eye lands FIRST, normalized 0-1000
  "regions": [                // 4 to 7 items: spots that cause confusion / friction / lost attention
    {
      "label": string,        // short name, e.g. "Buried CTA", "Wall of text", "Unclear pricing"
      "why": string,          // one sentence: why it confuses or loses you
      "severity": "high" | "medium" | "low",
      "box": [ymin, xmin, ymax, xmax]   // bounding box, integers normalized to 0-1000 (Gemini convention)
    }
  ]
}
Focus on real, visible problems in THIS screenshot (hero, CTA, navigation, pricing, trust, readability). Coordinates must be within 0-1000.`;

  // Engine 1: Gemini Vision (preferred when a key is configured). One fast
  // attempt per model — when Gemini is slow/over quota we want to fail over to
  // the Groq fallback quickly rather than burn ~2 min retrying a busy model.
  const c = getClient();
  if (c) {
    for (const modelName of MODELS) {
      try {
        const model = c.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
        });
        const res = await withTimeout(
          model.generateContent([{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }]),
          18000,
        );
        const parsed = JSON.parse(stripFences(res.response.text())) as VisionRoastData;
        if (parsed && Array.isArray(parsed.regions)) return { ...parsed, engine: "gemini" };
      } catch (err) {
        const msg = ((err as Error).message || "").slice(0, 140);
        console.warn(`[gemini-vision] ${modelName} failed: ${msg}`);
        if (/429|quota|rate limit|too many|resource exhausted/i.test(msg)) break; // straight to Groq
      }
    }
  }

  // Engine 2: Groq Vision fallback — keeps the Roast working when Gemini is out
  // of quota or busy (the exact "Vision analysis failed (model busy)" case).
  if (groqVisionEnabled()) {
    const parsed = await groqVisionJSON<VisionRoastData>(prompt, `data:${mime};base64,${b64}`, 30000);
    if (parsed && Array.isArray(parsed.regions)) return { ...parsed, engine: "groq" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Auto-Fix — Gemini generates optimized copy/markup for a detected problem.
// ---------------------------------------------------------------------------
export async function aiAutoFix(
  problem: { title: string; cause?: string; fix?: string },
  context: { title?: string; category?: string; tone?: string; audience?: string },
): Promise<AutoFix | null> {
  if (!isGeminiEnabled()) return null;
  const prompt = `You are a senior conversion copywriter + front-end engineer. A customer-simulation found this problem on the website "${context.title ?? "the site"}" (${context.category ?? "web product"}):

PROBLEM: ${problem.title}
${problem.cause ? `CAUSE: ${problem.cause}` : ""}
${problem.fix ? `SUGGESTED DIRECTION: ${problem.fix}` : ""}
BRAND TONE: ${context.tone ?? "clear, confident, friendly"}
TARGET AUDIENCE: ${context.audience ?? "the site's prospective buyers"}

Generate concrete, paste-ready fixes that directly overcome this problem. Return STRICT JSON:
{
  "problem": string,        // restate the problem in one line
  "rationale": string,      // 1-2 sentences: why these fixes convert better
  "variants": [             // 2 to 3 variants
    {
      "kind": string,       // e.g. "Hero headline", "Pricing blurb", "FAQ entry", "Trust strip"
      "heading": string,    // short label for this variant
      "copy": string,       // the actual ready-to-use copy
      "html": string        // a small self-contained Tailwind HTML snippet implementing it (no <script>)
    }
  ]
}
Keep copy specific and benefit-led; no lorem ipsum; no scripts in html.`;
  const json = await generateJSON<AutoFix>(prompt, 22000);
  if (!json || !Array.isArray(json.variants) || !json.variants.length) return null;
  return json;
}
