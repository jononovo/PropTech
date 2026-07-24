import path from "node:path";
import { z } from "zod";
import type { GetAnalysisResponse, IngestAnalysisRunBody } from "@workspace/api-zod";
import { DATA_DIR, readJson, writeJsonAtomic } from "../../lib/jsonStore";

export type AnalysisSidecar = z.infer<typeof GetAnalysisResponse>;
export type AnalysisRun = z.infer<typeof IngestAnalysisRunBody>;

const ANALYSIS_DIR = path.join(DATA_DIR, "analysis");

export function sidecarPath(applicationId: string): string {
  return path.join(ANALYSIS_DIR, `${applicationId}.json`);
}

/** Missing sidecar reads as an empty shell — the UI treats "no runs yet" as a normal state. */
export function readSidecar(applicationId: string): AnalysisSidecar {
  return (
    readJson<AnalysisSidecar>(sidecarPath(applicationId)) ?? {
      applicationId,
      latestRunId: null,
      runs: [],
    }
  );
}

export function writeSidecar(sidecar: AnalysisSidecar): void {
  writeJsonAtomic(sidecarPath(sidecar.applicationId), sidecar);
}

/**
 * Append-only write-path (analyzer spec §5): the portal appends the run and sets
 * latestRunId itself — the analyzer stays stateless toward the portal, single-writer
 * semantics preserved. Duplicate runIds are rejected (replay protection).
 */
export function appendRun(applicationId: string, run: AnalysisRun): AnalysisSidecar | "duplicate" {
  const sidecar = readSidecar(applicationId);
  if (sidecar.runs.some((r) => r.runId === run.runId)) return "duplicate";
  sidecar.runs.push(run);
  sidecar.latestRunId = run.runId;
  writeSidecar(sidecar);
  return sidecar;
}
