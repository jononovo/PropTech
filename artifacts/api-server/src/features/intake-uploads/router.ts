import path from "node:path";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { UploadDocumentResponse } from "@workspace/api-zod";
import { DATA_DIR } from "../../lib/jsonStore";
import { HttpError, isHttpError } from "../../lib/httpError";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { extensionAllowed, findBlock, isSafeSegment } from "../intake/blocks";

const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

type UploadedFileRecord = { filename: string; size: number; uploadedAt: string };

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

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const ctx = contexts.get(req);
    if (!ctx) {
      cb(new Error("Upload context missing"), "");
      return;
    }
    const dir = path.join(UPLOADS_DIR, ctx.app.id, ctx.blockId);
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, sanitizeFilename(file.originalname)),
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

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
    const block = findBlock(ctx.app, ctx.blockId);
    if (!block || !extensionAllowed(block, req.file.filename)) {
      // Contract: 400 when the format is not accepted by the block. Remove the stored file.
      if (existsSync(req.file.path)) unlinkSync(req.file.path);
      const formats = (block?.formats ?? []).join(", ");
      res.status(400).json({ error: `Format not accepted. Allowed: ${formats || "any"}` });
      return;
    }
    const record: UploadedFileRecord = {
      filename: req.file.filename,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
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
      if (existsSync(req.file.path)) unlinkSync(req.file.path);
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
      // Record removed transactionally first; the disk file goes second (an
      // orphaned file is harmless, a dangling record is not).
      const filePath = path.join(UPLOADS_DIR, id, blockId, filename);
      if (existsSync(filePath)) unlinkSync(filePath);
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
