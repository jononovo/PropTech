/**
 * Analyzer fixture seed — stands in for the engine until it exists (spec §7 step 1:
 * "portal builds triage against sidecar fixtures immediately").
 *
 * What it does (idempotent — safe to re-run):
 *   1. Tags docType (analyzer taxonomy ids) onto the seed template files (v3 + v4)
 *      and the pinned copy inside every existing application.
 *   2. Sets projectedClosingDate on the seed application (portal-owned, spec §8).
 *   3. Writes one realistic analysis run into the sidecar via the same store module
 *      the POST endpoint uses (runs with runId "fixture-*" are replaced).
 *   4. Records two starter verdicts (accepted docs → stopped staleness clocks).
 *
 * Run from artifacts/api-server:  pnpm exec tsx scripts/seed-analysis.ts
 */
import path from "node:path";
import { readJson, writeJsonAtomic, DATA_DIR, listFiles } from "../src/lib/jsonStore";
import { readSidecar, writeSidecar, type AnalysisRun } from "../src/features/analysis/store";
import { readApplication, writeApplication, listApplicationsRaw, type Application } from "../src/features/intake/store";

// ---------------------------------------------------------------------------
// 1. docType taxonomy tags (analyzer spec §4 — exact classification; never applicant-facing)
// ---------------------------------------------------------------------------
const DOC_TYPES: Record<string, string> = {
  "urla-1003": "application_form",
  disclosures: "disclosure_acknowledgment",
  "gov-id": "government_id",
  passport: "government_id",
  "ssn-verify": "ssn_verification",
  "pay-stubs": "pay_stub",
  "w2-forms": "w2_or_tax_return",
  "bank-statements": "bank_statement",
  "gift-letter": "gift_letter",
  appraisal: "appraisal_report",
  "purchase-agreement": "purchase_agreement",
  "prelim-title": "title_report",
  "insurance-binder": "insurance_binder",
  "prelim-cd": "closing_disclosure",
  "credit-report": "credit_report",
  "background-check": "background_check",
};

type TemplateJson = Application["template"];

function tagTemplate(tpl: TemplateJson): number {
  let tagged = 0;
  for (const s of tpl.sections) {
    for (const ss of s.subsections) {
      for (const b of ss.blocks) {
        if (b.kind !== "document") continue;
        const docType = DOC_TYPES[b.id] ?? b.id.replace(/-/g, "_");
        if (!DOC_TYPES[b.id]) console.warn(`  (no explicit taxonomy id for "${b.id}" — using fallback "${docType}")`);
        (b as Record<string, unknown>)["docType"] = docType;
        tagged += 1;
      }
    }
  }
  return tagged;
}

const templatesDir = path.join(DATA_DIR, "templates", "purchase-loan-ca");
for (const file of listFiles(templatesDir)) {
  const p = path.join(templatesDir, file);
  const tpl = readJson<TemplateJson>(p);
  if (!tpl) continue;
  const n = tagTemplate(tpl);
  writeJsonAtomic(p, tpl);
  console.log(`tagged ${n} document blocks in templates/purchase-loan-ca/${file}`);
}

// ---------------------------------------------------------------------------
// 2. The seed application: closing date + pinned-copy tags
// ---------------------------------------------------------------------------
const apps = listApplicationsRaw();
if (apps.length === 0) {
  console.error("No applications found — start one in the UI first.");
  process.exit(1);
}
const seedApp = readApplication(apps[0]!.id)!;
tagTemplate(seedApp.template);
const CLOSING = "2026-09-04";
seedApp.projectedClosingDate = CLOSING;

// ---------------------------------------------------------------------------
// 3. One realistic run: 312-page packet → 13 documents, 2 unassigned, 3 flagged.
//    Deliberate stories for every case page:
//    - passport satisfies gov-id's alternative group  → substitution scrutiny flag
//    - pay-stubs metadata anomaly                     → fraud_signal 0.42
//    - appraisal scan quality                          → low-DPI flag
//    - credit-report (hard clock) dies 2026-08-20     → before closing = blocker
//    - background-check 60d staleness expires 08-19   → warning
//    - insurance-binder + prelim-cd absent            → outstanding
// ---------------------------------------------------------------------------
const RUN_ID = "fixture-0724-01";
const criticalityOf = (blockId: string): "critical" | "standard" | "supporting" => {
  for (const s of seedApp.template.sections)
    for (const ss of s.subsections)
      for (const b of ss.blocks)
        if (b.id === blockId) return (b.criticality ?? "standard") as "critical" | "standard" | "supporting";
  return "standard";
};

type DocSpec = {
  blockId: string;
  pages: [number, number];
  documentDate: string;
  expiryDate?: string;
  issuingParty?: string;
  quality?: number;
  fraud?: number;
  confidence?: number;
  flags?: { code: string; detail: string }[];
};

