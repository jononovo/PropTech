import type { AnalysisDocument, FileSpan, RunInputFile } from '@workspace/api-client-react';
import {
  actionableFlags,
  flagLabel,
  flagSeverity,
  type CaseModel,
  type CaseReq,
  type Severity,
} from '../caseData';

/**
 * Pure view-model for the filmstrip review room. File-native: the run's input
 * is an ordered set of files; the UI walks ONE global page sequence (reading
 * order = input order, pages in order per file). The page index maps global
 * page numbers ↔ (fileId, in-file page) — spans are the canonical address,
 * global numbers are a view concern only. No React, no fetching.
 */

// ─── page index — global sequence over the run's input set ──────────────────

export interface RunPage {
  /** 1-based global page number in reading order */
  n: number;
  fileId: string;
  /** 1-based page within the file */
  page: number;
  filename: string;
}

export interface PageIndex {
  total: number;
  pages: RunPage[];
  at(n: number): RunPage | undefined;
  /** global [first,last] of a span; null when the span's file isn't in the run input */
  globalRange(span: FileSpan): [number, number] | null;
  /** global envelope over a document's spans */
  globalEnvelope(spans: FileSpan[]): [number, number] | null;
}

export function buildPageIndex(input: RunInputFile[]): PageIndex {
  const pages: RunPage[] = [];
  const offset = new Map<string, number>(); // fileId -> global number of its p.1, minus 1
  for (const f of input) {
    offset.set(f.fileId, pages.length);
    for (let p = 1; p <= f.pages; p++) {
      pages.push({ n: pages.length + 1, fileId: f.fileId, page: p, filename: f.filename });
    }
  }
  const globalRange = (span: FileSpan): [number, number] | null => {
    const off = offset.get(span.fileId);
    if (off === undefined) return null;
    return [off + (span.pages[0] ?? 1), off + (span.pages[1] ?? span.pages[0] ?? 1)];
  };
  return {
    total: pages.length,
    pages,
    at: (n) => pages[n - 1],
    globalRange,
    globalEnvelope: (spans) => {
      const ranges = spans.map(globalRange).filter((r): r is [number, number] => r !== null);
      if (ranges.length === 0) return null;
      return [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))];
    },
  };
}

/** every global page of a set of spans, in reading order */
export const spanPageList = (index: PageIndex, spans: FileSpan[]): number[] => {
  const out: number[] = [];
  for (const s of spans) {
    const r = index.globalRange(s);
    if (!r) continue;
    for (let p = r[0]; p <= r[1]; p++) out.push(p);
  }
  return out.sort((a, b) => a - b);
};

export type StopBand = 'hold' | 'attend';
export type CellBand = StopBand | 'clean';

export interface StopCallout {
  label: string;
  detail?: string;
  severity: Severity;
}

export interface ReviewStop {
  id: string;
  kind: 'document' | 'unassigned';
  /** inclusive 1-based GLOBAL page range (envelope over spans) */
  pages: [number, number];
  /** anchor page shown when the stop is selected */
  page: number;
  title: string;
  band: StopBand;
  /** verdict recorded — the stop stays in the strip with a tick */
  resolved: boolean;
  callouts: StopCallout[];
  req?: CaseReq;
  doc?: AnalysisDocument;
  description?: string;
  /** unassigned stops — the canonical file-qualified address (placements need it) */
  span?: FileSpan;
}

export interface PageCell {
  /** global page number */
  page: number;
  title: string;
  band: CellBand;
  stopId?: string;
  resolved: boolean;
}

export interface ReviewModel {
  totalPages: number;
  index: PageIndex;
  stops: ReviewStop[];
  /** one cell per global page, 1..totalPages */
  cells: PageCell[];
  openCount: number;
}

