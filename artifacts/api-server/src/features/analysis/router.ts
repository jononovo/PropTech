import { Router, type IRouter } from "express";
import {
  GetAnalysisResponse,
  IngestAnalysisRunBody,
  IngestAnalysisRunResponse,
  RecordVerdictBody,
  RecordVerdictResponse,
} from "@workspace/api-zod";
import { readApplication, writeApplication, type Application } from "../intake/store";
import { findBlock, isSafeSegment } from "../intake/blocks";
import { appendRun, readSidecar } from "./store";

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
  const app = readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(GetAnalysisResponse.parse(readSidecar(id)));
});

router.post("/applications/:applicationId/analysis", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = readApplication(id);
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
  for (const doc of parsed.data.documents) {
    const block = findBlock(app, doc.suggestedBlockId);
    if (!block || block.kind !== "document") {
      res.status(400).json({
        error: `suggestedBlockId "${doc.suggestedBlockId}" does not resolve to a document block on this application's pinned template`,
      });
      return;
    }
  }
  const result = appendRun(id, parsed.data);
  if (result === "duplicate") {
    res.status(409).json({ error: `runId "${parsed.data.runId}" already ingested` });
    return;
  }
  res.status(201).json(IngestAnalysisRunResponse.parse(result));
});

router.put("/applications/:applicationId/verdicts/:blockId", async (req, res): Promise<void> => {
  const id = paramStr(req.params["applicationId"]);
  const blockId = paramStr(req.params["blockId"]);
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
  const parsed = RecordVerdictBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
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
  writeApplication(app);
  res.json(RecordVerdictResponse.parse(app));
});

export default router;
