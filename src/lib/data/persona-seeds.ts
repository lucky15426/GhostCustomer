import type { Level, PersonaRole } from "@/lib/types";

export interface RoleSeed {
  role: PersonaRole;
  emoji: string;
  accent: string;
  ageRange: [number, number];
  companySize: [number, number];
  industries: string[];
  budgetSensitivity: Level;
  technicalSkill: Level;
  purchaseIntent: Level;
  goals: string[];
  frustrations: string[];
  objections: string[];
  // Bias applied during simulation: how this role tends to score (0..1 multipliers).
  bias: { interest: number; confusion: number; purchase: number; support: number; churn: number };
}

export const FIRST_NAMES = [
  "Sarah", "Marcus", "Priya", "Diego", "Aisha", "Liam", "Chen", "Fatima",
  "Noah", "Yuki", "Omar", "Elena", "Kwame", "Hana", "Ivan", "Maya",
  "Tariq", "Sofia", "Daniel", "Leila", "Mateo", "Nadia", "Ethan", "Zara",
  "Lucas", "Amara", "Felix", "Ingrid", "Rohan", "Camila", "Jonas", "Mei",
];

export const LAST_NAMES = [
  "Chen", "Okafor", "Patel", "Rossi", "Khan", "Müller", "Silva", "Nguyen",
  "Kim", "Haddad", "Larsson", "Mwangi", "Costa", "Volkov", "Reyes", "Tanaka",
];

