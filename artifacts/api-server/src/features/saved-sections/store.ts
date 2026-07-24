import path from "node:path";
import { z } from "zod";
import type { ListSavedSectionsResponseItem } from "@workspace/api-zod";
import { DATA_DIR, listFiles, readJson, writeJsonAtomic } from "../../lib/jsonStore";

export type SavedSection = z.infer<typeof ListSavedSectionsResponseItem>;

const SAVED_DIR = path.join(DATA_DIR, "saved-sections");

export function listSavedSections(): SavedSection[] {
  return listFiles(SAVED_DIR)
    .map((f) => readJson<SavedSection>(path.join(SAVED_DIR, f)))
    .filter((s): s is SavedSection => Boolean(s))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function writeSavedSection(section: SavedSection): void {
  writeJsonAtomic(path.join(SAVED_DIR, `${section.id}.json`), section);
}
