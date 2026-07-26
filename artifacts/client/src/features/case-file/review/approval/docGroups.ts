import type { AnalysisDocument, DocumentApproval, FileSpan } from '@workspace/api-client-react';
import { actionableFlags, type CaseModel } from '../../caseData';
import { buildPageIndex, spanPageList, type PageIndex } from '../reviewModel';

/**
 * Pure grouping for the document-approval flow: analyzer run → DocGroup[].
 * A group is the unit a human approves — one document as the analyzer split
 * it (a claim needing review), or an unassigned span. File-native: the
 * canonical identity of a group is its FileSpan[]; global page numbers are a
 * view convenience derived from the run's page index. No React, no fetching.
 */

export type PageDecisionValue = 'good' | 'bad' | 'flag_accepted';
export type MergeDecision = 'merged' | 'dismissed';

/**
 * Canonical key for a merge recommendation — MUST stay in lockstep with the
 * server's features/merge-resolutions/mergeKey.ts:
 * "<fileId>:p<f>-<l>|<fileId>:p<f>-<l>", spans sorted by fileId then first
 * page. No runId: files are immutable, so spans identify the recommendation
 * across runs and resolutions survive later (delta) runs.
 */
export const mergeResolutionKey = (spans: FileSpan[]) => {
  const sorted = [...spans].sort((a, b) =>
    a.fileId === b.fileId ? (a.pages[0] ?? 0) - (b.pages[0] ?? 0) : a.fileId.localeCompare(b.fileId),
  );
  return sorted.map((s) => `${s.fileId}:p${s.pages[0]}-${s.pages[1]}`).join('|');
};

const sameSpans = (a: FileSpan[], b: FileSpan[]) =>
  a.length === b.length &&
  a.every((s, i) => s.fileId === b[i]!.fileId && s.pages[0] === b[i]!.pages[0] && s.pages[1] === b[i]!.pages[1]);

const sortSpans = (spans: FileSpan[]) =>
  [...spans].sort((a, b) =>
    a.fileId === b.fileId ? (a.pages[0] ?? 0) - (b.pages[0] ?? 0) : a.fileId.localeCompare(b.fileId),
  );

export interface DocGroup {
  id: string;
  kind: 'document' | 'unassigned';
  /** the group's canonical address — every span making it up (>1 = merge or cross-file doc) */
  spans: FileSpan[];
  /** inclusive 1-based GLOBAL page envelope (view/sort only) */
  pages: [number, number];
  /** every global page of the group, in reading order */
  pageList: number[];
  title: string;
  /** second header line (analyzer's document-specific name, when it adds info) */
  subtitle?: string;
  /** set-arity block — filing needs a variant, so no quick approve from the strip */
  needsVariant?: boolean;
  /** analyzer's filing guess — correcting it is first-class in the rail */
  blockId?: string;
  doc?: AnalysisDocument;
  /** color band index; -1 = no color (standalone / unassigned — nothing to claim) */
  colorSlot: number;
  band?: 'hold' | 'attend';
  /** latest per-document approval recorded for exactly these spans on this run */
  settled?: DocumentApproval;
  /** true when this group is a human-accepted merge of analyzer groups */
  merged?: boolean;
  /** id of another open group the analyzer filed under the SAME requirement — a recommended merge */
  mergeWith?: string;
  /** resolution key for the pending/dismissed recommendation with mergeWith */
  mergeKey?: string;
}

/**
 * @param mergeResolutions Application.mergeResolutions — decision per
 *   recommendation key; `merged` combines the pair into ONE group (adjacent or
 *   not), `dismissed` keeps them apart but visible, absent = pending (gates approval).
 */
