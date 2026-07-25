import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Variant shape library — saved descriptor conventions for set blocks
 * (VariantShape in @workspace/api-zod lives in `data`). Same jsonb-row
 * pattern as saved_sections. Presets are seeded rows with deterministic ids
 * (vs-preset-<slug>) so re-seeding is an idempotent upsert.
 */
export const variantShapesTable = pgTable("variant_shapes", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type VariantShapeRow = typeof variantShapesTable.$inferSelect;
