import os from "node:os";
import { unlinkSync } from "node:fs";
import { Readable } from "node:stream";
import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { ReceiveFilesResponse, UpdateSourceFileBody, GetApplicationResponse } from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { clientIp } from "../../lib/clientIp";
import { readApplication, updateApplication } from "../intake/store";
import { extensionAllowed, findBlock, isSafeSegment } from "../intake/blocks";
import { openSourceFileStream } from "../../lib/packetObjectStore";
import { receiveSourceFiles, sanitizeFilename, storageExt } from "./receive";

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, _file, cb) =>
    cb(null, `sf-receive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024, files: 25 } });

const router: IRouter = Router();

/**
 * Unified receive (file-native intake phase 2): drop N files → each lands as
 * an immutable SourceFile. Optional blockId/variantId query params declare
 * solicited intent. Whole-drop validation — one bad file rejects the drop.
 */
router.post("/applications/:applicationId/files", upload.array("files", 25), async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const files = (req.files ?? []) as Express.Multer.File[];
  const cleanup = () => files.forEach((f) => { try { unlinkSync(f.path); } catch { /* gone */ } });
  try {
    if (!isSafeSegment(id)) throw new HttpError(400, "Invalid application id");
    const app = await readApplication(id);
    if (!app) throw new HttpError(404, "Application not found");

    const blockId = typeof req.query["blockId"] === "string" && req.query["blockId"] ? req.query["blockId"] : undefined;
    const variantId = typeof req.query["variantId"] === "string" && req.query["variantId"] ? req.query["variantId"] : undefined;
    if (variantId && !blockId) throw new HttpError(400, "variantId requires blockId");
    if (blockId) {
      const block = findBlock(app, blockId);
      if (!block || block.kind !== "document") {
        throw new HttpError(400, "blockId is not a document block on this application's pinned template");
      }
      for (const f of files) {
        const filename = sanitizeFilename(f.originalname);
        if (!extensionAllowed(block, filename)) {
          throw new HttpError(400, `${filename}: format not accepted. Allowed: ${(block.formats ?? []).join(", ") || "any"}`);
        }
      }
      if (variantId && !(app.variants?.[blockId] ?? []).some((v) => v.id === variantId)) {
        throw new HttpError(400, "Unknown variant for this block");
      }
    }

    const result = await receiveSourceFiles({
      app,
      files: files.map((f) => ({
        tempPath: f.path,
        originalname: f.originalname,
        sizeBytes: f.size,
        ...(f.mimetype ? { mimetype: f.mimetype } : {}),
      })),
      origin: blockId ? "solicited" : "unsolicited",
      ...(blockId ? { blockId } : {}),
      ...(variantId ? { variantId } : {}),
      ...(clientIp(req) ? { receivedIp: clientIp(req) } : {}),
      requirePdf: !blockId, // unsolicited drops are PDF-only; solicited follow block formats
    });
    res.status(201).json(ReceiveFilesResponse.parse(result));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  } finally {
    cleanup();
  }
});

/** Immutable bytes, straight from storage. */
router.get("/applications/:applicationId/files/:fileId", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const fileId = param(req, "fileId");
  if (!isSafeSegment(id) || !isSafeSegment(fileId)) {
    res.status(400).json({ error: "Invalid application or file id" });
    return;
  }
  const app = await readApplication(id);
  const sf = app?.files?.find((f) => f.id === fileId);
  if (!app || !sf) {
    res.status(404).json({ error: "No such file" });
    return;
  }
  const stream = await openSourceFileStream(app.storageFolder, sf.id, storageExt(sf));
  if (!stream) {
    res.status(404).json({ error: "File bytes missing from storage" });
    return;
  }
  const ext = storageExt(sf);
  res.type(ext === ".pdf" ? "application/pdf" : "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${sf.filename.replace(/"/g, "")}"`);
  res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
  (stream as Readable).pipe(res);
});

/** Rename = metadata only. Bytes and id untouched; from→to recorded in the ledger. */
router.patch("/applications/:applicationId/files/:fileId", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const fileId = param(req, "fileId");
  const parsed = UpdateSourceFileBody.safeParse(req.body);
  try {
    if (!isSafeSegment(id) || !isSafeSegment(fileId)) throw new HttpError(400, "Invalid application or file id");
    if (!parsed.success) throw new HttpError(400, parsed.error.message);
    const nextName = parsed.data.filename ? sanitizeFilename(parsed.data.filename) : undefined;
    if (!nextName) throw new HttpError(400, "Nothing to update — provide filename");
    const app = await updateApplication(id!, (app, emit) => {
      const sf = (app.files ?? []).find((f) => f.id === fileId);
      if (!sf) throw new HttpError(404, "No such file");
      if (sf.filename !== nextName) {
        emit({
          actor: { kind: "user", ip: clientIp(req) },
          action: "file.renamed",
          target: { type: "file", id: sf.id, label: nextName },
          detail: { from: sf.filename, to: nextName },
        });
        sf.filename = nextName;
      }
      return app;
    });
    if (!app) throw new HttpError(404, "Application not found");
    res.json(GetApplicationResponse.parse(app));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
