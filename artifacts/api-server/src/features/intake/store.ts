import path from "node:path";
import { z } from "zod";
import type { GetApplicationResponse, ListApplicationsResponseItem } from "@workspace/api-zod";
import { DATA_DIR, listFiles, readJson, writeJsonAtomic } from "../../lib/jsonStore";

export type Application = z.infer<typeof GetApplicationResponse>;
export type ApplicationSummary = z.infer<typeof ListApplicationsResponseItem>;

const APPLICATIONS_DIR = path.join(DATA_DIR, "applications");

export function applicationPath(id: string): string {
  return path.join(APPLICATIONS_DIR, `${id}.json`);
}

export function readApplication(id: string): Application | undefined {
  return readJson<Application>(applicationPath(id));
}

export function writeApplication(app: Application): void {
  writeJsonAtomic(applicationPath(app.id), app);
}

export function listApplicationsRaw(): Application[] {
  return listFiles(APPLICATIONS_DIR)
    .map((f) => readJson<Application>(path.join(APPLICATIONS_DIR, f)))
    .filter((a): a is Application => Boolean(a));
}

/** inUseBy is always derived by counting application files pinned to a version. */
export function countApplicationsFor(family: string, version: number): number {
  return listApplicationsRaw().filter((a) => a.family === family && a.version === version).length;
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
