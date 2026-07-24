import { existsSync } from "node:fs";
import path from "node:path";
import { db, savedSectionsTable, templatesTable } from "@workspace/db";
import { DATA_DIR, listDirs, listFiles, readJson } from "./jsonStore";
import { logger } from "./logger";

/**
 * One-time import of the committed JSON fixtures into Postgres. Runs at boot;
 * a non-empty table is left untouched, so this only fires on a fresh database
 * (first production deploy, wiped dev db). The files under data/templates and
 * data/saved-sections stay in the repo as the seed corpus.
 */
export async function seedStoresFromDisk(): Promise<void> {
  const tplDir = path.join(DATA_DIR, "templates");
  const hasTemplates =
    (await db.select({ family: templatesTable.family }).from(templatesTable).limit(1)).length > 0;
  if (!hasTemplates && existsSync(tplDir)) {
    let n = 0;
    for (const family of listDirs(tplDir)) {
      for (const file of listFiles(path.join(tplDir, family))) {
        const version = Number(file.replace(/^v/, "").replace(/\.json$/, ""));
        if (!Number.isInteger(version) || version <= 0) continue;
        const data = readJson<Record<string, unknown>>(path.join(tplDir, family, file));
        if (!data) continue;
        await db.insert(templatesTable).values({ family, version, data }).onConflictDoNothing();
        n++;
      }
    }
    logger.info({ seeded: n }, "templates table was empty — seeded from disk fixtures");
  }

  const savedDir = path.join(DATA_DIR, "saved-sections");
  const hasSaved =
    (await db.select({ id: savedSectionsTable.id }).from(savedSectionsTable).limit(1)).length > 0;
  if (!hasSaved && existsSync(savedDir)) {
    let n = 0;
    for (const file of listFiles(savedDir)) {
      const data = readJson<{ id?: string }>(path.join(savedDir, file));
      if (!data?.id) continue;
      await db.insert(savedSectionsTable).values({ id: data.id, data }).onConflictDoNothing();
      n++;
    }
    logger.info({ seeded: n }, "saved_sections table was empty — seeded from disk fixtures");
  }
}
