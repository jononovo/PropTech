import { z } from "zod";
import { asc, eq, sql } from "drizzle-orm";
import { db, applicationsTable } from "@workspace/db";
import type { GetApplicationResponse, ListApplicationsResponseItem } from "@workspace/api-zod";

export type Application = z.infer<typeof GetApplicationResponse>;
export type ApplicationSummary = z.infer<typeof ListApplicationsResponseItem>;

/**
 * Postgres-backed operational store: one jsonb document per application — the
 * OpenAPI contract is the schema, the row exists for atomicity. Templates and
 * saved sections stay file-based (authored artifacts, versioned like code);
 * packet PDFs/thumbnails stay on disk until App Storage arrives with the engine.
 */

export async function readApplication(id: string): Promise<Application | undefined> {
  const rows = await db
    .select({ data: applicationsTable.data })
    .from(applicationsTable)
    .where(eq(applicationsTable.id, id))
    .limit(1);
  return rows[0]?.data as Application | undefined;
}

export async function insertApplication(app: Application): Promise<void> {
  await db.insert(applicationsTable).values({ id: app.id, data: app });
}

/**
 * Atomic read-modify-write: SELECT ... FOR UPDATE serializes concurrent
 * mutations of one application across requests AND server instances — the
 * packet state machine's "the gate physically blocks" rests on this, and it
 * kills the whole-document clobber class for every mutating route.
 *
 * `mutate` may throw (e.g. HttpError) to abort; the transaction rolls back.
 * Returns undefined when the application does not exist.
 */
export async function updateApplication(
  id: string,
  mutate: (app: Application) => Application | Promise<Application>,
): Promise<Application | undefined> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ data: applicationsTable.data })
      .from(applicationsTable)
      .where(eq(applicationsTable.id, id))
      .for("update")
      .limit(1);
    if (!rows[0]) return undefined;
    const next = await mutate(rows[0].data as Application);
    await tx.update(applicationsTable).set({ data: next }).where(eq(applicationsTable.id, id));
    return next;
  });
}

export async function listApplicationsRaw(): Promise<Application[]> {
  const rows = await db
    .select({ data: applicationsTable.data })
    .from(applicationsTable)
    .orderBy(asc(applicationsTable.createdAt));
  return rows.map((r) => r.data as Application);
}

/** inUseBy is always derived by counting applications pinned to a version. */
export async function countApplicationsFor(family: string, version: number): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(applicationsTable)
    .where(
      sql`${applicationsTable.data}->>'family' = ${family} and (${applicationsTable.data}->>'version')::int = ${version}`,
    );
  return rows[0]?.n ?? 0;
}

function countDocBlocks(app: Application): { total: number; filed: number } {
  let total = 0;
  let filed = 0;
  const satisfiedIds = new Set(Object.keys(app.uploads).filter((k) => (app.uploads[k] ?? []).length > 0));
  for (const section of app.template.sections) {
    for (const ss of section.subsections) {
      for (const b of ss.blocks) {
        if (b.kind !== "document") continue;
        total += 1;
        if (satisfiedIds.has(b.id)) filed += 1;
      }
    }
  }
  return { total, filed };
}

export function toSummary(app: Application): ApplicationSummary {
  const { total, filed } = countDocBlocks(app);
  return {
    id: app.id,
    family: app.family,
    version: app.version,
    templateName: app.template.template,
    applicantName: app.applicantName,
    createdAt: app.createdAt,
    docsFiled: filed,
    docsTotal: total,
    ...(app.projectedClosingDate ? { projectedClosingDate: app.projectedClosingDate } : {}),
  };
}
