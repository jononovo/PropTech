import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { DATA_DIR } from "./jsonStore";
import { objectStorageClient } from "./objectStorage";

/**
 * Domain layout for document bytes. This is the ONLY module that knows where
 * bytes live:
 *
 *   <root>/applications/<storageFolder>/files/<fileId><ext>
 *   <root>/applications/<storageFolder>/approved/<basename>.pdf|.md
 *   <root>/applications/<storageFolder>/runs/<runId>/doc-NN_<slug>.md
 *
 * <storageFolder> is the application's human-legible folder name
 * (yyyymm_surname_initials_<id>), frozen at creation on the application
 * record — see features/intake/storageFolder.ts. Callers pass
 * app.storageFolder, never app.id.
 *
 * One self-contained folder per application (ruled Jul 25 2026) so a whole
 * case can be downloaded in one click. Uploads are the immutable originals;
 * approved/ holds materialized copies that point back to their sources.
 *
 * Two roots, resolved once at boot:
 *   - App Storage (GCS) when PRIVATE_OBJECT_DIR is set — the Replit path,
 *     unchanged. That env var only exists where App Storage is provisioned.
 *   - Local disk under DATA_DIR/object-store ONLY off-Replit (no REPL_ID),
 *     where the GCS credential sidecar (127.0.0.1:1106) cannot exist. Same
 *     key layout, so nothing above this module can tell the difference.
 *   - On Replit WITHOUT PRIVATE_OBJECT_DIR (misconfiguration): no fallback —
 *     every call fails loudly, exactly as before this module had a disk mode.
 *     Prod must never silently write document bytes to an ephemeral disk.
 *
 * Callers hand in ids/filenames and get streams back — no GCS types leak out
 * of this module except Readable.
 */

const DISK_ROOT = path.join(DATA_DIR, "object-store");
const ON_REPLIT = Boolean(process.env["REPL_ID"]);
const USE_DISK = !process.env["PRIVATE_OBJECT_DIR"] && !ON_REPLIT;
console.log(
  USE_DISK
    ? `[packetObjectStore] off-Replit, PRIVATE_OBJECT_DIR not set — document bytes on local disk at ${DISK_ROOT}`
    : process.env["PRIVATE_OBJECT_DIR"]
      ? "[packetObjectStore] document bytes in App Storage (GCS)"
      : "[packetObjectStore] MISCONFIGURED: on Replit without PRIVATE_OBJECT_DIR — storage calls will fail loudly",
);

const diskPath = (key: string): string => path.join(DISK_ROOT, key);

async function diskWrite(key: string, write: (dest: string) => Promise<void>): Promise<void> {
  const dest = diskPath(key);
  await mkdir(path.dirname(dest), { recursive: true });
  await write(dest);
}

type ObjectLocation = { bucketName: string; objectName: string };

function locateInPrivateDir(key: string): ObjectLocation {
  const dir = process.env["PRIVATE_OBJECT_DIR"];
  if (!dir) {
    throw new Error("PRIVATE_OBJECT_DIR is not set — App Storage is not provisioned");
  }
  const clean = dir.replace(/^\/+/, "").replace(/\/+$/, "");
  const slash = clean.indexOf("/");
  const bucketName = slash < 0 ? clean : clean.slice(0, slash);
  const prefix = slash < 0 ? "" : clean.slice(slash + 1);
  return { bucketName, objectName: prefix ? `${prefix}/${key}` : key };
}

function gcsFile(key: string) {
  const { bucketName, objectName } = locateInPrivateDir(key);
  return objectStorageClient.bucket(bucketName).file(objectName);
}

const appRoot = (storageFolder: string): string => `applications/${storageFolder}`;
// Approved registry bytes — flat per application, paired same-basename .pdf/.md
// (set-blocks master plan, storage option B).
const approvedKey = (storageFolder: string, basename: string, ext: "pdf" | "md"): string =>
  `${appRoot(storageFolder)}/approved/${basename}.${ext}`;
// Per-run analysis projections — one frontmattered .md per analyzer-suggested
// document, written at ingest. Regenerable (DB stays the authority); exists so
// the whole intelligence corpus is greppable/RAG-able markdown in one place.
const runDocKey = (storageFolder: string, runId: string, filename: string): string =>
  `${appRoot(storageFolder)}/runs/${runId}/${filename}`;