const DOCS: DocSpec[] = [
  { blockId: "urla-1003", pages: [1, 9], documentDate: "2026-07-08", issuingParty: "Homium Origination" },
  { blockId: "disclosures", pages: [10, 21], documentDate: "2026-07-08", issuingParty: "Homium Origination" },
  {
    blockId: "passport", pages: [22, 23], documentDate: "2018-03-15", expiryDate: "2028-03-14",
    issuingParty: "US Dept of State", confidence: 0.97,
    flags: [{ code: "satisfied_by_alternative", detail: "Filed in place of Government ID — Driver License (Proof of Identity group). Substitution scrutiny applied." }],
  },
  { blockId: "ssn-verify", pages: [24, 25], documentDate: "2026-06-12", issuingParty: "SSA" },
  {
    blockId: "pay-stubs", pages: [26, 31], documentDate: "2026-07-10", issuingParty: "Coastal Analytics LLC",
    fraud: 0.42, confidence: 0.9,
    flags: [{ code: "metadata_anomaly", detail: "PDF producer differs from employer's other stubs; file created 3 days before pay-period end." }],
  },
  { blockId: "w2-forms", pages: [32, 43], documentDate: "2026-01-31", issuingParty: "Coastal Analytics LLC" },
  { blockId: "bank-statements", pages: [44, 67], documentDate: "2026-06-30", issuingParty: "First National Bank", confidence: 0.96 },
  { blockId: "gift-letter", pages: [68, 70], documentDate: "2026-07-05" },
  {
    blockId: "appraisal", pages: [71, 108], documentDate: "2026-07-02", issuingParty: "Pacific Valuation Group",
    quality: 0.58, confidence: 0.88,
    flags: [{ code: "scan_quality", detail: "p.41–43 of segment below 150 DPI; exhibits legible, addenda borderline." }],
  },
  { blockId: "purchase-agreement", pages: [109, 126], documentDate: "2026-06-24", issuingParty: "CAR Form RPA" },
  { blockId: "prelim-title", pages: [127, 140], documentDate: "2026-07-01", issuingParty: "Golden State Title" },
  { blockId: "credit-report", pages: [141, 154], documentDate: "2026-05-22", expiryDate: "2026-08-20", issuingParty: "Tri-Merge Bureau" },
  { blockId: "background-check", pages: [155, 158], documentDate: "2026-06-20", issuingParty: "CA DOJ" },
];

const lastName = (seedApp.applicantName.split(/\s+/).pop() ?? "applicant").toLowerCase();
const party = (spec: DocSpec) => (spec.issuingParty ? spec.issuingParty.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "_" : "");

const run: AnalysisRun = {
  runId: RUN_ID,
  startedAt: "2026-07-24T02:10:00.000Z",
  pipelineVersion: "fixture-0.1 (analyzer not built — seeded stand-in run)",
  preflight: {
    pages: 312,
    flags: ["p.41–43 below 150 DPI", "p.120 blank page", "p.201–203 skew above 6°"],
    gate: "confirmed",
  },
  documents: DOCS.map((spec) => ({
    segment: { pages: spec.pages },
    suggestedBlockId: spec.blockId,
    confidence: spec.confidence ?? 0.93,
    suggestedName: `${spec.documentDate}_${spec.blockId}_${party(spec)}${lastName}.pdf`,
    coreFields: {
      document_date: spec.documentDate,
      primary_party_name: seedApp.applicantName,
      ...(spec.expiryDate ? { expiry_date: spec.expiryDate } : {}),
      ...(spec.issuingParty ? { issuing_party: spec.issuingParty } : {}),
    },
    scores: {
      quality: spec.quality ?? 0.92,
      formatting: 0.88,
      fraud_signal: spec.fraud ?? 0.06,
      scrutinyTier: criticalityOf(spec.blockId),
    },
    flags: spec.flags ?? [],
    extractions: [], // always present — empty in v1, populated in v2 (spec §1.5)
    artifacts: {
      md: `fixture://artifacts/${RUN_ID}/${spec.blockId}.md`,
      pageRenders: [`fixture://artifacts/${RUN_ID}/${spec.blockId}/p${spec.pages[0]}.png`],
      crops: [],
    },
  })),
  unassigned: [
    { pages: [201, 203], description: "Fax cover pages, no letterhead — likely transmission artifacts." },
    { pages: [310, 312], description: "Handwritten note, unreadable signature — possibly a gift explanation letter." },
  ],
  whisper: [
    "Split 312 pages into 13 documents; 2 unassigned; 3 flagged.",
    "Passport filed in place of Driver License — substitution scrutiny applied (Proof of Identity group).",
  ],
};

const sidecar = readSidecar(seedApp.id);
sidecar.runs = sidecar.runs.filter((r) => !r.runId.startsWith("fixture-"));
sidecar.runs.push(run);
sidecar.latestRunId = run.runId;
writeSidecar(sidecar);
console.log(`sidecar written: data/analysis/${seedApp.id}.json (run ${RUN_ID}, ${run.documents.length} docs)`);

// ---------------------------------------------------------------------------
// 4. Starter verdicts — accepted docs stop their staleness clocks (spec §0: clock-stops on accept)
// ---------------------------------------------------------------------------
seedApp.verdicts = {
  ...(seedApp.verdicts ?? {}),
  "urla-1003": {
    verdict: "accepted", datesEdited: false, decidedAt: "2026-07-24T02:25:00.000Z",
    decidedBy: "Underwriter", documentDate: "2026-07-08", runId: RUN_ID,
  },
  "bank-statements": {
    verdict: "accepted", datesEdited: false, decidedAt: "2026-07-24T02:28:00.000Z",
    decidedBy: "Underwriter", documentDate: "2026-06-30", runId: RUN_ID,
    note: "Three complete statements; balances consistent with stated deposits.",
  },
};
writeApplication(seedApp);
console.log(`application updated: ${seedApp.id} (closing ${CLOSING}, 2 verdicts, docType tags)`);
