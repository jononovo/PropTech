import { pgTable, text, jsonb, timestamp, bigserial, index } from "drizzle-orm/pg-core";

/**
 * Append-only per-application event ledger (file-native intake spec §ledger).
 * One row per state change: uploads, renames, approvals, run ingests, gate
 * decisions, template changes… Written in the SAME transaction as the state
 * change it records (see intake/store.ts updateApplication's emit hook), so a
 * rollback never leaves a phantom event and a change never lacks one.
 *
 * Never updated, never deleted. `actor` is jsonb {name?, ip?, kind: "user"|"system"}.
 * `target` identifies what was touched ({type, id, label?}); `detail` is small
 * action-specific context. Ordering = seq (per-app filter preserves order).
 */
export const applicationEventsTable = pgTable(
  "application_events",
  {
    seq: bigserial("seq", { mode: "number" }).primaryKey(),
    applicationId: text("application_id").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actor: jsonb("actor").notNull(),
    action: text("action").notNull(),
    target: jsonb("target"),
    detail: jsonb("detail"),
  },
  (t) => [index("application_events_app_idx").on(t.applicationId)],
);

export type ApplicationEventRow = typeof applicationEventsTable.$inferSelect;
