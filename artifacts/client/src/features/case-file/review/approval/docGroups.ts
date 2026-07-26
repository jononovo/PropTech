import type { AnalysisDocument, DocumentApproval } from '@workspace/api-client-react';
import { actionableFlags, type CaseModel } from '../../caseData';

/**
 * Pure grouping for the document-approval flow: analyzer run → DocGroup[].
 * A group is the unit a human approves — one document as the analyzer split
 * it (a claim needing review), or an unassigned range. No React, no fetching.
 */

export type PageDecisionValue = 'good' | 'bad' | 'flag_accepted';
export type MergeDecision = 'merged' | 'dismissed';

/** Stable key for a merge proposal between two groups, order-independent. */
export const mergePairKey = (a: string, b: string) => [a, b].sort().join('|');

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
  /** true when this group is a human merge of adjacent analyzer groups */
  merged?: boolean;
  /** id of another open group the analyzer filed under the SAME requirement — a recommended merge */
  mergeWith?: string;
}

const rangeList = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, i) => first + i);

/**
 * @param links pairs of adjacent group ids the human linked as one document
 */
export function buildDocGroups(model: CaseModel, links: Array<[string, string]> = []): DocGroup[] {
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
      pageList: rangeList(first, last),
      title: 'Unassigned pages',
      colorSlot: -1,
      band: 'attend',
    });
  }
  raw.sort((x, y) => x.pages[0] - y.pages[0]);

  // human links: merge adjacent groups into one document (client-side until approval)
  let groups = raw;
  for (const [aId, bId] of links) {
    const ai = groups.findIndex((g) => g.id === aId);
    const bi = groups.findIndex((g) => g.id === bId);
    if (ai < 0 || bi < 0 || Math.abs(ai - bi) !== 1) continue;
    const [first, second] = ai < bi ? [groups[ai], groups[bi]] : [groups[bi], groups[ai]];
    const merged: DocGroup = {
      ...first,
      id: `${first.id}+${second.id}`,
      pages: [first.pages[0], second.pages[1]],
      pageList: [...first.pageList, ...second.pageList],
      title: first.kind === 'document' ? first.title : second.title,
      blockId: first.blockId ?? second.blockId,
      band: first.band ?? second.band,
      merged: true,
    };
    groups = groups.flatMap((g) => (g === first ? [merged] : g === second ? [] : [g]));
  }

  // color bands only when the analyzer split ONE file into several documents —
  // the claim needing review. A standalone one-document packet gets no color.
  const docGroups = groups.filter((g) => g.kind === 'document');
  if (docGroups.length > 1) {
    docGroups.forEach((g, i) => {
      g.colorSlot = i % 6;
    });
  }

  // settle from the decision trail: newest approval for exactly these pages on this run
  const approvals = model.app.documentApprovals ?? [];
  for (const g of groups) {
    g.settled = approvals.find(
      (a) => a.runId === run.runId && a.pages[0] === g.pages[0] && a.pages[1] === g.pages[1],
    );
  }

  // merge recommendations: two OPEN groups filed under the same requirement are
  // probably one document. Adjacent pairs get a link button between them;
  // non-adjacent pairs get hop-over icons (reordering a PDF is unrealistic —
  // the point is to double-check, not to rearrange).
  const byBlock = new Map<string, DocGroup[]>();
  for (const g of groups) {
    if (g.kind !== 'document' || g.settled || !g.blockId) continue;
    const list = byBlock.get(g.blockId) ?? [];
    list.push(g);
    byBlock.set(g.blockId, list);
  }
  for (const list of byBlock.values()) {
    for (let i = 0; i < list.length - 1; i++) {
      list[i].mergeWith = list[i + 1].id;
      list[i + 1].mergeWith = list[i].id;
    }
  }

  return groups;
}

/** First group still needing a decision — the landing point of the review room. */
export const firstOpenGroup = (groups: DocGroup[]) => groups.find((g) => !g.settled);
