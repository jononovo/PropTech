import os from "node:os";
import { unlinkSync } from "node:fs";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { UploadDocumentResponse } from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { clientIp } from "../../lib/clientIp";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { extensionAllowed, findBlock, findSectionOfBlock, isSafeSegment, sectionAllowsUpload } from "../intake/blocks";
import { receiveSourceFiles, sanitizeFilename } from "../files/receive";

type UploadedFileRecord = { filename: string; size: number; uploadedAt: string; variantId?: string; uploaderIp?: string; fileId: string };

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
  // Section-level "Who adds" from the pinned template — enforced, not decorative.
  // Role identity comes from the access middleware (res.locals.profile).
  const role = (res.locals["profile"] as { role?: string } | undefined)?.role;
  const section = findSectionOfBlock(app, blockId);
  if (!section || !role || !sectionAllowsUpload(section, role)) {
    res.status(403).json({ error: `${role ?? "This role"} cannot upload to section "${section?.name ?? blockId}" (template permissions)` });
    return;
  }
  contexts.set(req, { app, blockId });
  next();
}

// Bytes stage in the OS temp dir, then land id-addressed in the SourceFile
// registry (file-native intake phase 2) — this route is now a thin "receive
// with declared intent" wrapper around the unified receive seam.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, _file, cb) =>
    cb(null, `intake-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
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
    const cleanup = () => { try { unlinkSync(req.file!.path); } catch { /* gone */ } };
    try {
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
      // Unknown variant = 400, BEFORE bytes land (no silently mis-filed uploads).
      const variantId = typeof req.query.variantId === "string" && req.query.variantId ? req.query.variantId : undefined;
      if (variantId) {
        const variants = (ctx.app.variants?.[ctx.blockId] ?? []) as { id: string }[];
        if (!variants.some((v) => v.id === variantId)) {
          res.status(400).json({ error: "Unknown variant for this block" });
          return;
        }
      }

      // Unified receive: bytes land as an immutable SourceFile with solicited
      // intent; the file.received ledger event carries blockId/variantId.
      const { files } = await receiveSourceFiles({
        app: ctx.app,
        files: [{
          tempPath: req.file.path,
          originalname: req.file.originalname,
          sizeBytes: req.file.size,
          ...(req.file.mimetype ? { mimetype: req.file.mimetype } : {}),
        }],
        origin: "solicited",
        blockId: ctx.blockId,
        ...(variantId ? { variantId } : {}),
        ...(clientIp(req) ? { receivedIp: clientIp(req) } : {}),
        requirePdf: false,
      });
      const sf = files[0]!;

      // The minted SourceFile is the source of truth — images were converted
      // to single-page PDFs at the receive seam (filename/size differ then).
      const record: UploadedFileRecord = {
        filename: sf.filename,
        size: sf.sizeBytes,
        uploadedAt: sf.receivedAt,
        fileId: sf.id,
        ...(variantId ? { variantId } : {}),
        ...(clientIp(req) ? { uploaderIp: clientIp(req) } : {}),
      };
      // Atomic append — no clobbering of concurrent writes to other parts of the app.
      const app = await updateApplication(ctx.app.id, (app) => {
        const list = ((app.uploads[ctx.blockId] ?? []) as UploadedFileRecord[]).filter(
          (f) => f.filename !== record.filename,
        );
        list.push(record);
        app.uploads[ctx.blockId] = list;
        return app;
      });
      if (!app) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.status(201).json(UploadDocumentResponse.parse(record));
    } catch (err) {
      if (isHttpError(err)) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    } finally {
      cleanup();
    }
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
      const app = await updateApplication(id, (app, emit) => {
        const files = (app.uploads[blockId] ?? []) as UploadedFileRecord[];
        const record = files.find((f) => f.filename === filename);
        if (!record) throw new HttpError(404, "File not found");
        app.uploads[blockId] = files.filter((f) => f.filename !== filename);
        // SourceFiles are never deleted — the registry row archives (audit),
        // bytes stay. Only the intake record (working state) goes away.
        const sf = (app.files ?? []).find((f) => f.id === record.fileId);
        if (sf) sf.status = "archived";
        emit({
          actor: { kind: "user", ip: clientIp(req) },
          action: "file.deleted",
          target: { type: "file", ...(record.fileId ? { id: record.fileId } : {}), label: filename },
          detail: { blockId },
        });
        return app;
      });
      if (!app) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
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
