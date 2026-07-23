// ─────────────────────────────────────────────────────────────────────────────
// HOMIUM PAGE REVIEW — shared dataset for the review-room variants.
// Derived from ./data.ts (case HM-2026-0412). Do not fork facts: page spans,
// doc names, flags and dates must stay consistent with the Register/Workfile.
// ─────────────────────────────────────────────────────────────────────────────
import { CASE } from "./data";
export { CASE }; // re-exported so review variants can import case facts from one place

export type PageBand = "clean" | "attend" | "hold"; // hold = AI deep review — no human verdict needed yet
export type CalloutSeverity = "red" | "amber" | "slate" | "ok";

export interface Callout {
  id: string;
  region: { x: number; y: number; w: number; h: number }; // % of page, top-left origin
  severity: CalloutSeverity;
  label: string;   // short, drawn at the region
  detail?: string; // one sentence, shown in the callout list
}

export interface VerdictAction {
  label: string;
  tone: "blue" | "neutral" | "red";
}

// Visual hints so every variant draws the SAME CSS-only page facsimiles. No images.
export type PageVisual =
  | "form" | "form-signed" | "w2" | "table" | "report-cover"
  | "table-clipped-skew" // skewed sheet, bottom ~6% hard-cropped
  | "table-deposit"      // ruled table, one highlighted row
  | "table-endmid"       // table that stops mid-rows, footer visible
  | "legal-seal"         // dense justified text, circular seal outline bottom-right
  | "fax-cover"          // sparse TO/FROM block, big lines
  | "utility-bill";      // logo block + amount box

export interface ReviewStop {
  page: number;          // package page number (matches Register spans)
  spanPages?: number;    // block size when the stop covers a run of pages
  doc: string;           // document (or "Unassigned")
  docPages: string;      // the doc's span in the package
  pageOfDoc?: string;    // e.g. "Statement page 2 of 6"
  classifiedAs: string;
  conf: number;          // classification confidence %
  scores: { quality: number | null; ocr: number | null; fraud: string };
  band: PageBand;
  visual: PageVisual;
  callouts: Callout[];
  question?: string;     // the AI's plain-language ask — AI suggests, the human decides
  actions: VerdictAction[];
  suggested?: string;    // the action the AI leans toward (must match an action label)
  note?: string;
}

