import path from "node:path";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync } from "node:fs";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import {
  DecidePacketGateBody,
  DecidePacketGateResponse,
  ReportPacketRunFailureBody,
  ReportPacketRunFailureResponse,
  UploadPacketResponse,
} from "@workspace/api-zod";
import { DATA_DIR } from "../../lib/jsonStore";
import { HttpError, isHttpError } from "../../lib/httpError";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { readPdfInfo, runPreflight } from "./preflight";

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
 * Per-application serialization of packet DISK artifacts (packet.pdf, thumbs)
 * within this instance — uploads for the same app queue here so pre-flight
 * never reads a half-replaced file. Packet STATE atomicity does not rest on
 * this: every state transition below is a SELECT ... FOR UPDATE transaction
 * (updateApplication) with sha-guarded flips, which holds across instances too.
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

/**
 * Kick the analyzer worker (spec §5: the portal API is the only integration
 * surface — the worker fetches the packet and POSTs the run back through the
 * real ingest endpoint). 202 expected immediately; the run lands later.
 * No ANALYZER_URL / unreachable worker = honest failure, never a silent skip.
 */
async function kickAnalyzer(applicationId: string, packetSha256: string, gate: "auto" | "confirmed" | "bypassed"): Promise<void> {
  const base = process.env["ANALYZER_URL"];
  if (!base) throw new Error("ANALYZER_URL is not configured — analyzer worker unreachable");
  const res = await fetch(`${base.replace(/\/$/, "")}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ applicationId, packetSha256, gate }),
    signal: AbortSignal.timeout(8000),
  }).catch((err: unknown) => {
    throw new Error(`Analyzer worker unreachable: ${err instanceof Error ? err.message : String(err)}`);
  });
  if (res.status !== 202) {
    const body = await res.text().catch(() => "");
    throw new Error(`Analyzer refused the run: ${res.status} ${body.slice(0, 200)}`);
  }
}

/** Guarded revert processing→gated after a failed kick/run — only OUR packet (sha) flips. */
async function revertToGated(appId: string, sha256: string, reason: string): Promise<void> {
  await updateApplication(appId, (a) => {
    if (a.packet?.state === "processing" && a.packet.sha256 === sha256) {
      const reverted: PacketState = { ...a.packet, state: "gated", lastRunError: reason.slice(0, 500) };
      delete reverted.gate;
      a.packet = reverted;
    }
    return a;
  });
}

async function validateTarget(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = param(req, "applicationId");
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = await readApplication(id);
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
 * The processing→report flip happens in the analysis ingest route when the run
 * lands; run-failed reverts processing→gated. Both are sha/state-guarded.
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
      // State 1: preflight_running — claimed ATOMICALLY before the work starts
      // (crash-honest). A packet mid-analysis refuses replacement: an older
      // request must never overwrite newer state.
      const base: PacketState = {
        filename: originalName,
        sizeBytes,
        pages: info.pages,
        sha256: createHash("sha256").update(readFileSync(tempPath)).digest("hex"),
        uploadedAt: new Date().toISOString(),
        state: "preflight_running",
      };
      let claimed: Application | undefined;
      try {
        claimed = await updateApplication(ctx.app.id, (app) => {
          if (app.packet?.state === "processing") {
            throw new HttpError(409, "Analyzer is running for this packet — wait for the run to land, then re-upload");
          }
          app.packet = base;
          return app;
        });
      } catch (err) {
        unlinkSync(tempPath);
        if (isHttpError(err)) {
          res.status(err.status).json({ error: err.message });
          return;
        }
        throw err;
      }
      if (!claimed) {
        unlinkSync(tempPath);
        res.status(404).json({ error: "Application not found" });
        return;
      }

      // Pre-flight runs OUTSIDE any transaction — never hold a row lock across
      // page rasterization.
      const packet: PacketState = { ...base };
      try {
        packet.preflight = await runPreflight(tempPath, info, path.join(PACKETS_DIR, ctx.app.id, "thumbs"));
      } catch (err) {
        unlinkSync(tempPath);
        res.status(500).json({ error: `Pre-flight failed: ${err instanceof Error ? err.message : String(err)}` });
        return;
      }
      // Accepted — this file IS the packet now; re-upload replaces (state machine restarts).
      renameSync(tempPath, path.join(PACKETS_DIR, ctx.app.id, "packet.pdf"));

      // Gate rule (spec §3): fewer than 20 pages AND zero red flags → auto-proceed.
      const auto = info.pages < 20 && packet.preflight.flags.length === 0;
      if (!auto) {
        packet.state = "gated";
        let app: Application | undefined;
        try {
          // Guarded finalize: only OUR claim (sha, still preflight_running) may
          // land — a concurrent re-upload that re-claimed wins over this one.
          app = await updateApplication(ctx.app.id, (a) => {
            if (a.packet?.state !== "preflight_running" || a.packet.sha256 !== packet.sha256) {
              throw new HttpError(409, "This upload was superseded by a newer upload");
            }
            a.packet = packet;
            return a;
          });
        } catch (err) {
          if (isHttpError(err)) {
            res.status(err.status).json({ error: err.message });
            return;
          }
          throw err;
        }
        if (!app) {
          res.status(404).json({ error: "Application not found" });
          return;
        }
        res.json(UploadPacketResponse.parse(app));
        return;
      }

      packet.gate = { decision: "auto", decidedAt: new Date().toISOString() };
      packet.state = "processing";
      let processing: Application | undefined;
      try {
        // Same guard as above — only the winning upload may enter processing
        // and kick the analyzer.
        processing = await updateApplication(ctx.app.id, (a) => {
          if (a.packet?.state !== "preflight_running" || a.packet.sha256 !== packet.sha256) {
            throw new HttpError(409, "This upload was superseded by a newer upload");
          }
          a.packet = packet;
          return a;
        });
      } catch (err) {
        if (isHttpError(err)) {
          res.status(err.status).json({ error: err.message });
          return;
        }
        throw err;
      }
      if (!processing) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      try {
        await kickAnalyzer(processing.id, packet.sha256, "auto");
      } catch (err) {
        // Honest failure: fall back to the gate rather than pretending a run started.
        const reason = err instanceof Error ? err.message : String(err);
        await revertToGated(ctx.app.id, packet.sha256, reason);
        res.status(502).json({ error: reason });
        return;
      }
      // state=processing — the run lands asynchronously via the ingest endpoint.
      res.json(UploadPacketResponse.parse(processing));
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

  // Check-then-decide is one row-locked transaction: two simultaneous gate
  // calls serialize at the DB — the second sees processing/report and gets a
  // 409, never a double run. Holds across server instances, not just this one.
  let decided: Application | undefined;
  try {
    decided = await updateApplication(ctx.app.id, (app) => {
      if (!app.packet) {
        throw new HttpError(404, "No packet uploaded for this application");
      }
      if (app.packet.state !== "gated") {
        throw new HttpError(409, `Packet is not awaiting a gate decision (state: ${app.packet.state})`);
      }
      const flags = app.packet.preflight?.flags ?? [];
      // Spec §3: "Process" (confirmed) only when clean; "Process anyway" (bypassed) is an
      // explicit human override of standing red flags — the two are not interchangeable.
      if (parsed.data.decision === "confirmed" && flags.length > 0) {
        throw new HttpError(400, `Packet has ${flags.length} red flag(s) — use "bypassed" (Process anyway) to override them`);
      }
      if (parsed.data.decision === "bypassed" && flags.length === 0) {
        throw new HttpError(400, 'Packet has no red flags — use "confirmed"');
      }
      const next: PacketState = {
        ...app.packet,
        gate: { decision: parsed.data.decision, decidedBy: parsed.data.decidedBy, decidedAt: new Date().toISOString() },
        state: "processing",
      };
      delete next.lastRunError;
      app.packet = next;
      return app;
    });
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
  if (!decided?.packet) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const packet = decided.packet;

  // Analyzer kick OUTSIDE the transaction — the persisted processing state is
  // what blocks competing mutations while the run is in flight.
  try {
    await kickAnalyzer(decided.id, packet.sha256, parsed.data.decision);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await revertToGated(ctx.app.id, packet.sha256, reason);
    res.status(502).json({ error: reason });
    return;
  }
  // state=processing — the run lands asynchronously via the ingest endpoint.
  res.json(DecidePacketGateResponse.parse(decided));
});

/**
 * The analyzer's input surface: the stored packet, byte-for-byte ("gate,
 * don't retouch" — no enhancement ever).
 */
router.get("/applications/:applicationId/packet/file", validateTarget, async (req, res): Promise<void> => {
  const ctx = contexts.get(req);
  if (!ctx?.app.packet) {
    res.status(404).json({ error: "No packet uploaded for this application" });
    return;
  }
  const file = path.join(PACKETS_DIR, ctx.app.id, "packet.pdf");
  if (!existsSync(file)) {
    res.status(404).json({ error: "Packet file missing on disk" });
    return;
  }
  res.type("application/pdf").sendFile(file);
});

/**
 * Analyzer failure callback — honest revert, never a silent hang. Guarded:
 * only the packet that is still processing THIS sha reverts; a stale worker
 * can never clobber a newer packet.
 */
router.post("/applications/:applicationId/packet/run-failed", validateTarget, async (req, res): Promise<void> => {
  const ctx = contexts.get(req);
  if (!ctx) {
    res.status(500).json({ error: "Request context missing" });
    return;
  }
  const parsed = ReportPacketRunFailureBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const app = await updateApplication(ctx.app.id, (a) => {
      if (!a.packet) {
        throw new HttpError(404, "No packet uploaded for this application");
      }
      if (a.packet.state !== "processing" || a.packet.sha256 !== parsed.data.packetSha256) {
        throw new HttpError(409, `Packet is not processing this sha (state: ${a.packet.state})`);
      }
      const reverted: PacketState = { ...a.packet, state: "gated", lastRunError: parsed.data.reason.slice(0, 500) };
      delete reverted.gate;
      a.packet = reverted;
      return a;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(ReportPacketRunFailureResponse.parse(app));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
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
