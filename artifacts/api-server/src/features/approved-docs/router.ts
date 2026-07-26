import { Router, type IRouter, type Request } from "express";
import { nanoid } from "nanoid";
import { RecordDocumentApprovalBody, type DocumentApproval } from "@workspace/api-zod";
import { readApplication, updateApplication } from "../intake/store";
import { findBlock, isSafeSegment } from "../intake/blocks";
import { HttpError, isHttpError } from "../../lib/httpError";
import { clientIp } from "../../lib/clientIp";
import { openApprovedObjectStream } from "../../lib/packetObjectStore";
import { findApprovedDoc, listApprovedDocs } from "./registry";
import { materializeApproval, materializeDocumentApproval } from "./materialize";

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

router.post("/applications/:applicationId/document-approvals", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  if (!isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const parsed = RecordDocumentApprovalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const approval: DocumentApproval = {
    id: `da-${nanoid(10)}`,
    blockId: body.blockId,
    ...(body.variantId ? { variantId: body.variantId } : {}),
    runId: body.runId,
    spans: body.spans,
    ...(body.pageDecisions ? { pageDecisions: body.pageDecisions } : {}),
    outcome: body.outcome,
    decidedBy: body.decidedBy,
    decidedAt: new Date().toISOString(),
  };
  try {
    const app = await updateApplication(id!, (app, emit) => {
      const block = findBlock(app, body.blockId);
      if (!block || block.kind !== "document") {
        throw new HttpError(400, "Block is not a document block on this application's template");
      }
      if (block.arity === "set") {
        if (!body.variantId) throw new HttpError(409, "Set blocks file per variant — variantId is required");
        const variant = (app.variants?.[body.blockId] ?? []).find((v) => v.id === body.variantId);
        if (!variant) throw new HttpError(409, "Unknown variant for this block");
      } else if (body.variantId) {
        throw new HttpError(409, "variantId only applies to set blocks");
      }
      // spans: each a valid in-file range; per file ascending and non-overlapping
      const prevByFile = new Map<string, number>();
      for (const s of approval.spans) {
        const [f, l] = s.pages;
        if (f === undefined || l === undefined || !Number.isInteger(f) || !Number.isInteger(l) || f < 1 || l < f) {
          throw new HttpError(400, "each span must carry an ascending 1-based [first,last]");
        }
        const sf = (app.files ?? []).find((file) => file.id === s.fileId);
        if (!sf) throw new HttpError(400, `span addresses unknown file ${s.fileId}`);
        if (sf.pages !== undefined && l > sf.pages) {
          throw new HttpError(400, `span exceeds the ${sf.pages}-page file ${sf.filename}`);
        }
        const prev = prevByFile.get(s.fileId) ?? 0;
        if (f <= prev) throw new HttpError(400, "spans within a file must be ascending and non-overlapping");
        prevByFile.set(s.fileId, l);
      }
      // append-only decision trail, newest first
      app.documentApprovals = [approval, ...(app.documentApprovals ?? [])];
      emit({
        actor: { kind: "user", name: body.decidedBy, ip: clientIp(req) },
        action: `document.${approval.outcome}`,
        target: { type: "block", id: body.blockId, label: block.name },
        detail: {
          spans: approval.spans,
          ...(body.variantId ? { variantId: body.variantId } : {}),
          runId: body.runId,
        },
      });
      return app;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    let finalApp = app;
    if (approval.outcome !== "rejected") {
      // Same posture as block accepts: the decision stands even if
      // materialization fails — failure lands loudly on materializationErrors.
      try {
        const row = await materializeDocumentApproval(app, {
          ...approval,
          outcome: approval.outcome as "approved" | "approved_incomplete",
        });
        await updateApplication(id!, (a) => {
          a.documentApprovals = (a.documentApprovals ?? []).map((d) =>
            d.id === approval.id ? { ...d, approvedDocId: row.id } : d,
          );
          return a;
        });
      } catch (err) {
        console.error(`[approved-docs] document materialization failed for ${id}/${body.blockId}:`, err instanceof Error ? err.message : err);
      }
      finalApp = (await readApplication(id!)) ?? app;
    }
    res.json(finalApp);
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
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
  const owner = await readApplication(id!);
  if (!owner) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const stream = await openApprovedObjectStream(owner.storageFolder, doc.basename, kind);
  if (!stream) {
    res.status(404).json({ error: `Approved ${kind} object missing from storage` });
    return;
  }
  res.setHeader("Content-Type", kind === "pdf" ? "application/pdf" : "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename="${doc.basename}.${kind}"`);
  stream.pipe(res);
});

export default router;
