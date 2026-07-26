import { eq, sql } from "drizzle-orm";
import {
  db,
  analysisRunsTable,
  applicationEventsTable,
  applicationsTable,
  approvedDocumentsTable,
} from "@workspace/db";
import { logger } from "../../lib/logger";
import { deleteApplicationObjects } from "../../lib/packetObjectStore";

/**
 * Data-retention sweep (policy: internal_docs/retention.md, owner-set Jul 26
 * 2026 — 2 years). An application whose LAST ACTIVITY (newest ledger event,
 * falling back to the row's updatedAt when it somehow has no events) is older
 * than the retention window is purged completely:
 *
 *   1. every object under applications/<storageFolder>/ (uploads, approved
 *      pairs, run artifacts) — bytes first, so a crash mid-purge never leaves
 *      a DB record pointing at deleted bytes for long (the row goes next run)
 *   2. all DB rows: events, analysis runs, approved-docs registry, the
 *      application itself — one transaction.
 *
 * Runs daily (scheduled from index.ts) + once shortly after boot. Deletion is
 * logged, not ledgered — the ledger being purged is the point.
 */

export const RETENTION_DAYS = Number(process.env["RETENTION_DAYS"] ?? 730);

export type RetentionCandidate = {
  id: string;
  applicantName: string | null;
  storageFolder: string | null;
  lastActivityAt: string;
};

/** Apps whose last activity predates the cutoff. */
export async function findExpired(now = new Date()): Promise<RetentionCandidate[]> {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: applicationsTable.id,
      data: applicationsTable.data,
      lastActivity: sql<string>`greatest(${applicationsTable.updatedAt}, coalesce(max(${applicationEventsTable.at}), ${applicationsTable.updatedAt}))`,
    })
    .from(applicationsTable)
    .leftJoin(applicationEventsTable, eq(applicationEventsTable.applicationId, applicationsTable.id))
    .groupBy(applicationsTable.id)
    .having(
      sql`greatest(${applicationsTable.updatedAt}, coalesce(max(${applicationEventsTable.at}), ${applicationsTable.updatedAt})) < ${cutoff}`,
    );
  return rows.map((r) => {
    const doc = r.data as { applicantName?: string; storageFolder?: string };
    return {
      id: r.id,
      applicantName: doc.applicantName ?? null,
      storageFolder: doc.storageFolder ?? null,
      lastActivityAt: new Date(r.lastActivity).toISOString(),
    };
  });
}

async function purgeOne(c: RetentionCandidate): Promise<void> {
  const objects = c.storageFolder ? await deleteApplicationObjects(c.storageFolder) : 0;
  await db.transaction(async (tx) => {
    await tx.delete(applicationEventsTable).where(eq(applicationEventsTable.applicationId, c.id));
    await tx.delete(analysisRunsTable).where(eq(analysisRunsTable.applicationId, c.id));
    await tx.delete(approvedDocumentsTable).where(eq(approvedDocumentsTable.applicationId, c.id));
    await tx.delete(applicationsTable).where(eq(applicationsTable.id, c.id));
  });
  logger.info(
    { applicationId: c.id, applicant: c.applicantName, lastActivityAt: c.lastActivityAt, objectsDeleted: objects },
    "retention: purged expired application",
  );
}

/** One full sweep. Failures on one app don't stop the rest. */
export async function sweepExpired(): Promise<{ purged: number; failed: number }> {
  const expired = await findExpired();
  let purged = 0;
  let failed = 0;
  for (const c of expired) {
    try {
      await purgeOne(c);
      purged += 1;
    } catch (err) {
      failed += 1;
      logger.error({ err, applicationId: c.id }, "retention: purge failed — will retry next sweep");
    }
  }
  if (expired.length > 0) logger.info({ purged, failed }, "retention: sweep complete");
  return { purged, failed };
}

/** Boot wiring: first sweep 60 s after start, then every 24 h. */
export function scheduleRetentionSweep(): void {
  const run = (): void => {
    void sweepExpired().catch((err) => logger.error({ err }, "retention: sweep crashed"));
  };
  setTimeout(run, 60_000).unref();
  setInterval(run, 24 * 60 * 60 * 1000).unref();
  logger.info({ retentionDays: RETENTION_DAYS }, "retention: sweep scheduled (boot +60s, then daily)");
}
