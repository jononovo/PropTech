import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

/** Root data directory: artifacts/api-server/data */
export const DATA_DIR = path.resolve(process.cwd(), "data");

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

export function readJson<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined;
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

/** Atomic write: write to a temp file in the same dir, then rename. */
export function writeJsonAtomic(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  renameSync(tmp, filePath);
}

export function listFiles(dir: string, ext = ".json"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext));
}

export function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function fileMtime(filePath: string): Date | undefined {
  if (!existsSync(filePath)) return undefined;
  return statSync(filePath).mtime;
}
