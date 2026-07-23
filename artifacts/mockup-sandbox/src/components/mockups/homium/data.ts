// ─────────────────────────────────────────────────────────────────────────────
// HOMIUM BACKBONE — shared story. Single source of truth for all four pages.
// One case, one package, one set of requirements. Do not fork this data.
// ─────────────────────────────────────────────────────────────────────────────

export const TODAY = new Date(2026, 6, 23); // Jul 23, 2026
export const CLOSING = new Date(2026, 8, 3); // Sep 3, 2026

export const CASE = {
  id: "HM-2026-0412",
  applicant: "Michael R. Henderson",
  loan: "Purchase Loan — CA Variant",
  property: "1462 Sycamore Ct, Pasadena CA",
  program: "Homium Deposit Assist · $74,000 equity share",
  originator: "Sarah Jenkins — Golden State Home Loans",
  stage: "Underwriting",
  package: { file: "Henderson_HM-0412_Package.pdf", pages: 296, size: "44.8 MB", received: "Jul 18, 09:42" },
};

export type Role = "Applicant" | "Originator" | "Underwriter" | "Manager" | "Title Company";

// accepted  = underwriter signed off — staleness clocks STOP (hard expiries never stop)
// clean     = filed, all checks passed, awaiting underwriter review
// review    = held in enhanced/deep review by the AI — no human action needed yet
// flagged   = exception — needs a human verdict
// missing   = required but not found in the package
// requested = asked for via drafted email — waiting on the other side
export type ReqStatus = "accepted" | "clean" | "review" | "flagged" | "missing" | "requested";

export interface Expiry {
  rule: string;            // plain-language rule, e.g. "Statements older than 90 days are inadmissible"
  staleOn: Date;           // the date it stops being admissible
  kind: "staleness" | "hard"; // staleness stops on acceptance; hard never stops
  note?: string;           // one-sentence situational note
}

export interface Req {
  id: string;
  name: string;
  formats: string;
  required: boolean;
  status: ReqStatus;
  file?: string;
  pages?: string;          // page span inside the 296-page package
  receivedOn?: string;
  acceptedOn?: string;     // set only when status === "accepted"
  conf?: number;           // AI match confidence %
  scores?: { q: number; f: number; fraud: string };
  flag?: { kind: string; note: string; severity: "clay" | "amber" | "slate" };
  expiry?: Expiry;
  desc?: string;
}

export interface Section { id: string; num: string; name: string; owner: Role; reqs: Req[] }

