import {
  Globe,
  Users,
  Activity,
  DollarSign,
  LifeBuoy,
  TrendingDown,
  Sparkles,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { AgentName, RunPhase } from "@/lib/types";

export interface AgentMeta {
  name: AgentName;
  short: string;
  icon: LucideIcon;
  color: string;
  phases: RunPhase[]; // phases during which this agent is "active"
}

// Monochrome graphite scale with two restrained signal accents
// (Revenue Leak = red, Insight = blue) — matches the "OpenAI reasoning trace" feel.
export const AGENTS: AgentMeta[] = [
  { name: "Website Analyzer", short: "Analyzer", icon: Globe, color: "#27272a", phases: ["analyzing"] },
  { name: "Persona Generator", short: "Personas", icon: Users, color: "#3f3f46", phases: ["generating_personas"] },
  { name: "Customer Simulator", short: "Swarm", icon: Activity, color: "#52525b", phases: ["simulating"] },
  { name: "Sales Agent", short: "Sales", icon: DollarSign, color: "#3f3f46", phases: ["sales_support"] },
  { name: "Support Agent", short: "Support", icon: LifeBuoy, color: "#4b5563", phases: ["sales_support"] },
  { name: "Revenue Leak Agent", short: "Revenue", icon: TrendingDown, color: "#991b1b", phases: ["revenue_churn"] },
  { name: "Insight Agent", short: "Insights", icon: Sparkles, color: "#1e3a8a", phases: ["synthesizing"] },
  { name: "Report Generator", short: "Report", icon: FileText, color: "#18181b", phases: ["reporting"] },
];

export const AGENT_BY_NAME: Record<AgentName, AgentMeta> = Object.fromEntries(
  AGENTS.map((a) => [a.name, a]),
) as Record<AgentName, AgentMeta>;

const PHASE_ORDER: RunPhase[] = [
  "queued",
  "analyzing",
  "generating_personas",
  "simulating",
  "sales_support",
  "revenue_churn",
  "synthesizing",
  "reporting",
  "done",
];

export function phaseIndex(p: RunPhase): number {
  const i = PHASE_ORDER.indexOf(p);
  return i < 0 ? 0 : i;
}

export type AgentStatus = "idle" | "active" | "done";

export function agentStatus(agent: AgentMeta, current: RunPhase): AgentStatus {
  const cur = phaseIndex(current);
  const agentPhase = phaseIndex(agent.phases[agent.phases.length - 1]);
  if (current === "done") return "done";
  if (agent.phases.includes(current)) return "active";
  return cur > agentPhase ? "done" : "idle";
}
