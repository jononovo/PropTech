import { nanoid } from "nanoid";
import { PDFDocument } from "pdf-lib";
import type { Readable } from "node:stream";
import { updateApplication, type Application } from "../intake/store";
import { findBlock } from "../intake/blocks";
import { readSidecar } from "../analysis/store";
import { openSourceFileStream, putApprovedObject } from "../../lib/packetObjectStore";
import { storageExt } from "../files/receive";
import { HttpError } from "../../lib/httpError";
import { buildSidecarMarkdown } from "./frontmatter";
import { insertApprovedDoc, liveBasenames, type ApprovedDoc } from "./registry";

/**
 * Approval materialization — the ONE seam both triggers share:
 *   - accept verdict on a single-arity block (analysis router calls this)
 *   - the per-document approval flow for set blocks (filmstrip roll-up)
 *
 * Physical extraction happens at approval ONLY (user ruling). File-native:
 * spans are extracted straight from the immutable SourceFile registry bytes —
 * there is no packet blob. Source priority:
 *   1. analyzer-assigned document in the accepted run → extract its FileSpans,
 *      pull per-(file,page) markdown from the worker
 *   2. direct intake upload (newest) → copy bytes whole (PDF only in v1)
 * Anything else fails loudly — a 409 up front, or a 502 recorded on the
 * application as materializationErrors[blockId] (verdict stands, retry clears).
 */

type FileSpan = { fileId: string; pages: [number, number] };

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "doc";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function fetchPageMarkdown(applicationId: string, runId: string, fileId: string, page: number): Promise<string> {
  const base = process.env["ANALYZER_URL"];
  if (!base) throw new HttpError(502, "ANALYZER_URL is not configured — analyzer worker unreachable");
  const res = await fetch(`${base.replace(/\/$/, "")}/store/${applicationId}/${runId}/files/${fileId}/md/${page}`).catch((err) => {
    throw new HttpError(502, `Analyzer worker unreachable: ${err instanceof Error ? err.message : String(err)}`);
  });
  if (!res.ok) throw new HttpError(502, `Analyzer store answered ${res.status} for ${fileId} p.${page} markdown`);
  return res.text();
}

/** Flatten spans into an ordered (fileId, in-file page) list. */
function spanPages(spans: FileSpan[]): { fileId: string; page: number }[] {
  return spans.flatMap((s) =>
    Array.from({ length: s.pages[1] - s.pages[0] + 1 }, (_, i) => ({ fileId: s.fileId, page: s.pages[0] + i })),
  );
}

function normalizeSpans(spans: { fileId: string; pages: number[] }[]): FileSpan[] {
  return spans.map((s) => {
    const [f, l] = s.pages;
    if (f === undefined || l === undefined || !Number.isInteger(f) || !Number.isInteger(l) || f < 1 || l < f) {
      throw new HttpError(502, `Invalid span for ${s.fileId}: [${s.pages.join(", ")}]`);
    }
    return { fileId: s.fileId, pages: [f, l] as [number, number] };
  });
}

/** Extract the spans' pages, in order, from the SourceFile registry bytes into one PDF. */
async function extractSpans(app: Application, spans: FileSpan[]): Promise<Buffer> {
  const loaded = new Map<string, PDFDocument>();
  const out = await PDFDocument.create();
  for (const span of spans) {
    let src = loaded.get(span.fileId);
    if (!src) {
      const sf = (app.files ?? []).find((f) => f.id === span.fileId);
      if (!sf) throw new HttpError(502, `Span addresses ${span.fileId}, which is not in the file registry`);
      const stream = await openSourceFileStream(app.id, sf.id, storageExt(sf));
      if (!stream) throw new HttpError(502, `File ${sf.filename} (${sf.id}) missing from storage`);
      src = await PDFDocument.load(await streamToBuffer(stream));
      loaded.set(span.fileId, src);
    }
    const [first, last] = span.pages;
    if (last > src.getPageCount()) {
      throw new HttpError(502, `File ${span.fileId} has ${src.getPageCount()} pages — cannot extract p.${last}`);
    }
    const indices = Array.from({ length: last - first + 1 }, (_, i) => first - 1 + i);
    const pages = await out.copyPages(src, indices);
    for (const p of pages) out.addPage(p);
  }
  return Buffer.from(await out.save());
}

