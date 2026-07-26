/**
 * One-off/maintenance: delete App Storage folders under applications/ that no
 * longer correspond to an application row (by storageFolder). Zero-back-compat
 * cleanup driver: `pnpm --filter @workspace/api-server exec tsx scripts/purge-storage-folders.ts`
 */
import { objectStorageClient } from "../src/lib/objectStorage";
import { listApplicationsRaw } from "../src/features/intake/store";

const dir = process.env["PRIVATE_OBJECT_DIR"];
if (!dir) throw new Error("PRIVATE_OBJECT_DIR not set");
const clean = dir.replace(/^\/+/, "").replace(/\/+$/, "");
const slash = clean.indexOf("/");
const bucketName = slash < 0 ? clean : clean.slice(0, slash);
const rootPrefix = slash < 0 ? "" : clean.slice(slash + 1);
const appsPrefix = `${rootPrefix ? rootPrefix + "/" : ""}applications/`;

const live = new Set((await listApplicationsRaw()).map((a) => a.storageFolder ?? a.id));
const bucket = objectStorageClient.bucket(bucketName);
const [files] = await bucket.getFiles({ prefix: appsPrefix });
const dead = files.filter((f) => {
  const folder = f.name.slice(appsPrefix.length).split("/")[0];
  return folder && !live.has(folder);
});
console.log(`live folders: ${[...live].join(", ") || "(none)"}`);
console.log(`objects under applications/: ${files.length}; deleting ${dead.length} orphaned`);
for (const f of dead) await f.delete();
console.log("done");
process.exit(0);
