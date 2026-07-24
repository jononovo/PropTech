import path from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import type { GetTemplateResponse, ListTemplatesResponseItem } from "@workspace/api-zod";
import { DATA_DIR, fileMtime, listDirs, listFiles, readJson, writeJsonAtomic } from "../../lib/jsonStore";
import { countApplicationsFor } from "../intake/store";

export type Template = z.infer<typeof GetTemplateResponse>;
export type TemplateListing = z.infer<typeof ListTemplatesResponseItem>;

const TEMPLATES_DIR = path.join(DATA_DIR, "templates");

export function templatePath(family: string, version: number): string {
  return path.join(TEMPLATES_DIR, family, `v${version}.json`);
}

export function familyExists(family: string): boolean {
  return existsSync(path.join(TEMPLATES_DIR, family));
}

export function readTemplate(family: string, version: number): Template | undefined {
  return readJson<Template>(templatePath(family, version));
}

export function writeTemplate(family: string, tpl: Template): void {
  writeJsonAtomic(templatePath(family, tpl.version), tpl);
}

export function familyVersions(family: string): number[] {
  return listFiles(path.join(TEMPLATES_DIR, family))
    .map((f) => Number(f.replace(/^v/, "").replace(/\.json$/, "")))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => b - a);
}

function countDocs(tpl: Template): number {
  return tpl.sections.reduce(
    (acc, s) =>
      acc + s.subsections.reduce((a, ss) => a + ss.blocks.filter((b) => b.kind === "document").length, 0),
    0,
  );
}

export async function toListing(family: string, tpl: Template): Promise<TemplateListing> {
  const mtime = fileMtime(templatePath(family, tpl.version));
  return {
    family,
    name: tpl.template,
    program: tpl.program,
    version: tpl.version,
    status: tpl.status,
    sections: tpl.sections.length,
    docs: countDocs(tpl),
    updated: (mtime ?? new Date()).toISOString(),
    inUseBy: await countApplicationsFor(family, tpl.version),
  };
}

/** The library index is always derived by scanning the directory tree. */
export async function listAllListings(): Promise<TemplateListing[]> {
  const out: TemplateListing[] = [];
  for (const family of listDirs(TEMPLATES_DIR)) {
    for (const version of familyVersions(family)) {
      const tpl = readTemplate(family, version);
      if (tpl) out.push(await toListing(family, tpl));
    }
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
