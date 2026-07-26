import { Router, type IRouter } from "express";
import { ListApplicationEventsResponse } from "@workspace/api-zod";
import { isSafeSegment } from "../intake/blocks";
import { readApplication } from "../intake/store";
import { listEvents } from "./store";

/** Read side of the ledger: newest-first rows for one application. */
const router: IRouter = Router();

router.get("/applications/:applicationId/events", async (req, res): Promise<void> => {
  const raw = req.params["applicationId"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = await readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const rows = await listEvents(id);
  res.json(
    ListApplicationEventsResponse.parse(
      rows.map((r) => ({
        seq: r.seq,
        at: r.at.toISOString(),
        actor: r.actor,
        action: r.action,
        ...(r.target ? { target: r.target } : {}),
        ...(r.detail ? { detail: r.detail } : {}),
      })),
    ),
  );
});

export default router;
