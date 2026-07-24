import { Readable } from "node:stream";
import { objectStorageClient } from "./objectStorage";

/**
 * Domain layout for document bytes in App Storage (GCS). This is the ONLY
 * module that knows where bytes live:
 *
 *   <PRIVATE_OBJECT_DIR>/packets/<applicationId>/packet.pdf
 *   <PRIVATE_OBJECT_DIR>/packets/<applicationId>/thumbs/page-<n>.png
 *   <PRIVATE_OBJECT_DIR>/uploads/<applicationId>/<blockId>/<filename>
 *
 * Callers hand in ids/filenames and get streams back — no GCS types leak out
 * of this module except Readable.
 */

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

const packetPdfKey = (applicationId: string): string => `packets/${applicationId}/packet.pdf`;
const pageThumbnailKey = (applicationId: string, page: number): string =>
  `packets/${applicationId}/thumbs/page-${page}.png`;
const intakeUploadKey = (applicationId: string, blockId: string, filename: string): string =>
  `uploads/${applicationId}/${blockId}/${filename}`;

/** Upload the accepted packet PDF from its local staging path. Re-upload overwrites. */
export async function putPacketPdf(applicationId: string, localPdfPath: string): Promise<void> {
  const { bucketName, objectName } = locateInPrivateDir(packetPdfKey(applicationId));
  await objectStorageClient
    .bucket(bucketName)
    .upload(localPdfPath, { destination: objectName, contentType: "application/pdf" });
}

/** Upload one pre-flight page thumbnail from its local staging path. */
export async function putPageThumbnail(applicationId: string, page: number, localPngPath: string): Promise<void> {
  const { bucketName, objectName } = locateInPrivateDir(pageThumbnailKey(applicationId, page));
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
  await gcsFile(intakeUploadKey(applicationId, blockId, filename)).save(bytes, {
    contentType,
    resumable: false,
  });
}

/** Remove one intake document upload. A missing object is not an error. */
export async function deleteIntakeUpload(applicationId: string, blockId: string, filename: string): Promise<void> {
  await gcsFile(intakeUploadKey(applicationId, blockId, filename)).delete({ ignoreNotFound: true });
}

/** Readable stream of the packet PDF, or undefined when no object exists. */
export async function openPacketPdfStream(applicationId: string): Promise<Readable | undefined> {
  return openStream(packetPdfKey(applicationId));
}

/** Readable stream of one page thumbnail, or undefined when no object exists. */
export async function openPageThumbnailStream(applicationId: string, page: number): Promise<Readable | undefined> {
  return openStream(pageThumbnailKey(applicationId, page));
}

async function openStream(key: string): Promise<Readable | undefined> {
  const file = gcsFile(key);
  const [exists] = await file.exists();
  if (!exists) return undefined;
  return file.createReadStream();
}
