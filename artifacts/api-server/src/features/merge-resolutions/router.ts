import { Router, type IRouter, type Request } from "express";
import { RecordMergeResolutionBody } from "@workspace/api-zod";
import { updateApplication } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { readSidecar } from "../analysis/store";
import { HttpError, isHttpError } from "../../lib/httpError";
import { mergeResolutionKey } from "./mergeKey";

/**
 * Merge-resolution endpoint — the human decision (merged | dismissed) on an
 * analyzer merge recommendation. Upsert: latest decision wins, so a dismissal
 * can be revisited. A PENDING recommendation (no entry) gates approval of both
 * groups client-side; this record is what makes the gate survive a refresh.
 */

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

const router: IRouter = Router();

router.post("/applications/:applicationId/merge-resolutions", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const parsed = RecordMergeResolutionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const ranges = body.ranges as [number, number][];
  for (const [f, l] of ranges) {
    if (!Number.isInteger(f) || !Number.isInteger(l) || f < 1 || l < f) {
      res.status(400).json({ error: "Each range must be an ascending 1-based [first,last]" });
      return;
    }
  }
  if (ranges[0]![0] === ranges[1]![0]) {
    res.status(400).json({ error: "The two ranges must be distinct" });
    return;
  }
  // the run must exist on this application — resolutions never dangle
  const sidecar = await readSidecar(id!);
  if (!sidecar.runs.some((r) => r.runId === body.runId)) {
    res.status(400).json({ error: `Run ${body.runId} not found on this application` });
    return;
  }
  try {
    const app = await updateApplication(id!, (app) => {
      const key = mergeResolutionKey(body.runId, ranges);
      app.mergeResolutions = {
        ...(app.mergeResolutions ?? {}),
        [key]: {
          runId: body.runId,
          ranges,
          decision: body.decision,
          decidedBy: body.decidedBy,
          decidedAt: new Date().toISOString(),
        },
      };
      return app;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(app);
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
