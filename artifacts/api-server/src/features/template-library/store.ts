import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { GetTemplateResponse, ListTemplatesResponseItem } from "@workspace/api-zod";
import { db, templatesTable } from "@workspace/db";
import { countApplicationsFor } from "../intake/store";

export type Template = z.infer<typeof GetTemplateResponse>;
export type TemplateListing = z.infer<typeof ListTemplatesResponseItem>;

/**
 * Postgres-backed template store. One row per version, the whole authored
 * document in `data` (same jsonb pattern as applications). Replaced the
 * file-backed store: prod disk is ephemeral, so file writes evaporated on
 * redeploys. The JSON files under data/templates remain as the seed corpus
 * imported on first boot (see ../../lib/seedStores).
 */

export async function familyExists(family: string): Promise<boolean> {
  const rows = await db
    .select({ family: templatesTable.family })
    .from(templatesTable)
    .where(eq(templatesTable.family, family))
    .limit(1);
  return rows.length > 0;
}

export async function readTemplate(family: string, version: number): Promise<Template | undefined> {
  const rows = await db
    .select({ data: templatesTable.data })
    .from(templatesTable)
    .where(and(eq(templatesTable.family, family), eq(templatesTable.version, version)))
    .limit(1);
  return rows[0]?.data as Template | undefined;
}

export async function writeTemplate(family: string, tpl: Template): Promise<void> {
  await db
    .insert(templatesTable)
    .values({ family, version: tpl.version, data: tpl })
    .onConflictDoUpdate({
      target: [templatesTable.family, templatesTable.version],
      set: { data: tpl, updatedAt: new Date() },
    });
}

export async function familyVersions(family: string): Promise<number[]> {
  const rows = await db
    .select({ version: templatesTable.version })
    .from(templatesTable)
    .where(eq(templatesTable.family, family))
    .orderBy(desc(templatesTable.version));
  return rows.map((r) => r.version);
}

function countDocs(tpl: Template): number {
  return tpl.sections.reduce(
    (acc, s) =>
      acc + s.subsections.reduce((a, ss) => a + ss.blocks.filter((b) => b.kind === "document").length, 0),
    0,
  );
}

export async function toListing(family: string, tpl: Template, updated?: Date): Promise<TemplateListing> {
  let ts = updated;
  if (!ts) {
    const rows = await db
      .select({ updatedAt: templatesTable.updatedAt })
      .from(templatesTable)
      .where(and(eq(templatesTable.family, family), eq(templatesTable.version, tpl.version)))
      .limit(1);
    ts = rows[0]?.updatedAt;
  }
  return {
    family,
    name: tpl.template,
    program: tpl.program,
    version: tpl.version,
    status: tpl.status,
    sections: tpl.sections.length,
    docs: countDocs(tpl),
    updated: (ts ?? new Date()).toISOString(),
    inUseBy: await countApplicationsFor(family, tpl.version),
  };
}

/** The library index is always derived from the table in one scan. */
export async function listAllListings(): Promise<TemplateListing[]> {
  const rows = await db.select().from(templatesTable);
  const out: TemplateListing[] = [];
  for (const row of rows) {
    out.push(await toListing(row.family, row.data as Template, row.updatedAt));
  }
  out.sort((a, b) => (a.family === b.family ? b.version - a.version : a.family.localeCompare(b.family)));
  return out;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "template";
}
