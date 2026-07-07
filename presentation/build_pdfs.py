#!/usr/bin/env python3
"""
Generate two separate PDFs for Ghost Customer AI:
  1. Ghost-Customer-AI-Pitch.pdf   -> a pitch deck (16:9 landscape, dark theme)
  2. Ghost-Customer-AI-Report.pdf  -> a written project report (A4 portrait, light)

Run:  python presentation/build_pdfs.py
Deps: fpdf2  (pip install fpdf2)
"""

import os
import math
from fpdf import FPDF
from fpdf.enums import XPos, YPos

REPO = "github.com/garvbahl37-gif/GhostAI"
TAGLINE = "The AI that becomes your customer before your customer becomes your problem."
OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def T(s: str) -> str:
    """Sanitize to characters the core PDF fonts can render."""
    repl = {
        "—": "-", "–": "-", "→": "->", "←": "<-",
        "‘": "'", "’": "'", "“": '"', "”": '"',
        "…": "...", "•": "-", " ": " ", " ": " ",
        "×": "x", "✅": "", "→️": "->",
    }
    for k, v in repl.items():
        s = s.replace(k, v)
    return s.encode("latin-1", "ignore").decode("latin-1")


# ============================================================================
# PITCH DECK
# ============================================================================
SLIDE_W, SLIDE_H = 297, 167  # 16:9

SLIDES = [
    {
        "kind": "title",
        "title": "GHOST CUSTOMER AI",
        "tagline": TAGLINE,
        "sub": "A multi-agent platform that simulates hundreds of customers before launch.",
    },
    {
        "kicker": "01 / THE PROBLEM",
        "title": "Companies find out too late.",
        "body": [
            "Today, a business learns what's broken on its website only AFTER customers:",
            "   leave bad reviews   /   open support tickets   /   cancel   /   ask for refunds   /   stop buying.",
            "By then the ad spend is gone and the customers are lost.",
            "Existing AI tools are reactive - they answer questions only after the problem occurs.",
        ],
    },
    {
        "kicker": "02 / THE INSIGHT",
        "title": "Every landing page is a black box.",
        "body": [
            "You ship it, then wait weeks for real traffic, heatmaps and churn data to tell you what failed.",
            "What if you could meet your customers - and watch them judge you - before they are real?",
            "We open the black box first.",
        ],
    },
    {
        "kicker": "03 / THE SOLUTION",
        "title": "Ghost Customer AI becomes the customer.",
        "body": [
            "We spin up hundreds of AI-generated virtual customers ('ghosts') that browse your site like real prospects.",
            "Each ghost reads your pricing, FAQs, features and onboarding, asks the hard questions,",
            "and reports exactly where it got confused, where it hesitated, and what objection killed the deal.",
            "You watch it live, then receive a board-ready executive report - before one real customer hits the page.",
        ],
    },
    {
        "kicker": "04 / WHY WE'RE DIFFERENT",
        "title": "This is NOT a chatbot.",
        "body": [
            "Reactive chatbots:  wait for a customer to ask  ->  answer after the damage is done  ->  one chat at a time.",
            "Ghost Customer AI:  becomes hundreds of customers  ->  finds problems before launch  ->  simulates your whole market at once.",
            "A chatbot talks to your customer. We become your customer.",
        ],
    },
    {
        "kicker": "05 / HOW IT WORKS",
        "title": "From a URL to insight in 7 steps.",
        "body": [
            "1.  Enter a website URL",
            "2.  AI crawls and analyzes the business",
            "3.  Generates hundreds of customer personas",
            "4.  Runs the customer simulation swarm",
            "5.  Sales and Support agents stress-test the experience",
            "6.  Detects revenue leaks and churn risks",
            "7.  Delivers an executive report",
        ],
    },
    {
        "kicker": "06 / THE FLAGSHIP",
        "title": "The Customer Swarm.",
        "body": [
            "12 to 500 AI personas across 10 archetypes:",
            "   Startup Founder, CTO, Product Manager, Agency Owner, Student,",
            "   Small Business Owner, Enterprise Buyer, Operations Manager, HR Manager, Freelancer.",
            "Each persona returns: interest, confusion, purchase probability, support dependency, churn risk,",
            "and a verdict - Convert / Maybe / Churn Risk / Bounce - rendered as a living, rotating swarm.",
        ],
    },
    {
        "kicker": "07 / THE ENGINE",
        "title": "A coordinated 8-agent brain.",
        "body": [
            "Website Analyzer  ->  Persona Generator  ->  Customer Simulation Swarm",
            "        ->  Sales Agent  ||  Support Agent  ->  Revenue Leak Agent  ->  Insight Agent  ->  Report Generator",
            "",
            "Orchestrated with LangGraph (Python) and mirrored in a TypeScript engine. Two paths, identical contract.",
        ],
    },
    {
        "kicker": "08 / WHAT YOU GET",
        "title": "Eight ways to find problems first.",
        "body": [
            "-  Conversion risk engine        -  Sales objection mining",
            "-  Support stress test           -  Revenue leak quantification (with $ impact)",
            "-  Churn risk segmentation       -  Competitor Battle Arena (you vs a rival)",
            "-  Pricing Time Machine          -  Executive report (PDF / Markdown export)",
        ],
    },
    {
        "kicker": "09 / EXAMPLE OUTPUT",
        "title": "What a run reveals.",
        "body": [
            "For a typical SaaS site, the swarm reports:",
            "   '67% of simulated customers were confused about pricing.'",
            "   'Enterprise buyers cannot find security / SSO information.'",
            "   'No free tier - self-serve buyers bounce.'",
            "   'Estimated +15% conversion uplift if the top fixes ship.'",
        ],
    },
    {
        "kicker": "10 / BUSINESS VALUE",
        "title": "Fix it before you pay for traffic.",
        "body": [
            "Improve conversion, reduce churn, close support gaps, win competitive deals, and price with confidence -",
            "all before spending a dollar on acquisition. A digital twin of your customer base, on demand.",
        ],
    },
    {
        "kicker": "11 / TECH & STATUS",
        "title": "Production-quality, demo-proof.",
        "body": [
            "Frontend:  Next.js 15, React 19, TypeScript, Tailwind, Framer Motion, Recharts.",
            "AI:  Gemini 2.5 Flash  |  Agents:  LangGraph + FastAPI  |  Crawl:  Firecrawl.",
            "Data:  Supabase Postgres + pgvector.  Deploy:  Vercel (web) + Render (engine).",
            "Runs with ZERO API keys on a deterministic mock engine - the full demo always works.",
        ],
    },
    {
        "kind": "title",
        "title": "Meet your customers before reality does.",
        "tagline": TAGLINE,
        "sub": REPO,
    },
]


