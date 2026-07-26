import path from "node:path";
import { mkdirSync, rmSync } from "node:fs";

/**
 * Local staging for multi-file intake bytes between drop and assemble.
 * Deliberately NOT App Storage: the manifest is short-lived working state
 * (minutes, one sitting) — only the ASSEMBLED packet is the durable,
 * integrity-bearing object. A lost staging dir (restart on ephemeral disk)
 * fails assemble loudly with "staged bytes missing — re-drop the files";
 * nothing downstream can reference a manifest file.
 */
const STAGING_ROOT = path.join(
  process.env["DATA_DIR"] ?? path.join(process.cwd(), "data"),
  "packet-staging",
);

export function stagingDir(appId: string): string {
  return path.join(STAGING_ROOT, appId);
}

export function stagedFilePath(appId: string, fileId: string): string {
  return path.join(stagingDir(appId), `${fileId}.pdf`);
}

export function ensureStagingDir(appId: string): string {
  const dir = stagingDir(appId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function clearStaging(appId: string): void {
  rmSync(stagingDir(appId), { recursive: true, force: true });
}
