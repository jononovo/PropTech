import { pgTable, text, jsonb, timestamp, bigserial, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Append-only analyzer runs (analyzer spec §5): the portal appends runs and
 * derives latestRunId itself — "latest INGESTED wins", which is exactly the
 * highest `seq` per application. One row per run; the run object (contract
 * shape: IngestAnalysisRunBody) lives whole in `data`.
 *
 * Unique (application_id, run_id) is the replay protection: a duplicate
 * ingest becomes ON CONFLICT DO NOTHING → the API's 409.
 */
export const analysisRunsTable = pgTable(
  "analysis_runs",
  {
    seq: bigserial("seq", { mode: "number" }).primaryKey(),
    applicationId: text("application_id").notNull(),
    runId: text("run_id").notNull(),
    data: jsonb("data").notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("analysis_runs_app_run_unique").on(t.applicationId, t.runId)],
);

export type AnalysisRunRow = typeof analysisRunsTable.$inferSelect;
