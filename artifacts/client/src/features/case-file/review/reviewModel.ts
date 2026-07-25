import type { AnalysisDocument } from '@workspace/api-client-react';
import {
  actionableFlags,
  flagLabel,
  flagSeverity,
  type CaseModel,
  type CaseReq,
  type Severity,
} from '../caseData';

/**
 * Pure view-model for the filmstrip review room. Stops are the pages a human
 * must decide on: flagged documents (verdict needed) and unassigned ranges
 * (filing needed). Everything else is a clean page — visible in "all pages"
 * mode, never queued. No React, no fetching.
 */

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
  /** inclusive 1-based page range */
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
}

export interface PageCell {
  page: number;
  title: string;
  band: CellBand;
  stopId?: string;
  resolved: boolean;
}

export interface ReviewModel {
  totalPages: number;
  stops: ReviewStop[];
  /** one cell per packet page, 1..totalPages */
  cells: PageCell[];
  openCount: number;
}

export function buildReviewModel(model: CaseModel): ReviewModel | null {
  const run = model.run;
  if (!run) return null;

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
    const [a, b] = doc.segment.pages;
    const first = a ?? 1;
    stops.push({
      id: `doc-${req.block.id}`,
      kind: 'document',
      pages: [first, b ?? first],
      page: first,
      title: req.block.name,
      band: callouts.some((c) => c.severity === 'clay') ? 'hold' : 'attend',
      resolved: !!req.verdict,
      callouts,
      req,
      doc,
    });
  }

  for (const u of model.unassignedOpen) {
    const [a, b] = u.pages;
    const first = a ?? 1;
    stops.push({
      id: `un-${first}-${b ?? first}`,
      kind: 'unassigned',
      pages: [first, b ?? first],
      page: first,
      title: 'Unassigned pages',
      band: 'attend',
      resolved: false,
      callouts: [{ label: 'No home on the checklist', detail: u.description, severity: 'amber' }],
      description: u.description,
    });
  }

  stops.sort((x, y) => x.page - y.page);

  const cells: PageCell[] = [];
  for (let p = 1; p <= run.preflight.pages; p++) {
    const stop = stops.find((s) => p >= s.pages[0] && p <= s.pages[1]);
    if (stop) {
      cells.push({ page: p, title: stop.title, band: stop.band, stopId: stop.id, resolved: stop.resolved });
      continue;
    }
    const req = model.reqs.find(
      (r) => r.doc && p >= (r.doc.segment.pages[0] ?? 0) && p <= (r.doc.segment.pages[1] ?? 0),
    );
    if (req) {
      cells.push({ page: p, title: req.block.name, band: 'clean', resolved: req.status === 'accepted' });
      continue;
    }
    const placement = model.placements.find(
      (pl) => p >= (pl.pages[0] ?? 0) && p <= (pl.pages[1] ?? 0),
    );
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

  return { totalPages: run.preflight.pages, stops, cells, openCount: stops.filter((s) => !s.resolved).length };
}

/** Real page renders from the analyzer's run store, proxied by the API. */
export const pageImageUrl = (
  applicationId: string,
  runId: string,
  page: number,
  size: 'full' | 'strip' = 'full',
) => `/api/applications/${applicationId}/runs/${runId}/pages/${page}${size === 'strip' ? '?size=strip' : ''}`;