/** Record or clear the block's loud materialization error on the application. */
async function setMaterializationError(applicationId: string, blockId: string, message: string | null): Promise<void> {
  await updateApplication(applicationId, (app) => {
    const errors = { ...(app.materializationErrors ?? {}) };
    if (message === null) delete errors[blockId];
    else errors[blockId] = { message, at: new Date().toISOString() };
    if (Object.keys(errors).length === 0) delete app.materializationErrors;
    else app.materializationErrors = errors;
    return app;
  });
}

/**
 * Materialize the accepted document for a block. Throws HttpError(409) for
 * precondition failures (nothing recorded on the app) and HttpError(502) for
 * mid-flight failures (recorded as materializationErrors before rethrowing).
 */
export async function materializeApproval(app: Application, blockId: string): Promise<ApprovedDoc> {
  const block = findBlock(app, blockId);
  if (!block || block.kind !== "document") throw new HttpError(409, "Block is not a document block on this application's template");
  if (block.arity === "set") {
    throw new HttpError(409, "Set blocks are approved per document via the document approval flow — block-level materialization applies to single blocks only");
  }
  const verdict = app.verdicts?.[blockId];
  if (verdict?.verdict !== "accepted") throw new HttpError(409, "Block has no accepted verdict — nothing to materialize");

  // Source 1: analyzer-assigned document in the accepted (or latest) run
  const sidecar = await readSidecar(app.id);
  const run = verdict.runId
    ? sidecar.runs.find((r) => r.runId === verdict.runId)
    : sidecar.runs.find((r) => r.runId === sidecar.latestRunId);
  const runDoc = run?.documents.find((d) => d.suggestedBlockId === blockId);
  // Source 2: newest direct intake upload
  const upload = [...(app.uploads[blockId] ?? [])].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  if (!runDoc && !upload) throw new HttpError(409, "Nothing on file for this block — no analyzer assignment and no intake upload");

  const approvedAt = new Date().toISOString();
  const approvedBy = verdict.decidedBy;
  const id = `ad-${nanoid(10)}`;

  try {
    const taken = await liveBasenames(app.id);
    // Only real dates make it into the basename — "unknown"/"undated" analyzer
    // values fall back to the approval date.
    const rawDate = (verdict.documentDate ?? runDoc?.coreFields?.["document_date"]) as string | undefined;
    const dateBit = rawDate && /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : approvedAt.slice(0, 10);
    let basename = `${slug(blockId)}_${slug(String(dateBit))}`;
    for (let seq = 0; taken.has(basename); seq++) basename = `${slug(blockId)}_${slug(String(dateBit))}_${String.fromCharCode(98 + seq)}`;

    let doc: ApprovedDoc;
    let pdfBytes: Buffer;
    let pageMarkdown: string[] = [];

    if (runDoc && run) {
      const spans = normalizeSpans(runDoc.spans);
      pdfBytes = await extractSpans(app, spans);
      pageMarkdown = await Promise.all(
        spanPages(spans).map((p) => fetchPageMarkdown(app.id, run.runId, p.fileId, p.page)),
      );
      doc = {
        id, applicationId: app.id, blockId, basename, source: "extract",
        spans, runId: run.runId,
        approvedBy, approvedAt,
      };
    } else {
      if (!upload!.filename.toLowerCase().endsWith(".pdf")) {
        throw new HttpError(502, `Only PDF uploads can be materialized (got ${upload!.filename}) — upload a PDF version instead`);
      }
      const sf = (app.files ?? []).find((f) => f.id === upload!.fileId);
      if (!sf) throw new HttpError(502, `Upload ${upload!.filename} has no SourceFile registry entry`);
      const uploadStream = await openSourceFileStream(app.id, sf.id, storageExt(sf));
      if (!uploadStream) throw new HttpError(502, `Upload ${upload!.filename} missing from storage`);
      pdfBytes = await streamToBuffer(uploadStream);
      doc = {
        id, applicationId: app.id, blockId, basename, source: "copy",
        sourceFilename: upload!.filename, approvedBy, approvedAt,
      };
    }

    const md = buildSidecarMarkdown({
      doc,
      blockName: block.name,
      suggestedName: runDoc?.suggestedName,
      scores: runDoc?.scores as Record<string, unknown> | undefined,
      flags: runDoc?.flags,
      coreFields: runDoc?.coreFields as Record<string, unknown> | undefined,
      pageMarkdown,
    });

    // Bytes first, registry row second — an orphaned object is harmless,
    // a registry row without bytes is not.
    await putApprovedObject(app.id, basename, "pdf", pdfBytes);
    await putApprovedObject(app.id, basename, "md", Buffer.from(md, "utf8"));
    await insertApprovedDoc(doc);
    await setMaterializationError(app.id, blockId, null);
    return doc;
  } catch (err) {
    const message = err instanceof HttpError ? err.message : `Materialization failed: ${err instanceof Error ? err.message : String(err)}`;
    await setMaterializationError(app.id, blockId, message).catch(() => undefined);
    throw err instanceof HttpError ? err : new HttpError(502, message);
  }
}

