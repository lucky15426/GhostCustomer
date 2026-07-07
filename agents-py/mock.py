"""
Ghost Customer AI — deterministic seeded mock engine.

GUARANTEE: this module produces a complete, internally consistent run with
NO network and NO API keys. The same URL always yields the same output, so the
UI/demo is stable and reproducible.

Strategy
--------
* `seed_for(url)` hashes the URL (SHA-256) into a 64-bit integer seed.
* A private `random.Random(seed)` instance drives every pseudo-random choice,
  so two calls with the same URL are byte-for-byte identical.
* Scoring uses an explicit *gap-penalty* model, not pure noise, so the numbers
  tell a coherent story:
      - missing SSO            -> hurts Enterprise Buyer + CTO (purchase, trust)
      - unclear/expensive price -> hurts budget-sensitive personas
      - no free tier           -> hurts Student + Freelancer
      - sparse FAQ             -> raises support dependency + confusion
* The same gaps drive the aggregate Insights, the ExecutiveReport narrative,
  the CompetitorAnalysis, and the PricingSimulation, so everything agrees.
"""

from __future__ import annotations

import hashlib
import math
import random
import re
from typing import Dict, List, Optional, Tuple

from models import (
    PERSONA_ROLES,
    ChurnRiskItem,
    CompetitorAnalysis,
    CompetitorDimension,
    ExecutiveReport,
    Faq,
    HeatmapZone,
    Insights,
    JourneyStep,
    Persona,
    PersonaPreference,
    PricePoint,
    PricingSimulation,
    PricingTier,
    Recommendation,
    RevenueLeak,
    RoleBreakdown,
    SalesObjection,
    SegmentReaction,
    SimulationResult,
    SiteScore,
    SupportGap,
    WebsiteAnalysis,
)

# ---------------------------------------------------------------------------
# Seeding helpers
# ---------------------------------------------------------------------------


