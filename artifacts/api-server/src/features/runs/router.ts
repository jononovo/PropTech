import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { nanoid } from "nanoid";
import {
  DecideRunGateBody,
  DecideRunGateResponse,
  GetRunEstimateResponse,
  ReportRunFailureBody,
  ReportRunFailureResponse,
} from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { clientIp } from "../../lib/clientIp";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { estimateRun } from "../files/preflight";
import { storageExt } from "../files/receive";

type RunState = NonNullable<Application["run"]>;
type RunInputFile = NonNullable<RunState["input"]>[number];
type SourceFile = NonNullable<Application["files"]>[number];

/**
 * File-native run lifecycle (replaces the packet state machine): the analyzer
 * runs over the ACTIVE FILE SET — files land durably at drop, the gate covers
 * the set, not a blob. gated → processing → report, per run request; persisted
 * server-side so the gate PHYSICALLY blocks. The processing→report flip happens
 * in the analysis ingest route; /run/failed reverts processing→gated. Both are
 * requestId-guarded, so a stale worker can never clobber a newer run.
 */

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

const contexts = new WeakMap<Request, { app: Application }>();

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

/** The run's input universe: active, analyzable (PDF, page-counted) source files, in receipt order. */
export function activeInputFiles(app: Application): SourceFile[] {
  return (app.files ?? []).filter(
    (f) =>
      f.status === "active" &&
      storageExt(f) === ".pdf" &&
      typeof f.pages === "number" &&
      f.pages > 0 &&
      typeof f.sha256 === "string",
  );
}

function toRunInput(files: SourceFile[]): RunInputFile[] {
  return files.map((f) => ({ fileId: f.id, filename: f.filename, sha256: f.sha256!, pages: f.pages! }));
}

/** Every structured flag across the set, fileId stamped in (SourceFile.flags keeps it implicit). */
function setFlags(files: SourceFile[]): { fileId: string; page?: number; code: string; note: string }[] {
  return files.flatMap((f) => (f.flags ?? []).map((flag) => ({ fileId: f.id, ...flag })));
}

/**
 * Kick the analyzer worker (spec §5: the portal API is the only integration
 * surface — the worker fetches each input file via GET /files/:fileId and
 * POSTs the run back through the real ingest endpoint). 202 expected
 * immediately; the run lands later. No ANALYZER_URL = honest failure.
 */
