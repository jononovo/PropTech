import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { Router, type IRouter } from "express";
import {
  GetAnalysisResponse,
  IngestAnalysisRunBody,
  IngestAnalysisRunResponse,
  RecordPlacementBody,
  RecordPlacementResponse,
  RecordVerdictBody,
  RecordVerdictResponse,
} from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { readApplication, updateApplication, type Application } from "../intake/store";
import { findBlock, isSafeSegment } from "../intake/blocks";
import { appendRun, readSidecar } from "./store";
import { writeRunSidecars } from "./runSidecars";
import { appendEvent } from "../ledger/store";
import { clientIp } from "../../lib/clientIp";
import { materializeApproval } from "../approved-docs/materialize";

const router: IRouter = Router();

function paramStr(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

router.get("/applications/:applicationId/analysis", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = await readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(GetAnalysisResponse.parse(await readSidecar(id)));
});

router.post("/applications/:applicationId/analysis", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = await readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const parsed = IngestAnalysisRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // INVARIANT (analyzer spec §5): every suggestedBlockId must resolve to a document
  // block in the application's PINNED template — the whole run is rejected otherwise.
  // The pinned template is immutable, so validating against this read is race-free.
  for (const doc of parsed.data.documents) {
    const block = findBlock(app, doc.suggestedBlockId);
    if (!block || block.kind !== "document") {
      res.status(400).json({
        error: `suggestedBlockId "${doc.suggestedBlockId}" does not resolve to a document block on this application's pinned template`,
      });
      return;
    }
  }
  const result = await appendRun(id, parsed.data);
  if (result === "duplicate") {
    res.status(409).json({ error: `runId "${parsed.data.runId}" already ingested` });
    return;
  }
  // Asynchronous completion of the packet choreography: a landed run flips the
  // packet processing→report and clears lastRunError. State-guarded — uploads
  // are 409-blocked during processing, so the processing packet IS this run's.
  await appendEvent({
    applicationId: id,
    actor: { kind: "system" },
    action: "run.ingested",
    target: { type: "run", id: parsed.data.runId },
    detail: { documents: parsed.data.documents.length },
  });
  // Markdown projections into App Storage (intelligence corpus). Regenerable,
  // so a failure is loud (ledger) but never fails the ingest.
  try {
    await writeRunSidecars(id, parsed.data, app.packet?.sha256);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[analysis] run sidecar write failed for ${id}/${parsed.data.runId}: ${message}`);
    await appendEvent({
      applicationId: id,
      actor: { kind: "system" },
      action: "run.sidecars_failed",
      target: { type: "run", id: parsed.data.runId },
      detail: { message },
    });
  }
  await updateApplication(id, (app) => {
    if (app.packet?.state === "processing") {
      const next: NonNullable<Application["packet"]> = { ...app.packet, state: "report" };
      delete next.lastRunError;
      app.packet = next;
    }
    return app;
  });
  res.status(201).json(IngestAnalysisRunResponse.parse(result));
});

router.put("/applications/:applicationId/verdicts/:blockId", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  const blockId = paramStr(req.params["blockId"]);
  if (!isSafeSegment(id) || !isSafeSegment(blockId)) {
    res.status(400).json({ error: "Invalid application or block id" });
    return;
  }
  const parsed = RecordVerdictBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const app = await updateApplication(id, (app, emit) => {
      const block = findBlock(app, blockId);
      if (!block || block.kind !== "document") {
        throw new HttpError(400, "Block is not a document block on this application's template");
      }
      // Verdicts are human-only (spec §1.6); accepting confirms the dates the block's clocks
      // run on (spec §1.4). Latest verdict per block is kept; re-recording replaces it.
      const verdict: NonNullable<Application["verdicts"]>[string] = {
        verdict: parsed.data.verdict,
        datesEdited: parsed.data.datesEdited ?? false,
        decidedAt: new Date().toISOString(),
        decidedBy: parsed.data.decidedBy,
        ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
        ...(parsed.data.documentDate !== undefined ? { documentDate: parsed.data.documentDate } : {}),
        ...(parsed.data.expiryDate !== undefined ? { expiryDate: parsed.data.expiryDate } : {}),
        ...(parsed.data.runId !== undefined ? { runId: parsed.data.runId } : {}),
      };
      app.verdicts = { ...(app.verdicts ?? {}), [blockId]: verdict };
      emit({
        actor: { kind: "user", name: parsed.data.decidedBy, ip: clientIp(req) },
        action: `verdict.${parsed.data.verdict}`,
        target: { type: "block", id: blockId, label: block.name },
        ...(parsed.data.note ? { detail: { note: parsed.data.note } } : {}),
      });
      return app;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    // Approval materialization (Phase 3): accepting a single-arity block
    // materializes its document into the approved registry. The verdict
    // stands either way — failure is recorded loudly on the application
    // (materializationErrors[blockId]) with a retry endpoint, never silent.
    let finalApp = app;
    const acceptedBlock = findBlock(app, blockId);
    if (parsed.data.verdict === "accepted" && acceptedBlock?.arity !== "set") {
      try {
        await materializeApproval(app, blockId);
      } catch (err) {
        console.error(`[approved-docs] materialization failed for ${id}/${blockId}:`, err instanceof Error ? err.message : err);
      }
      // re-read: materialization set or cleared materializationErrors
      finalApp = (await readApplication(id)) ?? app;
    }
    res.json(RecordVerdictResponse.parse(finalApp));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

/**
 * Page renders for the filmstrip review room — proxied from the analyzer
 * worker's run store (the API never grows its own copy of run artifacts).
 * Run artifacts are immutable, so responses cache aggressively.
 */
router.get("/applications/:applicationId/runs/:runId/pages/:page", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  const runId = paramStr(req.params["runId"]);
  if (!isSafeSegment(id) || !isSafeSegment(runId)) {
    res.status(400).json({ error: "Invalid application or run id" });
    return;
  }
  const page = Number.parseInt(paramStr(req.params["page"]) ?? "", 10);
  if (!Number.isFinite(page) || page <= 0) {
    res.status(400).json({ error: "Invalid page number" });
    return;
  }
  const size = req.query["size"] === "strip" ? "strip" : "full";
  const base = process.env["ANALYZER_URL"];
  if (!base) {
    res.status(502).json({ error: "ANALYZER_URL is not configured — analyzer worker unreachable" });
    return;
  }
  let upstream;
  try {
    upstream = await fetch(`${base.replace(/\/$/, "")}/store/${id}/${runId}/pages/${page}?size=${size}`, {
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    res.status(502).json({ error: `Analyzer worker unreachable: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }
  if (upstream.status === 404) {
    res.status(404).json({ error: "No render for this page" });
    return;
  }
  if (!upstream.ok || !upstream.body) {
    res.status(502).json({ error: `Analyzer store answered ${upstream.status}` });
    return;
  }
  res.type("png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  Readable.fromWeb(upstream.body as NodeWebReadableStream).pipe(res);
});