def seed_for(url: str) -> int:
    """Stable 64-bit seed derived from the URL via SHA-256."""
    digest = hashlib.sha256((url or "ghost").strip().lower().encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big")


def _rng(url: str, salt: str = "") -> random.Random:
    """A fresh deterministic RNG keyed by URL + an optional salt."""
    return random.Random(seed_for(url) ^ seed_for(salt) if salt else seed_for(url))


def _clamp(v: float, lo: int = 0, hi: int = 100) -> int:
    return int(max(lo, min(hi, round(v))))


def _domain_label(url: str) -> str:
    """Extract a human-ish brand label from a URL."""
    m = re.sub(r"^https?://", "", (url or "").strip().lower())
    m = m.split("/")[0]
    m = m.replace("www.", "")
    base = m.split(".")[0] if "." in m else m
    base = re.sub(r"[^a-z0-9]+", " ", base).strip()
    return base.title() if base else "Acme"


# ---------------------------------------------------------------------------
# Static vocabulary the generator samples from (kept compact + on-brand)
# ---------------------------------------------------------------------------
_CATEGORIES = [
    "SaaS Productivity",
    "DevTools",
    "Marketing Platform",
    "Analytics",
    "Fintech",
    "E-commerce",
    "AI Platform",
    "Collaboration",
]

_TONES = ["Confident", "Playful", "Technical", "Enterprise-formal", "Friendly", "Bold"]

_FEATURE_POOL = [
    "Real-time collaboration",
    "API access",
    "Dashboards & reporting",
    "Role-based access control",
    "Integrations marketplace",
    "Audit logs",
    "Mobile app",
    "Webhooks",
    "AI assistant",
    "Custom workflows",
    "Single sign-on (SSO)",
    "Data export",
]

_VALUE_POOL = [
    "Ship faster with less overhead",
    "One source of truth for your team",
    "Enterprise-grade security",
    "Automate the busywork",
    "Insights you can act on",
    "Set up in minutes, not weeks",
]

_TRUST_POOL = [
    "Customer logos",
    "Testimonials",
    "SOC 2 badge",
    "Money-back guarantee",
    "Uptime SLA",
    "G2 rating",
    "Case studies",
    "Press mentions",
]

_NAV_POOL = ["Product", "Pricing", "Docs", "Customers", "Blog", "Login", "Sign up"]

_CTA_POOL = ["Start free", "Book a demo", "Get started", "Try it free", "Contact sales"]

_FIRST_NAMES = [
    "Alex", "Priya", "Marcus", "Sofia", "Liam", "Nadia", "Diego", "Mei",
    "Omar", "Hannah", "Kenji", "Zara", "Tomas", "Ava", "Ravi", "Elena",
]
_LAST_NAMES = [
    "Reyes", "Patel", "Okafor", "Lindqvist", "Nguyen", "Cohen", "Santos",
    "Ferreira", "Khan", "Adler", "Tanaka", "Moreau", "Rossi", "Bauer",
]

_INDUSTRIES = [
    "Software", "E-commerce", "Healthcare", "Finance", "Education",
    "Media", "Manufacturing", "Consulting", "Nonprofit", "Logistics",
]

_ACCENTS = [
    "#7c3aed", "#06b6d4", "#f43f5e", "#22c55e", "#f59e0b",
    "#3b82f6", "#ec4899", "#14b8a6", "#a855f7", "#eab308",
]

# Per-role personality scaffolding. Each entry tunes the persona AND seeds the
# gap-penalty model in simulate().
_ROLE_PROFILE: Dict[str, dict] = {
    "Startup Founder": {
        "emoji": "🚀", "age": (28, 42), "size": (2, 25), "tech": "High",
        "budget": "High", "intent": "High",
        "archetype": "Time-starved builder optimizing for speed",
        "goals": ["Move fast", "Validate quickly", "Keep burn low"],
        "frustrations": ["Slow onboarding", "Hidden pricing"],
        "objections": ["Is this overkill for a small team?"],
        "weights": {"sso": 0.2, "price": 0.7, "free": 0.5, "faq": 0.4},
    },
    "CTO": {
        "emoji": "🧠", "age": (35, 52), "size": (40, 2000), "tech": "High",
        "budget": "Medium", "intent": "Medium",
        "archetype": "Risk-aware technical decision maker",
        "goals": ["Security & compliance", "Scalable architecture"],
        "frustrations": ["No SSO", "Unclear data residency"],
        "objections": ["Do you support SSO/SAML and audit logs?"],
        "weights": {"sso": 1.0, "price": 0.3, "free": 0.1, "faq": 0.5},
    },
    "Product Manager": {
        "emoji": "🗺️", "age": (29, 45), "size": (20, 500), "tech": "Medium",
        "budget": "Medium", "intent": "Medium",
        "archetype": "Outcome-driven coordinator",
        "goals": ["Align the team", "Ship measurable wins"],
        "frustrations": ["Feature gaps", "Weak reporting"],
        "objections": ["Will this fit our existing workflow?"],
        "weights": {"sso": 0.4, "price": 0.5, "free": 0.3, "faq": 0.5},
    },
    "Agency Owner": {
        "emoji": "🎯", "age": (30, 50), "size": (5, 60), "tech": "Medium",
        "budget": "High", "intent": "High",
        "archetype": "Margin-focused multi-client operator",
        "goals": ["Manage many clients", "White-label options"],
        "frustrations": ["Per-seat pricing", "No client roles"],
        "objections": ["Can I resell or white-label this?"],
        "weights": {"sso": 0.5, "price": 0.8, "free": 0.3, "faq": 0.4},
    },
    "Student": {
        "emoji": "🎓", "age": (18, 25), "size": (1, 1), "tech": "Medium",
        "budget": "High", "intent": "Low",
        "archetype": "Budget-zero learner",
        "goals": ["Learn the tool", "Spend nothing"],
        "frustrations": ["No free tier", "Credit card required"],
        "objections": ["Is there a student or free plan?"],
        "weights": {"sso": 0.0, "price": 0.9, "free": 1.0, "faq": 0.6},
    },
    "Small Business Owner": {
        "emoji": "🏪", "age": (32, 55), "size": (2, 30), "tech": "Low",
        "budget": "High", "intent": "Medium",
        "archetype": "Pragmatic generalist wearing many hats",
        "goals": ["Save time", "Avoid complexity"],
        "frustrations": ["Too technical", "Confusing setup"],
        "objections": ["Is this easy enough for a non-technical team?"],
        "weights": {"sso": 0.1, "price": 0.8, "free": 0.6, "faq": 0.9},
    },
    "Enterprise Buyer": {
        "emoji": "🏢", "age": (38, 58), "size": (500, 10000), "tech": "Medium",
        "budget": "Low", "intent": "Medium",
        "archetype": "Procurement-driven, compliance-first buyer",
        "goals": ["Security sign-off", "Vendor stability"],
        "frustrations": ["No SSO", "No SLA", "No enterprise tier"],
        "objections": ["Do you offer SSO, SLA, and an MSA?"],
        "weights": {"sso": 1.0, "price": 0.2, "free": 0.0, "faq": 0.6},
    },
    "Operations Manager": {
        "emoji": "⚙️", "age": (30, 50), "size": (50, 1500), "tech": "Medium",
        "budget": "Medium", "intent": "Medium",
        "archetype": "Process optimizer chasing efficiency",
        "goals": ["Automate workflows", "Reduce manual steps"],
        "frustrations": ["No integrations", "Poor docs"],
        "objections": ["Does it integrate with our stack?"],
        "weights": {"sso": 0.4, "price": 0.5, "free": 0.2, "faq": 0.8},
    },
    "HR Manager": {
        "emoji": "🧑‍💼", "age": (33, 52), "size": (30, 1200), "tech": "Low",
        "budget": "Medium", "intent": "Low",
        "archetype": "People-first, low-friction adopter",
        "goals": ["Easy rollout", "Team adoption"],
        "frustrations": ["Steep learning curve", "No onboarding help"],
        "objections": ["How hard is it to roll out to non-technical staff?"],
        "weights": {"sso": 0.5, "price": 0.4, "free": 0.3, "faq": 0.9},
    },
    "Freelancer": {
        "emoji": "✏️", "age": (24, 40), "size": (1, 1), "tech": "Medium",
        "budget": "High", "intent": "Medium",
        "archetype": "Solo operator watching every dollar",
        "goals": ["Look professional", "Pay only for what I use"],
        "frustrations": ["Minimum seats", "No free tier"],
        "objections": ["Is there an affordable solo plan?"],
        "weights": {"sso": 0.0, "price": 0.9, "free": 0.9, "faq": 0.6},
    },
}


# ---------------------------------------------------------------------------
# 1) Website analysis
# ---------------------------------------------------------------------------
def mock_analysis(url: str, source: str = "mock") -> WebsiteAnalysis:
    """Deterministic WebsiteAnalysis. `source` lets callers stamp 'fetch'
    or 'firecrawl' when text was really crawled but parsed by the mock."""
    r = _rng(url, "analysis")
    brand = _domain_label(url)
    category = r.choice(_CATEGORIES)

    features = r.sample(_FEATURE_POOL, k=r.randint(5, 9))
    value_props = r.sample(_VALUE_POOL, k=r.randint(2, 4))
    trust = r.sample(_TRUST_POOL, k=r.randint(1, 4))
    missing_trust = [t for t in _TRUST_POOL if t not in trust]
    r.shuffle(missing_trust)
    missing_trust = missing_trust[: r.randint(1, 3)]

    # Pricing tiers — sometimes there's a free tier, sometimes not.
    has_free = r.random() > 0.45
    base = r.choice([12, 19, 24, 29, 39, 49])
    tiers: List[PricingTier] = []
    if has_free:
        tiers.append(
            PricingTier(name="Free", price="$0", period="mo",
                        highlights=["1 user", "Community support"])
        )
    tiers.append(
        PricingTier(name="Pro", price=f"${base}", period="mo",
                    highlights=features[:2] + ["Email support"])
    )
    tiers.append(
        PricingTier(name="Team", price=f"${base * 3}", period="mo",
                    highlights=features[2:4] + ["Priority support"])
    )
    if r.random() > 0.5:
        tiers.append(
            PricingTier(name="Enterprise", price="Custom", period=None,
                        highlights=["SSO/SAML", "SLA", "Dedicated CSM"])
        )

    faq_count = r.randint(0, 6)
    faq_bank = [
        ("Is there a free trial?", "Yes, 14 days, no card required."),
        ("Can I cancel anytime?", "Yes, cancel from billing settings."),
        ("Do you offer SSO?", "SSO/SAML is available on Enterprise."),
        ("How is my data secured?", "Encrypted in transit and at rest."),
        ("Do you have an API?", "Yes, a full REST API and webhooks."),
        ("What integrations exist?", "Slack, Zapier, and 20+ others."),
    ]
    faqs = [Faq(q=q, a=a) for q, a in faq_bank[:faq_count]]

    onboarding = r.sample(
        ["Create account", "Connect your data", "Invite teammates",
         "Configure workspace", "Launch first project", "Explore templates"],
        k=r.randint(2, 5),
    )

    content_score = _clamp(
        58
        + (8 if has_free else -4)
        + min(len(faqs) * 4, 18)
        + (6 if len(trust) >= 3 else -3)
        + r.randint(-6, 8)
    )

    return WebsiteAnalysis(
        url=url,
        title=f"{brand} — {category}",
        tagline=r.choice(
            [
                f"The fastest way to {value_props[0].lower()}",
                f"{brand}: {value_props[0]}",
                f"Built for teams who {value_props[0].lower()}",
            ]
        ),
        category=category,
        valueProps=value_props,
        ctas=r.sample(_CTA_POOL, k=r.randint(2, 3)),
        navItems=r.sample(_NAV_POOL, k=r.randint(4, 6)),
        pricingTiers=tiers,
        faqs=faqs,
        trustSignals=trust,
        missingTrustSignals=missing_trust,
        onboardingSteps=onboarding,
        detectedFeatures=features,
        targetAudience=r.choice(
            ["Small to mid-size teams", "Developers and technical teams",
             "Growth-stage startups", "Enterprises and large orgs"]
        ),
        toneOfVoice=r.choice(_TONES),
        contentScore=content_score,
        source=source,  # "mock" | "fetch" | "firecrawl"
    )


# ---------------------------------------------------------------------------
# 2) Personas across the 10 canonical roles
# ---------------------------------------------------------------------------
def mock_personas(url: str, count: int = 8) -> List[Persona]:
    """Generate `count` personas, cycling deterministically through the 10
    canonical roles so the spread always covers the full spectrum."""
    r = _rng(url, "personas")
    count = max(1, min(count, 40))
    personas: List[Persona] = []
    roles = list(PERSONA_ROLES)
    r.shuffle(roles)  # stable shuffle for this URL

    for i in range(count):
        role = roles[i % len(roles)]
        prof = _ROLE_PROFILE[role]
        first = r.choice(_FIRST_NAMES)
        last = r.choice(_LAST_NAMES)
        name = f"{first} {last}"
        seed = f"{role}-{i}-{first}{last}".replace(" ", "")
        personas.append(
            Persona(
                id=f"p{i+1}",
                name=name,
                avatarSeed=seed,
                age=r.randint(*prof["age"]),
                role=role,  # type: ignore[arg-type]
                archetype=prof["archetype"],
                companySize=r.randint(*prof["size"]),
                industry=r.choice(_INDUSTRIES),
                budgetSensitivity=prof["budget"],  # type: ignore[arg-type]
                technicalSkill=prof["tech"],  # type: ignore[arg-type]
                purchaseIntent=prof["intent"],  # type: ignore[arg-type]
                goals=list(prof["goals"]),
                frustrations=list(prof["frustrations"]),
                objections=list(prof["objections"]),
                quote=r.choice(
                    [
                        f"Show me it works for {role.lower()}s like me.",
                        "If I can't tell what this costs, I'm gone.",
                        "I need to trust you before I hand over data.",
                    ]
                ),
                emoji=prof["emoji"],
                accent=_ACCENTS[i % len(_ACCENTS)],
            )
        )
    return personas


# ---------------------------------------------------------------------------
# Gap detection — derives site weaknesses from a WebsiteAnalysis
# ---------------------------------------------------------------------------
def _detect_gaps(a: WebsiteAnalysis) -> Dict[str, float]:
    """Return gap intensities in [0,1]; higher = worse for that dimension."""
    text_blob = " ".join(
        [a.title, a.tagline, " ".join(a.detectedFeatures)]
        + [t.name + " " + " ".join(t.highlights) for t in a.pricingTiers]
        + [t for t in a.trustSignals]
    ).lower()

    has_sso = "sso" in text_blob or "saml" in text_blob or "single sign" in text_blob
    has_free = any(
        t.price.strip().lower() in ("$0", "0", "free") or t.name.lower() == "free"
        for t in a.pricingTiers
    )
    # "unclear pricing" if any tier is "custom"/"contact" or there are no tiers.
    unclear_price = (len(a.pricingTiers) == 0) or any(
        not re.search(r"\d", t.price) for t in a.pricingTiers
    )
    faq_count = len(a.faqs)

    return {
        "sso": 0.0 if has_sso else 1.0,
        "free": 0.0 if has_free else 1.0,
        # Clear, numeric pricing carries only a tiny residual penalty so it
        # doesn't drag a healthy site below the Convert threshold.
        "price": 0.85 if unclear_price else 0.1,
        # sparse FAQ -> high gap; 6+ FAQs -> ~0.
        "faq": max(0.0, 1.0 - faq_count / 6.0),
        # Only sites that score poorly (<70) accrue a content penalty.
        "content": max(0.0, (70.0 - a.contentScore) / 70.0),
    }


# ---------------------------------------------------------------------------
# 3) Per-persona simulation with gap-penalty scoring
# ---------------------------------------------------------------------------
def _verdict(purchase: int, churn: int, confusion: int) -> str:
    if purchase >= 65 and churn < 45:
        return "Convert"
    if churn >= 60 or confusion >= 70:
        return "Churn Risk"
    if purchase >= 40:
        return "Maybe"
    return "Bounce"


def simulate_one(url: str, analysis: WebsiteAnalysis, persona: Persona) -> SimulationResult:
    """Score a single persona against the site using the gap-penalty model."""
    r = _rng(url, f"sim-{persona.id}")
    gaps = _detect_gaps(analysis)
    w = _ROLE_PROFILE[persona.role]["weights"]

    # Base scores anchored by purchase intent. These are deliberately generous
    # so a *clean* site (few gaps) yields a healthy share of "Convert" verdicts;
    # the gap penalties below are what drag scores down toward Maybe/Bounce.
    intent_base = {"Low": 48, "Medium": 64, "High": 80}[persona.purchaseIntent]
    base_trust = 70 + r.randint(-6, 6)
    base_interest = intent_base + r.randint(-8, 10)

    # Weighted penalties. Each gap*weight pushes the relevant scores.
    sso_pen = gaps["sso"] * w["sso"]
    price_pen = gaps["price"] * w["price"] * (
        1.2 if persona.budgetSensitivity == "High" else 1.0
    )
    free_pen = gaps["free"] * w["free"]
    faq_pen = gaps["faq"] * w["faq"]
    content_pen = gaps["content"]

    purchase = _clamp(
        base_interest
        - sso_pen * 28
        - price_pen * 26
        - free_pen * 22
        - faq_pen * 8
        - content_pen * 10
        + r.randint(-5, 5)
    )
    trust = _clamp(
        base_trust
        - sso_pen * 30
        - content_pen * 16
        + (8 if len(analysis.trustSignals) >= 3 else -6)
        + r.randint(-4, 4)
    )
    confusion = _clamp(
        18
        + faq_pen * 38
        + content_pen * 30
        + price_pen * 18
        + (8 if persona.technicalSkill == "Low" else 0)
        + r.randint(-4, 6)
    )
    support_dependency = _clamp(
        20
        + faq_pen * 40
        + (18 if persona.technicalSkill == "Low" else 0)
        + content_pen * 14
        + r.randint(-4, 6)
    )
    churn = _clamp(
        14
        + sso_pen * 24
        + price_pen * 22
        + free_pen * 18
        + faq_pen * 16
        + content_pen * 12
        + r.randint(-4, 6)
    )
    interest = _clamp(base_interest - confusion * 0.15 + r.randint(-4, 6))

    verdict = _verdict(purchase, churn, confusion)

    # Pick the most relevant objection given the dominant gap for this persona.
    dominant = max(
        [("sso", sso_pen), ("price", price_pen), ("free", free_pen), ("faq", faq_pen)],
        key=lambda kv: kv[1],
    )[0]
    objection_map = {
        "sso": "No SSO/SAML or enterprise security signals — can't get sign-off.",
        "price": "Pricing is unclear or feels too high for the value shown.",
        "free": "No free tier or trial — won't commit without trying it first.",
        "faq": "Too many open questions; the site doesn't answer my concerns.",
    }
    top_objection = (
        persona.objections[0]
        if dominant == "faq" and persona.objections
        else objection_map[dominant]
    )

    reasoning = (
        f"As a {persona.role}, {persona.name.split()[0]} "
        + (
            "saw clear value and a low-friction path to start."
            if verdict == "Convert"
            else "hit friction"
        )
        + (
            f": {objection_map[dominant]}"
            if verdict != "Convert"
            else f" Confidence held at {trust}/100 trust."
        )
    )

    # Journey across the 5 canonical stages, each tinted by the gaps it exposes.
    journey = [
        JourneyStep(
            stage="Landing",
            sentiment=_clamp(30 + base_interest * 0.4 - content_pen * 30, -100, 100),
            note="Skimmed the hero and value props.",
        ),
        JourneyStep(
            stage="Pricing",
            sentiment=_clamp(40 - price_pen * 70 - free_pen * 40, -100, 100),
            note=(
                "Pricing was clear and fair."
                if price_pen < 0.3
                else "Pricing was vague or felt steep."
            ),
        ),
        JourneyStep(
            stage="Features",
            sentiment=_clamp(35 + len(analysis.detectedFeatures) * 2 - sso_pen * 40, -100, 100),
            note=(
                "Found the capabilities I needed."
                if sso_pen * w["sso"] < 0.3
                else "Missing security/enterprise features I require."
            ),
        ),
        JourneyStep(
            stage="Onboarding",
            sentiment=_clamp(30 - faq_pen * 30 - content_pen * 25, -100, 100),
            note=(
                "Setup looked straightforward."
                if len(analysis.onboardingSteps) >= 3
                else "Unsure how to get started."
            ),
        ),
        JourneyStep(
            stage="Support",
            sentiment=_clamp(35 - faq_pen * 60, -100, 100),
            note=(
                "FAQ answered my questions."
                if faq_pen < 0.4
                else "Couldn't find answers to my questions."
            ),
        ),
    ]

    return SimulationResult(
        personaId=persona.id,
        personaName=persona.name,
        role=persona.role,
        interestScore=interest,
        confusionScore=confusion,
        purchaseProbability=purchase,
        supportDependency=support_dependency,
        churnRisk=churn,
        trustScore=trust,
        verdict=verdict,  # type: ignore[arg-type]
        topObjection=top_objection,
        reasoning=reasoning,
        journey=journey,
    )


def mock_simulations(
    url: str, analysis: WebsiteAnalysis, personas: List[Persona]
) -> List[SimulationResult]:
    return [simulate_one(url, analysis, p) for p in personas]


# ---------------------------------------------------------------------------
# 4) Aggregate insights
# ---------------------------------------------------------------------------
def _severity(score: float) -> str:
    if score >= 0.75:
        return "critical"
    if score >= 0.5:
        return "high"
    if score >= 0.25:
        return "medium"
    return "low"


def _avg(xs: List[int]) -> int:
    return _clamp(sum(xs) / len(xs)) if xs else 0


def mock_insights(
    url: str, analysis: WebsiteAnalysis, sims: List[SimulationResult]
) -> Insights:
    r = _rng(url, "insights")
    gaps = _detect_gaps(analysis)

    avg_purchase = _avg([s.purchaseProbability for s in sims])
    avg_confusion = _avg([s.confusionScore for s in sims])
    avg_churn = _avg([s.churnRisk for s in sims])

    verdict_breakdown = {"Convert": 0, "Maybe": 0, "Churn Risk": 0, "Bounce": 0}
    for s in sims:
        verdict_breakdown[s.verdict] += 1

    # Role breakdown: avg purchase probability + count per role present.
    by_role: Dict[str, List[int]] = {}
    for s in sims:
        by_role.setdefault(s.role, []).append(s.purchaseProbability)
    role_breakdown = [
        RoleBreakdown(role=role, purchaseProbability=_avg(vals), count=len(vals))  # type: ignore[arg-type]
        for role, vals in by_role.items()
    ]
    role_breakdown.sort(key=lambda rb: rb.purchaseProbability)

    conversion_risk = _clamp(
        0.45 * (100 - avg_purchase) + 0.30 * avg_churn + 0.25 * avg_confusion
    )

    # Sales objections keyed off detected gaps.
    sales_objections: List[SalesObjection] = []
    if gaps["sso"] > 0.5:
        sales_objections.append(
            SalesObjection(
                question="Do you support SSO/SAML and audit logs?",
                answeredOnSite=False,
                impact="Blocks enterprise & security-led buyers from signing off.",
                affectedRoles=["Enterprise Buyer", "CTO"],
                severity=_severity(0.8),  # type: ignore[arg-type]
            )
        )
    if gaps["price"] > 0.5:
        sales_objections.append(
            SalesObjection(
                question="What will this actually cost me?",
                answeredOnSite=False,
                impact="Budget-sensitive visitors bounce before talking to sales.",
                affectedRoles=["Small Business Owner", "Agency Owner", "Freelancer"],
                severity=_severity(0.65),  # type: ignore[arg-type]
            )
        )
    if gaps["free"] > 0.5:
        sales_objections.append(
            SalesObjection(
                question="Is there a free plan or trial?",
                answeredOnSite=False,
                impact="Self-serve and low-budget segments won't commit unseen.",
                affectedRoles=["Student", "Freelancer"],
                severity=_severity(0.55),  # type: ignore[arg-type]
            )
        )
    if not sales_objections:
        sales_objections.append(
            SalesObjection(
                question="How do you compare to alternatives?",
                answeredOnSite=False,
                impact="No comparison page leaves evaluators to guess.",
                affectedRoles=["Product Manager", "Operations Manager"],
                severity=_severity(0.3),  # type: ignore[arg-type]
            )
        )

    # Support gaps from FAQ/doc coverage.
    faq_cov = _clamp(100 * (1 - gaps["faq"]))
    doc_quality = _clamp(analysis.contentScore - 8 + r.randint(-6, 6))
    support_gaps = [
        SupportGap(
            scenario="New user can't find setup instructions",
            faqCoverage=faq_cov,
            docQuality=doc_quality,
            risk="Early-stage confusion drives support tickets and early churn.",
            severity=_severity(gaps["faq"]),  # type: ignore[arg-type]
        ),
        SupportGap(
            scenario="Billing / cancellation questions",
            faqCoverage=_clamp(faq_cov - 10),
            docQuality=doc_quality,
            risk="Unanswered billing questions erode trust at the decision point.",
            severity=_severity(max(gaps["faq"], gaps["price"]) * 0.8),  # type: ignore[arg-type]
        ),
    ]

    # Revenue leaks — the headline money story.
    revenue_leaks: List[RevenueLeak] = []
    if gaps["price"] > 0.4:
        affected = sum(1 for s in sims if s.role in
                       ("Small Business Owner", "Agency Owner", "Freelancer", "Student"))
        revenue_leaks.append(
            RevenueLeak(
                title="Opaque pricing scares off self-serve buyers",
                cause="No transparent per-seat or usage pricing on the page.",
                affectedPct=_clamp(100 * affected / max(len(sims), 1)),
                estConversionLoss=round(gaps["price"] * 9.5, 1),
                estRevenueImpact="$12k–$40k ARR/mo at current traffic",
                severity=_severity(gaps["price"]),  # type: ignore[arg-type]
                fix="Publish clear tier pricing with a 'starting at' anchor.",
            )
        )
    if gaps["sso"] > 0.5:
        revenue_leaks.append(
            RevenueLeak(
                title="No enterprise security story",
                cause="SSO/SAML, SLA, and compliance not surfaced anywhere.",
                affectedPct=_clamp(
                    100 * sum(1 for s in sims if s.role in ("Enterprise Buyer", "CTO"))
                    / max(len(sims), 1)
                ),
                estConversionLoss=round(gaps["sso"] * 7.0, 1),
                estRevenueImpact="$30k–$90k ARR/yr in lost enterprise deals",
                severity=_severity(0.8),  # type: ignore[arg-type]
                fix="Add a Security page with SSO/SAML, SOC 2, and an SLA.",
            )
        )
    if gaps["free"] > 0.5:
        revenue_leaks.append(
            RevenueLeak(
                title="No free tier kills the top of funnel",
                cause="No zero-cost entry point for evaluators.",
                affectedPct=_clamp(
                    100 * sum(1 for s in sims if s.role in ("Student", "Freelancer"))
                    / max(len(sims), 1)
                ),
                estConversionLoss=round(gaps["free"] * 6.0, 1),
                estRevenueImpact="$5k–$18k ARR/mo in unconverted PLG signups",
                severity=_severity(0.55),  # type: ignore[arg-type]
                fix="Introduce a generous free tier or a no-card trial.",
            )
        )
    if not revenue_leaks:
        revenue_leaks.append(
            RevenueLeak(
                title="Weak trust signals soften conversion",
                cause="Few logos / proof points above the fold.",
                affectedPct=40,
                estConversionLoss=2.5,
                estRevenueImpact="$3k–$9k ARR/mo",
                severity=_severity(0.3),  # type: ignore[arg-type]
                fix="Add customer logos, a G2 badge, and 2–3 testimonials.",
            )
        )

    # Churn risks per worst segment.
    churn_risks: List[ChurnRiskItem] = []
    worst = sorted(sims, key=lambda s: s.churnRisk, reverse=True)[:3]
    cat_map = {
        "sso": ("Missing Features", "No enterprise security features"),
        "price": ("Pricing", "Pricing felt unclear or too high"),
        "free": ("Pricing", "No affordable entry point"),
        "faq": ("Poor Support", "Couldn't get questions answered"),
        "content": ("Complexity", "Site clarity was low"),
    }
    for s in worst:
        dom = max(gaps.items(), key=lambda kv: kv[1])[0]
        cat, reason = cat_map.get(dom, ("Complexity", "General friction"))
        churn_risks.append(
            ChurnRiskItem(
                segment=s.role,
                category=cat,  # type: ignore[arg-type]
                reason=reason,
                riskPct=s.churnRisk,
                fix={
                    "Missing Features": "Ship SSO/SAML + a security page.",
                    "Pricing": "Clarify pricing and add a free/trial path.",
                    "Poor Support": "Expand the FAQ and add searchable docs.",
                    "Complexity": "Simplify onboarding and the value prop.",
                }[cat],
            )
        )

    heatmap = [
        HeatmapZone(zone="Hero CTA", confusion=_clamp(gaps["content"] * 60 + 10),
                    note="Primary action clarity."),
        HeatmapZone(zone="Pricing table", confusion=_clamp(gaps["price"] * 80 + 10),
                    note="Cost transparency is the biggest friction point."),
        HeatmapZone(zone="Feature list", confusion=_clamp(gaps["sso"] * 40 + 15),
                    note="Enterprise capabilities hard to verify."),
        HeatmapZone(zone="FAQ / Docs", confusion=_clamp(gaps["faq"] * 70 + 10),
                    note="Open questions left unanswered."),
        HeatmapZone(zone="Onboarding", confusion=_clamp(gaps["content"] * 50 + 12),
                    note="Path to first value."),
    ]

    top_questions = [o.question for o in sales_objections] + [
        "How long does setup take?",
        "Can I import my existing data?",
        "What happens to my data if I cancel?",
    ]

    est_uplift = round(
        sum(l.estConversionLoss for l in revenue_leaks) * 0.7, 1
    )

    headline = (
        f"{verdict_breakdown['Bounce'] + verdict_breakdown['Churn Risk']} of "
        f"{len(sims)} ghost customers walked away — "
        + (
            "pricing opacity is the #1 leak."
            if gaps["price"] > 0.4
            else "missing enterprise trust signals cap your ceiling."
            if gaps["sso"] > 0.5
            else "the funnel is solid but trust signals are thin."
        )
    )

    return Insights(
        headline=headline,
        avgPurchaseProbability=avg_purchase,
        avgConfusion=avg_confusion,
        avgChurnRisk=avg_churn,
        conversionRiskScore=conversion_risk,
        estConversionUplift=est_uplift,
        verdictBreakdown=verdict_breakdown,
        roleBreakdown=role_breakdown,
        salesObjections=sales_objections,
        supportGaps=support_gaps,
        revenueLeaks=revenue_leaks,
        churnRisks=churn_risks,
        heatmap=heatmap,
        topQuestions=top_questions[:8],
    )


# ---------------------------------------------------------------------------
# 5) Executive report
# ---------------------------------------------------------------------------
def mock_report(
    url: str,
    analysis: WebsiteAnalysis,
    insights: Insights,
    competitor: Optional[CompetitorAnalysis] = None,
) -> ExecutiveReport:
    brand = _domain_label(url)
    summary = (
        f"We simulated a swarm of AI ghost customers against {brand}. "
        f"Average purchase probability landed at {insights.avgPurchaseProbability}/100 "
        f"with a conversion-risk score of {insights.conversionRiskScore}/100. "
        f"{insights.headline}"
    )

    key_findings = [insights.headline] + [
        f"{rl.title}: {rl.cause}" for rl in insights.revenueLeaks[:3]
    ]

    conversion_risks = [
        f"{o.question} — {o.impact}" for o in insights.salesObjections
    ]
    churn_lines = [
        f"{c.segment}: {c.reason} ({c.riskPct}% risk) → {c.fix}"
        for c in insights.churnRisks
    ]
    leak_lines = [
        f"{rl.title} — est. {rl.estConversionLoss}pp conversion loss, {rl.estRevenueImpact}"
        for rl in insights.revenueLeaks
    ]
    customer_questions = list(insights.topQuestions)

    competitor_notes: List[str] = []
    if competitor:
        competitor_notes = [
            f"Head-to-head winner: {competitor.winner} — {competitor.reason}",
        ] + [
            f"{d.name}: you {d.you} vs competitor {d.competitor} (winner: {d.winner})"
            for d in competitor.dimensions
        ]

    recommendations = [
        Recommendation(
            title=rl.title.replace("scares off", "fix:").split(" — ")[0][:60],
            detail=rl.fix,
            effort="Medium",
            impact="High" if rl.severity in ("high", "critical") else "Medium",
        )
        for rl in insights.revenueLeaks[:4]
    ]
    if not recommendations:
        recommendations = [
            Recommendation(
                title="Add proof above the fold",
                detail="Customer logos, a G2 badge, and 2–3 testimonials.",
                effort="Low",
                impact="Medium",
            )
        ]

    return ExecutiveReport(
        executiveSummary=summary,
        keyFindings=key_findings,
        conversionRisks=conversion_risks,
        churnRisks=churn_lines,
        revenueLeaks=leak_lines,
        customerQuestions=customer_questions,
        competitorNotes=competitor_notes,
        recommendations=recommendations,
        projectedUplift=f"~{insights.estConversionUplift}% conversion uplift if top fixes ship",
    )


# ---------------------------------------------------------------------------
# 6) Competitor analysis (deterministic head-to-head)
# ---------------------------------------------------------------------------
def mock_competitor(url: str, competitor_url: str) -> CompetitorAnalysis:
    you_a = mock_analysis(url)
    comp_a = mock_analysis(competitor_url)
    r = _rng(url + "|" + competitor_url, "competitor")

    dims = ["Clarity", "Pricing Transparency", "Trust Signals",
            "Feature Depth", "Onboarding", "Enterprise Readiness"]
    you_gaps = _detect_gaps(you_a)
    comp_gaps = _detect_gaps(comp_a)

    def dim_score(a: WebsiteAnalysis, g: Dict[str, float], name: str) -> int:
        table = {
            "Clarity": a.contentScore,
            "Pricing Transparency": _clamp(100 - g["price"] * 80),
            "Trust Signals": _clamp(len(a.trustSignals) * 14 + 20),
            "Feature Depth": _clamp(len(a.detectedFeatures) * 9 + 10),
            "Onboarding": _clamp(len(a.onboardingSteps) * 14 + 20),
            "Enterprise Readiness": _clamp(100 - g["sso"] * 70),
        }
        return _clamp(table[name] + r.randint(-4, 4))

    dimensions: List[CompetitorDimension] = []
    you_total = 0
    comp_total = 0
    for d in dims:
        ys = dim_score(you_a, you_gaps, d)
        cs = dim_score(comp_a, comp_gaps, d)
        you_total += ys
        comp_total += cs
        winner = "you" if ys > cs + 3 else "competitor" if cs > ys + 3 else "tie"
        dimensions.append(CompetitorDimension(name=d, you=ys, competitor=cs, winner=winner))  # type: ignore[arg-type]

    you_score = _clamp(you_total / len(dims))
    comp_score = _clamp(comp_total / len(dims))
    overall = "you" if you_score > comp_score + 2 else "competitor" if comp_score > you_score + 2 else "tie"

    persona_prefs: List[PersonaPreference] = []
    for role in PERSONA_ROLES[:6]:
        w = _ROLE_PROFILE[role]["weights"]
        you_fit = -(you_gaps["sso"] * w["sso"] + you_gaps["price"] * w["price"] + you_gaps["free"] * w["free"])
        comp_fit = -(comp_gaps["sso"] * w["sso"] + comp_gaps["price"] * w["price"] + comp_gaps["free"] * w["free"])
        prefers = "you" if you_fit >= comp_fit else "competitor"
        persona_prefs.append(
            PersonaPreference(
                role=role,  # type: ignore[arg-type]
                prefers=prefers,  # type: ignore[arg-type]
                why=(
                    "Better fit on the gaps this role cares about most."
                    if prefers == "you"
                    else "Competitor covers this role's blockers more directly."
                ),
            )
        )

    reason = (
        f"{_domain_label(url) if overall == 'you' else _domain_label(competitor_url)} "
        f"leads on {max(dimensions, key=lambda d: abs(d.you - d.competitor)).name.lower()}."
        if overall != "tie"
        else "Both sites are evenly matched; execution on the details will decide."
    )

    return CompetitorAnalysis(
        you=SiteScore(url=url, title=you_a.title, score=you_score),
        competitor=SiteScore(url=competitor_url, title=comp_a.title, score=comp_score),
        winner=overall,  # type: ignore[arg-type]
        reason=reason,
        dimensions=dimensions,
        personaPreferences=persona_prefs,
    )


# ---------------------------------------------------------------------------
# 7) Pricing simulation — constant-elasticity demand model
# ---------------------------------------------------------------------------
def mock_pricing(
    url: str,
    current_price: Optional[float] = None,
    proposed_price: Optional[float] = None,
) -> PricingSimulation:
    """Constant-elasticity-of-demand model:  conversion ∝ price^(elasticity),
    elasticity < 0. Revenue index = price * conversion. We scan a price grid to
    find the revenue-maximizing 'optimal' price."""
    r = _rng(url, "pricing")
    analysis = mock_analysis(url)

    # Derive a sane current price from the Pro tier if not provided.
    if current_price is None:
        pro = next((t for t in analysis.pricingTiers if t.name.lower() == "pro"), None)
        if pro and re.search(r"\d+", pro.price):
            current_price = float(re.search(r"\d+", pro.price).group())  # type: ignore[union-attr]
        else:
            current_price = 29.0
    current_price = float(max(1.0, current_price))

    elasticity = -1.3 - r.random() * 0.6  # between -1.3 and -1.9

    # Conversion at the current price is our anchor (0..1).
    base_conv = 0.06 + r.random() * 0.05  # 6%–11%

    def conversion_at(price: float) -> float:
        ratio = price / current_price
        c = base_conv * (ratio ** elasticity)
        return max(0.001, min(0.6, c))

    def revenue_index(price: float) -> float:
        # Index against current revenue = 100.
        cur_rev = current_price * conversion_at(current_price)
        return round(100 * (price * conversion_at(price)) / cur_rev, 1)

    # Build the curve across a grid 0.4x..2.0x of current price.
    curve: List[PricePoint] = []
    lo, hi = current_price * 0.4, current_price * 2.0
    steps = 13
    optimal_price = current_price
    best_rev = -1.0
    for i in range(steps):
        price = round(lo + (hi - lo) * i / (steps - 1), 2)
        conv = round(conversion_at(price) * 100, 2)
        rev_idx = revenue_index(price)
        curve.append(PricePoint(price=price, conversion=conv, revenueIndex=rev_idx))
        if rev_idx > best_rev:
            best_rev = rev_idx
            optimal_price = price

    if proposed_price is None:
        proposed_price = optimal_price
    proposed_price = float(max(1.0, proposed_price))

    conv_change = round(
        100 * (conversion_at(proposed_price) - conversion_at(current_price))
        / conversion_at(current_price),
        1,
    )
    rev_change = round(revenue_index(proposed_price) - 100.0, 1)

    if proposed_price > current_price:
        recommendation = (
            f"Raising to ${proposed_price:.0f} trades volume for margin: "
            f"~{conv_change}% conversions, {rev_change:+.0f}% revenue index. "
            + ("Worth it." if rev_change > 0 else "Not worth it — revenue drops.")
        )
    elif proposed_price < current_price:
        recommendation = (
            f"Lowering to ${proposed_price:.0f} lifts conversions ~{conv_change:+.0f}% "
            f"for a {rev_change:+.0f}% revenue index change."
        )
    else:
        recommendation = f"${current_price:.0f} is already at (or near) the revenue-optimal point."

    # Segment reactions keyed off budget sensitivity & the direction of change.
    seg_reactions: List[SegmentReaction] = []
    going_up = proposed_price > current_price
    for role in PERSONA_ROLES:
        budget = _ROLE_PROFILE[role]["budget"]
        sensitive = budget == "High"
        will_churn = bool(going_up and sensitive and r.random() > 0.4)
        reaction = (
            ("Likely to churn or downgrade." if will_churn else "Will grumble but stay.")
            if going_up
            else "Pleased — more likely to convert."
        )
        if not sensitive and going_up:
            reaction = "Largely price-insensitive; minimal reaction."
            will_churn = False
        seg_reactions.append(
            SegmentReaction(role=role, reaction=reaction, willChurn=will_churn)  # type: ignore[arg-type]
        )

    return PricingSimulation(
        currentPrice=round(current_price, 2),
        proposedPrice=round(proposed_price, 2),
        expectedConversionChange=conv_change,
        expectedRevenueChange=rev_change,
        recommendation=recommendation,
        segmentReactions=seg_reactions,
        optimalPrice=round(optimal_price, 2),
        curve=curve,
    )


# ---------------------------------------------------------------------------
# Convenience: full offline run in one call (used by tests / CLI smoke checks)
# ---------------------------------------------------------------------------
def full_mock_run(url: str, persona_count: int = 8) -> dict:
    analysis = mock_analysis(url)
    personas = mock_personas(url, persona_count)
    sims = mock_simulations(url, analysis, personas)
    insights = mock_insights(url, analysis, sims)
    report = mock_report(url, analysis, insights)
    return {
        "analysis": analysis,
        "personas": personas,
        "simulations": sims,
        "insights": insights,
        "report": report,
    }