export const ROLE_SEEDS: RoleSeed[] = [
  {
    role: "Startup Founder",
    emoji: "🚀",
    accent: "#8b5cf6",
    ageRange: [26, 40],
    companySize: [2, 25],
    industries: ["SaaS", "Fintech", "Marketplace", "DevTools", "AI"],
    budgetSensitivity: "Medium",
    technicalSkill: "High",
    purchaseIntent: "High",
    goals: [
      "Ship faster without growing headcount",
      "Find tools that scale with the company",
      "Prove ROI to investors quickly",
      "Reduce time-to-value on day one",
    ],
    frustrations: [
      "Pricing that hides the real cost until checkout",
      "No self-serve trial",
      "Vague feature lists with no proof",
      "Sales calls required just to see pricing",
    ],
    objections: [
      "Is this going to lock me in?",
      "Will this still work at 10x our size?",
      "Why is there no transparent pricing?",
    ],
    bias: { interest: 0.92, confusion: 0.55, purchase: 0.78, support: 0.35, churn: 0.22 },
  },
  {
    role: "CTO",
    emoji: "🧠",
    accent: "#6366f1",
    ageRange: [33, 52],
    companySize: [40, 800],
    industries: ["Enterprise SaaS", "Healthcare", "Finance", "Logistics"],
    budgetSensitivity: "Low",
    technicalSkill: "High",
    purchaseIntent: "Medium",
    goals: [
      "Confirm security and compliance posture",
      "Validate the integration and API story",
      "Assess long-term architectural fit",
    ],
    frustrations: [
      "No SOC 2 / security page",
      "Missing API or SDK documentation",
      "Unclear data residency and SSO support",
    ],
    objections: [
      "Do you support SSO / SAML?",
      "Where is your security documentation?",
      "Can this integrate with our stack?",
    ],
    bias: { interest: 0.7, confusion: 0.6, purchase: 0.52, support: 0.5, churn: 0.3 },
  },
  {
    role: "Product Manager",
    emoji: "🧭",
    accent: "#d6d6da",
    ageRange: [28, 45],
    companySize: [20, 400],
    industries: ["SaaS", "E-commerce", "Media", "EdTech"],
    budgetSensitivity: "Medium",
    technicalSkill: "Medium",
    purchaseIntent: "Medium",
    goals: [
      "Understand exactly what the product does",
      "See how it fits the existing workflow",
      "Find a clear comparison vs. alternatives",
    ],
    frustrations: [
      "Buzzwords instead of concrete capabilities",
      "No screenshots or product tour",
      "Can't tell which plan has which feature",
    ],
    objections: [
      "What does this actually do differently?",
      "Which plan includes the feature I need?",
      "Is there a product demo I can watch?",
    ],
    bias: { interest: 0.8, confusion: 0.62, purchase: 0.58, support: 0.4, churn: 0.28 },
  },
  {
    role: "Agency Owner",
    emoji: "🎯",
    accent: "#a6a6ae",
    ageRange: [30, 50],
    companySize: [5, 60],
    industries: ["Marketing", "Design", "Consulting", "Dev Agency"],
    budgetSensitivity: "Medium",
    technicalSkill: "Medium",
    purchaseIntent: "High",
    goals: [
      "Resell or use across many clients",
      "White-label or multi-seat support",
      "Predictable per-client cost",
    ],
    frustrations: [
      "No team / multi-workspace pricing",
      "Per-seat costs that explode with clients",
      "No partner or agency program",
    ],
    objections: [
      "Can I manage multiple clients in one account?",
      "Is there volume or agency pricing?",
      "Can I white-label this?",
    ],
    bias: { interest: 0.82, confusion: 0.5, purchase: 0.7, support: 0.45, churn: 0.32 },
  },
  {
    role: "Student",
    emoji: "🎓",
    accent: "#f2f2f4",
    ageRange: [18, 26],
    companySize: [1, 1],
    industries: ["Education", "Personal", "Side Project"],
    budgetSensitivity: "High",
    technicalSkill: "Medium",
    purchaseIntent: "Low",
    goals: [
      "Find a free or student plan",
      "Learn the tool for a project",
      "Avoid any credit card requirement",
    ],
    frustrations: [
      "No free tier",
      "Credit card required just to try",
      "Expensive for an individual",
    ],
    objections: [
      "Is there a free or student plan?",
      "Do I need a credit card to start?",
      "Is this affordable for one person?",
    ],
    bias: { interest: 0.6, confusion: 0.5, purchase: 0.28, support: 0.55, churn: 0.5 },
  },
  {
    role: "Small Business Owner",
    emoji: "🏪",
    accent: "#6f6f77",
    ageRange: [30, 58],
    companySize: [2, 30],
    industries: ["Retail", "Hospitality", "Local Services", "E-commerce"],
    budgetSensitivity: "High",
    technicalSkill: "Low",
    purchaseIntent: "Medium",
    goals: [
      "Solve one concrete problem cheaply",
      "Get set up without technical help",
      "See clear, simple pricing",
    ],
    frustrations: [
      "Too technical / jargon heavy",
      "Feels built for big companies",
      "Pricing feels expensive for value",
    ],
    objections: [
      "Is this too complicated for me?",
      "Why does it cost this much?",
      "Will I need a developer to set it up?",
    ],
    bias: { interest: 0.66, confusion: 0.78, purchase: 0.42, support: 0.72, churn: 0.48 },
  },
  {
    role: "Enterprise Buyer",
    emoji: "🏢",
    accent: "#818cf8",
    ageRange: [38, 58],
    companySize: [800, 12000],
    industries: ["Banking", "Insurance", "Government", "Pharma", "Telecom"],
    budgetSensitivity: "Low",
    technicalSkill: "Medium",
    purchaseIntent: "Medium",
    goals: [
      "Confirm enterprise readiness & compliance",
      "Find security, SSO, SLA, and procurement info",
      "Validate vendor stability and support",
    ],
    frustrations: [
      "No SSO / SAML / SCIM information",
      "No security or compliance page",
      "No mention of SLAs or dedicated support",
    ],
    objections: [
      "Do you offer SSO and SAML?",
      "Where can I find your security & compliance docs?",
      "What SLA and support tier do you provide?",
    ],
    bias: { interest: 0.64, confusion: 0.7, purchase: 0.38, support: 0.6, churn: 0.26 },
  },
  {
    role: "Operations Manager",
    emoji: "⚙️",
    accent: "#2dd4bf",
    ageRange: [30, 50],
    companySize: [50, 1500],
    industries: ["Logistics", "Manufacturing", "Retail Ops", "Healthcare"],
    budgetSensitivity: "Medium",
    technicalSkill: "Medium",
    purchaseIntent: "Medium",
    goals: [
      "Reduce manual work and errors",
      "Understand rollout effort across the team",
      "See integrations with existing tools",
    ],
    frustrations: [
      "Unclear onboarding / migration path",
      "No info on team training",
      "Hard to estimate total cost of ownership",
    ],
    objections: [
      "How long does rollout take?",
      "Does it integrate with our current tools?",
      "What's the real total cost?",
    ],
    bias: { interest: 0.74, confusion: 0.66, purchase: 0.55, support: 0.58, churn: 0.34 },
  },
  {
    role: "HR Manager",
    emoji: "🧑‍💼",
    accent: "#f472b6",
    ageRange: [30, 52],
    companySize: [30, 2000],
    industries: ["HR Tech", "Services", "Tech", "Healthcare"],
    budgetSensitivity: "Medium",
    technicalSkill: "Low",
    purchaseIntent: "Medium",
    goals: [
      "Improve a people process without IT help",
      "Ensure data privacy / GDPR compliance",
      "Easy adoption for non-technical staff",
    ],
    frustrations: [
      "No privacy / GDPR statement",
      "Looks like it needs engineering to use",
      "No evidence other HR teams use it",
    ],
    objections: [
      "Is employee data handled safely?",
      "Can my team use this without IT?",
      "Are you GDPR compliant?",
    ],
    bias: { interest: 0.68, confusion: 0.72, purchase: 0.46, support: 0.66, churn: 0.4 },
  },
  {
    role: "Freelancer",
    emoji: "💼",
    accent: "#a78bfa",
    ageRange: [24, 45],
    companySize: [1, 3],
    industries: ["Design", "Writing", "Dev", "Marketing", "Consulting"],
    budgetSensitivity: "High",
    technicalSkill: "Medium",
    purchaseIntent: "Medium",
    goals: [
      "Pay only for what they use",
      "Look professional to clients",
      "Start instantly, cancel anytime",
    ],
    frustrations: [
      "Minimum seats or annual lock-in",
      "No monthly option",
      "Overkill features they pay for but never use",
    ],
    objections: [
      "Is there a monthly, cancel-anytime plan?",
      "Am I paying for features I won't use?",
      "Is there a minimum commitment?",
    ],
    bias: { interest: 0.7, confusion: 0.5, purchase: 0.5, support: 0.45, churn: 0.44 },
  },
];

export const ROLE_BY_NAME: Record<PersonaRole, RoleSeed> = Object.fromEntries(
  ROLE_SEEDS.map((s) => [s.role, s]),
) as Record<PersonaRole, RoleSeed>;