async function kickAnalyzer(payload: {
  applicationId: string;
  requestId: string;
  gate: "auto" | "confirmed" | "bypassed";
  input: RunInputFile[];
  flags: { fileId: string; page?: number; code: string; note: string }[];
  plan?: { parse?: string; text?: string; judge?: string; fraudScoring?: boolean };
}): Promise<void> {
  const base = process.env["ANALYZER_URL"];
  if (!base) throw new Error("ANALYZER_URL is not configured — analyzer worker unreachable");
  const res = await fetch(`${base.replace(/\/$/, "")}/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  }).catch((err: unknown) => {
    throw new Error(`Analyzer worker unreachable: ${err instanceof Error ? err.message : String(err)}`);
  });
  if (res.status !== 202) {
    const body = await res.text().catch(() => "");
    throw new Error(`Analyzer refused the run: ${res.status} ${body.slice(0, 200)}`);
  }
}

/** Guarded revert processing→gated after a failed kick/run — only OUR request (requestId) flips. */
async function revertToGated(appId: string, requestId: string, reason: string): Promise<void> {
  await updateApplication(appId, (a, emit) => {
    if (a.run?.state === "processing" && a.run.requestId === requestId) {
      const reverted: RunState = { ...a.run, state: "gated", lastRunError: reason.slice(0, 500) };
      delete reverted.gate;
      a.run = reverted;
      emit({
        actor: { kind: "system" },
        action: "run.failed",
        detail: { reason: reason.slice(0, 200) },
      });
    }
    return a;
  });
}

const router: IRouter = Router();

router.get("/applications/:applicationId/run/estimate", validateTarget, async (req, res): Promise<void> => {
  const ctx = contexts.get(req)!;
  const files = activeInputFiles(ctx.app);
  const pages = files.reduce((n, f) => n + (f.pages ?? 0), 0);
  const { usd, minutes } = estimateRun(pages);
  res.json(
    GetRunEstimateResponse.parse({ files: files.length, pages, estimateUsd: usd, estimateMinutes: minutes }),
  );
});

router.post("/applications/:applicationId/run/gate", validateTarget, async (req, res): Promise<void> => {
  const ctx = contexts.get(req)!;
  const parsed = DecideRunGateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check-then-decide is one row-locked transaction: two simultaneous gate
  // calls serialize at the DB — the second sees processing and gets a 409,
  // never a double run. Holds across server instances, not just this one.
  const requestId = `rr-${nanoid(10)}`;
  let decided: Application | undefined;
  try {
    decided = await updateApplication(ctx.app.id, (app, emit) => {
      if (app.run?.state === "processing") {
        throw new HttpError(409, "Analyzer is already running — wait for the run to land");
      }
      const files = activeInputFiles(app);
      if (files.length === 0) {
        throw new HttpError(409, "No analyzable files on this application — drop at least one PDF first");
      }
      const flags = setFlags(files);
      // Spec §3: "Process" (confirmed) only when clean; "Process anyway" (bypassed) is an
      // explicit human override of standing red flags — the two are not interchangeable.
      if (parsed.data.decision === "confirmed" && flags.length > 0) {
        throw new HttpError(400, `The file set has ${flags.length} red flag(s) — use "bypassed" (Process anyway) to override them`);
      }
      if (parsed.data.decision === "bypassed" && flags.length === 0) {
        throw new HttpError(400, 'The file set has no red flags — use "confirmed"');
      }
      app.run = {
        state: "processing",
        requestId,
        input: toRunInput(files),
        gate: { decision: parsed.data.decision, decidedBy: parsed.data.decidedBy, decidedAt: new Date().toISOString() },
      };
      emit({
        actor: { kind: "user", name: parsed.data.decidedBy, ip: clientIp(req) },
        action: `gate.${parsed.data.decision}`,
        detail: { files: files.length, pages: files.reduce((n, f) => n + (f.pages ?? 0), 0), redFlags: flags.length },
      });
      return app;
    });
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
  if (!decided?.run?.input) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  // Analyzer kick OUTSIDE the transaction — the persisted processing state is
  // what blocks competing mutations while the run is in flight.
  try {
    const kicked = activeInputFiles(decided);
    await kickAnalyzer({
      applicationId: decided.id,
      requestId,
      gate: parsed.data.decision,
      input: decided.run.input,
      flags: setFlags(kicked),
      ...(parsed.data.plan ? { plan: parsed.data.plan } : {}),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await revertToGated(ctx.app.id, requestId, reason);
    res.status(502).json({ error: reason });
    return;
  }
  res.json(DecideRunGateResponse.parse(decided));
});

/**
 * Analyzer failure callback — honest revert, never a silent hang. Guarded:
 * only the run still processing THIS requestId reverts; a stale worker can
 * never clobber a newer run.
 */
router.post("/applications/:applicationId/run/failed", validateTarget, async (req, res): Promise<void> => {
  const ctx = contexts.get(req)!;
  const parsed = ReportRunFailureBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const app = await updateApplication(ctx.app.id, (a) => {
      if (a.run?.state !== "processing" || a.run.requestId !== parsed.data.requestId) {
        throw new HttpError(409, `No run processing this request (state: ${a.run?.state ?? "none"})`);
      }
      const reverted: RunState = { ...a.run, state: "gated", lastRunError: parsed.data.reason.slice(0, 500) };
      delete reverted.gate;
      a.run = reverted;
      return a;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(ReportRunFailureResponse.parse(app));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
