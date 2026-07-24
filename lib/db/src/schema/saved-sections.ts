import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Saved template sections (reusable building blocks in the template editor).
 * One jsonb document per row (contract shape: ListSavedSectionsResponseItem),
 * DB-backed for the same reason as templates: prod disk is ephemeral.
 */
export const savedSectionsTable = pgTable("saved_sections", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SavedSectionRow = typeof savedSectionsTable.$inferSelect;
