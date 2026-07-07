"""
Ghost Customer AI — Pydantic v2 domain models.

These mirror the TypeScript contract in `src/lib/types.ts` *field-for-field*.
Every field uses the EXACT camelCase name the frontend expects so that
`model.model_dump()` produces JSON the Next.js app can consume directly.

Design notes
------------
* We avoid Pydantic aliases and just declare the camelCase names verbatim;
  this keeps the JSON identical on the wire with zero serialization config.
* `Literal[...]` unions mirror the TS string-literal unions so invalid values
  fail fast during validation.
* A handful of reserved-word collisions (none here) would use `model_config`
  with `populate_by_name`; we don't need it because no field clashes with a
  Python keyword.
"""

from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Primitive unions (kept identical to src/lib/types.ts)
# ---------------------------------------------------------------------------
Level = Literal["Low", "Medium", "High"]

PersonaRole = Literal[
    "Startup Founder",
    "CTO",
    "Product Manager",
    "Agency Owner",
    "Student",
    "Small Business Owner",
    "Enterprise Buyer",
    "Operations Manager",
    "HR Manager",
    "Freelancer",
]

# Canonical ordered list of the 10 roles — used by the mock engine to fan out
# personas deterministically.
PERSONA_ROLES: List[str] = [
    "Startup Founder",
    "CTO",
    "Product Manager",
    "Agency Owner",
    "Student",
    "Small Business Owner",
    "Enterprise Buyer",
    "Operations Manager",
    "HR Manager",
    "Freelancer",
]

AgentName = Literal[
    "Website Analyzer",
    "Persona Generator",
    "Customer Simulator",
    "Sales Agent",
    "Support Agent",
    "Revenue Leak Agent",
    "Churn Agent",
    "Insight Agent",
    "Report Generator",
]

Verdict = Literal["Convert", "Maybe", "Churn Risk", "Bounce"]

JourneyStage = Literal["Landing", "Pricing", "Features", "Onboarding", "Support"]

Severity = Literal["low", "medium", "high", "critical"]

ChurnCategory = Literal[
    "Pricing",
    "Onboarding",
    "Missing Features",
    "Poor Support",
    "Complexity",
]

RunPhase = Literal[
    "queued",
    "analyzing",
    "generating_personas",
    "simulating",
    "sales_support",
    "revenue_churn",
    "synthesizing",
    "reporting",
    "done",
    "error",
]

WinnerSide = Literal["you", "competitor", "tie"]


# ---------------------------------------------------------------------------
# Website intelligence
# ---------------------------------------------------------------------------
class PricingTier(BaseModel):
    name: str
    price: str
    period: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)


class Faq(BaseModel):
    q: str
    a: str


class WebsiteAnalysis(BaseModel):
    url: str
    title: str
    tagline: str
    category: str
    valueProps: List[str] = Field(default_factory=list)
    ctas: List[str] = Field(default_factory=list)
    navItems: List[str] = Field(default_factory=list)
    pricingTiers: List[PricingTier] = Field(default_factory=list)
    faqs: List[Faq] = Field(default_factory=list)
    trustSignals: List[str] = Field(default_factory=list)
    missingTrustSignals: List[str] = Field(default_factory=list)
    onboardingSteps: List[str] = Field(default_factory=list)
    detectedFeatures: List[str] = Field(default_factory=list)
    targetAudience: str = ""
    toneOfVoice: str = ""
    contentScore: int = 0  # 0-100 overall clarity of the site
    source: Literal["firecrawl", "fetch", "mock"] = "mock"


# ---------------------------------------------------------------------------
# Personas
# ---------------------------------------------------------------------------
class Persona(BaseModel):
    id: str
    name: str
    avatarSeed: str
    age: int
    role: PersonaRole
    archetype: str
    companySize: int
    industry: str
    budgetSensitivity: Level
    technicalSkill: Level
    purchaseIntent: Level
    goals: List[str] = Field(default_factory=list)
    frustrations: List[str] = Field(default_factory=list)
    objections: List[str] = Field(default_factory=list)
    quote: str = ""
    emoji: str = ""
    accent: str = "#7c3aed"  # hex used for the persona card glow


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------
class JourneyStep(BaseModel):
    stage: JourneyStage
    sentiment: int  # -100..100
    note: str


class SimulationResult(BaseModel):
    personaId: str
    personaName: str
    role: PersonaRole
    interestScore: int  # 0-100
    confusionScore: int  # 0-100
    purchaseProbability: int  # 0-100
    supportDependency: int  # 0-100
    churnRisk: int  # 0-100
    trustScore: int  # 0-100
    verdict: Verdict
    topObjection: str
    reasoning: str
    journey: List[JourneyStep] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------
class SalesObjection(BaseModel):
    question: str
    answeredOnSite: bool
    impact: str
    affectedRoles: List[PersonaRole] = Field(default_factory=list)
    severity: Severity


class SupportGap(BaseModel):
    scenario: str
    faqCoverage: int  # 0-100
    docQuality: int  # 0-100
    risk: str
    severity: Severity


