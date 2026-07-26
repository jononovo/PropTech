import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { copyFileSync, existsSync, statSync, unlinkSync } from "node:fs";
import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { SetPacketFileRemovedBody } from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { clientIp } from "../../lib/clientIp";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { readPdfInfo, quickFileFlags } from "../packet/preflight";
import { acceptPacketPdf } from "../packet/router";
import { clearStaging, ensureStagingDir, stagedFilePath } from "./staging";

const run = promisify(execFile);

type Manifest = NonNullable<Application["packetManifest"]>;
type ManifestFile = Manifest["files"][number];

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, _file, cb) =>
    cb(null, `manifest-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`),
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024, files: 25 } });

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file.pdf";
}

const router: IRouter = Router();

/**
 * Multi-file intake v1 (Phase 5): drop N PDFs → reviewable manifest → per-file
 * X → assemble into ONE packet that flows through the unchanged single-packet
 * pipeline. Whole-drop validation: one bad file rejects the drop (fix and
 * re-drop) — a half-accepted manifest is worse than a clear error.
 */
router.post("/applications/:applicationId/packet/files", upload.array("files", 25), async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const files = (req.files ?? []) as Express.Multer.File[];
  const cleanup = () => files.forEach((f) => { try { unlinkSync(f.path); } catch { /* gone */ } });
  try {
    if (!isSafeSegment(id)) throw new HttpError(400, "Invalid application id");
    const app = await readApplication(id);
    if (!app) throw new HttpError(404, "Application not found");
    if (app.packet?.state === "processing") {
      throw new HttpError(409, "Analyzer is running for this packet — wait for the run to land");
    }
    if (files.length === 0) {
      throw new HttpError(400, 'No files provided (multipart field name must be "files")');
    }

    // Validate + measure every file BEFORE any state lands.
    const entries: ManifestFile[] = [];
    for (const f of files) {
      const filename = sanitizeFilename(f.originalname);
      if (!filename.toLowerCase().endsWith(".pdf")) {
        throw new HttpError(400, `${filename}: not a PDF — the whole drop was rejected, fix and re-drop`);
      }
      const info = await readPdfInfo(f.path);
      if ("error" in info) throw new HttpError(400, `${filename}: ${info.error}`);
      if (info.encrypted) throw new HttpError(400, `${filename}: encrypted — remove the password and re-drop`);
      entries.push({
        id: `pf-${nanoid(8)}`,
        filename,
        sizeBytes: f.size,
        pages: info.pages,
        flags: await quickFileFlags(f.path),
        removed: false,
      });
    }

    // Stage bytes (replacing any previous manifest's staging), then persist.
    clearStaging(id!);
    ensureStagingDir(id!);
    entries.forEach((e, i) => copyFileSync(files[i]!.path, stagedFilePath(id!, e.id)));
    const updated = await updateApplication(id!, (a) => {
      a.packetManifest = { files: entries, createdAt: new Date().toISOString() };
      return a;
    });
    if (!updated) throw new HttpError(404, "Application not found");
    res.json(updated);
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

/** The X — reversible until assemble consumes the manifest. */
router.post("/applications/:applicationId/packet/files/:fileId", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const fileId = param(req, "fileId");
  const parsed = SetPacketFileRemovedBody.safeParse(req.body);
  try {
    if (!isSafeSegment(id)) throw new HttpError(400, "Invalid application id");
    if (!parsed.success) throw new HttpError(400, parsed.error.message);
    const updated = await updateApplication(id!, (a) => {
      if (!a.packetManifest) throw new HttpError(404, "No manifest — drop files first");
      if (a.packetManifest.assembledAt) throw new HttpError(409, "Manifest already assembled — re-drop to start over");
      const f = a.packetManifest.files.find((x) => x.id === fileId);
      if (!f) throw new HttpError(404, "No such file in the manifest");
      f.removed = parsed.data.removed;
      return a;
    });
    if (!updated) throw new HttpError(404, "Application not found");
    res.json(updated);
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

/**
 * Concatenate kept files (manifest order, pdfunite) into ONE packet PDF and
 * push it through the exact single-packet acceptance path. Global page
 * addressing everywhere downstream; packet.files records provenance spans.
 */
router.post("/applications/:applicationId/packet/assemble", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  try {
    if (!isSafeSegment(id)) throw new HttpError(400, "Invalid application id");
    const app = await readApplication(id);
    if (!app) throw new HttpError(404, "Application not found");
    const manifest = app.packetManifest;
    if (!manifest) throw new HttpError(400, "No manifest — drop files first");
    if (manifest.assembledAt) throw new HttpError(409, "Manifest already assembled — re-drop to start over");
    const kept = manifest.files.filter((f) => !f.removed);
    if (kept.length === 0) throw new HttpError(400, "Every file was removed — keep at least one or re-drop");
    const missing = kept.filter((f) => !existsSync(stagedFilePath(id!, f.id)));
    if (missing.length > 0) {
      throw new HttpError(409,
        `Staged bytes missing for ${missing.map((f) => f.filename).join(", ")} — re-drop the files`);
    }

    // provenance: global page span per source file, in manifest order
    const files: { filename: string; pages: [number, number] }[] = [];
    let cursor = 1;
    for (const f of kept) {
      files.push({ filename: f.filename, pages: [cursor, cursor + f.pages - 1] });
      cursor += f.pages;
    }

    const tempPath = path.join(os.tmpdir(), `packet-assemble-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`);
    if (kept.length === 1) {
      copyFileSync(stagedFilePath(id!, kept[0]!.id), tempPath);
    } else {
      await run("pdfunite", [...kept.map((f) => stagedFilePath(id!, f.id)), tempPath]).catch((err: unknown) => {
        throw new HttpError(500, `pdfunite failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    const info = await readPdfInfo(tempPath);
    if ("error" in info) {
      unlinkSync(tempPath);
      throw new HttpError(500, `Assembled packet does not parse: ${info.error}`);
    }
    const originalName = kept.length === 1
      ? kept[0]!.filename
      : `assembled-packet-${kept.length}-files.pdf`;

    const accepted = await acceptPacketPdf({
      appId: id!,
      tempPath,
      originalName,
      sizeBytes: statSync(tempPath).size,
      info,
      files,
      consumeManifest: true,
      ...(clientIp(req) ? { uploaderIp: clientIp(req) } : {}),
    });
    clearStaging(id!); // consumed — staged bytes are gone by design (no defer queue in v1)
    res.json(accepted);
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