// ── the priority queue: 6 stops, blockers and defects first ─────────────────
export const REVIEW_QUEUE: ReviewStop[] = [
  {
    page: 31, doc: "Bank Statements — Last 3 Months", docPages: "30–68",
    pageOfDoc: "Wells Fargo · May cycle · statement page 2 of 6",
    classifiedAs: "Bank statement — Wells Fargo checking", conf: 95,
    scores: { quality: 41, ocr: 55, fraud: "Low · 3%" }, band: "attend", visual: "table-clipped-skew",
    callouts: [
      { id: "31a", region: { x: 8, y: 88, w: 84, h: 10 }, severity: "red", label: "Bottom edge clipped", detail: "The account-number strip is cut off — bottom ~6% of the page is missing from the scan." },
      { id: "31b", region: { x: 6, y: 5, w: 58, h: 8 }, severity: "amber", label: "Skew 11°", detail: "Page scanned at an angle — OCR degraded, column totals unverified." },
    ],
    question: "The defect is physical, not fraud — the account number repeats in the header of p.30. Re-scan anyway, or accept with the p.30 reference?",
    actions: [{ label: "Request re-scan", tone: "blue" }, { label: "Accept as-is", tone: "neutral" }, { label: "Flag to originator", tone: "neutral" }],
    suggested: "Request re-scan",
    note: "This is the page behind the Workfile's FLAGGED card.",
  },
  {
    page: 33, doc: "Bank Statements — Last 3 Months", docPages: "30–68",
    pageOfDoc: "Wells Fargo · May cycle · statement page 4 of 6",
    classifiedAs: "Bank statement — Wells Fargo checking", conf: 96,
    scores: { quality: 93, ocr: 96, fraud: "Low · 3%" }, band: "attend", visual: "table-deposit",
    callouts: [
      { id: "33a", region: { x: 8, y: 46, w: 84, h: 7 }, severity: "amber", label: "$9,500 deposit · Jun 14", detail: "Non-payroll deposit. A gift letter is required — none found in the 296-page package." },
    ],
    question: "The deposit itself is fine — the paperwork is missing. Draft the gift-letter request to the applicant, or flag to the underwriter?",
    actions: [{ label: "Draft gift-letter request", tone: "blue" }, { label: "Accept deposit", tone: "neutral" }, { label: "Flag to underwriter", tone: "neutral" }],
    suggested: "Draft gift-letter request",
    note: "Feeds the Gift Letter blocker — the file's only true blocker today.",
  },
  {
    page: 62, doc: "Bank Statements — Last 3 Months", docPages: "30–68",
    pageOfDoc: "Chase savings · July cycle · statement page 3 of 4",
    classifiedAs: "Bank statement — Chase savings", conf: 97,
    scores: { quality: 90, ocr: 94, fraud: "Low · 3%" }, band: "attend", visual: "table-endmid",
    callouts: [
      { id: "62a", region: { x: 8, y: 90, w: 84, h: 7 }, severity: "amber", label: "Footer: “Page 3 of 4”", detail: "Page 4 was not found adjacent. A misfile in the correspondence block (p.248–288) is the likely cause." },
    ],
    question: "The statement says there's a page 4 — it isn't here. Search the correspondence block for it, or request the full cycle from the applicant?",
    actions: [{ label: "Search correspondence block", tone: "blue" }, { label: "Request full statement", tone: "neutral" }, { label: "Accept — balance forward matches", tone: "neutral" }],
    suggested: "Search correspondence block",
  },
  {
    page: 197, doc: "Title Commitment", docPages: "180–204",
    pageOfDoc: "Notarized signature page",
    classifiedAs: "Title commitment — notarization", conf: 98,
    scores: { quality: 96, ocr: 97, fraud: "Under review · 2 of 3 checks" }, band: "hold", visual: "legal-seal",
    callouts: [
      { id: "197a", region: { x: 62, y: 72, w: 26, h: 16 }, severity: "slate", label: "Notary seal", detail: "Seal differs from the county registry sample. Held in automated deep review — two of three checks complete." },
    ],
    question: "No verdict needed yet — deep review finishes on its own. Override only if the underwriter wants it escalated now.",
    actions: [{ label: "Wait — deep review running", tone: "blue" }, { label: "Escalate to underwriter now", tone: "neutral" }],
    suggested: "Wait — deep review running",
    note: "Matches the Workfile's slate 'Enhanced review' status — not your turn.",
  },
  {
    page: 248, spanPages: 41, doc: "Unassigned", docPages: "248–288",
    pageOfDoc: "Block of 41 pages",
    classifiedAs: "Correspondence & fax covers", conf: 88,
    scores: { quality: 88, ocr: 91, fraud: "—" }, band: "attend", visual: "fax-cover",
    callouts: [
      { id: "248a", region: { x: 6, y: 8, w: 88, h: 24 }, severity: "amber", label: "No requirement match", detail: "41 pages of emails and cover sheets — nothing matches a checklist requirement." },
    ],
    question: "Nothing in this block matches a requirement. Archive all 41 pages, or step through them one by one? (Chase p.4 may be hiding in here.)",
    actions: [{ label: "Archive all 41 pages", tone: "blue" }, { label: "Review individually", tone: "neutral" }],
    suggested: "Archive all 41 pages",
  },
  {
    page: 289, spanPages: 8, doc: "Unassigned", docPages: "289–296",
    pageOfDoc: "Block of 8 pages",
    classifiedAs: "SoCal Edison bill — June 2026", conf: 91,
    scores: { quality: 95, ocr: 97, fraud: "—" }, band: "attend", visual: "utility-bill",
    callouts: [
      { id: "289a", region: { x: 58, y: 12, w: 34, h: 12 }, severity: "amber", label: "No matching requirement", detail: "Possibly proof of residence — not required for CA purchase loans." },
    ],
    question: "Not required for this program. Archive it, or attach it to the file as supporting material?",
    actions: [{ label: "Archive", tone: "blue" }, { label: "Attach as supporting material", tone: "neutral" }, { label: "Ask originator", tone: "neutral" }],
    suggested: "Archive",
  },
];

// ── clean pages, for the accept-next-accept rhythm and “every page” mode ────
export interface CleanPage {
  page: number; doc: string; classifiedAs: string; conf: number; visual: PageVisual;
  callouts?: Callout[]; // ok-severity only
}
export const CLEAN_RUN: CleanPage[] = [
  { page: 1, doc: "URLA — Form 1003", classifiedAs: "URLA Form 1003 — Section 1", conf: 99, visual: "form" },
  { page: 9, doc: "URLA — Form 1003", classifiedAs: "URLA Form 1003 — signature page", conf: 99, visual: "form-signed",
    callouts: [{ id: "9a", region: { x: 10, y: 78, w: 56, h: 8 }, severity: "ok", label: "Borrower signature verified" }] },
  { page: 22, doc: "W-2 Forms (2024 + 2025)", classifiedAs: "W-2 — BrightPath Logistics, 2024", conf: 98, visual: "w2" },
  { page: 26, doc: "Pay Stubs — Last 30 Days", classifiedAs: "Pay stub — Jun 8–21", conf: 97, visual: "table" },
  { page: 135, doc: "Appraisal Report", classifiedAs: "URAR appraisal — cover", conf: 96, visual: "report-cover" },
  { page: 211, doc: "Credit Report — Tri-Merge", classifiedAs: "Tri-merge credit report — cover", conf: 99, visual: "report-cover" },
];

// ── scope + stats ────────────────────────────────────────────────────────────
export const MODES = [
  { id: "priority" as const, label: "Priority only", detail: () => { const s = reviewStats(); return `${s.stops} stops · ${s.stopPages} pages`; } },
  { id: "all" as const, label: "Every page", detail: () => `${CASE.package.pages} pages` },
];

export const reviewStats = () => {
  const stops = REVIEW_QUEUE.length; // 6
  const stopPages = REVIEW_QUEUE.reduce((n, s) => n + (s.spanPages ?? 1), 0); // 53
  const total = CASE.package.pages; // 296
  return { stops, stopPages, total, autoCleared: total - stopPages }; // 243 auto-cleared
};
