import path from "node:path";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { UploadDocumentResponse } from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { deleteIntakeUpload, putIntakeUpload } from "../../lib/packetObjectStore";
import { clientIp } from "../../lib/clientIp";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { extensionAllowed, findBlock, isSafeSegment } from "../intake/blocks";

type UploadedFileRecord = { filename: string; size: number; uploadedAt: string; variantId?: string; uploaderIp?: string };

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

type UploadContext = { app: Application; blockId: string };
const contexts = new WeakMap<Request, UploadContext>();

/**
 * Business validation BEFORE multer touches disk:
 * safe path segments, application exists, block exists and is a document block.
 */
async function validateUploadTarget(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = param(req, "applicationId");
  const blockId = param(req, "blockId");
  if (!isSafeSegment(id) || !isSafeSegment(blockId)) {
    res.status(400).json({ error: "Invalid application or block id" });
    return;
  }
  const app = await readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const block = findBlock(app, blockId);
  if (!block || block.kind !== "document") {
    res.status(400).json({ error: "Block is not a document block on this application's template" });
    return;
  }
  contexts.set(req, { app, blockId });
  next();
}

// Bytes buffer in memory (50 MB cap), then land in App Storage — no local disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router: IRouter = Router();

router.post(
  "/applications/:applicationId/uploads/:blockId",
  validateUploadTarget,
  upload.single("file"),
  async (req, res): Promise<void> => {
    const ctx = contexts.get(req);
    if (!ctx) {
      res.status(500).json({ error: "Upload context missing" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file provided (multipart field name must be \"file\")" });
      return;
    }
    // Block lookup against the PINNED template (immutable per application) — the
    // context read is race-free for this check.
    const filename = sanitizeFilename(req.file.originalname);
    const block = findBlock(ctx.app, ctx.blockId);
    if (!block || !extensionAllowed(block, filename)) {
      // Contract: 400 when the format is not accepted by the block. Nothing was stored yet.
      const formats = (block?.formats ?? []).join(", ");
      res.status(400).json({ error: `Format not accepted. Allowed: ${formats || "any"}` });
      return;
    }
    // Set blocks: an upload may be tagged to one of the block's variants.
    // Metadata only — the object-store key is unchanged. Unknown variant = 400,
    // BEFORE bytes land (no silently mis-filed uploads).
    const variantId = typeof req.query.variantId === "string" && req.query.variantId ? req.query.variantId : undefined;
    if (variantId) {
      const variants = (ctx.app.variants?.[ctx.blockId] ?? []) as { id: string }[];
      if (!variants.some((v) => v.id === variantId)) {
        res.status(400).json({ error: "Unknown variant for this block" });
        return;
      }
    }
    // Bytes land in App Storage FIRST, the record second — an orphaned object
    // is harmless, a dangling record is not.
    try {
      await putIntakeUpload(ctx.app.id, ctx.blockId, filename, req.file.buffer, req.file.mimetype || "application/octet-stream");
    } catch (err) {
      res.status(500).json({ error: `Upload storage write failed: ${err instanceof Error ? err.message : String(err)}` });
      return;
    }
    const record: UploadedFileRecord = {
      filename,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      ...(variantId ? { variantId } : {}),
      ...(clientIp(req) ? { uploaderIp: clientIp(req) } : {}),
    };
    // Atomic append — no clobbering of concurrent writes to other parts of the app.
    const app = await updateApplication(ctx.app.id, (app) => {
      const files = ((app.uploads[ctx.blockId] ?? []) as UploadedFileRecord[]).filter(
        (f) => f.filename !== record.filename,
      );
      files.push(record);
      app.uploads[ctx.blockId] = files;
      return app;
    });
    if (!app) {
      // Best-effort undo of the just-stored object; an orphan is harmless anyway.
      await deleteIntakeUpload(ctx.app.id, ctx.blockId, filename).catch(() => undefined);
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.status(201).json(UploadDocumentResponse.parse(record));
  },
);

router.delete(
  "/applications/:applicationId/uploads/:blockId/:filename",
  async (req, res): Promise<void> => {
    const id = param(req, "applicationId");
    const blockId = param(req, "blockId");
    if (!isSafeSegment(id) || !isSafeSegment(blockId)) {
      res.status(400).json({ error: "Invalid application or block id" });
      return;
    }
    const filename = sanitizeFilename(param(req, "filename") ?? "");
    try {
      const app = await updateApplication(id, (app) => {
        const files = (app.uploads[blockId] ?? []) as UploadedFileRecord[];
        if (!files.some((f) => f.filename === filename)) {
          throw new HttpError(404, "File not found");
        }
        app.uploads[blockId] = files.filter((f) => f.filename !== filename);
        return app;
      });
      if (!app) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      // Record removed transactionally first; the stored object goes second (an
      // orphaned object is harmless, a dangling record is not).
      await deleteIntakeUpload(id, blockId, filename);
      res.sendStatus(204);
    } catch (err) {
      if (isHttpError(err)) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }
  },
);

export default router;