/**
 * Materialize ONE document from the per-document approval flow — explicit
 * source (runId + spans), no verdict lookup. Same registry + object store
 * seam as block accepts; supersede is scoped to the SAME spans so sibling
 * documents in a set-block variant stay live.
 */
export async function materializeDocumentApproval(
  app: Application,
  approval: {
    id: string;
    blockId: string;
    variantId?: string;
    runId: string;
    spans: { fileId: string; pages: number[] }[];
    outcome: "approved" | "approved_incomplete";
    pageDecisions?: { fileId: string; page: number; decision: string; note?: string }[];
    decidedBy: string;
    decidedAt: string;
  },
): Promise<ApprovedDoc> {
  const { blockId } = approval;
  const block = findBlock(app, blockId);
  if (!block || block.kind !== "document") throw new HttpError(409, "Block is not a document block on this application's template");

  try {
    const sidecar = await readSidecar(app.id);
    const run = sidecar.runs.find((r) => r.runId === approval.runId);
    if (!run) throw new HttpError(502, `Run ${approval.runId} not found on this application`);
    const spans = normalizeSpans(approval.spans);
    // the analyzer's document matching the FIRST span, if any — scores/flags provenance
    const first = spans[0]!;
    const runDoc = run.documents.find(
      (d) => d.spans[0]?.fileId === first.fileId && d.spans[0]?.pages[0] === first.pages[0] && d.spans[0]?.pages[1] === first.pages[1],
    );

    const taken = await liveBasenames(app.id);
    const rawDate = runDoc?.coreFields?.["document_date"] as string | undefined;
    const dateBit = rawDate && /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : approval.decidedAt.slice(0, 10);
    let basename = `${slug(blockId)}_${slug(String(dateBit))}`;
    for (let seq = 0; taken.has(basename); seq++) basename = `${slug(blockId)}_${slug(String(dateBit))}_${String.fromCharCode(98 + seq)}`;

    const pdfBytes = await extractSpans(app, spans);
    const pageMarkdown = await Promise.all(
      spanPages(spans).map((p) => fetchPageMarkdown(app.id, run.runId, p.fileId, p.page)),
    );

    const doc: ApprovedDoc = {
      id: `ad-${nanoid(10)}`,
      applicationId: app.id, blockId, basename, source: "extract",
      spans, runId: run.runId,
      ...(approval.variantId ? { variantId: approval.variantId } : {}),
      approvedBy: approval.decidedBy, approvedAt: approval.decidedAt,
    };

    const variantLabel = approval.variantId
      ? (app.variants?.[blockId] ?? []).find((v) => v.id === approval.variantId)?.label
      : undefined;
    const md = buildSidecarMarkdown({
      doc,
      blockName: block.name,
      suggestedName: runDoc?.suggestedName,
      scores: runDoc?.scores as Record<string, unknown> | undefined,
      flags: runDoc?.flags,
      coreFields: runDoc?.coreFields as Record<string, unknown> | undefined,
      ...(variantLabel ? { variantLabel } : {}),
      approval: {
        outcome: approval.outcome,
        ...(approval.pageDecisions ? { pageDecisions: approval.pageDecisions } : {}),
      },
      pageMarkdown,
    });

    await putApprovedObject(app.id, basename, "pdf", pdfBytes);
    await putApprovedObject(app.id, basename, "md", Buffer.from(md, "utf8"));
    await insertApprovedDoc(doc, { matchSpans: spans });
    await setMaterializationError(app.id, blockId, null);
    return doc;
  } catch (err) {
    const message = err instanceof HttpError ? err.message : `Materialization failed: ${err instanceof Error ? err.message : String(err)}`;
    await setMaterializationError(app.id, blockId, message).catch(() => undefined);
    throw err instanceof HttpError ? err : new HttpError(502, message);
  }
}
