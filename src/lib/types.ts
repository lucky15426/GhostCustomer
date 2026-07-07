// ============================================================================
// Ghost Customer AI — Shared domain contracts
// Every agent, API route, and UI component speaks these types.
// ============================================================================

export type Level = "Low" | "Medium" | "High";

export type PersonaRole =
  | "Startup Founder"
  | "CTO"
  | "Product Manager"
  | "Agency Owner"
  | "Student"
  | "Small Business Owner"
  | "Enterprise Buyer"
  | "Operations Manager"
  | "HR Manager"
  | "Freelancer";

export type AgentName =
  | "Website Analyzer"
  | "Persona Generator"
  | "Customer Simulator"
  | "Sales Agent"
  | "Support Agent"
  | "Revenue Leak Agent"
  | "Churn Agent"
  | "Insight Agent"
  | "Report Generator";

// ---------------------------------------------------------------------------
// Website intelligence
// ---------------------------------------------------------------------------
export interface WebsiteAnalysis {
  url: string;
  title: string;
  tagline: string;
  category: string;
  valueProps: string[];
  ctas: string[];
  navItems: string[];
  pricingTiers: PricingTier[];
  faqs: { q: string; a: string }[];
  trustSignals: string[];
  missingTrustSignals: string[];
  onboardingSteps: string[];
  detectedFeatures: string[];
  targetAudience: string;
  toneOfVoice: string;
  contentScore: number; // 0-100 overall clarity of the site
  source: "firecrawl" | "fetch" | "mock";
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  highlights: string[];
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------
export interface Persona {
  id: string;
  name: string;
  avatarSeed: string;
  age: number;
  role: PersonaRole;
  archetype: string;
  companySize: number;
  industry: string;
  budgetSensitivity: Level;
  technicalSkill: Level;
  purchaseIntent: Level;
  goals: string[];
  frustrations: string[];
  objections: string[];
  quote: string;
  emoji: string;
  accent: string; // hex used for the persona card glow
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
export type Verdict = "Convert" | "Maybe" | "Churn Risk" | "Bounce";

export type JourneyStage =
  | "Landing"
  | "Pricing"
  | "Features"
  | "Onboarding"
  | "Support";

export interface JourneyStep {
  stage: JourneyStage;
  sentiment: number; // -100..100
  note: string;
}

export interface SimulationResult {
  personaId: string;
  personaName: string;
  role: PersonaRole;
  interestScore: number; // 0-100
  confusionScore: number; // 0-100
  purchaseProbability: number; // 0-100
  supportDependency: number; // 0-100
  churnRisk: number; // 0-100
  trustScore: number; // 0-100
  verdict: Verdict;
  topObjection: string;
  reasoning: string;
  journey: JourneyStep[];
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------
export type Severity = "low" | "medium" | "high" | "critical";

export interface SalesObjection {
  question: string;
  answeredOnSite: boolean;
  impact: string;
  affectedRoles: PersonaRole[];
  severity: Severity;
}

export interface SupportGap {
  scenario: string;
  faqCoverage: number; // 0-100
  docQuality: number; // 0-100
  risk: string;
  severity: Severity;
}

export interface RevenueLeak {
  title: string;
  cause: string;
  affectedPct: number;
  estConversionLoss: number; // percentage points
  estRevenueImpact: string;
  severity: Severity;
  fix: string;
}

export interface ChurnRisk {
  segment: string;
  category:
    | "Pricing"
    | "Onboarding"
    | "Missing Features"
    | "Poor Support"
    | "Complexity";
  reason: string;
  riskPct: number;
  fix: string;
}

export interface HeatmapZone {
  zone: string; // e.g. "Pricing table", "Hero CTA"
  confusion: number; // 0-100
  note: string;
}

export interface Insights {
  headline: string;
  avgPurchaseProbability: number;
  avgConfusion: number;
  avgChurnRisk: number;
  conversionRiskScore: number; // 0-100 (higher = worse)
  estConversionUplift: number; // % uplift if all fixes applied
  verdictBreakdown: Record<Verdict, number>;
  roleBreakdown: { role: PersonaRole; purchaseProbability: number; count: number }[];
  salesObjections: SalesObjection[];
  supportGaps: SupportGap[];
  revenueLeaks: RevenueLeak[];
  churnRisks: ChurnRisk[];
  heatmap: HeatmapZone[];
  topQuestions: string[];
}

// ---------------------------------------------------------------------------
// Competitor & pricing
// ---------------------------------------------------------------------------
export interface CompetitorAnalysis {
  you: { url: string; title: string; score: number };
  competitor: { url: string; title: string; score: number };
  winner: "you" | "competitor" | "tie";
  reason: string;
  dimensions: {
    name: string;
    you: number;
    competitor: number;
    winner: "you" | "competitor" | "tie";
  }[];
  personaPreferences: {
    role: PersonaRole;
    prefers: "you" | "competitor";
    why: string;
  }[];
}

export interface PricingSimulation {
  currentPrice: number;
  proposedPrice: number;
  expectedConversionChange: number; // %, can be negative
  expectedRevenueChange: number; // %
  recommendation: string;
  segmentReactions: { role: PersonaRole; reaction: string; willChurn: boolean }[];
  optimalPrice: number;
  curve: { price: number; conversion: number; revenueIndex: number }[];
}

// ---------------------------------------------------------------------------
// Executive report
// ---------------------------------------------------------------------------
export interface ExecutiveReport {
  executiveSummary: string;
  keyFindings: string[];
  conversionRisks: string[];
  churnRisks: string[];
  revenueLeaks: string[];
  customerQuestions: string[];
  competitorNotes: string[];
  recommendations: { title: string; detail: string; effort: Level; impact: Level }[];
  projectedUplift: string;
}

// ---------------------------------------------------------------------------
// Run state + streaming protocol
// ---------------------------------------------------------------------------
export type RunPhase =
  | "queued"
  | "analyzing"
  | "generating_personas"
  | "simulating"
  | "sales_support"
  | "revenue_churn"
  | "synthesizing"
  | "reporting"
  | "done"
  | "error";

export interface RunConfig {
  url: string;
  pricingUrl?: string;
  faqUrl?: string;
  competitorUrl?: string;
  personaCount: number;
  currentPrice?: number;
  /** Speed Run demo: fully offline, deterministic Stripe data — no crawl/LLM. */
  isDemo?: boolean;
}

export interface RunState {
  runId: string;
  config: RunConfig;
  phase: RunPhase;
  createdAt: number;
  analysis?: WebsiteAnalysis;
  personas: Persona[];
  simulations: SimulationResult[];
  insights?: Insights;
  competitor?: CompetitorAnalysis;
  report?: ExecutiveReport;
  engine: "gemini" | "mock";
  error?: string;
}

// Newline-delimited JSON events streamed from /api/run.
export type RunEvent =
  | { type: "status"; phase: RunPhase; message: string; progress: number }
  | { type: "analysis"; data: WebsiteAnalysis }
  | { type: "persona"; data: Persona; index: number; total: number }
  | { type: "thought"; agent: AgentName; text: string }
  | { type: "simulation"; data: SimulationResult }
  | { type: "metric"; key: string; value: number }
  | { type: "leak"; data: RevenueLeak }
  | { type: "objection"; data: SalesObjection }
  | { type: "insights"; data: Insights }
  | { type: "report"; data: ExecutiveReport }
  | { type: "done"; runId: string }
  | { type: "error"; message: string };

// ---------------------------------------------------------------------------
// Visual Roast (Gemini Vision over a real screenshot)
// ---------------------------------------------------------------------------
export interface RoastRegion {
  label: string;
  why: string;
  severity: Severity;
  // Gemini convention: [ymin, xmin, ymax, xmax] normalized 0-1000
  box: [number, number, number, number];
}

export interface VisionRoast {
  screenshotUrl: string;
  roast: string;
  clarityScore: number; // 0-100
  firstLook?: { x: number; y: number }; // 0-1000 where the eye lands first
  regions: RoastRegion[];
  source: "gemini-vision" | "groq-vision";
  engine?: "gemini" | "groq";
}

// ---------------------------------------------------------------------------
// Ghost Heatmap — confusion/objection points plotted on the screenshot
// (Hotjar-style). x/y are normalized PERCENTAGES (0-100) of the image box.
// ---------------------------------------------------------------------------
export interface HeatmapPoint {
  x: number; // 0-100 (% of width)
  y: number; // 0-100 (% of height)
  severity: "high" | "medium" | "low";
  label: string;
  why: string;
  personaId?: string;
}

export interface HeatmapData {
  screenshotUrl: string;
  points: HeatmapPoint[];
}

// ---------------------------------------------------------------------------
// Auto-Fix (Gemini generates optimized copy/markup for a detected problem)
// ---------------------------------------------------------------------------
export interface AutoFixVariant {
  kind: string; // e.g. "Hero headline", "Pricing blurb", "FAQ", "Trust strip"
  heading: string;
  copy: string;
  html?: string; // optional ready-to-paste Tailwind HTML snippet
}

export interface AutoFix {
  problem: string;
  rationale: string;
  variants: AutoFixVariant[];
}
