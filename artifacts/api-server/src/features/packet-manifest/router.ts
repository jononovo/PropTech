import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createWriteStream, existsSync, mkdirSync, rmSync, statSync, unlinkSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { SetPacketFileRemovedBody } from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { clientIp } from "../../lib/clientIp";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { readPdfInfo } from "../packet/preflight";
import { acceptPacketPdf } from "../packet/router";
import { openSourceFileStream } from "../../lib/packetObjectStore";
import { receiveSourceFiles, storageExt } from "../files/receive";

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

const router: IRouter = Router();

/**
 * Multi-file intake, registry-backed (file-native intake phase 2): drop N
 * PDFs → each lands durably as an immutable SourceFile → reviewable manifest
 * (manifest file id == SourceFile id) → per-file X → assemble reads the
 * durable bytes. Local staging is gone — no "staged bytes missing" mode.
 * Whole-drop validation: one bad file rejects the drop (fix and re-drop).
 *
 * NOTE: the assemble/concatenation step itself dies in phase 3 — files
 * already land as themselves; only the run input is still one blob.
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

    // Unified receive: validates the whole drop, stores immutable bytes,
    // appends registry rows + file.received ledger events in one tx.
    const received = await receiveSourceFiles({
      app,
      files: files.map((f) => ({
        tempPath: f.path,
        originalname: f.originalname,
        sizeBytes: f.size,
        mimetype: "application/pdf",
      })),
      origin: "unsolicited",
      ...(clientIp(req) ? { receivedIp: clientIp(req) } : {}),
      requirePdf: true,
    });

    const entries: ManifestFile[] = received.files.map((sf) => ({
      id: sf.id,
      filename: sf.filename,
      sizeBytes: sf.sizeBytes,
      pages: sf.pages ?? 0,
      flags: sf.flags ?? [],
      removed: false,
    }));
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
 * push it through the exact single-packet acceptance path. Bytes come from
 * the durable SourceFile registry — re-assemble works any time. Global page
 * addressing downstream; packet.files records provenance spans. (Dies in
 * phase 3 — runs will take the file set directly.)
 */
router.post("/applications/:applicationId/packet/assemble", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const scratch = path.join(os.tmpdir(), `packet-assemble-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  try {
    if (!isSafeSegment(id)) throw new HttpError(400, "Invalid application id");
    const app = await readApplication(id);
    if (!app) throw new HttpError(404, "Application not found");
    const manifest = app.packetManifest;
    if (!manifest) throw new HttpError(400, "No manifest — drop files first");
    if (manifest.assembledAt) throw new HttpError(409, "Manifest already assembled — re-drop to start over");
    const kept = manifest.files.filter((f) => !f.removed);
    if (kept.length === 0) throw new HttpError(400, "Every file was removed — keep at least one or re-drop");

    // provenance: global page span per source file, in manifest order
    const files: { filename: string; pages: [number, number] }[] = [];
    let cursor = 1;
    for (const f of kept) {
      files.push({ filename: f.filename, pages: [cursor, cursor + f.pages - 1] });
      cursor += f.pages;
    }

    // Pull durable bytes to scratch from the SourceFile registry.
    mkdirSync(scratch, { recursive: true });
    const localPaths: string[] = [];
    for (const f of kept) {
      const sf = (app.files ?? []).find((x) => x.id === f.id);
      const stream = sf ? await openSourceFileStream(id!, sf.id, storageExt(sf)) : undefined;
      if (!stream) {
        throw new HttpError(409, `Bytes missing for ${f.filename} — re-drop the files`);
      }
      const dest = path.join(scratch, `${f.id}.pdf`);
      await pipeline(stream, createWriteStream(dest));
      localPaths.push(dest);
    }

    const tempPath = path.join(scratch, "assembled.pdf");
    if (localPaths.length === 1) {
      // single file: pass through untouched
      localPaths[0] && (await run("cp", [localPaths[0], tempPath]));
    } else {
      await run("pdfunite", [...localPaths, tempPath]).catch((err: unknown) => {
        throw new HttpError(500, `pdfunite failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    const info = await readPdfInfo(tempPath);
    if ("error" in info) {
      throw new HttpError(500, `Assembled packet does not parse: ${info.error}`);
    }
    const originalName = kept.length === 1
      ? kept[0]!.filename
      : `assembled-packet-${kept.length}-files.pdf`;

    // acceptPacketPdf consumes tempPath (it unlinks it); scratch dir cleanup below.
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
    res.json(accepted);
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  } finally {
    if (existsSync(scratch)) rmSync(scratch, { recursive: true, force: true });
  }
});

export default router;
