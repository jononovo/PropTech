import { pgTable, text, integer, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";

/**
 * Template library. Each row is ONE template version; the full authored
 * document (contract shape: GetTemplateResponse in @workspace/api-zod) lives
 * whole in `data`, same single-jsonb pattern as applications. Rows exist so
 * templates survive production redeploys and are shared across instances —
 * the previous file-backed store lived on ephemeral prod disk.
 *
 * Seeding: on boot with an empty table, the API imports the committed JSON
 * files under artifacts/api-server/data/templates (see lib/seedStores.ts).
 */
export const templatesTable = pgTable(
  "templates",
  {
    family: text("family").notNull(),
    version: integer("version").notNull(),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.family, t.version] })],
);

export type TemplateRow = typeof templatesTable.$inferSelect;