export function buildDocGroups(
  model: CaseModel,
  mergeResolutions: Record<string, { decision: MergeDecision }> = {},
  index?: PageIndex,
): DocGroup[] {
  const run = model.run;
  if (!run) return [];
  const idx = index ?? buildPageIndex(run.input);

  const reqFor = (blockId: string) => model.reqs.find((r) => r.block.id === blockId);
  const blockName = (blockId: string) => reqFor(blockId)?.block.name ?? blockId;

  const groupId = (spans: FileSpan[]) =>
    `g-${spans.map((s) => `${s.fileId}:${s.pages[0]}-${s.pages[1]}`).join('+')}`;
  const envelope = (spans: FileSpan[]): [number, number] => idx.globalEnvelope(spans) ?? [1, 1];

  const raw: DocGroup[] = [];
  for (const doc of run.documents) {
    const spans = sortSpans(doc.spans);
    const flags = actionableFlags(doc);
    const fs = doc.scores.fraud_signal;
    const fraudHigh = fs != null && fs >= 0.3;
    const name = blockName(doc.suggestedBlockId);
    raw.push({
      id: groupId(spans),
      kind: 'document',
      spans,
      pages: envelope(spans),
      pageList: spanPageList(idx, spans),
      title: name,
      // analyzer's doc-specific name as the second line, when it adds info
      ...(doc.suggestedName && doc.suggestedName !== name ? { subtitle: doc.suggestedName } : {}),
      ...(reqFor(doc.suggestedBlockId)?.block.arity === 'set' ? { needsVariant: true } : {}),
      blockId: doc.suggestedBlockId,
      doc,
      colorSlot: -1,
      ...(flags.length > 0 || fraudHigh
        ? { band: (fraudHigh || flags.some((f) => f.code.includes('fraud') || f.code.includes('metadata')) ? 'hold' : 'attend') as 'hold' | 'attend' }
        : {}),
    });
  }
  for (const u of model.unassignedOpen) {
    const spans = [u.span];
    raw.push({
      id: groupId(spans),
      kind: 'unassigned',
      spans,
      pages: envelope(spans),
      pageList: spanPageList(idx, spans),
      title: 'Unassigned pages',
      colorSlot: -1,
      band: 'attend',
    });
  }
  raw.sort((x, y) => x.pages[0] - y.pages[0]);
  let groups = raw;

  // settle from the decision trail: approval for exactly these spans on this run
  const approvals = model.app.documentApprovals ?? [];
  const settleFor = (spans: FileSpan[]) =>
    approvals.find((a) => a.runId === run.runId && sameSpans(sortSpans(a.spans), spans));
  for (const g of groups) g.settled = settleFor(g.spans);

  // merge recommendations: two OPEN groups filed under the same requirement are
  // probably one document. The human must resolve each recommendation — merged
  // (combine into ONE group, adjacent or not) or dismissed (keep apart, stays
  // visible) — before either side can be approved. Resolutions persist on the
  // application keyed by mergeResolutionKey.
  const byBlock = new Map<string, DocGroup[]>();
  for (const g of groups) {
    if (g.kind !== 'document' || g.settled || !g.blockId) continue;
    const list = byBlock.get(g.blockId) ?? [];
    list.push(g);
    byBlock.set(g.blockId, list);
  }
  for (const list of byBlock.values()) {
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i]!;
      const b = list[i + 1]!;
      const key = mergeResolutionKey([...a.spans, ...b.spans]);
      if (mergeResolutions[key]?.decision === 'merged') {
        const spans = sortSpans([...a.spans, ...b.spans]);
        const combined: DocGroup = {
          ...a,
          id: `${a.id}+${b.id}`,
          spans,
          pages: envelope(spans),
          pageList: spanPageList(idx, spans),
          merged: true,
        };
        combined.settled = settleFor(combined.spans);
        groups = groups.flatMap((g) => (g === a ? [combined] : g === b ? [] : [g]));
        list.splice(i, 2, combined);
        i--; // the combined group may pair with the next sibling
      } else {
        a.mergeWith = b.id;
        a.mergeKey = key;
        b.mergeWith = a.id;
        b.mergeKey = key;
      }
    }
  }

  // color bands only when the analyzer split the input into several documents —
  // the claim needing review. A standalone one-document run gets no color.
  const docGroups = groups.filter((g) => g.kind === 'document');
  if (docGroups.length > 1) {
    docGroups.forEach((g, i) => {
      g.colorSlot = i % 6;
    });
  }

  return groups;
}

/** First group still needing a decision — the landing point of the review room. */
export const firstOpenGroup = (groups: DocGroup[]) => groups.find((g) => !g.settled);