class Deck(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(110, 110, 118)
        self.cell(0, 6, T("GHOST CUSTOMER AI"), align="L")
        self.cell(0, 6, T(f"{self.page_no()} / {len(SLIDES)}"), align="R")

    def bg(self):
        self.set_fill_color(8, 8, 11)
        self.rect(0, 0, SLIDE_W, SLIDE_H, "F")
        # top hairline
        self.set_draw_color(70, 70, 78)
        self.set_line_width(0.3)
        self.line(20, 16, SLIDE_W - 20, 16)


def build_deck():
    pdf = Deck(orientation="L", unit="mm", format=(SLIDE_H, SLIDE_W))
    pdf.set_auto_page_break(False)
    pdf.set_margins(20, 20, 20)
    cw = SLIDE_W - 40

    for s in SLIDES:
        pdf.add_page()
        pdf.bg()
        if s.get("kind") == "title":
            pdf.set_xy(20, 58)
            pdf.set_font("Helvetica", "B", 34)
            pdf.set_text_color(248, 248, 250)
            pdf.multi_cell(cw, 15, T(s["title"]), align="L",
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(4)
            pdf.set_x(20)
            pdf.set_font("Helvetica", "I", 13)
            pdf.set_text_color(170, 170, 178)
            pdf.multi_cell(cw, 7, T(s["tagline"]), align="L",
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(3)
            pdf.set_x(20)
            pdf.set_font("Helvetica", "", 11)
            pdf.set_text_color(130, 130, 138)
            pdf.multi_cell(cw, 6, T(s["sub"]), align="L")
        else:
            pdf.set_xy(20, 24)
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(140, 140, 148)
            pdf.cell(cw, 6, T(s["kicker"]), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(2)
            pdf.set_x(20)
            pdf.set_font("Helvetica", "B", 26)
            pdf.set_text_color(248, 248, 250)
            pdf.multi_cell(cw, 12, T(s["title"]), align="L",
                           new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(5)
            pdf.set_font("Helvetica", "", 13)
            pdf.set_text_color(196, 196, 204)
            for line in s["body"]:
                pdf.set_x(20)
                if line == "":
                    pdf.ln(3)
                    continue
                pdf.multi_cell(cw, 7.5, T(line), align="L",
                               new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1.5)

    out = os.path.join(OUT_DIR, "Ghost-Customer-AI-Pitch.pdf")
    pdf.output(out)
    return out


# ============================================================================
# WRITTEN REPORT
# ============================================================================
REPORT = [
    ("Executive Summary", [
        ("p", "Ghost Customer AI is a multi-agent customer-simulation platform. Instead of waiting for "
              "real users to reveal what is broken on a website, it generates hundreds of AI-powered "
              "virtual customers - 'ghosts' - that browse the site, evaluate pricing and onboarding, ask "
              "buying questions, and report where they would get confused, hesitate, or abandon. The "
              "platform then quantifies conversion risk, churn risk, support gaps and revenue leaks, and "
              "produces a board-ready executive report - all before a single real customer arrives."),
        ("p", "The product is deliberately not a chatbot. A chatbot answers a customer after a problem "
              "occurs; Ghost Customer AI becomes the customer and surfaces the problem proactively, across "
              "an entire simulated market at once. It is built to run end-to-end with zero API keys on a "
              "deterministic engine, and to upgrade transparently to live AI when keys are present."),
    ]),
    ("1. Problem Statement", [
        ("p", "Businesses typically discover experience problems only after they have already cost money: "
              "negative reviews, support tickets, cancellations, refund requests, and silent drop-off. "
              "Conversion blockers, unanswered sales objections, thin documentation and unclear pricing "
              "are invisible until traffic exposes them - by which point acquisition spend is wasted."),
        ("p", "Existing AI tooling is reactive. Chatbots, support assistants and FAQ bots respond once a "
              "user complains. None of them simulate the customer's experience ahead of launch, and none "
              "predict which segments will churn or why a deal stalls."),
    ]),
    ("2. Solution Overview", [
        ("p", "Ghost Customer AI inverts the model. It crawls and understands a target website, generates "
              "a diverse population of realistic customer personas, and runs each persona through the full "
              "funnel (Landing, Pricing, Features, Onboarding, Support). Specialized agents then act as a "
              "prospective buyer and as a difficult support customer to stress-test the site. The results "
              "are aggregated into quantified risks and a prioritized set of recommendations."),
        ("p", "The user experience centers on a live 'war room' where the swarm is visualized in real time "
              "as a rotating field of customer nodes, followed by an interactive insights dashboard and an "
              "exportable executive report."),
    ]),
    ("3. Product Features", [
        ("b", "Customer Swarm Simulation - 12 to 500 AI personas across 10 archetypes, each simulating a "
              "complete buying journey and returning interest, confusion, purchase probability, support "
              "dependency, churn risk and a verdict (Convert / Maybe / Churn Risk / Bounce)."),
        ("b", "Website Intelligence - extracts value propositions, calls-to-action, pricing tiers, FAQs, "
              "trust signals and a 0-100 content clarity score."),
        ("b", "Sales Objection Mining - surfaces the exact buyer questions the site never answers, scored "
              "by impact and affected roles."),
        ("b", "Support Stress Test - measures FAQ and documentation coverage against hard scenarios and "
              "flags where support dependency and churn rise."),
        ("b", "Revenue Leak Detection - names each leak, its cause, the percentage of customers affected, "
              "the estimated conversion loss and the recommended fix."),
        ("b", "Churn Prediction - identifies which segments will leave and why (Pricing, Onboarding, "
              "Missing Features, Poor Support, Complexity)."),
        ("b", "Competitor Battle Arena - scores your site against a rival across dimensions and shows which "
              "customer segments prefer which product."),
        ("b", "Pricing Time Machine - a constant-elasticity demand model that finds the revenue-maximizing "
              "price and predicts how each segment reacts to a change."),
        ("b", "Executive Report - a narrative summary with prioritized, effort-vs-impact recommendations, "
              "exportable to PDF and Markdown."),
    ]),
    ("4. Multi-Agent Architecture", [
        ("p", "The platform is built around a canonical eight-agent graph. Website Analyzer feeds Persona "
              "Generator, which feeds the Customer Simulation Swarm. The Sales Agent and Support Agent run "
              "as parallel branches after simulation and fan back into the Revenue Leak Agent, which is "
              "followed by the Insight Agent and finally the Report Generator."),
        ("mono", "Website Analyzer -> Persona Generator -> Customer Simulation Swarm"),
        ("mono", "        -> Sales Agent  ||  Support Agent"),
        ("mono", "        -> Revenue Leak Agent -> Insight Agent -> Report Generator"),
        ("p", "Language-heavy stages (site understanding and report narrative) are handled by the LLM, "
              "where reasoning adds the most value. Per-persona scoring stays in a fast, grounded, "
              "deterministic engine, so a 500-ghost swarm never fans out into 500 fragile model calls and "
              "every number traces back to the same detected gaps."),
    ]),
    ("5. Technical Architecture & Stack", [
        ("p", "The product ships as a full-stack TypeScript application (Next.js 15, React 19, Tailwind, "
              "Framer Motion, Recharts). Its API routes implement the multi-agent orchestrator and stream "
              "results to the browser as newline-delimited JSON, driving the live war-room UI. A parallel "
              "Python engine (FastAPI + LangGraph) implements the identical agent graph and contract, and "
              "can be enabled via an environment variable."),
        ("p", "AI is provided by Gemini 2.5 Flash; crawling by Firecrawl with a plain-fetch fallback; "
              "optional persistence by Supabase Postgres with pgvector. Crucially, all external services "
              "are optional: with no keys the app runs on a deterministic, seeded mock engine that produces "
              "rich, reproducible results, guaranteeing the demo always works."),
        ("p", "Deployment: the Next.js app (frontend plus its API-route backend) deploys to Vercel as one "
              "unit; the optional Python engine deploys to Render or Railway. Docker and docker-compose "
              "files are provided for fully offline, local operation."),
    ]),
    ("6. Data Model & API", [
        ("p", "Core domain types include WebsiteAnalysis, Persona, SimulationResult, Insights, "
              "CompetitorAnalysis, PricingSimulation and ExecutiveReport, shared verbatim between the "
              "TypeScript and Python engines. The Supabase schema defines users/profiles, projects, "
              "crawled_pages and documents (with vector embeddings), personas, simulations, insights, "
              "reports and competitor_analysis, with row-level security and pgvector indexes."),
        ("b", "POST /api/run - streams the full multi-agent run as NDJSON RunEvents."),
        ("b", "POST /api/project, /api/crawl, /api/generate-personas - project + analysis utilities."),
        ("b", "POST /api/competitor-analysis, /api/pricing-simulation - standalone analyses."),
        ("b", "GET /api/insights, /api/report, /api/health - results and status."),
    ]),
    ("7. Differentiation", [
        ("p", "Most AI products in this space are reactive: chatbots, support assistants and FAQ bots that "
              "engage after a customer raises an issue. Ghost Customer AI is proactive and population-scale: "
              "it simulates the whole market before launch. The closest analogies are chaos engineering and "
              "digital-twin technology applied to customer behavior rather than infrastructure."),
    ]),
    ("8. Roadmap", [
        ("b", "Deeper LLM reasoning mode that routes a sample of personas through full model reasoning."),
        ("b", "Mission-control dashboard layout and an interactive revenue-leak 'fracture map' of the site."),
        ("b", "Real document/PDF ingestion and competitor multi-page crawling."),
        ("b", "Persisted run history and team collaboration via Supabase Auth."),
    ]),
    ("9. Conclusion", [
        ("p", "Ghost Customer AI turns customer discovery from a lagging indicator into a leading one. By "
              "becoming hundreds of customers on demand, it lets a business see - and fix - conversion "
              "blockers, churn risks and revenue leaks before real customers ever experience them. It is "
              "production-quality, demo-proof, and architecturally honest about where AI adds value versus "
              "where deterministic logic keeps results fast and reproducible."),
        ("p", f"Source code: {REPO}"),
    ]),
]


class Report(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_y(10)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(150, 150, 156)
        self.cell(0, 5, T("GHOST CUSTOMER AI - Project Report"), align="L")
        self.cell(0, 5, T(self.section or ""), align="R",
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(220, 220, 224)
        self.set_line_width(0.2)
        self.line(20, 18, 190, 18)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-14)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(150, 150, 156)
        self.cell(0, 6, T(f"Page {self.page_no()}"), align="C")

    section = ""


def _dot_sphere(pdf, cx, cy, R, n=150):
    """Draw a monochrome dot-sphere motif (on-brand 'customer core')."""
    pts = []
    for i in range(n):
        phi = math.acos(1 - 2 * (i + 0.5) / n)
        theta = math.pi * (1 + 5 ** 0.5) * (i + 0.5)
        x = math.sin(phi) * math.cos(theta)
        y = math.cos(phi)
        z = math.sin(phi) * math.sin(theta)
        pts.append((x, y, z))
    pts.sort(key=lambda p: p[2])  # back-to-front
    for x, y, z in pts:
        depth = (z + 1) / 2  # 0 (back) .. 1 (front)
        sx = cx + x * R
        sy = cy + y * R
        rad = 0.3 + depth * 0.8
        shade = int(70 + depth * 185)
        pdf.set_fill_color(shade, shade, min(255, shade + 4))
        pdf.ellipse(sx - rad, sy - rad, rad * 2, rad * 2, "F")


def build_report():
    pdf = Report(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(True, margin=20)
    pdf.set_margins(20, 22, 20)
    cw = 170

    # ---- cover (full-bleed dark) ----
    pdf.add_page()
    pdf.set_fill_color(7, 7, 10)
    pdf.rect(0, 0, 210, 297, "F")
    # on-brand dot sphere motif, lower-centre
    _dot_sphere(pdf, cx=105, cy=200, R=58, n=160)
    # top hairline + kicker
    pdf.set_draw_color(70, 70, 78)
    pdf.set_line_width(0.3)
    pdf.line(20, 52, 190, 52)
    pdf.set_xy(20, 58)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(150, 150, 158)
    pdf.cell(cw, 6, T("PROJECT REPORT"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    # title
    pdf.set_xy(20, 70)
    pdf.set_font("Helvetica", "B", 32)
    pdf.set_text_color(248, 248, 250)
    pdf.multi_cell(cw, 14, T("Ghost Customer AI"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)
    pdf.set_x(20)
    pdf.set_font("Helvetica", "I", 12)
    pdf.set_text_color(180, 180, 188)
    pdf.multi_cell(cw, 7, T(TAGLINE), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    # bottom meta
    pdf.set_draw_color(60, 60, 68)
    pdf.line(20, 272, 190, 272)
    pdf.set_xy(20, 276)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(160, 160, 168)
    pdf.cell(cw / 2, 5, T("Multi-agent customer simulation platform"), align="L")
    pdf.cell(cw / 2, 5, T(REPO), align="R")

    # ---- body ----
    pdf.add_page()
    for title, blocks in REPORT:
        pdf.section = title
        if pdf.get_y() > 250:
            pdf.add_page()
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 15)
        pdf.set_text_color(18, 18, 22)
        pdf.set_x(20)
        pdf.multi_cell(cw, 8, T(title), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(1)
        for kind, text in blocks:
            pdf.set_x(20)
            if kind == "p":
                pdf.set_font("Helvetica", "", 11)
                pdf.set_text_color(44, 44, 50)
                pdf.multi_cell(cw, 6, T(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(2)
            elif kind == "b":
                pdf.set_font("Helvetica", "", 11)
                pdf.set_text_color(44, 44, 50)
                pdf.set_x(22)
                pdf.cell(4, 6, T("-"))
                pdf.multi_cell(cw - 6, 6, T(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1)
            elif kind == "mono":
                pdf.set_font("Courier", "", 9.5)
                pdf.set_text_color(30, 30, 36)
                pdf.set_fill_color(244, 244, 246)
                pdf.multi_cell(cw, 5.5, T(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)

    out = os.path.join(OUT_DIR, "Ghost-Customer-AI-Report.pdf")
    pdf.output(out)
    return out


if __name__ == "__main__":
    d = build_deck()
    r = build_report()
    print("Pitch deck :", d)
    print("Report     :", r)