// SourceFile registry bytes (file-native intake phase 2) — immutable,
// id-addressed. ext comes from the immutable ORIGINAL filename, so renames
// never touch storage.
// Per-run citation geometry — one elements JSON (typed blocks + bboxes) per
// (file, page), projected at ingest. Never grepped by the Q&A agent; consulted
// only to resolve a made citation's quote to an on-page bbox.
const runElementsKey = (storageFolder: string, runId: string, fileId: string, page: number): string =>
  `${appRoot(storageFolder)}/runs/${runId}/elements/${fileId}/p${page}.json`;
const sourceFileKey = (storageFolder: string, fileId: string, ext: string): string =>
  `${appRoot(storageFolder)}/files/${fileId}${ext}`;
// Page renders live NEXT TO their file's bytes — everything about a file sits
// under its fileId (ruled Jul 26 2026: one storage flow, object storage only;
// the analyzer's disk is scratch). Files are immutable, so renders never
// change: write-once, cache forever.
//   files/<fileId>/pages/p-<page>.png       full render at analyzer DPI
//   files/<fileId>/thumbnails/p-<page>.png  320px-wide filmstrip thumbnail
export type RenderKind = "pages" | "thumbnails";
const fileRenderKey = (storageFolder: string, fileId: string, kind: RenderKind, page: number): string =>
  `${appRoot(storageFolder)}/files/${fileId}/${kind}/p-${page}.png`;
// Approved docs are the record of truth and must be self-contained: their
// thumbnails are COPIES (renumbered 1..N in document page order), never links
// back to files/ — originals are audit-only and may be swept independently.
const approvedThumbnailKey = (storageFolder: string, basename: string, page: number): string =>
  `${appRoot(storageFolder)}/approved/${basename}/thumbnails/p-${page}.png`;

/** Write one approved-registry object (pdf bytes or md sidecar). Overwrite = retry semantics. */
export async function putApprovedObject(
  storageFolder: string,
  basename: string,
  ext: "pdf" | "md",
  bytes: Buffer,
): Promise<void> {
  const key = approvedKey(storageFolder, basename, ext);
  const contentType = ext === "pdf" ? "application/pdf" : "text/markdown";
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, { contentType, resumable: false });
}

/**
 * Delete EVERYTHING under one application's folder — files/, approved/,
 * runs/. Retention-sweep only (internal_docs/retention.md); nothing else may
 * delete document bytes. Returns the number of objects removed.
 */
export async function deleteApplicationObjects(storageFolder: string): Promise<number> {
  const root = `${appRoot(storageFolder)}/`;
  if (USE_DISK) {
    const dir = diskPath(root);
    let count = 0;
    try {
      const entries = await readdir(dir, { recursive: true, withFileTypes: true });
      count = entries.filter((e) => e.isFile()).length;
    } catch {
      return 0;
    }
    await rm(dir, { recursive: true, force: true });
    return count;
  }
  const { bucketName, objectName } = locateInPrivateDir(root);
  const bucket = objectStorageClient.bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix: objectName });
  for (const f of files) {
    await f.delete();
  }
  return files.length;
}

/** Store one SourceFile's immutable bytes. Write-once by convention (ids are never reused). */
export async function putSourceFileBytes(
  storageFolder: string,
  fileId: string,
  ext: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const key = sourceFileKey(storageFolder, fileId, ext);
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, { contentType, resumable: false });
}

/** Store one page render (full or thumbnail). Write-once by convention — files are immutable. */
export async function putFileRender(
  storageFolder: string,
  fileId: string,
  kind: RenderKind,
  page: number,
  bytes: Buffer,
): Promise<void> {
  const key = fileRenderKey(storageFolder, fileId, kind, page);
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, { contentType: "image/png", resumable: false });
}

/** Readable stream of one page render, or undefined when missing. */
export async function openFileRenderStream(
  storageFolder: string,
  fileId: string,
  kind: RenderKind,
  page: number,
): Promise<Readable | undefined> {
  return openStream(fileRenderKey(storageFolder, fileId, kind, page));
}

/**
 * Copy one source-page thumbnail into an approved document's own folder,
 * renumbered to the document's page order. Returns false when the source
 * thumbnail is missing (caller decides how loud to be).
 */
export async function copyThumbnailToApproved(
  storageFolder: string,
  fileId: string,
  sourcePage: number,
  basename: string,
  docPage: number,
): Promise<boolean> {
  const bytes = await readBytes(fileRenderKey(storageFolder, fileId, "thumbnails", sourcePage));
  if (!bytes) return false;
  const key = approvedThumbnailKey(storageFolder, basename, docPage);
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return true;
  }
  await gcsFile(key).save(bytes, { contentType: "image/png", resumable: false });
  return true;
}

