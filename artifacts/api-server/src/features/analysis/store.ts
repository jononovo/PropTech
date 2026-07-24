import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db, analysisRunsTable } from "@workspace/db";
import type { GetAnalysisResponse, IngestAnalysisRunBody } from "@workspace/api-zod";

export type AnalysisSidecar = z.infer<typeof GetAnalysisResponse>;
export type AnalysisRun = z.infer<typeof IngestAnalysisRunBody>;

/**
 * Postgres-backed sidecar: one row per ingested run, ordered by seq (ingest
 * order). The API's sidecar shape is rebuilt on read; latestRunId is the
 * highest seq — "latest INGESTED run wins", same semantics the file store had.
 */

/** No rows reads as an empty shell — the UI treats "no runs yet" as a normal state. */
export async function readSidecar(applicationId: string): Promise<AnalysisSidecar> {
  const rows = await db
    .select({ runId: analysisRunsTable.runId, data: analysisRunsTable.data })
    .from(analysisRunsTable)
    .where(eq(analysisRunsTable.applicationId, applicationId))
    .orderBy(asc(analysisRunsTable.seq));
  return {
    applicationId,
    latestRunId: rows.length > 0 ? rows[rows.length - 1]!.runId : null,
    runs: rows.map((r) => r.data as AnalysisRun),
  };
}

/**
 * Append-only write-path (analyzer spec §5): the portal appends the run and
 * derives latestRunId itself — the analyzer stays stateless toward the portal.
 * Duplicate runIds are rejected via the unique (application_id, run_id) index:
 * atomic replay protection with no read-modify-write race.
 */
export async function appendRun(applicationId: string, run: AnalysisRun): Promise<AnalysisSidecar | "duplicate"> {
  const inserted = await db
    .insert(analysisRunsTable)
    .values({ applicationId, runId: run.runId, data: run })
    .onConflictDoNothing()
    .returning({ seq: analysisRunsTable.seq });
  if (inserted.length === 0) return "duplicate";
  return readSidecar(applicationId);
}
