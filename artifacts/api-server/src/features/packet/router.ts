import path from "node:path";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync } from "node:fs";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { DecidePacketGateBody, DecidePacketGateResponse, UploadPacketResponse } from "@workspace/api-zod";
import { DATA_DIR } from "../../lib/jsonStore";
import { readApplication, writeApplication, type Application } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { readPdfInfo, runPreflight } from "./preflight";
import { buildSimulatedRun, ingestViaRealEndpoint } from "./simulator";

export const PACKETS_DIR = path.join(DATA_DIR, "packets");

type PacketState = NonNullable<Application["packet"]>;

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "packet.pdf";
}

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

const contexts = new WeakMap<Request, { app: Application }>();

/**
 * Per-application serialization for packet mutations. "The gate physically
 * blocks" only holds if check-then-write is atomic per application — uploads
 * and gate decisions for the same app queue here. Single-process server, so
 * an in-memory promise chain is sufficient.
 */
const packetLocks = new Map<string, Promise<void>>();

async function withPacketLock(appId: string, fn: () => Promise<void>): Promise<void> {
  const prev = packetLocks.get(appId) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  packetLocks.set(appId, tail);
  try {
    await run;
  } finally {
    if (packetLocks.get(appId) === tail) packetLocks.delete(appId);
  }
}

function validateTarget(req: Request, res: Response, next: NextFunction): void {
  const id = param(req, "applicationId");
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  contexts.set(req, { app });
  next();
}

// The packet is stored under a fixed name — re-upload REPLACES it and re-runs
// pre-flight (state machine restarts). Prior analysis runs stay in the sidecar.
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const ctx = contexts.get(req);
    if (!ctx) {
      cb(new Error("Upload context missing"), "");
      return;
    }
    const dir = path.join(PACKETS_DIR, ctx.app.id);
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  // Written to a temp name first — only an ACCEPTED upload is renamed to
  // packet.pdf (inside the lock), so rejected or racing uploads never clobber
  // the packet a previous pre-flight reported on.
  filename: (_req, _file, cb) =>
    cb(null, `packet.upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`),
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

const router: IRouter = Router();

/**
 * Portal-owned packet state machine (C2 staged intake, analyzer spec §3):
 * preflight_running → gated → processing → report. Persisted server-side on the
 * application so the gate PHYSICALLY blocks — no client choreography can pass it.
 */