/**
 * Manual filing of analyzer-unassigned page ranges (portal-owned, human-only).
 * "Your assignments win" — a placement outlives analyzer suggestions; the next
 * run sees it as ground truth. A new placement replaces any earlier placement
 * overlapping the same pages (newest human decision wins).
 */
router.post("/applications/:applicationId/placements", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const parsed = RecordPlacementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [first, last] = parsed.data.pages;
  if (
    first === undefined || last === undefined ||
    !Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first
  ) {
    res.status(400).json({ error: "pages must be an inclusive 1-based range [first, last]" });
    return;
  }
  try {
    const app = await updateApplication(id, (app, emit) => {
      if (app.packet?.pages && last > app.packet.pages) {
        throw new HttpError(400, `Page range exceeds the ${app.packet.pages}-page packet`);
      }
      if (parsed.data.target !== "archive") {
        const block = findBlock(app, parsed.data.target);
        if (!block || block.kind !== "document") {
          throw new HttpError(400, 'target must be a document block on this application\'s template, or "archive"');
        }
      }
      const placement: NonNullable<Application["manualPlacements"]>[number] = {
        pages: [first, last],
        target: parsed.data.target,
        decidedBy: parsed.data.decidedBy,
        decidedAt: new Date().toISOString(),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
        ...(parsed.data.runId !== undefined ? { runId: parsed.data.runId } : {}),
      };
      const keep = (app.manualPlacements ?? []).filter(
        (p) => (p.pages[1] ?? 0) < first || (p.pages[0] ?? 0) > last,
      );
      app.manualPlacements = [...keep, placement];
      emit({
        actor: { kind: "user", name: parsed.data.decidedBy, ip: clientIp(req) },
        action: "placement.recorded",
        target: { type: "block", id: parsed.data.target },
        detail: { pages: [first, last] },
      });
      return app;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(RecordPlacementResponse.parse(app));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
