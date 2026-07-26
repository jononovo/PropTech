import type { AnalysisDocument, DocumentApproval } from '@workspace/api-client-react';
import { actionableFlags, type CaseModel } from '../../caseData';

/**
 * Pure grouping for the document-approval flow: analyzer run → DocGroup[].
 * A group is the unit a human approves — one document as the analyzer split
 * it (a claim needing review), or an unassigned range. No React, no fetching.
 */

export type PageDecisionValue = 'good' | 'bad' | 'flag_accepted';
export type MergeDecision = 'merged' | 'dismissed';

/**
 * Canonical key for a merge recommendation — MUST stay in lockstep with the
 * server's features/merge-resolutions/mergeKey.ts: "<runId>:p<f>-<l>|p<f>-<l>",
 * ranges sorted by first page. Resolutions persist on the application under
 * this key, so the gate and the audit trail survive refreshes.
 */
export const mergeResolutionKey = (runId: string, ranges: [number, number][]) => {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  return `${runId}:${sorted.map(([f, l]) => `p${f}-${l}`).join('|')}`;
};

export interface DocGroup {
  id: string;
  kind: 'document' | 'unassigned';
  /** inclusive 1-based page range */
  pages: [number, number];
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
  /** latest per-document approval recorded for exactly these pages on this run */
  settled?: DocumentApproval;
  /** true when this group is a human-accepted merge of analyzer groups */
  merged?: boolean;
  /** every [first,last] range making up the group (>1 = non-adjacent merge) */
  ranges: [number, number][];
  /** id of another open group the analyzer filed under the SAME requirement — a recommended merge */
  mergeWith?: string;
  /** resolution key for the pending/dismissed recommendation with mergeWith */
  mergeKey?: string;
}

const rangeList = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, i) => first + i);

/**
 * @param mergeResolutions Application.mergeResolutions — decision per
 *   recommendation key; `merged` combines the pair into ONE group (adjacent or
 *   not), `dismissed` keeps them apart but visible, absent = pending (gates approval).
 */
export function buildDocGroups(
  model: CaseModel,
  mergeResolutions: Record<string, { decision: MergeDecision }> = {},
): DocGroup[] {
  const run = model.run;
  if (!run) return [];

  const reqFor = (blockId: string) => model.reqs.find((r) => r.block.id === blockId);
  const blockName = (blockId: string) => reqFor(blockId)?.block.name ?? blockId;

  const raw: DocGroup[] = [];
  for (const doc of run.documents) {
    const [a, b] = doc.segment.pages;
    const first = a ?? 1;
    const last = b ?? first;
    const flags = actionableFlags(doc);
    const fs = doc.scores.fraud_signal;
    const fraudHigh = fs != null && fs >= 0.3;
    const name = blockName(doc.suggestedBlockId);
    raw.push({
      id: `g-${first}-${last}`,
      kind: 'document',
      pages: [first, last],
      ranges: [[first, last]],
      pageList: rangeList(first, last),
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
    const [a, b] = u.pages;
    const first = a ?? 1;
    const last = b ?? first;
    raw.push({
      id: `g-${first}-${last}`,
      kind: 'unassigned',
      pages: [first, last],
      ranges: [[first, last]],
      pageList: rangeList(first, last),
      title: 'Unassigned pages',
      colorSlot: -1,
      band: 'attend',
    });
  }
  raw.sort((x, y) => x.pages[0] - y.pages[0]);
  let groups = raw;

  // settle from the decision trail: approval for exactly these ranges on this run
  const approvals = model.app.documentApprovals ?? [];
  const settleFor = (ranges: [number, number][]) =>
    approvals.find((a) => {
      if (a.runId !== run.runId) return false;
      const aRanges: [number, number][] = a.pageRanges?.length
        ? (a.pageRanges as [number, number][])
        : [[a.pages[0]!, a.pages[1]!]];
      return (
        aRanges.length === ranges.length &&
        aRanges.every((r, i) => r[0] === ranges[i]![0] && r[1] === ranges[i]![1])
      );
    });
  for (const g of groups) g.settled = settleFor(g.ranges);

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
      const a = list[i];
      const b = list[i + 1];
      const key = mergeResolutionKey(run.runId, [a.pages, b.pages]);
      if (mergeResolutions[key]?.decision === 'merged') {
        const combined: DocGroup = {
          ...a,
          id: `${a.id}+${b.id}`,
          pages: [Math.min(a.pages[0], b.pages[0]), Math.max(a.pages[1], b.pages[1])],
          ranges: [...a.ranges, ...b.ranges].sort((x, y) => x[0] - y[0]),
          pageList: [...a.pageList, ...b.pageList].sort((x, y) => x - y),
          merged: true,
        };
        combined.settled = settleFor(combined.ranges);
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

  // color bands only when the analyzer split ONE file into several documents —
  // the claim needing review. A standalone one-document packet gets no color.
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
