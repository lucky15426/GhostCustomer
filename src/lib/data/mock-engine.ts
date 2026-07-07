// ============================================================================
// Deterministic, seeded simulation engine.
//
// This is what makes Ghost Customer AI demo-proof: with NO API keys at all it
// produces rich, varied, internally-consistent results that differ per URL.
// When GEMINI_API_KEY is present the orchestrator swaps individual stages for
// real LLM calls, but the scoring math and aggregation below are shared by
// both paths so the numbers always reconcile.
// ============================================================================

import {
  ROLE_SEEDS,
  ROLE_BY_NAME,
  FIRST_NAMES,
  LAST_NAMES,
  type RoleSeed,
} from "./persona-seeds";
import {
  avg,
  clamp,
  hashString,
  hostOf,
  makeRng,
  pick,
  pickMany,
  randInt,
} from "@/lib/utils";
import type {
  ChurnRisk,
  CompetitorAnalysis,
  ExecutiveReport,
  Insights,
  JourneyStep,
  Persona,
  PersonaRole,
  PricingSimulation,
  RevenueLeak,
  RunConfig,
  SalesObjection,
  SimulationResult,
  SupportGap,
  Verdict,
  WebsiteAnalysis,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Speed Run demo — a hand-tuned, impressive Stripe analysis. Fully offline:
// the orchestrator uses this directly in demo mode (no crawl, no LLM) so a
// hackathon demo never depends on the network. Shape matches live data exactly.
// ---------------------------------------------------------------------------
export function demoStripeAnalysis(): WebsiteAnalysis {
  return {
    url: "https://stripe.com",
    title: "Stripe",
    tagline: "Financial infrastructure to grow your revenue",
    category: "Payments & Financial Infrastructure",
    valueProps: [
      "Accept payments and move money globally with a single integration",
      "Battle-tested APIs trusted by millions of businesses worldwide",
      "Built-in fraud protection, billing, and revenue tooling out of the box",
    ],
    ctas: ["Start now", "Contact sales", "Read the docs"],
    navItems: ["Products", "Solutions", "Developers", "Resources", "Pricing", "Sign in"],
    pricingTiers: [
      {
        name: "Integrated",
        price: "2.9% + 30¢",
        period: "per successful card charge",
        highlights: ["No setup fees", "No monthly fees", "Pay only when you get paid"],
      },
      {
        name: "Custom",
        price: "Custom",
        period: "for large payment volume",
        highlights: ["Volume discounts", "Multi-product pricing", "Country-specific rates", "Dedicated support"],
      },
    ],
    faqs: [
      { q: "How fast can I start accepting payments?", a: "You can be live in minutes with a few lines of code." },
      { q: "Which payment methods are supported?", a: "100+ methods including cards, wallets, and bank debits across 135+ currencies." },
      { q: "Is Stripe secure?", a: "Stripe is a PCI Service Provider Level 1, the most stringent certification available." },
    ],
    trustSignals: [
      "Powers millions of businesses across 135+ currencies",
      "99.999% historical uptime",
      "PCI Service Provider Level 1 certified",
      "Trusted by Amazon, Shopify, OpenAI, and Marriott",
    ],
    missingTrustSignals: [
      "Transparent enterprise pricing on the page",
      "A side-by-side comparison vs. competitors",
    ],
    onboardingSteps: ["Create an account", "Add your API keys", "Drop in Checkout or Elements", "Go live"],
    detectedFeatures: ["Payments", "Billing", "Connect", "Radar fraud detection", "Issuing", "Terminal", "Tax", "Invoicing"],
    targetAudience: "Developers and finance teams at startups through global enterprises",
    toneOfVoice: "Confident, technical, precise",
    contentScore: 86,
    source: "mock",
  };
}

// ---------------------------------------------------------------------------
// Site category archetypes (drives realistic, varied analysis output)
// ---------------------------------------------------------------------------
interface Archetype {
  category: string;
  taglines: string[];
  valueProps: string[];
  features: string[];
  audience: string;
  tone: string;
}

const ARCHETYPES: Archetype[] = [
  {
    category: "B2B SaaS Platform",
    taglines: [
      "The all-in-one platform for modern teams",
      "Automate your workflow. Scale without limits.",
      "Everything your team needs, in one place",
    ],
    valueProps: [
      "Save 10+ hours a week with automation",
      "Real-time collaboration for distributed teams",
      "Enterprise-grade reliability",
      "Connect your entire tool stack",
    ],
    features: ["Dashboards", "Automation", "Integrations", "Reporting", "Team roles", "API access"],
    audience: "Operations and product teams at growing companies",
    tone: "Confident, professional, slightly playful",
  },
  {
    category: "Developer Tool",
    taglines: [
      "Ship faster with less code",
      "The developer platform for building anything",
      "From idea to production in minutes",
    ],
    valueProps: [
      "Deploy in seconds",
      "Type-safe by default",
      "Scales from prototype to production",
      "Loved by 50,000+ developers",
    ],
    features: ["CLI", "SDKs", "Webhooks", "Edge functions", "Observability", "CI/CD"],
    audience: "Software engineers and platform teams",
    tone: "Technical, direct, community-driven",
  },
  {
    category: "AI Productivity App",
    taglines: [
      "Your AI copilot for everything",
      "Work smarter with AI built in",
      "Let AI handle the busywork",
    ],
    valueProps: [
      "AI that drafts, summarizes, and analyzes",
      "Cut research time by 70%",
      "Personalized to how you work",
      "Private and secure by design",
    ],
    features: ["AI chat", "Smart search", "Auto-summaries", "Templates", "Integrations"],
    audience: "Knowledge workers, founders, and creators",
    tone: "Friendly, futuristic, benefit-led",
  },
  {
    category: "E-commerce / DTC",
    taglines: [
      "Products you'll actually love",
      "Better quality. Honest prices.",
      "Designed for everyday life",
    ],
    valueProps: [
      "Free shipping over $50",
      "30-day money-back guarantee",
      "Sustainably made",
      "Loved by 100,000+ customers",
    ],
    features: ["Free returns", "Subscriptions", "Gift cards", "Rewards", "Bundles"],
    audience: "Direct consumers shopping online",
    tone: "Warm, aspirational, trustworthy",
  },
  {
    category: "Fintech Service",
    taglines: [
      "Money that works as hard as you do",
      "Banking, reimagined",
      "Take control of your finances",
    ],
    valueProps: [
      "No hidden fees",
      "Bank-grade security",
      "Get paid up to 2 days early",
      "Track everything in one app",
    ],
    features: ["Cards", "Transfers", "Budgeting", "Savings", "Analytics"],
    audience: "Consumers and small businesses managing money",
    tone: "Reassuring, clear, security-first",
  },
];

const FAQ_BANK = [
  { q: "How much does it cost?", a: "Plans start at $29/month, billed monthly or annually." },
  { q: "Is there a free trial?", a: "Yes — a 14-day free trial, no credit card required." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel from your account settings at any time." },
  { q: "Do you offer refunds?", a: "We offer a 30-day money-back guarantee." },
  { q: "What integrations are supported?", a: "We integrate with 50+ popular tools." },
  { q: "How do I get support?", a: "Email support is available on all plans." },
];

const TRUST_BANK = [
  "Customer testimonials",
  "Logos of well-known customers",
  "Star ratings / reviews",
  "Case studies",
  "Money-back guarantee",
  "Security badge (SOC 2)",
  "GDPR compliance statement",
  "Uptime SLA",
];

const ONBOARDING_BANK = [
  "Create an account",
  "Connect your data sources",
  "Invite your team",
  "Configure your first workspace",
  "Import existing data",
  "Set up integrations",
  "Launch your first project",
];

// ---------------------------------------------------------------------------
// Website analysis
// ---------------------------------------------------------------------------
export function mockAnalyze(config: RunConfig): WebsiteAnalysis {
  const host = hostOf(config.url);
  const seed = hashString(config.url || host);
  const rng = makeRng(seed);
  const arch = ARCHETYPES[seed % ARCHETYPES.length];

  const brand = host
    .split(".")[0]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Seeded "gaps" — these are what the simulation later punishes.
  const hasFreeTier = rng() > 0.45;
  const hasSSO = rng() > 0.6;
  const hasSecurity = rng() > 0.5;
  const hasFAQ = rng() > 0.3;
  const pricingClear = rng() > 0.4;
  const trustCount = randInt(rng, 1, 4);

  const tiers = [
    ...(hasFreeTier ? [{ name: "Free", price: "$0", period: "forever", highlights: ["Up to 3 projects", "Community support"] }] : []),
    { name: "Pro", price: pricingClear ? "$29" : "Contact us", period: "per month", highlights: ["Unlimited projects", "Priority support", "Integrations"] },
    { name: "Team", price: pricingClear ? "$99" : "Custom", period: "per month", highlights: ["Everything in Pro", "Team roles", "Advanced analytics"] },
    { name: "Enterprise", price: "Custom", highlights: ["SSO & SAML", "Dedicated support", "SLA"] },
  ];

  const faqs = hasFAQ ? pickMany(rng, FAQ_BANK, randInt(rng, 3, 5)) : pickMany(rng, FAQ_BANK, 1);
  const allTrust = pickMany(rng, TRUST_BANK, trustCount);
  const missingTrust = TRUST_BANK.filter((t) => !allTrust.includes(t)).slice(0, 4);

  const nav = ["Product", "Pricing", "Customers", "Resources", "Login", "Get Started"];
  if (hasSecurity) nav.splice(3, 0, "Security");

  const contentScore = clamp(
    52 +
      (hasFreeTier ? 6 : 0) +
      (hasSSO ? 6 : 0) +
      (hasSecurity ? 8 : 0) +
      (hasFAQ ? 8 : -6) +
      (pricingClear ? 10 : -10) +
      trustCount * 3,
  );

  return {
    url: config.url,
    title: brand || "Acme",
    tagline: pick(rng, arch.taglines),
    category: arch.category,
    valueProps: pickMany(rng, arch.valueProps, 3),
    ctas: pick(rng, [["Start free trial", "Book a demo"], ["Get started", "Talk to sales"], ["Try it free", "See pricing"]]),
    navItems: nav,
    pricingTiers: tiers,
    faqs,
    trustSignals: allTrust,
    missingTrustSignals: missingTrust,
    onboardingSteps: pickMany(rng, ONBOARDING_BANK, randInt(rng, 3, 5)),
    detectedFeatures: [
      ...pickMany(rng, arch.features, randInt(rng, 4, 6)),
      ...(hasSSO ? ["SSO / SAML"] : []),
    ],
    targetAudience: arch.audience,
    toneOfVoice: arch.tone,
    contentScore,
    source: "mock",
  };
}

// ---------------------------------------------------------------------------
// Site signals derived from ANY analysis (mock, crawl, or AI). The simulator
// reads these so its scoring is identical across engines.
// ---------------------------------------------------------------------------
export interface SiteSignals {
  hasFreeTier: boolean;
  pricingClear: boolean;
  hasSSO: boolean;
  hasSecurity: boolean;
  hasFAQ: boolean;
  hasTrust: boolean;
  hasOnboarding: boolean;
  contentScore: number;
}

export function deriveSignals(a: WebsiteAnalysis): SiteSignals {
  const blob = JSON.stringify(a).toLowerCase();
  const hasFreeTier =
    a.pricingTiers.some((t) => /free|\$0|trial/i.test(`${t.name} ${t.price}`)) ||
    /free trial|free plan|free forever/.test(blob);
  const pricingClear =
    a.pricingTiers.some((t) => /\$\d/.test(t.price)) && a.pricingTiers.length >= 2;
  const hasSSO = /sso|saml|scim|single sign/.test(blob);
  const hasSecurity = /security|soc ?2|compliance|gdpr|iso ?27001|encryption/.test(blob);
  const hasFAQ = a.faqs.length >= 3;
  const hasTrust = a.trustSignals.length >= 2;
  const hasOnboarding = a.onboardingSteps.length >= 2;
  return {
    hasFreeTier,
    pricingClear,
    hasSSO,
    hasSecurity,
    hasFAQ,
    hasTrust,
    hasOnboarding,
    contentScore: a.contentScore,
  };
}

// ---------------------------------------------------------------------------
// Persona generation
// ---------------------------------------------------------------------------
export function mockPersonas(seedKey: string, count: number): Persona[] {
  const seed = hashString("personas:" + seedKey);
  const rng = makeRng(seed);
  const personas: Persona[] = [];
  for (let i = 0; i < count; i++) {
    // Weighted spread across roles, cycling so every archetype appears.
    const roleSeed = ROLE_SEEDS[i % ROLE_SEEDS.length];
    personas.push(makePersona(roleSeed, rng, i));
  }
  return personas;
}

function makePersona(s: RoleSeed, rng: () => number, i: number): Persona {
  const first = pick(rng, FIRST_NAMES);
  const last = pick(rng, LAST_NAMES);
  const name = `${first} ${last}`;
  return {
    id: `p_${i}_${hashString(name + i).toString(36)}`,
    name,
    avatarSeed: `${name}-${i}`,
    age: randInt(rng, s.ageRange[0], s.ageRange[1]),
    role: s.role,
    archetype: `${s.role} • ${pick(rng, s.industries)}`,
    companySize: randInt(rng, s.companySize[0], s.companySize[1]),
    industry: pick(rng, s.industries),
    budgetSensitivity: s.budgetSensitivity,
    technicalSkill: s.technicalSkill,
    purchaseIntent: s.purchaseIntent,
    goals: pickMany(rng, s.goals, 2),
    frustrations: pickMany(rng, s.frustrations, 2),
    objections: pickMany(rng, s.objections, 2),
    quote: pick(rng, s.objections),
    emoji: s.emoji,
    accent: s.accent,
  };
}

// ---------------------------------------------------------------------------
// Per-persona simulation
// ---------------------------------------------------------------------------
const STAGES: JourneyStep["stage"][] = ["Landing", "Pricing", "Features", "Onboarding", "Support"];

export function mockSimulate(
  persona: Persona,
  analysis: WebsiteAnalysis,
  signals: SiteSignals,
): SimulationResult {
  const rng = makeRng(hashString(persona.id + analysis.url));
  const seed = ROLE_BY_NAME[persona.role];
  const b = seed.bias;

  let interest = 40 + b.interest * 45 + (signals.contentScore - 60) * 0.4;
  let confusion = 20 + b.confusion * 35;
  let purchase = 20 + b.purchase * 55 + (signals.contentScore - 60) * 0.5;
  let support = 20 + b.support * 50;
  let churn = 10 + b.churn * 40;
  let trust = 35 + signals.contentScore * 0.4 + (signals.hasTrust ? 12 : -8);

  const objections: string[] = [];

  // Apply gap penalties tied to who the persona is.
  if (!signals.pricingClear && persona.budgetSensitivity !== "Low") {
    confusion += 18;
    purchase -= 14;
    objections.push("Pricing is unclear or hidden");
  }
  if (!signals.hasFreeTier && (persona.role === "Student" || persona.role === "Freelancer")) {
    purchase -= 22;
    churn += 8;
    objections.push("No free tier to try it");
  }
  if (!signals.hasSSO && (persona.role === "Enterprise Buyer" || persona.role === "CTO")) {
    purchase -= 20;
    confusion += 14;
    trust -= 12;
    objections.push("No SSO / SAML information found");
  }
  if (!signals.hasSecurity && (persona.role === "Enterprise Buyer" || persona.role === "CTO" || persona.role === "HR Manager")) {
    purchase -= 16;
    trust -= 16;
    objections.push("No security / compliance documentation");
  }
  if (!signals.hasFAQ) {
    confusion += 10;
    support += 14;
    objections.push("FAQs don't answer my questions");
  }
  if (!signals.hasOnboarding && persona.technicalSkill === "Low") {
    confusion += 12;
    churn += 12;
    objections.push("Unclear how to get started");
  }
  if (signals.contentScore < 60 && persona.technicalSkill === "Low") {
    confusion += 10;
  }

  // small seeded jitter so personas of the same role still differ
  const j = () => (rng() - 0.5) * 12;
  interest = clamp(interest + j());
  confusion = clamp(confusion + j());
  purchase = clamp(purchase + j());
  support = clamp(support + j());
  churn = clamp(churn + j());
  trust = clamp(trust + j());

  const verdict: Verdict =
    purchase >= 65 ? "Convert" : purchase >= 45 ? "Maybe" : churn >= 55 ? "Churn Risk" : "Bounce";

  const journey: JourneyStep[] = STAGES.map((stage) => {
    let sentiment = 30 + j() * 2;
    let note = "Explored without friction";
    if (stage === "Pricing" && !signals.pricingClear) {
      sentiment = -40 + j();
      note = "Couldn't tell what it would actually cost";
    } else if (stage === "Onboarding" && !signals.hasOnboarding) {
      sentiment = -25 + j();
      note = "Unsure what the first step is";
    } else if (stage === "Support" && !signals.hasFAQ) {
      sentiment = -20 + j();
      note = "Questions went unanswered";
    } else if (stage === "Features") {
      sentiment = clamp(interest - 30, -100, 100);
      note = interest > 60 ? "Liked the capabilities" : "Wanted more proof / detail";
    } else if (stage === "Landing") {
      sentiment = clamp(interest - 20, -100, 100);
      note = persona.role + " landed and scanned the hero";
    }
    return { stage, sentiment: clamp(sentiment, -100, 100), note };
  });

  const topObjection = objections[0] ?? pick(rng, persona.objections);
  const reasoning = buildReasoning(persona, { interest, confusion, purchase }, objections);

  return {
    personaId: persona.id,
    personaName: persona.name,
    role: persona.role,
    interestScore: interest,
    confusionScore: confusion,
    purchaseProbability: purchase,
    supportDependency: support,
    churnRisk: churn,
    trustScore: trust,
    verdict,
    topObjection,
    reasoning,
    journey,
  };
}

function buildReasoning(
  persona: Persona,
  s: { interest: number; confusion: number; purchase: number },
  objections: string[],
): string {
  const lead =
    s.purchase >= 65
      ? `As a ${persona.role.toLowerCase()}, this looks like a strong fit.`
      : s.purchase >= 45
        ? `As a ${persona.role.toLowerCase()}, I'm interested but not convinced yet.`
        : `As a ${persona.role.toLowerCase()}, I'm not ready to buy this.`;
  const block = objections.length
    ? ` My main blocker: ${objections[0].toLowerCase()}.`
    : ` It mostly answered my questions.`;
  const close =
    s.confusion > 55
      ? " A few things on the page left me confused."
      : " The messaging was reasonably clear.";
  return lead + block + close;
}

// ---------------------------------------------------------------------------
// Insight aggregation (shared by mock + AI paths)
// ---------------------------------------------------------------------------
export function buildInsights(
  analysis: WebsiteAnalysis,
  personas: Persona[],
  sims: SimulationResult[],
): Insights {
  const signals = deriveSignals(analysis);
  const avgPurchase = avg(sims.map((s) => s.purchaseProbability));
  const avgConfusion = avg(sims.map((s) => s.confusionScore));
  const avgChurn = avg(sims.map((s) => s.churnRisk));

  const verdictBreakdown: Record<Verdict, number> = {
    Convert: 0,
    Maybe: 0,
    "Churn Risk": 0,
    Bounce: 0,
  };
  sims.forEach((s) => (verdictBreakdown[s.verdict] += 1));

  // role breakdown
  const roleMap = new Map<PersonaRole, number[]>();
  sims.forEach((s) => {
    const arr = roleMap.get(s.role) ?? [];
    arr.push(s.purchaseProbability);
    roleMap.set(s.role, arr);
  });
  const roleBreakdown = [...roleMap.entries()]
    .map(([role, arr]) => ({ role, purchaseProbability: avg(arr), count: arr.length }))
    .sort((a, b) => a.purchaseProbability - b.purchaseProbability);

  const total = sims.length || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  // Sales objections derived from signal gaps
  const salesObjections: SalesObjection[] = [];
  if (!signals.hasSSO)
    salesObjections.push({
      question: "Do you support SSO / SAML?",
      answeredOnSite: false,
      impact: "Enterprise & CTO buyers cannot validate access management and may not convert.",
      affectedRoles: ["Enterprise Buyer", "CTO"],
      severity: "high",
    });
  if (!signals.hasSecurity)
    salesObjections.push({
      question: "Where is your security & compliance documentation?",
      answeredOnSite: false,
      impact: "Security-sensitive buyers drop off without a trust anchor.",
      affectedRoles: ["Enterprise Buyer", "CTO", "HR Manager"],
      severity: "critical",
    });
  if (!signals.pricingClear)
    salesObjections.push({
      question: "What will this actually cost me?",
      answeredOnSite: false,
      impact: "Hidden pricing creates hesitation across budget-sensitive segments.",
      affectedRoles: ["Startup Founder", "Small Business Owner", "Freelancer"],
      severity: "high",
    });
  if (!signals.hasFreeTier)
    salesObjections.push({
      question: "Is there a free way to try it?",
      answeredOnSite: false,
      impact: "Self-serve segments won't commit without a no-risk trial.",
      affectedRoles: ["Student", "Freelancer", "Startup Founder"],
      severity: "medium",
    });
  salesObjections.push({
    question: "How is this different from alternatives?",
    answeredOnSite: signals.contentScore > 70,
    impact: "Weak differentiation increases comparison-shopping and stalls deals.",
    affectedRoles: ["Product Manager", "Operations Manager"],
    severity: signals.contentScore > 70 ? "low" : "medium",
  });

  const supportGaps: SupportGap[] = [
    {
      scenario: "Customer asks a question not covered in the FAQ",
      faqCoverage: signals.hasFAQ ? 62 : 24,
      docQuality: clamp(signals.contentScore - 10),
      risk: signals.hasFAQ
        ? "Some edge-case questions still require human support."
        : "Most questions will become support tickets — high deflection failure.",
      severity: signals.hasFAQ ? "medium" : "high",
    },
    {
      scenario: "Non-technical user tries to self-onboard",
      faqCoverage: signals.hasOnboarding ? 58 : 30,
      docQuality: signals.hasOnboarding ? 64 : 36,
      risk: signals.hasOnboarding
        ? "Onboarding exists but assumes some technical fluency."
        : "No clear onboarding path — low-skill users will churn early.",
      severity: signals.hasOnboarding ? "medium" : "high",
    },
    {
      scenario: "Angry customer escalates a billing issue",
      faqCoverage: 40,
      docQuality: 48,
      risk: "No visible escalation or refund policy heightens churn on conflict.",
      severity: "medium",
    },
  ];

  // Revenue leaks
  const revenueLeaks: RevenueLeak[] = [];
  if (!signals.pricingClear)
    revenueLeaks.push({
      title: "Pricing uncertainty",
      cause: "No transparent, self-serve pricing on the site.",
      affectedPct: pct(sims.filter((s) => s.confusionScore > 55).length),
      estConversionLoss: 18,
      estRevenueImpact: "High",
      severity: "high",
      fix: "Publish clear pricing tiers with what's included in each.",
    });
  if (!signals.hasFreeTier)
    revenueLeaks.push({
      title: "No low-risk entry point",
      cause: "No free tier or no-card trial for self-serve users.",
      affectedPct: pct(sims.filter((s) => ["Student", "Freelancer", "Startup Founder"].includes(s.role)).length),
      estConversionLoss: 12,
      estRevenueImpact: "Medium",
      severity: "medium",
      fix: "Add a free trial (no credit card) or a free tier.",
    });
  if (!signals.hasSecurity)
    revenueLeaks.push({
      title: "Missing trust anchors for big deals",
      cause: "No security/compliance page for enterprise evaluation.",
      affectedPct: pct(sims.filter((s) => ["Enterprise Buyer", "CTO", "HR Manager"].includes(s.role)).length),
      estConversionLoss: 15,
      estRevenueImpact: "High",
      severity: "high",
      fix: "Add a Security page covering SOC 2, encryption, SSO, and data handling.",
    });
  if (analysis.missingTrustSignals.length > 2)
    revenueLeaks.push({
      title: "Weak social proof",
      cause: `Missing ${analysis.missingTrustSignals.slice(0, 3).join(", ").toLowerCase()}.`,
      affectedPct: pct(sims.filter((s) => s.trustScore < 50).length),
      estConversionLoss: 9,
      estRevenueImpact: "Medium",
      severity: "medium",
      fix: "Add testimonials, customer logos, and review ratings near CTAs.",
    });

  // Churn risks
  const churnRisks: ChurnRisk[] = [];
  const worstRoles = roleBreakdown.slice(0, 3);
  for (const r of worstRoles) {
    if (r.purchaseProbability >= 55) continue;
    const cat =
      r.role === "Small Business Owner" || r.role === "HR Manager"
        ? "Onboarding"
        : r.role === "Student" || r.role === "Freelancer"
          ? "Pricing"
          : r.role === "Enterprise Buyer" || r.role === "CTO"
            ? "Missing Features"
            : "Complexity";
    churnRisks.push({
      segment: r.role,
      category: cat as ChurnRisk["category"],
      reason:
        cat === "Onboarding"
          ? "Onboarding is too complex for non-technical users."
          : cat === "Pricing"
            ? "Price-sensitive and no low-cost entry point."
            : cat === "Missing Features"
              ? "Couldn't confirm enterprise-grade capabilities (SSO/security)."
              : "Product feels overwhelming at first contact.",
      riskPct: clamp(100 - r.purchaseProbability),
      fix:
        cat === "Onboarding"
          ? "Add a guided setup wizard and a 'first 5 minutes' checklist."
          : cat === "Pricing"
            ? "Introduce a starter tier and annual discount."
            : cat === "Missing Features"
              ? "Surface security & integration capabilities prominently."
              : "Add progressive onboarding and contextual tooltips.",
    });
  }

  const heatmap = [
    { zone: "Pricing table", confusion: signals.pricingClear ? 28 : 78, note: signals.pricingClear ? "Mostly clear" : "Biggest source of confusion" },
    { zone: "Hero / value prop", confusion: clamp(70 - signals.contentScore), note: "How fast visitors 'get it'" },
    { zone: "Feature section", confusion: clamp(60 - signals.contentScore * 0.5), note: "Capability clarity" },
    { zone: "Onboarding / get-started", confusion: signals.hasOnboarding ? 34 : 66, note: signals.hasOnboarding ? "Path exists" : "Unclear next step" },
    { zone: "Security / trust", confusion: signals.hasSecurity ? 22 : 82, note: signals.hasSecurity ? "Present" : "Missing for enterprise" },
    { zone: "FAQ / support", confusion: signals.hasFAQ ? 30 : 70, note: signals.hasFAQ ? "Covers basics" : "Sparse" },
  ];

  const topQuestions = [
    ...salesObjections.filter((o) => !o.answeredOnSite).map((o) => o.question),
    "Can I import my existing data?",
    "How long does setup take?",
    "What happens after the trial ends?",
  ].slice(0, 8);

  const conversionRiskScore = clamp(100 - avgPurchase * 0.7 - (100 - avgConfusion) * 0.3 + avgChurn * 0.2);
  const estConversionUplift = clamp(
    revenueLeaks.reduce((a, l) => a + l.estConversionLoss, 0) * 0.7,
    0,
    40,
  );

  const convPct = pct(verdictBreakdown.Convert);
  const confusedPct = pct(sims.filter((s) => s.confusionScore > 55).length);
  const headline =
    confusedPct >= 40
      ? `${confusedPct}% of simulated customers were confused — mostly about ${signals.pricingClear ? "what to do next" : "pricing"}.`
      : `${convPct}% of simulated customers would convert; the rest hit fixable blockers.`;

  return {
    headline,
    avgPurchaseProbability: avgPurchase,
    avgConfusion,
    avgChurnRisk: avgChurn,
    conversionRiskScore,
    estConversionUplift,
    verdictBreakdown,
    roleBreakdown,
    salesObjections,
    supportGaps,
    revenueLeaks,
    churnRisks,
    heatmap,
    topQuestions,
  };
}

// ---------------------------------------------------------------------------
// Competitor analysis
// ---------------------------------------------------------------------------
/**
 * Build a head-to-head from TWO real `WebsiteAnalysis` objects. Both sides
 * should be produced by the same crawl + Gemini path (`aiAnalyze`) so the
 * comparison reflects real sites, not a fabricated competitor. If a caller
 * cannot crawl the competitor it may pass `mockAnalyze({url})` explicitly, but
 * the default product path now analyzes both.
 */
export function buildCompetitor(
  youUrl: string,
  compUrl: string,
  youAnalysis: WebsiteAnalysis,
  compAnalysis: WebsiteAnalysis,
): CompetitorAnalysis {
  const youScore = youAnalysis.contentScore;
  const compScore = compAnalysis.contentScore;

  const dims = [
    { name: "Pricing clarity", you: scoreDim(youAnalysis, "pricing"), competitor: scoreDim(compAnalysis, "pricing") },
    { name: "Trust & security", you: scoreDim(youAnalysis, "trust"), competitor: scoreDim(compAnalysis, "trust") },
    { name: "Onboarding", you: scoreDim(youAnalysis, "onboarding"), competitor: scoreDim(compAnalysis, "onboarding") },
    { name: "Feature clarity", you: scoreDim(youAnalysis, "features"), competitor: scoreDim(compAnalysis, "features") },
    { name: "Messaging", you: clamp(youScore + 4), competitor: clamp(compScore + 4) },
  ].map((d) => ({
    ...d,
    winner: (d.you > d.competitor ? "you" : d.you < d.competitor ? "competitor" : "tie") as "you" | "competitor" | "tie",
  }));

  const youWins = dims.filter((d) => d.winner === "you").length;
  const compWins = dims.filter((d) => d.winner === "competitor").length;
  const winner = youWins > compWins ? "you" : compWins > youWins ? "competitor" : "tie";

  const personaPreferences = ROLE_SEEDS.slice(0, 6).map((s) => {
    const rng = makeRng(hashString(s.role + youUrl + compUrl));
    const prefersYou = (youScore + rng() * 20) > (compScore + rng() * 20);
    return {
      role: s.role,
      prefers: (prefersYou ? "you" : "competitor") as "you" | "competitor",
      why: prefersYou
        ? `Your ${pick(rng, ["pricing", "messaging", "onboarding"])} resonated more with this segment.`
        : `Competitor's ${pick(rng, ["clarity", "trust signals", "free tier"])} won this segment.`,
    };
  });

  const reason =
    winner === "competitor"
      ? `Competitor leads on ${dims.filter((d) => d.winner === "competitor").map((d) => d.name.toLowerCase()).slice(0, 2).join(" and ")}.`
      : winner === "you"
        ? `You lead on ${dims.filter((d) => d.winner === "you").map((d) => d.name.toLowerCase()).slice(0, 2).join(" and ")}.`
        : "It's close — segments are split.";

  return {
    you: { url: youUrl, title: youAnalysis.title, score: youScore },
    competitor: { url: compUrl, title: compAnalysis.title, score: compScore },
    winner,
    reason,
    dimensions: dims,
    personaPreferences,
  };
}

function scoreDim(a: WebsiteAnalysis, dim: "pricing" | "trust" | "onboarding" | "features"): number {
  const s = deriveSignals(a);
  switch (dim) {
    case "pricing":
      return clamp((s.pricingClear ? 70 : 35) + (s.hasFreeTier ? 15 : 0));
    case "trust":
      return clamp((s.hasSecurity ? 45 : 15) + (s.hasTrust ? 30 : 5) + (s.hasSSO ? 15 : 0));
    case "onboarding":
      return clamp(s.hasOnboarding ? 68 : 38);
    case "features":
      return clamp(40 + a.detectedFeatures.length * 6);
  }
}

// ---------------------------------------------------------------------------
// Pricing time-machine
// ---------------------------------------------------------------------------
export function mockPricing(current: number, proposed: number): PricingSimulation {
  // Simple constant-elasticity-ish demand model around an anchor.
  const elasticity = -1.15;
  const demand = (p: number) => Math.max(0.05, Math.pow(p / current, elasticity));
  const baseConv = 1;
  const newConv = demand(proposed);
  const conversionChange = Math.round((newConv / baseConv - 1) * 100);
  const revenueChange = Math.round(((proposed * newConv) / (current * baseConv) - 1) * 100);

  const curve: PricingSimulation["curve"] = [];
  let optimalPrice = current;
  let bestRev = -Infinity;
  for (let p = Math.max(5, Math.round(current * 0.4)); p <= Math.round(current * 2.2); p += Math.max(1, Math.round(current * 0.1))) {
    const conv = demand(p);
    const rev = p * conv;
    curve.push({ price: p, conversion: clamp(conv * 60, 0, 100), revenueIndex: Math.round(rev) });
    if (rev > bestRev) {
      bestRev = rev;
      optimalPrice = p;
    }
  }

  const segmentReactions = ROLE_SEEDS.slice(0, 6).map((s) => {
    const sensitive = s.budgetSensitivity === "High";
    const willChurn = sensitive && proposed > current * 1.2;
    return {
      role: s.role,
      reaction: willChurn
        ? "Would look for a cheaper alternative."
        : proposed < current
          ? "Happy — sees better value."
          : sensitive
            ? "Hesitant but might stay if value is clear."
            : "Largely price-insensitive; unaffected.",
      willChurn,
    };
  });

  const recommendation =
    revenueChange > 0 && conversionChange > -20
      ? `Raise price toward $${optimalPrice}. Revenue improves even as some price-sensitive users drop.`
      : revenueChange > 0
        ? `$${proposed} lifts revenue but loses ${Math.abs(conversionChange)}% of conversions — protect price-sensitive segments with a starter tier.`
        : `Hold or lower price; $${proposed} reduces both conversion and revenue.`;

  return {
    currentPrice: current,
    proposedPrice: proposed,
    expectedConversionChange: conversionChange,
    expectedRevenueChange: revenueChange,
    recommendation,
    segmentReactions,
    optimalPrice,
    curve,
  };
}

// ---------------------------------------------------------------------------
// Executive report
// ---------------------------------------------------------------------------
export function buildReport(
  analysis: WebsiteAnalysis,
  insights: Insights,
  competitor?: CompetitorAnalysis,
): ExecutiveReport {
  const recs = [
    ...insights.revenueLeaks.map((l) => ({
      title: `Fix: ${l.title}`,
      detail: l.fix,
      effort: (l.severity === "critical" || l.severity === "high" ? "Medium" : "Low") as ExecutiveReport["recommendations"][number]["effort"],
      impact: (l.estConversionLoss > 14 ? "High" : l.estConversionLoss > 9 ? "Medium" : "Low") as ExecutiveReport["recommendations"][number]["impact"],
    })),
    ...insights.churnRisks.slice(0, 2).map((c) => ({
      title: `Reduce churn in ${c.segment}`,
      detail: c.fix,
      effort: "Medium" as const,
      impact: "High" as const,
    })),
  ].slice(0, 6);

  return {
    executiveSummary: `${analysis.title} (${analysis.category}) was evaluated by ${
      insights.verdictBreakdown.Convert +
      insights.verdictBreakdown.Maybe +
      insights.verdictBreakdown["Churn Risk"] +
      insights.verdictBreakdown.Bounce
    } simulated customers. Average purchase probability is ${insights.avgPurchaseProbability}% with a conversion-risk score of ${insights.conversionRiskScore}/100. ${insights.headline} Addressing the top revenue leaks could lift conversion by an estimated ${insights.estConversionUplift}%.`,
    keyFindings: [
      insights.headline,
      `Highest-risk segment: ${insights.roleBreakdown[0]?.role ?? "n/a"} (${insights.roleBreakdown[0]?.purchaseProbability ?? 0}% purchase probability).`,
      `${insights.salesObjections.filter((o) => !o.answeredOnSite).length} common buyer questions are not answered on the site.`,
      `Average customer confusion is ${insights.avgConfusion}%.`,
    ],
    conversionRisks: insights.salesObjections
      .filter((o) => !o.answeredOnSite)
      .map((o) => `${o.question} — ${o.impact}`),
    churnRisks: insights.churnRisks.map((c) => `${c.segment}: ${c.reason} (${c.riskPct}% risk)`),
    revenueLeaks: insights.revenueLeaks.map((l) => `${l.title}: ~${l.estConversionLoss}% conversion at risk (${l.affectedPct}% of customers).`),
    customerQuestions: insights.topQuestions,
    competitorNotes: competitor
      ? [
          `Overall winner: ${competitor.winner === "you" ? competitor.you.title : competitor.winner === "competitor" ? competitor.competitor.title : "Tie"}. ${competitor.reason}`,
          ...competitor.dimensions.map((d) => `${d.name}: you ${d.you} vs competitor ${d.competitor}.`),
        ]
      : ["No competitor analysis was run for this report."],
    recommendations: recs,
    projectedUplift: `~${insights.estConversionUplift}% conversion uplift if the top ${recs.length} recommendations are implemented.`,
  };
}
