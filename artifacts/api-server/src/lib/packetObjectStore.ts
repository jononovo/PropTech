import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { DATA_DIR } from "./jsonStore";
import { objectStorageClient } from "./objectStorage";

/**
 * Domain layout for document bytes. This is the ONLY module that knows where
 * bytes live:
 *
 *   <root>/applications/<applicationId>/packet/packet.pdf
 *   <root>/applications/<applicationId>/packet/thumbs/page-<n>.png
 *   <root>/applications/<applicationId>/uploads/<blockId>/<filename>
 *   <root>/applications/<applicationId>/approved/<basename>.pdf|.md
 *   <root>/applications/<applicationId>/runs/<runId>/doc-NN_<slug>.md
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

const appRoot = (applicationId: string): string => `applications/${applicationId}`;
const packetPdfKey = (applicationId: string): string => `${appRoot(applicationId)}/packet/packet.pdf`;
const pageThumbnailKey = (applicationId: string, page: number): string =>
  `${appRoot(applicationId)}/packet/thumbs/page-${page}.png`;
const intakeUploadKey = (applicationId: string, blockId: string, filename: string): string =>
  `${appRoot(applicationId)}/uploads/${blockId}/${filename}`;
// Approved registry bytes — flat per application, paired same-basename .pdf/.md
// (set-blocks master plan, storage option B).
const approvedKey = (applicationId: string, basename: string, ext: "pdf" | "md"): string =>
  `${appRoot(applicationId)}/approved/${basename}.${ext}`;
// Per-run analysis projections — one frontmattered .md per analyzer-suggested
// document, written at ingest. Regenerable (DB stays the authority); exists so
// the whole intelligence corpus is greppable/RAG-able markdown in one place.
const runDocKey = (applicationId: string, runId: string, filename: string): string =>
  `${appRoot(applicationId)}/runs/${runId}/${filename}`;

/** Upload the accepted packet PDF from its local staging path. Re-upload overwrites. */
export async function putPacketPdf(applicationId: string, localPdfPath: string): Promise<void> {
  const key = packetPdfKey(applicationId);
  if (USE_DISK) {
    await diskWrite(key, (dest) => copyFile(localPdfPath, dest));
    return;
  }
  const { bucketName, objectName } = locateInPrivateDir(key);
  await objectStorageClient
    .bucket(bucketName)
    .upload(localPdfPath, { destination: objectName, contentType: "application/pdf" });
}

/** Upload one pre-flight page thumbnail from its local staging path. */
export async function putPageThumbnail(applicationId: string, page: number, localPngPath: string): Promise<void> {
  const key = pageThumbnailKey(applicationId, page);
  if (USE_DISK) {
    await diskWrite(key, (dest) => copyFile(localPngPath, dest));
    return;
  }
  const { bucketName, objectName } = locateInPrivateDir(key);
  await objectStorageClient
    .bucket(bucketName)
    .upload(localPngPath, { destination: objectName, contentType: "image/png" });
}

/** Store one intake document upload (buffer from multer memory storage). */
export async function putIntakeUpload(
  applicationId: string,
  blockId: string,
  filename: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const key = intakeUploadKey(applicationId, blockId, filename);
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, {
    contentType,
    resumable: false,
  });
}

/** Remove one intake document upload. A missing object is not an error. */
export async function deleteIntakeUpload(applicationId: string, blockId: string, filename: string): Promise<void> {
  const key = intakeUploadKey(applicationId, blockId, filename);
  if (USE_DISK) {
    await rm(diskPath(key), { force: true });
    return;
  }
  await gcsFile(key).delete({ ignoreNotFound: true });
}

/** Readable stream of the packet PDF, or undefined when no object exists. */
export async function openPacketPdfStream(applicationId: string): Promise<Readable | undefined> {
  return openStream(packetPdfKey(applicationId));
}

/** Readable stream of one page thumbnail, or undefined when no object exists. */
export async function openPageThumbnailStream(applicationId: string, page: number): Promise<Readable | undefined> {
  return openStream(pageThumbnailKey(applicationId, page));
}

/** Readable stream of one intake upload, or undefined when no object exists. */
export async function openIntakeUploadStream(
  applicationId: string,
  blockId: string,
  filename: string,
): Promise<Readable | undefined> {
  return openStream(intakeUploadKey(applicationId, blockId, filename));
}

/** Write one approved-registry object (pdf bytes or md sidecar). Overwrite = retry semantics. */
export async function putApprovedObject(
  applicationId: string,
  basename: string,
  ext: "pdf" | "md",
  bytes: Buffer,
): Promise<void> {
  const key = approvedKey(applicationId, basename, ext);
  const contentType = ext === "pdf" ? "application/pdf" : "text/markdown";
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, { contentType, resumable: false });
}

/** Write one per-run document projection (.md). Overwrite = regenerate semantics. */
export async function putRunDocMarkdown(
  applicationId: string,
  runId: string,
  filename: string,
  bytes: Buffer,
): Promise<void> {
  const key = runDocKey(applicationId, runId, filename);
  if (USE_DISK) {
    await diskWrite(key, (dest) => writeFile(dest, bytes));
    return;
  }
  await gcsFile(key).save(bytes, { contentType: "text/markdown", resumable: false });
}

/** Readable stream of one approved-registry object, or undefined when missing. */
export async function openApprovedObjectStream(
  applicationId: string,
  basename: string,
  ext: "pdf" | "md",
): Promise<Readable | undefined> {
  return openStream(approvedKey(applicationId, basename, ext));
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
