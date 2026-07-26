import type { Readable } from "node:stream";
import type { z } from "zod";
import express, { Router, type IRouter } from "express";
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
import { writeRunSidecars, writeRunElements } from "./runSidecars";
import { appendEvent } from "../ledger/store";
import { clientIp } from "../../lib/clientIp";
import { materializeApproval } from "../approved-docs/materialize";
import { putFileRender, openFileRenderStream, type RenderKind } from "../../lib/packetObjectStore";

const router: IRouter = Router();

function paramStr(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

type AnalysisRun = z.infer<typeof IngestAnalysisRunBody>;

/**
 * Delta-run union — the "latest run = whole truth" invariant. A delta run
 * analyzes only files not covered by the previous run; at ingest we union the
 * previous run's results for untouched files into the new blob, so every read
 * path (review, triage, qa-agent, sidecars) keeps consuming ONLY the latest
 * run with zero changes. Files are immutable, so carrying results forward is
 * always sound.
 */
function unionWithPrevious(prev: AnalysisRun | undefined, next: AnalysisRun): AnalysisRun {
  if (!prev) return next;
  const nextIds = new Set(next.input.map((f) => f.fileId));
  const carriedInput = prev.input.filter((f) => !nextIds.has(f.fileId));
  if (carriedInput.length === 0) return next; // full re-run — nothing to carry
  const carriedIds = new Set(carriedInput.map((f) => f.fileId));
  const input = [...carriedInput, ...next.input]; // receipt order: covered files first
  return {
    ...next,
    input,
    documents: [
      ...prev.documents.filter((d) => d.spans.every((s) => carriedIds.has(s.fileId))),
      ...next.documents,
    ],
    unassigned: [
      ...prev.unassigned.filter((u) => carriedIds.has(u.span.fileId)),
      ...next.unassigned,
    ],
    preflight: {
      pages: input.reduce((n, f) => n + f.pages, 0),
      flags: [
        ...prev.preflight.flags.filter((f) => f.fileId !== undefined && carriedIds.has(f.fileId)),
        ...next.preflight.flags,
      ],
      gate: next.preflight.gate,
    },
    // Satisfaction is a per-block read over that run's OWN documents, so a
    // delta run's entry for a block that also has carried documents is
    // partial-context — omit those (absent is a legal state) instead of
    // letting either partial view masquerade as the whole truth.
    ...(prev.satisfaction || next.satisfaction
      ? {
          satisfaction: (() => {
            const carriedBlocks = new Set(
              prev.documents
                .filter((d) => d.spans.every((s) => carriedIds.has(s.fileId)))
                .map((d) => d.suggestedBlockId),
            );
            const newBlocks = new Set(next.documents.map((d) => d.suggestedBlockId));
            const merged: NonNullable<AnalysisRun["satisfaction"]> = {};
            for (const [blockId, s] of Object.entries(prev.satisfaction ?? {})) {
              if (!newBlocks.has(blockId)) merged[blockId] = s;
            }
            for (const [blockId, s] of Object.entries(next.satisfaction ?? {})) {
              if (!carriedBlocks.has(blockId)) merged[blockId] = s;
            }
            return merged;
          })(),
        }
      : {}),
    ...(prev.artifactsProduced || next.artifactsProduced
      ? {
          artifactsProduced: {
            md: (prev.artifactsProduced?.md ?? true) && (next.artifactsProduced?.md ?? true),
            elements:
              (prev.artifactsProduced?.elements ?? false) || (next.artifactsProduced?.elements ?? false),
            crops: (prev.artifactsProduced?.crops ?? false) || (next.artifactsProduced?.crops ?? false),
          },
        }
      : {}),
  };
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
  // INVARIANT (file-native runs): every span must address a file in the run's
  // declared input set, within that file's page count. The run body carries its
  // own input (frozen at kick); cross-check against the registry for page counts.
  const inputIds = new Set(parsed.data.input.map((f) => f.fileId));
  const allSpans = [
    ...parsed.data.documents.flatMap((d) => d.spans),
    ...parsed.data.unassigned.map((u) => u.span),
  ];
  for (const span of allSpans) {
    if (!inputIds.has(span.fileId)) {
      res.status(400).json({ error: `span addresses ${span.fileId}, which is not in the run's input set` });
      return;
    }
    const sf = (app.files ?? []).find((f) => f.id === span.fileId);
    const [f, l] = span.pages as [number, number];
    if (!Number.isInteger(f) || !Number.isInteger(l) || f < 1 || l < f || (sf?.pages !== undefined && l > sf.pages)) {
      res.status(400).json({ error: `span ${span.fileId}:p${f}-${l} is not a valid range within the file` });
      return;
    }
  }
  // Union delta runs at ingest — the persisted blob is always the whole truth.
  const previous = (await readSidecar(id)).runs.at(-1);
  const run = unionWithPrevious(previous, parsed.data);
  const result = await appendRun(id, run);
  if (result === "duplicate") {
    res.status(409).json({ error: `runId "${run.runId}" already ingested` });
    return;
  }
  // Asynchronous completion of the packet choreography: a landed run flips the
  // packet processing→report and clears lastRunError. State-guarded — uploads
  // are 409-blocked during processing, so the processing packet IS this run's.
  await appendEvent({
    applicationId: id,
    actor: { kind: "system" },
    action: "run.ingested",
    target: { type: "run", id: run.runId },
    detail: { documents: run.documents.length },
  });
  // Markdown projections into App Storage (intelligence corpus). Regenerable,
  // so a failure is loud (ledger) but never fails the ingest.
  try {
    await writeRunSidecars(id, app.storageFolder, run);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[analysis] run sidecar write failed for ${id}/${run.runId}: ${message}`);
    await appendEvent({
      applicationId: id,
      actor: { kind: "system" },
      action: "run.sidecars_failed",
      target: { type: "run", id: run.runId },
      detail: { message },
    });
  }
  // Citation-geometry projection (elements/pN.json per input page) — durable
  // bbox source for Q&A agent citations. Same regenerable semantics: loud
  // ledger event on failure, never fails the ingest.
  try {
    await writeRunElements(id, app.storageFolder, run);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[analysis] run elements write failed for ${id}/${run.runId}: ${message}`);
    await appendEvent({
      applicationId: id,
      actor: { kind: "system" },
      action: "run.elements_failed",
      target: { type: "run", id: run.runId },
      detail: { message },
    });
  }
  await updateApplication(id, (app) => {
    // requestId correlation (stale-worker guard): only the kick this run
    // answers may flip processing→report — a late run from a superseded kick
    // still persists (append-only) but never clobbers a newer run's state.
    if (app.run?.state === "processing" && (run.requestId === undefined || app.run.requestId === run.requestId)) {
      const next: NonNullable<Application["run"]> = { ...app.run, state: "report" };
      delete next.lastRunError;
      app.run = next;
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
 * Page renders for the filmstrip review room — served straight from object
 * storage, collocated with the file's bytes (files/<fileId>/pages|thumbnails).
 * The analyzer uploads them as it renders; its disk is scratch. Files are
 * immutable, so a render never changes — responses cache forever.
 */
router.get("/applications/:applicationId/files/:fileId/pages/:page", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  const fileId = paramStr(req.params["fileId"]);
  if (!isSafeSegment(id) || !isSafeSegment(fileId)) {
    res.status(400).json({ error: "Invalid application or file id" });
    return;
  }
  const page = Number.parseInt(paramStr(req.params["page"]) ?? "", 10);
  if (!Number.isFinite(page) || page <= 0) {
    res.status(400).json({ error: "Invalid page number" });
    return;
  }
  const kind: RenderKind = req.query["size"] === "thumb" ? "thumbnails" : "pages";
  const app = await readApplication(id!);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const stream = await openFileRenderStream(app.storageFolder, fileId!, kind, page);
  if (!stream) {
    res.status(404).json({ error: "No render for this page" });
    return;
  }
  res.type("png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  (stream as Readable).pipe(res);
});

/**
 * Render upload — the analyzer worker pushes each page's full render and
 * thumbnail here the moment it renders them (single storage flow: object
 * storage is the only durable home; the worker's disk is scratch).
 */
router.put(
  "/applications/:applicationId/files/:fileId/renders/:page",
  express.raw({ type: "image/png", limit: "50mb" }),
  async (req, res): Promise<void> => {
    const id = paramStr(req.params["applicationId"]);
    const fileId = paramStr(req.params["fileId"]);
    if (!isSafeSegment(id) || !isSafeSegment(fileId)) {
      res.status(400).json({ error: "Invalid application or file id" });
      return;
    }
    const page = Number.parseInt(paramStr(req.params["page"]) ?? "", 10);
    const kind = req.query["kind"];
    if (!Number.isFinite(page) || page <= 0 || (kind !== "pages" && kind !== "thumbnails")) {
      res.status(400).json({ error: "Invalid page or kind (pages|thumbnails)" });
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: "Empty body — send the PNG bytes as image/png" });
      return;
    }
    const app = await readApplication(id!);
    const sf = (app?.files ?? []).find((f) => f.id === fileId);
    if (!app || !sf) {
      res.status(404).json({ error: "No such file" });
      return;
    }
    if (sf.pages !== undefined && page > sf.pages) {
      res.status(400).json({ error: `Page ${page} exceeds ${sf.filename}'s ${sf.pages} pages` });
      return;
    }
    await putFileRender(app.storageFolder, fileId!, kind, page, req.body);
    res.json({ stored: true });
  },
);

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
  const span = parsed.data.span;
  const [first, last] = span.pages;
  if (
    first === undefined || last === undefined ||
    !Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first
  ) {
    res.status(400).json({ error: "span.pages must be an inclusive 1-based range [first, last]" });
    return;
  }
  try {
    const app = await updateApplication(id, (app, emit) => {
      const sf = (app.files ?? []).find((f) => f.id === span.fileId);
      if (!sf) throw new HttpError(400, `span addresses unknown file ${span.fileId}`);
      if (sf.pages !== undefined && last > sf.pages) {
        throw new HttpError(400, `Span exceeds the ${sf.pages}-page file ${sf.filename}`);
      }
      if (parsed.data.target !== "archive") {
        const block = findBlock(app, parsed.data.target);
        if (!block || block.kind !== "document") {
          throw new HttpError(400, 'target must be a document block on this application\'s template, or "archive"');
        }
      }
      const placement: NonNullable<Application["manualPlacements"]>[number] = {
        span: { fileId: span.fileId, pages: [first, last] },
        target: parsed.data.target,
        decidedBy: parsed.data.decidedBy,
        decidedAt: new Date().toISOString(),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
        ...(parsed.data.runId !== undefined ? { runId: parsed.data.runId } : {}),
      };
      // newest human decision wins — drop earlier placements overlapping the same file span
      const keep = (app.manualPlacements ?? []).filter(
        (p) => p.span.fileId !== span.fileId || (p.span.pages[1] ?? 0) < first || (p.span.pages[0] ?? 0) > last,
      );
      app.manualPlacements = [...keep, placement];
      emit({
        actor: { kind: "user", name: parsed.data.decidedBy, ip: clientIp(req) },
        action: "placement.recorded",
        target: { type: "block", id: parsed.data.target },
        detail: { span: { fileId: span.fileId, pages: [first, last] } },
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
