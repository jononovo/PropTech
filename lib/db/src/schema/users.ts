import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Demo users for the test sign-in page. Flat columns — a fixed lookup, not an
 * evolving document, so no jsonb here. Passwords are PLAINTEXT by explicit
 * decision (demo credentials, all "1234"); hashing and real sessions arrive
 * with real authentication later.
 */
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  org: text("org").notNull(),
  initials: text("initials").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof usersTable.$inferSelect;
