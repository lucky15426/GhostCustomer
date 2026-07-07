import { WarRoom } from "@/components/war-room/war-room";

export default async function SimulationPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <WarRoom runId={runId} />;
}