/** Readable stream of one approved document's thumbnail, or undefined when missing. */
export async function openApprovedThumbnailStream(
  storageFolder: string,
  basename: string,
  page: number,
): Promise<Readable | undefined> {
  return openStream(approvedThumbnailKey(storageFolder, basename, page));
}

async function readBytes(key: string): Promise<Buffer | undefined> {
  if (USE_DISK) {
    try {
      return await readFile(diskPath(key));
    } catch {
      return undefined;
    }
  }
  const file = gcsFile(key);
  const [exists] = await file.exists();
  if (!exists) return undefined;
  const [bytes] = await file.download();
  return bytes;
}

/** Readable stream of one SourceFile's bytes, or undefined when missing. */
export async function openSourceFileStream(
  storageFolder: string,
  fileId: string,
  ext: string,
): Promise<Readable | undefined> {
  return openStream(sourceFileKey(storageFolder, fileId, ext));
}

/** Write one per-run document projection (.md). Overwrite = regenerate semantics. */
export async function putRunDocMarkdown(
  storageFolder: string,
  runId: string,
  filename: string,
  bytes: Buffer,
): Promise<void> {
  const key = runDocKey(storageFolder, runId, filename);
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, { contentType: "text/markdown", resumable: false });
}

/** Write one per-run page-elements projection (.json). Overwrite = regenerate semantics. */
export async function putRunElementsJson(
  storageFolder: string,
  runId: string,
  fileId: string,
  page: number,
  bytes: Buffer,
): Promise<void> {
  const key = runElementsKey(storageFolder, runId, fileId, page);
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, { contentType: "application/json", resumable: false });
}

/**
 * Q&A agent corpus access — the agent's list/grep/read tools go through these
 * two functions ONLY. Keys returned/accepted are RELATIVE to the application
 * root (e.g. "runs/<runId>/doc-01_urla.md", "approved/<basename>.md") so the
 * model never sees or fabricates cross-application paths.
 */
const CORPUS_TEXT_RE = /\.(md|json)$/;

export async function listCorpusKeys(storageFolder: string): Promise<string[]> {
  const root = `${appRoot(storageFolder)}/`;
  if (USE_DISK) {
    const dir = diskPath(root);
    try {
      const entries = await readdir(dir, { recursive: true, withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && CORPUS_TEXT_RE.test(e.name))
        .map((e) => path.relative(dir, path.join(e.parentPath, e.name)).split(path.sep).join("/"))
        .sort();
    } catch {
      return [];
    }
  }
  const { bucketName, objectName } = locateInPrivateDir(root);
  const [files] = await objectStorageClient.bucket(bucketName).getFiles({ prefix: objectName });
  return files
    .map((f) => f.name.slice(objectName.length))
    .filter((k) => CORPUS_TEXT_RE.test(k))
    .sort();
}

/** Read one corpus text object by app-relative key. Undefined when missing. Throws on escape attempts. */
export async function readCorpusText(storageFolder: string, relKey: string): Promise<string | undefined> {
  if (relKey.includes("..") || relKey.startsWith("/") || !CORPUS_TEXT_RE.test(relKey)) {
    throw new Error(`Invalid corpus key: ${relKey}`);
  }
  const key = `${appRoot(storageFolder)}/${relKey}`;
  if (USE_DISK) {
    try {
      return await readFile(diskPath(key), "utf8");
    } catch {
      return undefined;
    }
  }
  const file = gcsFile(key);
  const [exists] = await file.exists();
  if (!exists) return undefined;
  const [bytes] = await file.download();
  return bytes.toString("utf8");
}

/** Readable stream of one approved-registry object, or undefined when missing. */
export async function openApprovedObjectStream(
  storageFolder: string,
  basename: string,
  ext: "pdf" | "md",
): Promise<Readable | undefined> {
  return openStream(approvedKey(storageFolder, basename, ext));
}

async function openStream(key: string): Promise<Readable | undefined> {
  if (USE_DISK) {
    const src = diskPath(key);
    return existsSync(src) ? createReadStream(src) : undefined;
  }
  const file = gcsFile(key);
  const [exists] = await file.exists();
  if (!exists) return undefined;
  return file.createReadStream();
}
