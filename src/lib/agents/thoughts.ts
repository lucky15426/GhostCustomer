import type { AgentName, Persona, SimulationResult, WebsiteAnalysis } from "@/lib/types";
import type { SiteSignals } from "@/lib/data/mock-engine";

// Curated, data-grounded "thinking" lines for the live agent stream. These
// reference the ACTUAL findings so the war room feels like real reasoning even
// without an LLM. (When Gemini is enabled the orchestrator can splice in real
// thoughts, but these guarantee a rich stream offline.)

export function analyzerThoughts(a: WebsiteAnalysis, s: SiteSignals): { agent: AgentName; text: string }[] {
  return [
    { agent: "Website Analyzer", text: `Reading ${a.url} — looks like a ${a.category.toLowerCase()}.` },
    { agent: "Website Analyzer", text: `Headline value prop: "${a.valueProps[0] ?? a.tagline}".` },
    {
      agent: "Website Analyzer",
      text: s.pricingClear
        ? `Found ${a.pricingTiers.length} pricing tiers with visible prices.`
        : `Pricing is vague or gated — no clear numbers on the page.`,
    },
    {
      agent: "Website Analyzer",
      text: s.hasSecurity
        ? `Security / compliance information is present.`
        : `No security or compliance page detected — flagging for enterprise buyers.`,
    },
    { agent: "Website Analyzer", text: `Overall content clarity scored ${a.contentScore}/100.` },
  ];
}

export function personaThoughts(count: number): { agent: AgentName; text: string }[] {
  return [
    { agent: "Persona Generator", text: `Spinning up ${count} virtual customers across 10 archetypes…` },
    { agent: "Persona Generator", text: `Calibrating budget sensitivity, technical skill, and intent per persona.` },
    { agent: "Persona Generator", text: `Each ghost gets its own goals, frustrations, and objections.` },
  ];
}

export function simulatorThought(sim: SimulationResult): { agent: AgentName; text: string } {
  const verb =
    sim.verdict === "Convert"
      ? "would buy"
      : sim.verdict === "Maybe"
        ? "is on the fence"
        : sim.verdict === "Churn Risk"
          ? "would likely churn"
          : "bounced";
  return {
    agent: "Customer Simulator",
    text: `${sim.personaName} (${sim.role}) ${verb} — ${sim.purchaseProbability}% purchase intent. ${sim.topObjection}.`,
  };
}

export function salesThoughts(a: WebsiteAnalysis, s: SiteSignals): { agent: AgentName; text: string }[] {
  const out: { agent: AgentName; text: string }[] = [];
  if (!s.hasSSO)
    out.push({ agent: "Sales Agent", text: `Asked "Do you support SSO?" — no answer on the site. Enterprise deals at risk.` });
  if (!s.pricingClear)
    out.push({ agent: "Sales Agent", text: `Prospects can't self-qualify on price — that's a silent conversion killer.` });
  if (!s.hasFreeTier)
    out.push({ agent: "Sales Agent", text: `No low-risk entry point; self-serve buyers won't commit.` });
  out.push({ agent: "Sales Agent", text: `Logged ${out.length || 1} unanswered buying questions.` });
  return out;
}

export function supportThoughts(s: SiteSignals): { agent: AgentName; text: string }[] {
  return [
    {
      agent: "Support Agent",
      text: s.hasFAQ
        ? `FAQ covers the basics but misses edge cases — some tickets will escalate.`
        : `Sparse FAQ — most questions will become support tickets.`,
    },
    {
      agent: "Support Agent",
      text: s.hasOnboarding
        ? `Onboarding exists but assumes technical fluency.`
        : `No clear onboarding path — low-skill users will get stuck and churn.`,
    },
    { agent: "Support Agent", text: `Stress-tested an angry billing escalation — no refund policy visible.` },
  ];
}

export function leakThoughts(leakCount: number): { agent: AgentName; text: string }[] {
  return [
    { agent: "Revenue Leak Agent", text: `Cross-referencing objections against conversion drop-off…` },
    { agent: "Revenue Leak Agent", text: `Detected ${leakCount} revenue leaks draining conversions.` },
  ];
}

export function insightThoughts(): { agent: AgentName; text: string }[] {
  return [
    { agent: "Insight Agent", text: `Merging signals from all agents into a unified risk model.` },
    { agent: "Insight Agent", text: `Ranking fixes by impact vs. effort.` },
  ];
}

export function reportThoughts(): { agent: AgentName; text: string }[] {
  return [{ agent: "Report Generator", text: `Drafting the executive report and recommendations…` }];
}
