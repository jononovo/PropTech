import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

/**
 * Operational store for loan applications. The full application document
 * (contract shape: GetApplicationResponse in @workspace/api-zod) lives in
 * `data` as ONE jsonb document — the OpenAPI contract is the schema; rows
 * exist for atomicity (SELECT ... FOR UPDATE) and multi-instance safety,
 * not for relational decomposition while the product shape is still moving.
 * Templates and saved sections follow the same pattern in their own tables.
 */
export const applicationsTable = pgTable("applications", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertApplicationRowSchema = createInsertSchema(applicationsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type ApplicationRow = typeof applicationsTable.$inferSelect;
