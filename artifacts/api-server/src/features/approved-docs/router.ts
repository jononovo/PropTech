import { Router, type IRouter, type Request } from "express";
import { readApplication } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { isHttpError } from "../../lib/httpError";
import { openApprovedObjectStream } from "../../lib/packetObjectStore";
import { findApprovedDoc, listApprovedDocs } from "./registry";
import { materializeApproval } from "./materialize";

/**
 * Approved-document registry endpoints: list, retry-materialize, download.
 * Writes happen through materializeApproval (also called by the accept
 * verdict in the analysis router) — one seam, two triggers.
 */

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

const router: IRouter = Router();

router.get("/applications/:applicationId/approved-docs", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  res.json(await listApprovedDocs(id!));
});

router.post("/applications/:applicationId/approved-docs/:blockId/materialize", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const blockId = param(req, "blockId");
  if (!isSafeSegment(id) || !isSafeSegment(blockId)) {
    res.status(400).json({ error: "Invalid application or block id" });
    return;
  }
  const app = await readApplication(id!);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  try {
    const doc = await materializeApproval(app, blockId!);
    res.status(201).json(doc);
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.get("/applications/:applicationId/approved-docs/:approvedDocId/file", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const docId = param(req, "approvedDocId");
  if (!isSafeSegment(id) || !isSafeSegment(docId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const kind = req.query["kind"] === "md" ? "md" : "pdf";
  const doc = await findApprovedDoc(id!, docId!);
  if (!doc) {
    res.status(404).json({ error: "Approved document not found" });
    return;
  }
  const stream = await openApprovedObjectStream(id!, doc.basename, kind);
  if (!stream) {
    res.status(404).json({ error: `Approved ${kind} object missing from storage` });
    return;
  }
  res.setHeader("Content-Type", kind === "pdf" ? "application/pdf" : "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename="${doc.basename}.${kind}"`);
  stream.pipe(res);
});

export default router;
