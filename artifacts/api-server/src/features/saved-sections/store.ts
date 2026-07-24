import { z } from "zod";
import type { ListSavedSectionsResponseItem } from "@workspace/api-zod";
import { db, savedSectionsTable } from "@workspace/db";

export type SavedSection = z.infer<typeof ListSavedSectionsResponseItem>;

/** Postgres-backed, one jsonb row per saved section (see templates store). */

export async function listSavedSections(): Promise<SavedSection[]> {
  const rows = await db.select({ data: savedSectionsTable.data }).from(savedSectionsTable);
  return rows.map((r) => r.data as SavedSection).sort((a, b) => a.name.localeCompare(b.name));
}

export async function writeSavedSection(section: SavedSection): Promise<void> {
  await db
    .insert(savedSectionsTable)
    .values({ id: section.id, data: section })
    .onConflictDoUpdate({ target: savedSectionsTable.id, set: { data: section, updatedAt: new Date() } });
}