router.post(
  "/applications/:applicationId/packet",
  validateTarget,
  upload.single("file"),
  async (req, res): Promise<void> => {
    const ctx = contexts.get(req);
    if (!ctx) {
      res.status(500).json({ error: "Upload context missing" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file provided (multipart field name must be "file")' });
      return;
    }
    const originalName = sanitizeFilename(req.file.originalname);
    if (!originalName.toLowerCase().endsWith(".pdf")) {
      unlinkSync(req.file.path);
      res.status(400).json({ error: "Packet must be a PDF" });
      return;
    }
    const tempPath = req.file.path;
    const sizeBytes = req.file.size;
    const info = await readPdfInfo(tempPath);
    if ("error" in info) {
      unlinkSync(tempPath);
      res.status(400).json({ error: info.error });
      return;
    }
    if (info.encrypted) {
      unlinkSync(tempPath);
      res.status(400).json({ error: "PDF is encrypted — remove the password and re-upload" });
      return;
    }

    await withPacketLock(ctx.app.id, async () => {
      let app = readApplication(ctx.app.id);
      if (!app) {
        unlinkSync(tempPath);
        res.status(404).json({ error: "Application not found" });
        return;
      }
      if (app.packet?.state === "processing") {
        // An analyzer run is mid-flight — replacing the packet now would let an
        // older request overwrite newer state. Let the run land, then re-drop.
        unlinkSync(tempPath);
        res.status(409).json({
          error: "Analyzer is running for this packet — wait for the run to land, then re-upload",
        });
        return;
      }

      // State 1: preflight_running — persisted before the work starts (crash-honest).
      const packet: PacketState = {
        filename: originalName,
        sizeBytes,
        pages: info.pages,
        sha256: createHash("sha256").update(readFileSync(tempPath)).digest("hex"),
        uploadedAt: new Date().toISOString(),
        state: "preflight_running",
      };
      app.packet = packet;
      writeApplication(app);

      try {
        packet.preflight = await runPreflight(tempPath, info, path.join(PACKETS_DIR, app.id, "thumbs"));
      } catch (err) {
        unlinkSync(tempPath);
        res.status(500).json({ error: `Pre-flight failed: ${err instanceof Error ? err.message : String(err)}` });
        return;
      }
      // Accepted — this file IS the packet now; re-upload replaces (state machine restarts).
      renameSync(tempPath, path.join(PACKETS_DIR, app.id, "packet.pdf"));

      // Gate rule (spec §3): fewer than 20 pages AND zero red flags → auto-proceed.
      const auto = info.pages < 20 && packet.preflight.flags.length === 0;
      if (!auto) {
        packet.state = "gated";
        app = readApplication(app.id) ?? app;
        app.packet = packet;
        writeApplication(app);
        res.json(UploadPacketResponse.parse(app));
        return;
      }
      packet.gate = { decision: "auto", decidedAt: new Date().toISOString() };
      packet.state = "processing";
      app = readApplication(app.id) ?? app;
      app.packet = packet;
      writeApplication(app);
      try {
        await ingestViaRealEndpoint(app.id, buildSimulatedRun(app, packet, "auto"));
      } catch (err) {
        // Honest failure: fall back to the gate rather than pretending a run exists.
        packet.state = "gated";
        delete packet.gate;
        app = readApplication(app.id) ?? app;
        app.packet = packet;
        writeApplication(app);
        res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
        return;
      }
      packet.state = "report";
      app = readApplication(app.id) ?? app;
      app.packet = packet;
      writeApplication(app);
      res.json(UploadPacketResponse.parse(app));
    });
  },
);

router.post("/applications/:applicationId/packet/gate", validateTarget, async (req, res): Promise<void> => {
  const ctx = contexts.get(req);
  if (!ctx) {
    res.status(500).json({ error: "Request context missing" });
    return;
  }
  const parsed = DecidePacketGateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await withPacketLock(ctx.app.id, async () => {
    // Fresh read INSIDE the lock — two simultaneous gate calls serialize here,
    // so the second one sees processing/report and gets a 409, never a double run.
    let app = readApplication(ctx.app.id);
    if (!app?.packet) {
      res.status(404).json({ error: "No packet uploaded for this application" });
      return;
    }
    if (app.packet.state !== "gated") {
      res.status(409).json({ error: `Packet is not awaiting a gate decision (state: ${app.packet.state})` });
      return;
    }
    const flags = app.packet.preflight?.flags ?? [];
    // Spec §3: "Process" (confirmed) only when clean; "Process anyway" (bypassed) is an
    // explicit human override of standing red flags — the two are not interchangeable.
    if (parsed.data.decision === "confirmed" && flags.length > 0) {
      res.status(400).json({ error: `Packet has ${flags.length} red flag(s) — use "bypassed" (Process anyway) to override them` });
      return;
    }
    if (parsed.data.decision === "bypassed" && flags.length === 0) {
      res.status(400).json({ error: 'Packet has no red flags — use "confirmed"' });
      return;
    }

    const packet: PacketState = { ...app.packet };
    packet.gate = { decision: parsed.data.decision, decidedBy: parsed.data.decidedBy, decidedAt: new Date().toISOString() };
    packet.state = "processing";
    app.packet = packet;
    writeApplication(app);

    try {
      await ingestViaRealEndpoint(app.id, buildSimulatedRun(app, packet, parsed.data.decision));
    } catch (err) {
      packet.state = "gated";
      delete packet.gate;
      app = readApplication(app.id) ?? app;
      app.packet = packet;
      writeApplication(app);
      res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
      return;
    }
    packet.state = "report";
    app = readApplication(app.id) ?? app;
    app.packet = packet;
    writeApplication(app);
    res.json(DecidePacketGateResponse.parse(app));
  });
});

router.get("/applications/:applicationId/packet/thumbnails/:page", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const page = Number.parseInt(param(req, "page") ?? "", 10);
  if (!Number.isFinite(page) || page <= 0) {
    res.status(400).json({ error: "Invalid page number" });
    return;
  }
  const file = path.join(PACKETS_DIR, id, "thumbs", `page-${page}.png`);
  if (!existsSync(file)) {
    res.status(404).json({ error: "No thumbnail for this page" });
    return;
  }
  res.type("png").sendFile(file);
});

export default router;
