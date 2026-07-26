import path from "node:path";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { nanoid } from "nanoid";
import { updateApplication, type Application } from "../intake/store";
import { readPdfInfo, quickFileFlags } from "../packet/preflight";
import { putSourceFileBytes } from "../../lib/packetObjectStore";
import { HttpError } from "../../lib/httpError";

export type SourceFile = NonNullable<Application["files"]>[number];

export function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

/** Storage extension is derived from the IMMUTABLE original name — renames never move bytes. */
export function storageExt(file: Pick<SourceFile, "filename" | "originalFilename">): string {
  return (path.extname(file.originalFilename ?? file.filename) || ".pdf").toLowerCase();
}

/**
 * THE unified receive seam (file-native intake phase 2): every file that
 * enters the system — unsolicited drop or solicited block/variant upload —
 * becomes an immutable, id-addressed SourceFile here. Whole-drop validation:
 * one bad file throws before ANY bytes or state land.
 *
 * Bytes land first (orphaned object harmless), then the registry rows append
 * to app.files with their ledger events in the same transaction.
 */
export async function receiveSourceFiles(opts: {
  app: Application;
  files: { tempPath: string; originalname: string; sizeBytes: number; mimetype?: string }[];
  origin: "unsolicited" | "solicited";
  blockId?: string;
  variantId?: string;
  receivedBy?: string;
  receivedIp?: string;
  /** unsolicited drops are PDF-only; solicited uploads follow the block's formats (validated by the caller) */
  requirePdf: boolean;
}): Promise<{ files: SourceFile[]; application: Application }> {
  if (opts.files.length === 0) throw new HttpError(400, 'No files provided (multipart field name must be "files")');

  // 1) validate + measure everything before any state lands
  const minted: SourceFile[] = [];
  for (const f of opts.files) {
    const filename = sanitizeFilename(f.originalname);
    const isPdf = filename.toLowerCase().endsWith(".pdf");
    if (opts.requirePdf && !isPdf) {
      throw new HttpError(400, `${filename}: not a PDF — the whole drop was rejected, fix and re-drop`);
    }
    let pages: number | undefined;
    let flags: string[] = [];
    if (isPdf) {
      const info = await readPdfInfo(f.tempPath);
      if ("error" in info) throw new HttpError(400, `${filename}: ${info.error}`);
      if (info.encrypted) throw new HttpError(400, `${filename}: encrypted — remove the password and re-drop`);
      pages = info.pages;
      flags = await quickFileFlags(f.tempPath);
    }
    minted.push({
      id: `sf-${nanoid(8)}`,
      kind: "original",
      origin: opts.origin,
      filename,
      originalFilename: filename,
      ...(opts.blockId ? { blockId: opts.blockId } : {}),
      ...(opts.variantId ? { variantId: opts.variantId } : {}),
      sizeBytes: f.sizeBytes,
      ...(pages !== undefined ? { pages } : {}),
      sha256: createHash("sha256").update(readFileSync(f.tempPath)).digest("hex"),
      flags,
      status: "active",
      receivedAt: new Date().toISOString(),
      ...(opts.receivedBy ? { receivedBy: opts.receivedBy } : {}),
      ...(opts.receivedIp ? { receivedIp: opts.receivedIp } : {}),
    });
  }

  // 2) bytes first — immutable, id-addressed
  for (let i = 0; i < minted.length; i++) {
    const sf = minted[i]!;
    const src = opts.files[i]!;
    await putSourceFileBytes(
      opts.app.id,
      sf.id,
      storageExt(sf),
      readFileSync(src.tempPath),
      src.mimetype || (storageExt(sf) === ".pdf" ? "application/pdf" : "application/octet-stream"),
    );
  }

  // 3) registry rows + ledger events in ONE transaction
  const application = await updateApplication(opts.app.id, (app, emit) => {
    app.files = [...(app.files ?? []), ...minted];
    for (const sf of minted) {
      emit({
        actor: { kind: "user", ...(opts.receivedBy ? { name: opts.receivedBy } : {}), ...(opts.receivedIp ? { ip: opts.receivedIp } : {}) },
        action: "file.received",
        target: { type: "file", id: sf.id, label: sf.filename },
        detail: {
          origin: sf.origin,
          sizeBytes: sf.sizeBytes,
          ...(sf.pages !== undefined ? { pages: sf.pages } : {}),
          ...(sf.blockId ? { blockId: sf.blockId } : {}),
          ...(sf.variantId ? { variantId: sf.variantId } : {}),
          ...((sf.flags ?? []).length > 0 ? { flags: sf.flags } : {}),
        },
      });
    }
    return app;
  });
  if (!application) throw new HttpError(404, "Application not found");
  return { files: minted, application };
}