export const SECTIONS: Section[] = [
  { id: "s1", num: "01", name: "Initial Application", owner: "Applicant", reqs: [
    { id: "a1", name: "URLA — Form 1003", formats: ".PDF", required: true, status: "accepted", file: "urla_form1003.pdf", pages: "1–9", receivedOn: "Jul 18", acceptedOn: "Jul 20", conf: 99, desc: "Uniform Residential Loan Application, all eight sections complete. Borrower signature present on p.9." },
    { id: "a2", name: "Homium Program Attestation", formats: ".PDF", required: true, status: "accepted", file: "homium_attestation.pdf", pages: "10–11", receivedOn: "Jul 18", acceptedOn: "Jul 20", conf: 98, desc: "Equity-share deposit assistance attestation — terms acknowledged, countersigned by originator." },
    { id: "a3", name: "Disclosure Acknowledgments", formats: ".PDF", required: true, status: "accepted", file: "disclosures.pdf", pages: "12–18", receivedOn: "Jul 18", acceptedOn: "Jul 21", conf: 97, desc: "LE receipt, ECOA, and CA-required disclosures. All initials accounted for." },
  ]},
  { id: "s2", num: "02", name: "Identity Verification", owner: "Applicant", reqs: [
    { id: "b1", name: "Government ID — Driver License", formats: ".PDF .JPG", required: true, status: "accepted", file: "henderson_license.pdf", pages: "19–20", receivedOn: "Jul 18", acceptedOn: "Jul 20", conf: 99, desc: "CA driver license, front and back. Face, DOB and address legible.",
      expiry: { rule: "ID must remain valid through closing", staleOn: new Date(2026, 7, 30), kind: "hard", note: "Accepted — but the license itself expires Aug 30, four days before a slipped closing would need it. Hard expiries survive acceptance." } },
    { id: "b2", name: "SSN Verification", formats: ".PDF", required: true, status: "accepted", file: "ssa_verification.pdf", pages: "21", receivedOn: "Jul 18", acceptedOn: "Jul 20", conf: 96, desc: "SSA verification letter matching the name and SSN on the 1003." },
  ]},
  { id: "s3", num: "03", name: "Income & Assets", owner: "Applicant", reqs: [
    { id: "c1", name: "W-2 Forms (2024 + 2025)", formats: ".PDF", required: true, status: "accepted", file: "w2_2024_2025.pdf", pages: "22–25", receivedOn: "Jul 18", acceptedOn: "Jul 20", conf: 98, desc: "Both years, BrightPath Logistics. EIN and wages cross-check against returns. Accepted — staleness clock stopped." },
    { id: "c2", name: "Pay Stubs — Last 30 Days", formats: ".PDF .JPG", required: true, status: "clean", file: "paystubs_jun_jul.pdf", pages: "26–29", receivedOn: "Jul 18", conf: 97, scores: { q: 94, f: 96, fraud: "Low · 2%" }, desc: "Two stubs covering Jun 8 – Jul 5. Gross and YTD consistent with the 1003.",
      expiry: { rule: "Pay stubs older than 30 days are inadmissible", staleOn: new Date(2026, 7, 7), kind: "staleness", note: "Goes stale Aug 7 — before closing. Accept in underwriting before then, or a fresh stub will be needed." } },
    { id: "c3", name: "Bank Statements — Last 3 Months", formats: ".PDF", required: true, status: "flagged", file: "wells_chase_may_jul.pdf", pages: "30–68", receivedOn: "Jul 18", conf: 95, scores: { q: 58, f: 88, fraud: "Low · 3%" },
      flag: { kind: "Scan defect", note: "The Wells Fargo statement's page 2 was scanned at an angle — the account number is cut off.", severity: "amber" },
      expiry: { rule: "Statements older than 90 days are inadmissible", staleOn: new Date(2026, 7, 15), kind: "staleness", note: "The May cycle goes stale Aug 15 — nineteen days before closing. Resolve the flag and accept before then." },
      desc: "Wells Fargo checking + Chase savings, three cycles. Deposit pattern matches payroll; one page failed the legibility check." },
    { id: "c4", name: "Gift Letter", formats: ".PDF", required: true, status: "missing",
      flag: { kind: "Not found", note: "A $9,500 deposit on Jun 14 looks like gift funds, but no gift letter was found in the 296-page package.", severity: "amber" },
      desc: "Required whenever a large non-payroll deposit appears. The Jun 14 deposit needs a signed letter with a no-repayment clause." },
    { id: "c5", name: "Federal Tax Returns (2024 + 2025)", formats: ".PDF", required: true, status: "clean", file: "returns_24_25.pdf", pages: "69–102", receivedOn: "Jul 18", conf: 98, desc: "Signed 1040s, both years, all schedules. AGI consistent year over year." },
  ]},
  { id: "s4", num: "04", name: "Property Valuation", owner: "Originator", reqs: [
    { id: "d1", name: "Purchase Agreement", formats: ".PDF", required: true, status: "accepted", file: "purchase_agreement.pdf", pages: "103–134", receivedOn: "Jul 18", acceptedOn: "Jul 22", conf: 99, desc: "Fully executed at $612,000 with Homium equity-share rider. All initials present." },
    { id: "d2", name: "Appraisal Report", formats: ".PDF", required: true, status: "clean", file: "appraisal_sycamore.pdf", pages: "135–178", receivedOn: "Jul 21", conf: 96, desc: "URAR appraisal, value $618,000, effective May 30.",
      expiry: { rule: "Appraisal valid 120 days from effective date", staleOn: new Date(2026, 8, 27), kind: "staleness", note: "Valid until Sep 27 — comfortably past the closing target." } },
    { id: "d3", name: "Homeowners Insurance Binder", formats: ".PDF", required: true, status: "requested", receivedOn: undefined, desc: "Binder with dwelling coverage at replacement cost, Homium named as additional insured. Requested from the originator Jul 22 — secure upload link sent." },
    { id: "d4", name: "Flood Certification", formats: ".PDF", required: true, status: "clean", file: "flood_cert.pdf", pages: "179", receivedOn: "Jul 18", conf: 98, desc: "Zone X determination — flood insurance not required." },
  ]},
  { id: "s5", num: "05", name: "Title & Escrow", owner: "Title Company", reqs: [
    { id: "e1", name: "Title Commitment", formats: ".PDF", required: true, status: "review", file: "title_commitment.pdf", pages: "180–204", receivedOn: "Jul 20", conf: 95, scores: { q: 96, f: 98, fraud: "Under review" },
      flag: { kind: "Enhanced review", note: "The notary seal on p.197 differs from the county registry sample. Held in deep review — two of three checks complete. No action needed from you yet.", severity: "slate" },
      desc: "ALTA commitment from Foothill Title. Schedule B exceptions are standard; one notarization is under automated deep review." },
    { id: "e2", name: "Prior Warranty Deed", formats: ".PDF", required: true, status: "clean", file: "prior_deed.pdf", pages: "205–210", receivedOn: "Jul 20", conf: 97, desc: "Prior recorded deed; grantor chain consistent with the commitment." },
    { id: "e3", name: "Preliminary Closing Disclosure", formats: ".PDF", required: false, status: "missing", desc: "Due from escrow no later than Aug 31 — three days before closing. Not expected yet." },
  ]},
  { id: "s6", num: "06", name: "Credit & Compliance", owner: "Underwriter", reqs: [
    { id: "f1", name: "Credit Report — Tri-Merge", formats: ".PDF", required: true, status: "clean", file: "credit_trimerge.pdf", pages: "211–242", receivedOn: "Jul 18", conf: 99, desc: "Tri-merge, mid-score 741. No disputed accounts.",
      expiry: { rule: "Credit reports must be current at closing — 120 days", staleOn: new Date(2026, 10, 2), kind: "hard", note: "Current until Nov 2 — no risk to this closing." } },
    { id: "f2", name: "Background Check — CA DOJ", formats: ".PDF", required: true, status: "clean", file: "doj_check.pdf", pages: "243–246", receivedOn: "Jul 18", conf: 97, desc: "State background check, clear, issued May 30.",
      expiry: { rule: "Background checks valid 60 days — must be current at closing", staleOn: new Date(2026, 6, 29), kind: "staleness", note: "Goes stale Jul 29. If underwriting isn't cleared by then, it must be re-ordered — 3–5 business day turnaround." } },
    { id: "f3", name: "OFAC / Watchlist Screening", formats: ".PDF", required: true, status: "accepted", file: "ofac_screen.pdf", pages: "247", receivedOn: "Jul 18", acceptedOn: "Jul 21", conf: 98, desc: "Automated watchlist screen — no matches." },
  ]},
];

