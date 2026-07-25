import type {
  AnalysisDocument,
  AnalysisRun,
  AnalysisSidecar,
  Application,
  ApplicationVariant,
  Block,
  ManualPlacement,
  UploadedFile,
  Verdict,
} from '@workspace/api-client-react';

/**
 * Pure view-model for the case file. Merges the application (pinned template,
 * uploads, human verdicts) with the analyzer sidecar (latest run) into
 * per-requirement rows that all four lenses read. No React, no fetching.
 */

// ─── status vocabulary ──────────────────────────────────────────────────────
// accepted  — human signed off; staleness clocks stop (hard expiries never do)
// requested — human asked for a new version; waiting on the other side
// flagged   — analyzer raised something a human must decide
// clean     — analyzer filed it, checks passed, awaiting human review.
//             SEPARATION RULE: still intake-side — it renders, but never counts
//             toward cleared/done/quiet. Nothing is part of the application
//             until a human accepts.
// filed     — uploaded via intake but no analyzer run has seen it yet
// covered   — not present itself, but an ACCEPTED alternative satisfies the group
// missing   — required and nowhere to be found
export type ReqStatus = 'accepted' | 'requested' | 'flagged' | 'clean' | 'filed' | 'covered' | 'missing';
export type Severity = 'clay' | 'amber' | 'slate';
export type Band = 'escalate' | 'warn' | 'watch' | 'quiet';

export interface ReqClock {
  kind: 'hard' | 'staleness';
  staleOn: Date;
  days: number; // relative to today (negative = already stale)
  stopped: boolean;
  stoppedOn?: Date;
  rule: string;
  note: string;
}

export interface CaseReq {
  block: Block;
  sectionId: string;
  sectionNum: string;
  sectionName: string;
  subsectionName: string;
  owner: string;
  status: ReqStatus;
  doc?: AnalysisDocument;
  verdict?: Verdict;
  uploads: UploadedFile[];
  severity?: Severity;
  flagTitle?: string;
  flagNote?: string;
  clock?: ReqClock;
  coveredBy?: string;
  /** set blocks only — this application's variants with their tagged uploads */
  variants?: { variant: ApplicationVariant; uploads: UploadedFile[] }[];
  /** effective dates — verdict-confirmed values win over analyzer suggestions */
  documentDate?: string;
  expiryDate?: string;
}

export interface CaseSection {
  id: string;
  num: string;
  name: string;
  owner: string;
  reqs: CaseReq[];
  cleared: number;
  total: number;
  dot?: 'blocker' | 'warning' | 'neutral';
  done: boolean;
}

export interface AuditEntry {
  when: Date;
  text: string;
}

export type UnassignedEntry = AnalysisRun['unassigned'][number];

export interface CaseModel {
  app: Application;
  run: AnalysisRun | null;
  today: Date;
  closing: Date | null;
  daysToClose: number | null;
  sections: CaseSection[];
  reqs: CaseReq[];
  exceptions: CaseReq[];
  covered: CaseReq[];
  waiting: CaseReq[];
  liveClocks: CaseReq[];
  stoppedClocks: CaseReq[];
  alarmCount: number;
  stats: { found: number; quiet: number; attention: number; unassigned: number };
  audit: AuditEntry[];
  /** human filings/archivals of unassigned ranges — portal-owned, analyzer never writes these */
  placements: ManualPlacement[];
  /** analyzer-unassigned ranges no human has filed or archived yet */
  unassignedOpen: UnassignedEntry[];
}

// ─── date helpers ───────────────────────────────────────────────────────────

