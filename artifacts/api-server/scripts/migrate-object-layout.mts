/**
 * One-off: move objects from the old prefixes (packets/, uploads/, approved/)
 * into the per-application layout applications/<appId>/{packet,uploads,approved}/.
 * Copies then deletes the old object. Idempotent — skips if target exists.
 */
import { objectStorageClient } from "../src/lib/objectStorage";

const dir = process.env["PRIVATE_OBJECT_DIR"];
if (!dir) throw new Error("PRIVATE_OBJECT_DIR not set");
const clean = dir.replace(/^\/+/, "").replace(/\/+$/, "");
const slash = clean.indexOf("/");
const bucketName = slash < 0 ? clean : clean.slice(0, slash);
const rootPrefix = slash < 0 ? "" : clean.slice(slash + 1) + "/";
const bucket = objectStorageClient.bucket(bucketName);

function remap(key: string): string | null {
  let m = key.match(/^packets\/([^/]+)\/(.+)$/);
  if (m) return `applications/${m[1]}/packet/${m[2]}`;
  m = key.match(/^uploads\/([^/]+)\/(.+)$/);
  if (m) return `applications/${m[1]}/uploads/${m[2]}`;
  m = key.match(/^approved\/([^/]+)\/(.+)$/);
  if (m) return `applications/${m[1]}/approved/${m[2]}`;
  return null;
}

let moved = 0, skipped = 0;
for (const prefix of ["packets/", "uploads/", "approved/"]) {
  const [files] = await bucket.getFiles({ prefix: rootPrefix + prefix });
  for (const f of files) {
    const key = f.name.slice(rootPrefix.length);
    const to = remap(key);
    if (!to) { console.log("SKIP (no remap)", key); skipped++; continue; }
    const dest = bucket.file(rootPrefix + to);
    const [exists] = await dest.exists();
    if (!exists) await f.copy(dest);
    await f.delete();
    console.log("MOVED", key, "->", to);
    moved++;
  }
}
console.log(`done: ${moved} moved, ${skipped} skipped`);
