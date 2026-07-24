import type { Application } from "../intake/store";
import type { AnalysisRun } from "../analysis/store";

type PacketState = NonNullable<Application["packet"]>;

/**
 * Deterministic run SIMULATOR — the stand-in analyzer while the real engine is built.
 * Boring on purpose: sequential page assignment, neutral scores, zero fabricated
 * findings. Every surface labels it via pipelineVersion "simulated-*"; the whisper
 * says so in plain words. It exercises the full choreography (gate → run → report)
 * without pretending to analyze.
 */

function documentBlocks(app: Application): { id: string; criticality: "critical" | "standard" | "supporting" }[] {
  const out: { id: string; criticality: "critical" | "standard" | "supporting" }[] = [];
  for (const section of app.template.sections) {
    for (const ss of section.subsections) {
      for (const b of ss.blocks) {
        if (b.kind === "document") out.push({ id: b.id, criticality: b.criticality ?? "standard" });
      }
    }
  }
  return out;
}

export function buildSimulatedRun(app: Application, packet: PacketState, gate: "auto" | "confirmed" | "bypassed"): AnalysisRun {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const blocks = documentBlocks(app);
  const assigned = blocks.slice(0, Math.min(blocks.length, packet.pages));

  const documents: AnalysisRun["documents"] = assigned.map((block, i) => ({
    segment: { pages: [i + 1, i + 1] },
    suggestedBlockId: block.id,
    confidence: 0.5,
    suggestedName: `${today}_${block.id}_simulated.pdf`,
    coreFields: { document_date: today, primary_party_name: app.applicantName },
    scores: { quality: 0.5, formatting: 0.5, fraud_signal: 0, scrutinyTier: block.criticality },
    flags: [],
    extractions: [],
    artifacts: { md: "simulated:none", pageRenders: [], crops: [] },
  }));

  const leftover = packet.pages - assigned.length;
  const unassigned: AnalysisRun["unassigned"] =
    leftover > 0
      ? [
          {
            pages: [assigned.length + 1, packet.pages],
            description: "Pages not matched to any requirement — simulated run assigns one page per requirement in template order.",
          },
        ]
      : [];

  const flagCount = packet.preflight?.flags.length ?? 0;
  return {
    runId: `sim-${now.getTime().toString(36)}`,
    startedAt: now.toISOString(),
    pipelineVersion: "simulated-0.1",
    preflight: { pages: packet.pages, flags: packet.preflight?.flags ?? [], gate },
    documents,
    unassigned,
    whisper: [
      "SIMULATED RUN — deterministic placeholder; the analyzer engine is not built yet.",
      `Assigned ${assigned.length} of ${packet.pages} page(s) to ${assigned.length} requirement(s) sequentially; ${Math.max(0, leftover)} page(s) unassigned; pre-flight raised ${flagCount} flag(s).`,
    ],
  };
}

/**
 * The simulated run enters through the REAL ingest endpoint over HTTP — the same
 * door the Python analyzer will use. The portal never fabricates analysis through
 * a side channel, so swapping the simulator for the real engine changes nothing
 * on the portal side.
 */
export async function ingestViaRealEndpoint(applicationId: string, runObj: AnalysisRun): Promise<void> {
  const port = process.env["PORT"];
  if (!port) throw new Error("PORT is not set — cannot reach the ingest endpoint");
  const res = await fetch(`http://127.0.0.1:${port}/api/applications/${encodeURIComponent(applicationId)}/analysis`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(runObj),
  });
  if (res.status !== 201) {
    const body = await res.text().catch(() => "");
    throw new Error(`Analyzer ingest rejected the simulated run: ${res.status} ${body.slice(0, 300)}`);
  }
}