/** Parse a date-only string ("2026-09-04") in local time; full ISO strings pass through. */
export function parseDate(s: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const daysBetween = (from: Date, to: Date) =>
  Math.round((midnight(to).getTime() - midnight(from).getTime()) / 86_400_000);

export const addDays = (d: Date, n: number) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

export const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const fmtTime = (d: Date) =>
  `${fmt(d)} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

export const band = (days: number): Band =>
  days <= 7 ? 'escalate' : days <= 30 ? 'warn' : days <= 90 ? 'watch' : 'quiet';

// ─── flag vocabulary ────────────────────────────────────────────────────────

const FLAG_LABELS: Record<string, string> = {
  scan_quality: 'Scan defect',
  metadata_anomaly: 'Metadata anomaly',
  fraud_signal: 'Fraud signal',
  satisfied_by_alternative: 'Satisfied by alternative',
  needs_review: 'Needs review',
};

export const flagLabel = (code: string) =>
  FLAG_LABELS[code] ?? code.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export const flagSeverity = (code: string): Severity => {
  if (code.includes('fraud') || code.includes('metadata')) return 'clay';
  if (code === 'satisfied_by_alternative') return 'slate';
  return 'amber';
};

const SEV_RANK: Record<Severity, number> = { clay: 0, amber: 1, slate: 2 };

/** Flags that demand a human verdict (slate flags are informational). */
export const actionableFlags = (doc: AnalysisDocument) =>
  doc.flags.filter((f) => flagSeverity(f.code) !== 'slate');

// ─── model builder ──────────────────────────────────────────────────────────

export function buildCaseModel(
  app: Application,
  sidecar: AnalysisSidecar | undefined,
  now: Date = new Date(),
): CaseModel {
  const today = midnight(now);
  const closing = app.projectedClosingDate ? parseDate(app.projectedClosingDate) : null;
  const daysToClose = closing ? daysBetween(today, closing) : null;

  const run: AnalysisRun | null = sidecar?.runs.length
    ? (sidecar.runs.find((r) => r.runId === sidecar.latestRunId) ??
      sidecar.runs[sidecar.runs.length - 1])
    : null;

  // last assignment wins if the analyzer mapped two segments to one block
  const docByBlock = new Map<string, AnalysisDocument>();
  for (const doc of run?.documents ?? []) docByBlock.set(doc.suggestedBlockId, doc);

  const placements = app.manualPlacements ?? [];
  const overlaps = (a: readonly number[], b: readonly number[]) =>
    (a[0] ?? 0) <= (b[1] ?? 0) && (b[0] ?? 0) <= (a[1] ?? 0);
  const unassignedOpen = (run?.unassigned ?? []).filter(
    (u) => !placements.some((p) => overlaps(p.pages, u.pages)),
  );

  // which alternative-group members have anything on file (intake-side presence)
  const present = (blockId: string) =>
    docByBlock.has(blockId) || (app.uploads[blockId]?.length ?? 0) > 0;

  // separation rule: only a human-ACCEPTED alternative can cover its group —
  // analyzer-filed presence alone made cases "look done yesterday"
  const accepted = (blockId: string) => app.verdicts?.[blockId]?.verdict === 'accepted';

  const coveredByName = new Map<string, string>(); // blockId -> covering block name
  const blockNames = new Map<string, string>();
  for (const section of app.template.sections)
    for (const sub of section.subsections)
      for (const b of sub.blocks) blockNames.set(b.id, b.name);

  for (const group of app.template.alternatives) {
    const members = [group.primary, ...group.satisfiedBy];
    for (const member of members) {
      if (present(member)) continue;
      const covering = members.find((m) => m !== member && accepted(m));
      if (covering) coveredByName.set(member, blockNames.get(covering) ?? covering);
    }
  }

  const sections: CaseSection[] = [];
  const reqs: CaseReq[] = [];

  app.template.sections.forEach((section, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const sectionReqs: CaseReq[] = [];

    for (const sub of section.subsections) {
      for (const block of sub.blocks) {
        if (block.kind !== 'document') continue;
        const req = buildReq(block, {
          app,
          doc: docByBlock.get(block.id),
          verdict: app.verdicts?.[block.id],
          uploads: app.uploads[block.id] ?? [],
          placements,
          coveredBy: coveredByName.get(block.id),
          packetPages: run?.preflight.pages,
          sectionId: section.id,
          sectionNum: num,
          sectionName: section.name,
          subsectionName: sub.name,
          owner: String(section.owner),
          today,
          closing,
        });
        if (block.arity === 'set') {
          const uploads = app.uploads[block.id] ?? [];
          req.variants = (app.variants?.[block.id] ?? []).map((variant) => ({
            variant,
            uploads: uploads.filter((f) => f.variantId === variant.id),
          }));
        }
        sectionReqs.push(req);
        reqs.push(req);
      }
    }

    // separation rule: clean is intake-side, it never counts toward cleared/done
    const cleared = sectionReqs.filter((r) =>
      r.status === 'accepted' || r.status === 'covered',
    ).length;

    sections.push({
      id: section.id,
      num,
      name: section.name,
      owner: String(section.owner),
      reqs: sectionReqs,
      cleared,
      total: sectionReqs.length,
      dot: sectionDot(sectionReqs),
      done: sectionReqs.length > 0 && cleared === sectionReqs.length,
    });
  });

  const exceptions = reqs
    .filter(
      (r) =>
        r.status === 'flagged' ||
        (r.status === 'missing' && r.block.criticality !== 'supporting'),
    )
    .sort((a, b) => SEV_RANK[a.severity ?? 'amber'] - SEV_RANK[b.severity ?? 'amber']);

  const covered = reqs.filter((r) => r.status === 'covered');
  const waiting = reqs.filter(
    (r) => r.status === 'requested' || (r.status === 'missing' && r.block.criticality === 'supporting'),
  );

  const liveClocks = reqs
    .filter((r) => r.clock && !r.clock.stopped)
    .sort((a, b) => a.clock!.days - b.clock!.days);
  const stoppedClocks = reqs.filter((r) => r.clock?.stopped);
  const alarmCount = liveClocks.filter((r) => r.clock!.days <= 30).length;

  // separation rule: quiet = human-settled only (accepted or covered-by-accepted)
  const quiet = reqs.filter(
    (r) => r.status === 'accepted' || r.status === 'covered',
  ).length;

  return {
    app,
    run,
    today,
    closing,
    daysToClose,
    sections,
    reqs,
    exceptions,
    covered,
    waiting,
    liveClocks,
    stoppedClocks,
    alarmCount,
    stats: {
      found: run?.documents.length ?? 0,
      quiet,
      attention: exceptions.length,
      unassigned: unassignedOpen.length,
    },
    audit: buildAudit(app, run, reqs),
    placements,
    unassignedOpen,
  };
}

// ─── per-requirement derivation ─────────────────────────────────────────────

interface ReqContext {
  app: Application;
  doc?: AnalysisDocument;
  verdict?: Verdict;
  uploads: UploadedFile[];
  placements: ManualPlacement[];
  coveredBy?: string;
  packetPages?: number;
  sectionId: string;
  sectionNum: string;
  sectionName: string;
  subsectionName: string;
  owner: string;
  today: Date;
  closing: Date | null;
}

function buildReq(block: Block, ctx: ReqContext): CaseReq {
  const { doc, verdict, uploads, coveredBy } = ctx;

  let status: ReqStatus;
  if (verdict?.verdict === 'accepted') status = 'accepted';
  else if (verdict?.verdict === 'new_version_requested') status = 'requested';
  else if (
    doc &&
    (actionableFlags(doc).length > 0 ||
      (doc.scores.fraud_signal != null && doc.scores.fraud_signal >= 0.3))
  )
    status = 'flagged';
  else if (doc) status = 'clean';
  else if (uploads.length > 0 || ctx.placements.some((p) => p.target === block.id)) status = 'filed';
  else if (coveredBy) status = 'covered';
  else status = 'missing';

  const documentDate = verdict?.documentDate ?? doc?.coreFields.document_date;
  const expiryDate = verdict?.expiryDate ?? doc?.coreFields.expiry_date;
  const clock = buildClock(block, { documentDate, expiryDate, verdict, today: ctx.today, closing: ctx.closing });

  let severity: Severity | undefined;
  let flagTitle: string | undefined;
  let flagNote: string | undefined;

  if (status === 'flagged' && doc) {
    const flags = actionableFlags(doc);
    const worst = [...flags].sort((a, b) => SEV_RANK[flagSeverity(a.code)] - SEV_RANK[flagSeverity(b.code)])[0];
    if (worst) {
      severity = flagSeverity(worst.code);
      flagTitle = flagLabel(worst.code);
      flagNote = flags.map((f) => f.detail).join(' ');
    }
    if (doc.scores.fraud_signal != null && doc.scores.fraud_signal >= 0.3) {
      severity = 'clay';
      if (!flagTitle) {
        flagTitle = 'Fraud signal';
        flagNote = `Fraud signal at ${Math.round(doc.scores.fraud_signal * 100)}% — review before accepting.`;
      }
    }
  } else if (status === 'missing') {
    severity = block.criticality === 'critical' ? 'clay' : 'amber';
    flagTitle = 'Not found';
    flagNote = ctx.packetPages
      ? `Required by the checklist but not found in the ${ctx.packetPages}-page packet.`
      : 'Required by the checklist — nothing filed yet.';
    if (block.criticality === 'critical') flagNote += ' Blocks underwriting until filed.';
  } else if (status === 'covered' && coveredBy) {
    severity = 'slate';
    flagTitle = 'Covered by alternative';
    flagNote = `${coveredBy} satisfies this requirement — substitution scrutiny applied.`;
  } else if (doc?.flags.some((f) => f.code === 'satisfied_by_alternative')) {
    // informational note on the substituting document itself
    severity = 'slate';
    flagTitle = 'Satisfied by alternative';
    flagNote = doc.flags.find((f) => f.code === 'satisfied_by_alternative')?.detail;
  }

  return {
    block,
    sectionId: ctx.sectionId,
    sectionNum: ctx.sectionNum,
    sectionName: ctx.sectionName,
    subsectionName: ctx.subsectionName,
    owner: ctx.owner,
    status,
    doc,
    verdict,
    uploads,
    severity,
    flagTitle,
    flagNote,
    clock,
    coveredBy,
    documentDate,
    expiryDate,
  };
}

function buildClock(
  block: Block,
  args: { documentDate?: string; expiryDate?: string; verdict?: Verdict; today: Date; closing: Date | null },
): ReqClock | undefined {
  const rule = block.expiry;
  if (!rule) return undefined;

  if (rule.kind === 'hard') {
    if (!args.expiryDate) return undefined;
    const staleOn = parseDate(args.expiryDate);
    const days = daysBetween(args.today, staleOn);
    return {
      kind: 'hard',
      staleOn,
      days,
      stopped: false, // hard expiries survive acceptance
      rule: 'Hard expiry — must remain valid through closing',
      note: hardNote(staleOn, args.closing, args.verdict),
    };
  }

  if (!args.documentDate || !rule.days) return undefined;
  const staleOn = addDays(parseDate(args.documentDate), rule.days);
  const stopped = args.verdict?.verdict === 'accepted';
  return {
    kind: 'staleness',
    staleOn,
    days: daysBetween(args.today, staleOn),
    stopped,
    stoppedOn: stopped && args.verdict ? new Date(args.verdict.decidedAt) : undefined,
    rule: `Valid ${rule.days} days from document date`,
    note: stalenessNote(staleOn, args.closing),
  };
}

function hardNote(staleOn: Date, closing: Date | null, verdict?: Verdict): string {
  const accepted = verdict?.verdict === 'accepted';
  if (closing && staleOn.getTime() < closing.getTime()) {
    return `${accepted ? 'Accepted, but hard expiries survive acceptance — it' : 'It'} expires ${fmt(staleOn)}, ${daysBetween(staleOn, closing)} days before closing. A fresh version will be needed.`;
  }
  return `Valid through ${fmt(staleOn)}${closing ? ' — outlives the closing target' : ''}. Hard expiries never stop.`;
}

function stalenessNote(staleOn: Date, closing: Date | null): string {
  if (closing && staleOn.getTime() < closing.getTime()) {
    return `Goes stale ${fmt(staleOn)} — ${daysBetween(staleOn, closing)} days before closing. Accept in underwriting before then, or a fresh version will be needed.`;
  }
  return `Goes stale ${fmt(staleOn)}${closing ? ' — past the closing target' : ''}. Accepting stops this clock.`;
}

function sectionDot(reqs: CaseReq[]): CaseSection['dot'] {
  const blocker = reqs.some(
    (r) =>
      (r.status === 'flagged' && r.severity === 'clay') ||
      (r.status === 'missing' && r.block.criticality === 'critical'),
  );
  if (blocker) return 'blocker';
  const warning = reqs.some(
    (r) =>
      (r.status === 'flagged' && r.severity === 'amber') ||
      (r.status === 'missing' && r.block.criticality !== 'supporting') ||
      (r.clock && !r.clock.stopped && r.clock.days <= 30),
  );
  if (warning) return 'warning';
  const neutral = reqs.some((r) => r.status === 'requested' || r.status === 'filed');
  return neutral ? 'neutral' : undefined;
}

// ─── audit trail (derived — the sidecar and verdicts are the record) ────────

function buildAudit(app: Application, run: AnalysisRun | null, reqs: CaseReq[]): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const packet = app.packet;

  if (packet) {
    const uploaded = new Date(packet.uploadedAt);
    entries.push({
      when: uploaded,
      text: `Packet received — ${packet.filename} · ${packet.pages} pages · ${Math.round(packet.sizeBytes / 1024)} KB`,
    });
    for (const flag of packet.preflight?.flags ?? []) {
      entries.push({ when: uploaded, text: `Pre-flight: ${flag}` });
    }
    if (packet.gate) {
      const when = new Date(packet.gate.decidedAt);
      const standing = packet.preflight?.flags.length ?? 0;
      const who = packet.gate.decidedBy ?? 'Staff';
      if (packet.gate.decision === 'auto') {
        entries.push({
          when,
          text: `Pre-flight clean — processed automatically (${packet.pages} pages, no flags)`,
        });
      } else if (packet.gate.decision === 'confirmed') {
        entries.push({ when, text: `${who} confirmed the gate — full pipeline approved before spend` });
      } else {
        entries.push({ when, text: `${who} processed anyway — ${standing} pre-flight flag(s) standing` });
      }
    }
  }

  if (run) {
    const when = new Date(run.startedAt);
    entries.push({
      when,
      text: `Analyzer run — ${run.preflight.pages} pages read, ${run.documents.length} documents filed, ${run.unassigned.length} unassigned`,
    });
    // Fixture-era sidecars carry gate/flag info only on the run. Packet-backed
    // apps already logged richer entries above — don't repeat them.
    if (!packet) {
      if (run.preflight.gate === 'confirmed') {
        entries.push({ when, text: 'Pre-flight gate confirmed — full pipeline approved before spend' });
      } else if (run.preflight.gate === 'bypassed') {
        entries.push({ when, text: 'Pre-flight gate bypassed — processed anyway' });
      }
      for (const flag of run.preflight.flags) {
        entries.push({ when, text: `Pre-flight: ${flag}` });
      }
    }
  }

  for (const p of app.manualPlacements ?? []) {
    const range = p.pages[0] === p.pages[1] ? `p. ${p.pages[0]}` : `pp. ${p.pages[0]}–${p.pages[1]}`;
    entries.push({
      when: new Date(p.decidedAt),
      text:
        p.target === 'archive'
          ? `${p.decidedBy} archived ${range} — kept on file, off the checklist`
          : `${p.decidedBy} filed ${range} as ${reqs.find((r) => r.block.id === p.target)?.block.name ?? p.target} — manual placement wins`,
    });
  }

  for (const ev of app.templateHistory ?? []) {
    entries.push({
      when: new Date(ev.decidedAt),
      text: `${ev.decidedBy} upgraded the template v${ev.fromVersion} → v${ev.toVersion} — additive-only, prior work untouched`,
    });
  }

  for (const r of reqs) {
    if (!r.verdict) continue;
    const when = new Date(r.verdict.decidedAt);
    if (r.verdict.verdict === 'accepted') {
      const clockNote =
        r.clock?.kind === 'staleness'
          ? ' — staleness clock stopped'
          : r.clock?.kind === 'hard'
            ? ' — hard expiry stays live'
            : '';
      const dates = r.verdict.datesEdited ? ' (dates edited at verdict)' : '';
      entries.push({ when, text: `${r.verdict.decidedBy} accepted ${r.block.name}${clockNote}${dates}` });
    } else {
      entries.push({ when, text: `${r.verdict.decidedBy} requested a new version of ${r.block.name}` });
    }
  }

  return entries.sort((a, b) => a.when.getTime() - b.when.getTime());
}

// ─── misc display helpers ───────────────────────────────────────────────────

export const pageSpan = (doc: AnalysisDocument) => {
  const [a, b] = doc.segment.pages;
  return a === b ? `${a}` : `${a}–${b}`;
};

export const confidencePct = (doc: AnalysisDocument) => Math.round(doc.confidence * 100);

/** Checks summary from analyzer scores: quality / formatting / fraud. When the
 * run didn't score fraud (plan toggle off), the fraud check honestly isn't
 * counted — 2 checks, not a free pass on 3. */
export function checksSummary(doc: AnalysisDocument): { passed: number; total: number } {
  const passes = [doc.scores.quality >= 0.7, doc.scores.formatting >= 0.7];
  if (doc.scores.fraud_signal != null) passes.push(doc.scores.fraud_signal <= 0.25);
  return { passed: passes.filter(Boolean).length, total: passes.length };
}
