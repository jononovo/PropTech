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
 * Insert the new row and supersede any live rows for the same block(+variant)
 * in one transaction — one live approved document per requirement slot.
 */
export async function insertApprovedDoc(doc: ApprovedDoc): Promise<void> {
  await db.transaction(async (tx) => {
    const conditions = [
      eq(approvedDocumentsTable.applicationId, doc.applicationId),
      eq(approvedDocumentsTable.blockId, doc.blockId),
      isNull(approvedDocumentsTable.supersededBy),
      doc.variantId
        ? eq(approvedDocumentsTable.variantId, doc.variantId)
        : isNull(approvedDocumentsTable.variantId),
    ];
    await tx
      .update(approvedDocumentsTable)
      .set({ supersededBy: doc.id })
      .where(and(...conditions));
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
