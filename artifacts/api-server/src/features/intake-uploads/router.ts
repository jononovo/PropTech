import path from "node:path";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { UploadDocumentResponse } from "@workspace/api-zod";
import { DATA_DIR } from "../../lib/jsonStore";
import { readApplication, writeApplication, type Application } from "../intake/store";
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
function validateUploadTarget(req: Request, res: Response, next: NextFunction): void {
  const id = param(req, "applicationId");
  const blockId = param(req, "blockId");
  if (!isSafeSegment(id) || !isSafeSegment(blockId)) {
    res.status(400).json({ error: "Invalid application or block id" });
    return;
  }
  const app = readApplication(id);
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
    // Re-read to avoid clobbering concurrent writes since validation.
    const app = readApplication(ctx.app.id) ?? ctx.app;
    const files = ((app.uploads[ctx.blockId] ?? []) as UploadedFileRecord[]).filter(
      (f) => f.filename !== record.filename,
    );
    files.push(record);
    app.uploads[ctx.blockId] = files;
    writeApplication(app);
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
    const app = readApplication(id);
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    const files = (app.uploads[blockId] ?? []) as UploadedFileRecord[];
    if (!files.some((f) => f.filename === filename)) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const filePath = path.join(UPLOADS_DIR, app.id, blockId, filename);
    if (existsSync(filePath)) unlinkSync(filePath);
    app.uploads[blockId] = files.filter((f) => f.filename !== filename);
    writeApplication(app);
    res.sendStatus(204);
  },
);

export default router;
