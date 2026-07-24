import { asc, eq } from "drizzle-orm";
import { db, usersTable, type UserRow } from "@workspace/db";

/** What the API exposes: everything except the password and row metadata. */
export type PublicUser = Omit<UserRow, "password" | "createdAt">;

const toPublic = ({ id, username, name, role, org, initials }: UserRow): PublicUser => ({
  id,
  username,
  name,
  role,
  org,
  initials,
});

export async function listUsers(): Promise<PublicUser[]> {
  const rows = await db.select().from(usersTable).orderBy(asc(usersTable.createdAt));
  return rows.map(toPublic);
}

/** Plaintext comparison by design — demo credentials; real auth replaces this. */
export async function verifyLogin(username: string, password: string): Promise<PublicUser | undefined> {
  const rows = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  const row = rows[0];
  return row && row.password === password ? toPublic(row) : undefined;
}
