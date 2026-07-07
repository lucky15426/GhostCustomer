import { InsightsView } from "@/components/insights/insights-view";

export default async function InsightsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <InsightsView runId={runId} />;
}
