import { eq, desc, and, isNull } from "drizzle-orm";
import { db, approvedDocumentsTable } from "@workspace/db";
import type { ApprovedDocument } from "@workspace/api-zod";

export type ApprovedDoc = ApprovedDocument;

/**
 * Registry rows for the approved store — APPEND-ONLY. Re-acceptance writes a
 * new row and stamps the old one's supersededBy; nothing is ever deleted.
 */

export async function listApprovedDocs(applicationId: string): Promise<ApprovedDoc[]> {
  const rows = await db
    .select({ data: approvedDocumentsTable.data, supersededBy: approvedDocumentsTable.supersededBy })
    .from(approvedDocumentsTable)
    .where(eq(approvedDocumentsTable.applicationId, applicationId))
    .orderBy(desc(approvedDocumentsTable.seq));
  return rows.map((r) => ({ ...(r.data as ApprovedDoc), ...(r.supersededBy ? { supersededBy: r.supersededBy } : {}) }));
}

export async function findApprovedDoc(applicationId: string, id: string): Promise<ApprovedDoc | undefined> {
  const rows = await db
    .select({ data: approvedDocumentsTable.data, supersededBy: approvedDocumentsTable.supersededBy })
    .from(approvedDocumentsTable)
    .where(and(eq(approvedDocumentsTable.applicationId, applicationId), eq(approvedDocumentsTable.id, id)));
  const r = rows[0];
  return r ? { ...(r.data as ApprovedDoc), ...(r.supersededBy ? { supersededBy: r.supersededBy } : {}) } : undefined;
}

/** Live (non-superseded) basenames for this application — collision avoidance. */
export async function liveBasenames(applicationId: string): Promise<Set<string>> {
  const rows = await db
    .select({ basename: approvedDocumentsTable.basename })
    .from(approvedDocumentsTable)
    .where(eq(approvedDocumentsTable.applicationId, applicationId));
  return new Set(rows.map((r) => r.basename));
}

/**
 * Insert the new row and supersede prior live rows in one transaction.
 *
 * Default (block accept, single blocks): one live approved document per
 * block(+variant) slot — all live rows for the slot are superseded.
 *
 * Document flow (`matchSpans`): a variant legitimately holds MANY documents
 * (Jan + Feb statements), so only a re-approval of the SAME spans supersedes;
 * sibling documents in the slot stay live.
 */
export async function insertApprovedDoc(
  doc: ApprovedDoc,
  opts?: { matchSpans?: { fileId: string; pages: [number, number] }[] },
): Promise<void> {
  await db.transaction(async (tx) => {
    const conditions = [
      eq(approvedDocumentsTable.applicationId, doc.applicationId),
      eq(approvedDocumentsTable.blockId, doc.blockId),
      isNull(approvedDocumentsTable.supersededBy),
      doc.variantId
        ? eq(approvedDocumentsTable.variantId, doc.variantId)
        : isNull(approvedDocumentsTable.variantId),
    ];
    if (opts?.matchSpans) {
      // spans live inside the jsonb doc — pull the slot's live rows and match in JS
      const live = await tx
        .select({ id: approvedDocumentsTable.id, data: approvedDocumentsTable.data })
        .from(approvedDocumentsTable)
        .where(and(...conditions));
      const key = (spans: { fileId: string; pages: number[] }[]) =>
        spans.map((s) => `${s.fileId}:${s.pages[0]}-${s.pages[1]}`).join("|");
      const wanted = key(opts.matchSpans);
      const ids = live
        .filter((r) => {
          const s = (r.data as ApprovedDoc).spans;
          return Array.isArray(s) && key(s) === wanted;
        })
        .map((r) => r.id);
      for (const rowId of ids) {
        await tx
          .update(approvedDocumentsTable)
          .set({ supersededBy: doc.id })
          .where(and(eq(approvedDocumentsTable.applicationId, doc.applicationId), eq(approvedDocumentsTable.id, rowId)));
      }
    } else {
      await tx
        .update(approvedDocumentsTable)
        .set({ supersededBy: doc.id })
        .where(and(...conditions));
    }
    await tx.insert(approvedDocumentsTable).values({
      id: doc.id,
      applicationId: doc.applicationId,
      blockId: doc.blockId,
      variantId: doc.variantId ?? null,
      basename: doc.basename,
      data: doc,
    });
  });
}