export function buildReviewModel(model: CaseModel): ReviewModel | null {
  const run = model.run;
  if (!run) return null;
  const index = buildPageIndex(run.input);

  const stops: ReviewStop[] = [];

  for (const req of model.reqs) {
    const doc = req.doc;
    if (!doc) continue;
    const flags = actionableFlags(doc);
    const fs = doc.scores.fraud_signal; // undefined = not scored this run (plan toggle off)
    const fraudHigh = fs != null && fs >= 0.3;
    if (flags.length === 0 && !fraudHigh) continue;

    const callouts: StopCallout[] = flags.map((f) => ({
      label: flagLabel(f.code),
      detail: f.detail,
      severity: flagSeverity(f.code),
    }));
    if (fraudHigh && !doc.flags.some((f) => f.code.includes('fraud'))) {
      callouts.push({
        label: 'Fraud signal',
        detail: `Model fraud signal at ${Math.round(fs * 100)}% — review before accepting.`,
        severity: 'clay',
      });
    }
    const env = index.globalEnvelope(doc.spans);
    if (!env) continue;
    stops.push({
      id: `doc-${req.block.id}`,
      kind: 'document',
      pages: env,
      page: env[0],
      title: req.block.name,
      band: callouts.some((c) => c.severity === 'clay') ? 'hold' : 'attend',
      resolved: !!req.verdict,
      callouts,
      req,
      doc,
    });
  }

  for (const u of model.unassignedOpen) {
    const r = index.globalRange(u.span);
    if (!r) continue;
    stops.push({
      id: `un-${u.span.fileId}-${r[0]}-${r[1]}`,
      kind: 'unassigned',
      pages: r,
      page: r[0],
      title: 'Unassigned pages',
      band: 'attend',
      resolved: false,
      callouts: [{ label: 'No home on the checklist', detail: u.description, severity: 'amber' }],
      description: u.description,
      span: u.span,
    });
  }

  stops.sort((x, y) => x.page - y.page);

  const inRange = (p: number, r: [number, number] | null) => !!r && p >= r[0] && p <= r[1];
  const cells: PageCell[] = [];
  for (let p = 1; p <= index.total; p++) {
    const stop = stops.find((s) => p >= s.pages[0] && p <= s.pages[1]);
    if (stop) {
      cells.push({ page: p, title: stop.title, band: stop.band, stopId: stop.id, resolved: stop.resolved });
      continue;
    }
    const req = model.reqs.find(
      (r) => r.doc && r.doc.spans.some((s) => inRange(p, index.globalRange(s))),
    );
    if (req) {
      cells.push({ page: p, title: req.block.name, band: 'clean', resolved: req.status === 'accepted' });
      continue;
    }
    const placement = model.placements.find((pl) => inRange(p, index.globalRange(pl.span)));
    if (placement) {
      const title =
        placement.target === 'archive'
          ? 'Archived'
          : (model.reqs.find((r) => r.block.id === placement.target)?.block.name ?? 'Filed manually');
      cells.push({ page: p, title, band: 'clean', resolved: true });
      continue;
    }
    cells.push({ page: p, title: `Page ${p}`, band: 'clean', resolved: false });
  }

  return { totalPages: index.total, index, stops, cells, openCount: stops.filter((s) => !s.resolved).length };
}

/** Real page renders from the analyzer's run store, proxied by the API —
 * addressed (fileId, in-file page). */
export const pageImageUrl = (
  applicationId: string,
  runId: string,
  fileId: string,
  page: number,
  size: 'full' | 'strip' = 'full',
) =>
  `/api/applications/${applicationId}/runs/${runId}/files/${fileId}/pages/${page}${size === 'strip' ? '?size=strip' : ''}`;

/** Global-page image URL via the run's page index. */
export const globalPageImageUrl = (
  applicationId: string,
  runId: string,
  index: PageIndex,
  globalPage: number,
  size: 'full' | 'strip' = 'full',
) => {
  const rp = index.at(globalPage);
  return rp ? pageImageUrl(applicationId, runId, rp.fileId, rp.page, size) : '';
};
