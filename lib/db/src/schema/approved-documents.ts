import { pgTable, text, jsonb, timestamp, serial } from "drizzle-orm/pg-core";

/**
 * Approved-document registry — APPEND-ONLY. A row exists only after a human
 * accepted a document and its bytes were materialized into the approved store
 * (flat `approved/<applicationId>/<basename>.pdf` + `.md`). Pre-approval
 * splits/assignments live in run data + intake flow and are NEVER in here.
 *
 * Supersession instead of deletion: re-acceptance writes a new row and stamps
 * the old one's supersededBy — full history, no destructive writes.
 *
 * `data` carries the contract shape (ApprovedDocument in @workspace/api-zod);
 * the columns outside `data` exist for indexed lookup only — same jsonb-first
 * pattern as the applications table.
 */
export const approvedDocumentsTable = pgTable("approved_documents", {
  seq: serial("seq").primaryKey(),
  id: text("id").notNull().unique(),
  applicationId: text("application_id").notNull(),
  blockId: text("block_id").notNull(),
  variantId: text("variant_id"),
  basename: text("basename").notNull(),
  data: jsonb("data").notNull(),
  supersededBy: text("superseded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ApprovedDocumentRow = typeof approvedDocumentsTable.$inferSelect;