export const UNASSIGNED = [
  { id: "u1", label: "Correspondence & fax covers", pages: "248–288", note: "41 pages of emails and cover sheets — nothing matches a requirement. Suggest: archive." },
  { id: "u2", label: "SoCal Edison bill — June 2026", pages: "289–296", note: "No matching requirement — possibly proof of residence; not required for CA purchase loans." },
];

export const AUDIT = [
  { time: "Jul 18 · 09:42", text: "Package received — 296 pages" },
  { time: "Jul 18 · 09:44", text: "19 documents identified, 17 matched to the checklist" },
  { time: "Jul 18 · 09:44", text: "3 exceptions surfaced for review" },
  { time: "Jul 20 · 14:10", text: "Underwriter accepted W-2 Forms — staleness clock stopped" },
  { time: "Jul 22 · 11:31", text: "Insurance binder requested from originator — secure link sent" },
];

// ── helpers ──────────────────────────────────────────────────────────────────
export const allReqs = () => SECTIONS.flatMap(s => s.reqs.map(r => ({ req: r, sec: s })));
export const daysTo = (d: Date) => Math.round((d.getTime() - TODAY.getTime()) / 86400000);
export const daysToClose = daysTo(CLOSING); // 42
export type Band = "escalate" | "warn" | "watch" | "quiet";
export const band = (days: number): Band => (days <= 7 ? "escalate" : days <= 30 ? "warn" : days <= 90 ? "watch" : "quiet");
export const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Live clocks: expiry present AND (hard || not yet accepted). Sorted most urgent first.
export const liveClocks = () =>
  allReqs()
    .filter(({ req }) => req.expiry && (req.expiry.kind === "hard" || req.status !== "accepted"))
    .map(x => ({ ...x, days: daysTo(x.req.expiry!.staleOn) }))
    .sort((a, b) => a.days - b.days);

// Stopped clocks: staleness rules neutralized by acceptance.
export const stoppedClocks = () =>
  allReqs().filter(({ req }) => req.expiry && req.expiry.kind === "staleness" && req.status === "accepted")
    .concat(allReqs().filter(({ req }) => !req.expiry && req.status === "accepted"));

export const alarmCount = () => liveClocks().filter(x => x.days <= 30).length; // 3
export const exceptions = () => allReqs().filter(({ req }) => req.status === "flagged" || req.status === "missing" && req.required || req.status === "review");

export const stats = () => {
  const reqs = allReqs();
  const found = reqs.filter(({ req }) => req.file).length; // 17
  const quiet = reqs.filter(({ req }) => (req.status === "clean" || req.status === "accepted") && !req.flag).length;
  const attention = reqs.filter(({ req }) => req.status === "flagged" || (req.status === "missing" && req.required)).length;
  return { found, quiet, attention, unassigned: UNASSIGNED.length };
};
