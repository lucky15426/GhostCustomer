"use client";

// Loaded ONLY via dynamic import() inside a click handler, so @react-pdf never
// runs during SSR. Builds a 1-page B2B sales "Battle Card" from real
// CompetitorAnalysis data and returns a downloadable PDF Blob.

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { CompetitorAnalysis } from "@/lib/types";

const C = {
  ink: "#0a0a0b",
  sub: "#52525b",
  line: "#e4e4e7",
  soft: "#f4f4f5",
  you: "#6d28d9",
  rival: "#dc2626",
  win: "#15803d",
  accent: "#6d28d9",
};

const styles = StyleSheet.create({
  page: { paddingVertical: 34, paddingHorizontal: 38, fontSize: 9.5, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.4 },
  eyebrow: { fontSize: 8, letterSpacing: 2, color: C.accent, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 4 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 10, marginBottom: 14 },
  date: { fontSize: 8, color: C.sub },

  scoreRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  scoreCard: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12 },
  scoreLabel: { fontSize: 7.5, color: C.sub, textTransform: "uppercase", letterSpacing: 1 },
  scoreName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 3 },
  scoreUrl: { fontSize: 7.5, color: C.sub, marginTop: 1 },
  scoreNum: { fontSize: 30, fontFamily: "Helvetica-Bold", marginTop: 6 },

  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginBottom: 7, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: C.line },

  tRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.line },
  tHead: { flexDirection: "row", paddingVertical: 4, backgroundColor: C.soft, paddingHorizontal: 6, borderRadius: 3 },
  cDim: { flex: 1, paddingHorizontal: 6 },
  cNum: { width: 60, textAlign: "center" },
  cWin: { width: 70, textAlign: "right", paddingRight: 6 },
  th: { fontSize: 7.5, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Helvetica-Bold" },

  pitchItem: { flexDirection: "row", gap: 8, marginBottom: 7 },
  chip: { width: 96, fontSize: 8, fontFamily: "Helvetica-Bold" },
  pitchBody: { flex: 1, fontSize: 9 },

  verdict: { backgroundColor: C.soft, borderRadius: 6, padding: 11, marginBottom: 16 },
  footer: { position: "absolute", bottom: 22, left: 38, right: 38, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6, fontSize: 7.5, color: C.sub },
});

const clean = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

function BattleCardDoc({ data, dateStr }: { data: CompetitorAnalysis; dateStr: string }) {
  const youWins = data.dimensions.filter((d) => d.winner === "you").slice(0, 6);
  const rivalWins = data.dimensions.filter((d) => d.winner === "competitor").slice(0, 6);
  const pitches = data.personaPreferences.filter((p) => p.prefers === "you").slice(0, 4);
  const objections = data.personaPreferences.filter((p) => p.prefers === "competitor").slice(0, 3);
  const winnerName = data.winner === "you" ? data.you.title : data.winner === "competitor" ? data.competitor.title : "Tie";

  return (
    <Document title={`Battle Card — ${data.you.title} vs ${data.competitor.title}`} author="Ghost Customer AI">
      <Page size="A4" style={styles.page}>
        <View style={styles.headRow}>
          <View>
            <Text style={styles.eyebrow}>Competitive Battle Card</Text>
            <Text style={styles.h1}>
              {data.you.title} vs {data.competitor.title}
            </Text>
          </View>
          <Text style={styles.date}>Generated {dateStr}{"\n"}by Ghost Customer AI</Text>
        </View>

        {/* scores */}
        <View style={styles.scoreRow}>
          <View style={[styles.scoreCard, data.winner === "you" ? { borderColor: C.you, borderWidth: 2 } : {}]}>
            <Text style={styles.scoreLabel}>Us</Text>
            <Text style={styles.scoreName}>{data.you.title}</Text>
            <Text style={styles.scoreUrl}>{clean(data.you.url)}</Text>
            <Text style={[styles.scoreNum, { color: C.you }]}>{data.you.score}</Text>
          </View>
          <View style={[styles.scoreCard, data.winner === "competitor" ? { borderColor: C.rival, borderWidth: 2 } : {}]}>
            <Text style={styles.scoreLabel}>Competitor</Text>
            <Text style={styles.scoreName}>{data.competitor.title}</Text>
            <Text style={styles.scoreUrl}>{clean(data.competitor.url)}</Text>
            <Text style={[styles.scoreNum, { color: C.rival }]}>{data.competitor.score}</Text>
          </View>
        </View>

        <View style={styles.verdict}>
          <Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Verdict: {winnerName === "Tie" ? "Split decision. " : `${winnerName} wins. `}</Text>
            {data.reason}
          </Text>
        </View>

        {/* head to head */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Head-to-Head</Text>
          <View style={styles.tHead}>
            <Text style={[styles.cDim, styles.th]}>Dimension</Text>
            <Text style={[styles.cNum, styles.th]}>Us</Text>
            <Text style={[styles.cNum, styles.th]}>Them</Text>
            <Text style={[styles.cWin, styles.th]}>Edge</Text>
          </View>
          {data.dimensions.map((d) => (
            <View style={styles.tRow} key={d.name}>
              <Text style={styles.cDim}>{d.name}</Text>
              <Text style={[styles.cNum, { color: C.you, fontFamily: "Helvetica-Bold" }]}>{d.you}</Text>
              <Text style={[styles.cNum, { color: C.rival, fontFamily: "Helvetica-Bold" }]}>{d.competitor}</Text>
              <Text style={[styles.cWin, { color: d.winner === "you" ? C.win : d.winner === "competitor" ? C.rival : C.sub, fontFamily: "Helvetica-Bold" }]}>
                {d.winner === "you" ? "Us" : d.winner === "competitor" ? "Them" : "Even"}
              </Text>
            </View>
          ))}
        </View>

        {/* weaknesses to exploit */}
        {rivalWins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Their Strengths to Neutralize</Text>
            {rivalWins.map((d) => (
              <View style={styles.pitchItem} key={d.name}>
                <Text style={[styles.chip, { color: C.rival }]}>{d.name}</Text>
                <Text style={styles.pitchBody}>They lead {d.competitor} to {d.you}. Acknowledge, then pivot to where we win.</Text>
              </View>
            ))}
          </View>
        )}

        {/* winning pitches per persona */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Winning Pitch by Buyer</Text>
          {pitches.length === 0 && <Text style={{ color: C.sub }}>No clear per-persona advantage detected.</Text>}
          {pitches.map((p) => (
            <View style={styles.pitchItem} key={p.role}>
              <Text style={[styles.chip, { color: C.you }]}>{p.role}</Text>
              <Text style={styles.pitchBody}>{p.why}</Text>
            </View>
          ))}
        </View>

        {/* objections to handle */}
        {objections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objections to Handle</Text>
            {objections.map((p) => (
              <View style={styles.pitchItem} key={p.role}>
                <Text style={[styles.chip, { color: C.sub }]}>{p.role}</Text>
                <Text style={styles.pitchBody}>{p.why}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Ghost Customer AI — Competitive Battle Card</Text>
          <Text>Confidential · for internal sales use</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateBattleCardBlob(data: CompetitorAnalysis, dateStr: string): Promise<Blob> {
  return await pdf(<BattleCardDoc data={data} dateStr={dateStr} />).toBlob();
}