class RevenueLeak(BaseModel):
    title: str
    cause: str
    affectedPct: int
    estConversionLoss: float  # percentage points
    estRevenueImpact: str
    severity: Severity
    fix: str


class ChurnRiskItem(BaseModel):
    segment: str
    category: ChurnCategory
    reason: str
    riskPct: int
    fix: str


class HeatmapZone(BaseModel):
    zone: str  # e.g. "Pricing table", "Hero CTA"
    confusion: int  # 0-100
    note: str


class RoleBreakdown(BaseModel):
    role: PersonaRole
    purchaseProbability: int
    count: int


class Insights(BaseModel):
    headline: str
    avgPurchaseProbability: int
    avgConfusion: int
    avgChurnRisk: int
    conversionRiskScore: int  # 0-100 (higher = worse)
    estConversionUplift: float  # % uplift if all fixes applied
    # Record<Verdict, number> — keyed by verdict string.
    verdictBreakdown: Dict[str, int] = Field(default_factory=dict)
    roleBreakdown: List[RoleBreakdown] = Field(default_factory=list)
    salesObjections: List[SalesObjection] = Field(default_factory=list)
    supportGaps: List[SupportGap] = Field(default_factory=list)
    revenueLeaks: List[RevenueLeak] = Field(default_factory=list)
    churnRisks: List[ChurnRiskItem] = Field(default_factory=list)
    heatmap: List[HeatmapZone] = Field(default_factory=list)
    topQuestions: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Competitor & pricing
# ---------------------------------------------------------------------------
class SiteScore(BaseModel):
    url: str
    title: str
    score: int


class CompetitorDimension(BaseModel):
    name: str
    you: int
    competitor: int
    winner: WinnerSide


class PersonaPreference(BaseModel):
    role: PersonaRole
    prefers: Literal["you", "competitor"]
    why: str


class CompetitorAnalysis(BaseModel):
    you: SiteScore
    competitor: SiteScore
    winner: WinnerSide
    reason: str
    dimensions: List[CompetitorDimension] = Field(default_factory=list)
    personaPreferences: List[PersonaPreference] = Field(default_factory=list)


class SegmentReaction(BaseModel):
    role: PersonaRole
    reaction: str
    willChurn: bool


class PricePoint(BaseModel):
    price: float
    conversion: float
    revenueIndex: float


class PricingSimulation(BaseModel):
    currentPrice: float
    proposedPrice: float
    expectedConversionChange: float  # %, can be negative
    expectedRevenueChange: float  # %
    recommendation: str
    segmentReactions: List[SegmentReaction] = Field(default_factory=list)
    optimalPrice: float
    curve: List[PricePoint] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Executive report
# ---------------------------------------------------------------------------
class Recommendation(BaseModel):
    title: str
    detail: str
    effort: Level
    impact: Level


class ExecutiveReport(BaseModel):
    executiveSummary: str
    keyFindings: List[str] = Field(default_factory=list)
    conversionRisks: List[str] = Field(default_factory=list)
    churnRisks: List[str] = Field(default_factory=list)
    revenueLeaks: List[str] = Field(default_factory=list)
    customerQuestions: List[str] = Field(default_factory=list)
    competitorNotes: List[str] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)
    projectedUplift: str = ""


# ---------------------------------------------------------------------------
# Run config + request bodies (the streaming protocol itself is plain dicts —
# see graph.run_pipeline — to keep the discriminated union flexible)
# ---------------------------------------------------------------------------
class RunConfig(BaseModel):
    url: str
    pricingUrl: Optional[str] = None
    faqUrl: Optional[str] = None
    competitorUrl: Optional[str] = None
    personaCount: int = 8
    currentPrice: Optional[float] = None


class CrawlRequest(BaseModel):
    url: str


class GeneratePersonasRequest(BaseModel):
    url: str
    personaCount: int = 8


class CompetitorRequest(BaseModel):
    url: str
    competitorUrl: str


class PricingRequest(BaseModel):
    url: str
    currentPrice: Optional[float] = None
    proposedPrice: Optional[float] = None


# Convenience export used by the FastAPI health endpoint and others.
__all__ = [
    "Level",
    "PersonaRole",
    "PERSONA_ROLES",
    "AgentName",
    "Verdict",
    "JourneyStage",
    "Severity",
    "ChurnCategory",
    "RunPhase",
    "WinnerSide",
    "PricingTier",
    "Faq",
    "WebsiteAnalysis",
    "Persona",
    "JourneyStep",
    "SimulationResult",
    "SalesObjection",
    "SupportGap",
    "RevenueLeak",
    "ChurnRiskItem",
    "HeatmapZone",
    "RoleBreakdown",
    "Insights",
    "SiteScore",
    "CompetitorDimension",
    "PersonaPreference",
    "CompetitorAnalysis",
    "SegmentReaction",
    "PricePoint",
    "PricingSimulation",
    "Recommendation",
    "ExecutiveReport",
    "RunConfig",
    "CrawlRequest",
    "GeneratePersonasRequest",
    "CompetitorRequest",
    "PricingRequest",
]
