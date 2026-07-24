// Generates test-assets/sample-packet-v1.pdf — the loan-shaped test packet
// (parallel-thread note 4): URLA-style page, 2-page bank statement, ID page,
// deed page, one DELIBERATELY blank page (pre-flight must catch it) and one
// duplicated statement page (ditto), plus one skewed page for the future
// parser to prove itself against. All content is synthetic — "SAMPLE" marked.
// Run: node test-assets/make-sample-packet.mjs
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";

const LETTER = [612, 792];
const ink = rgb(0.12, 0.12, 0.14);
const faint = rgb(0.45, 0.45, 0.5);

const doc = await PDFDocument.create();
doc.setProducer("Sheaf test-asset generator");
doc.setCreator("make-sample-packet.mjs");
const mono = await doc.embedFont(StandardFonts.Courier);
const sans = await doc.embedFont(StandardFonts.Helvetica);
const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

function page() {
  return doc.addPage(LETTER);
}
function header(p, formId, title) {
  p.drawText(formId, { x: 40, y: 750, size: 9, font: mono, color: faint });
  p.drawText("SAMPLE — NOT A REAL DOCUMENT", { x: 380, y: 750, size: 9, font: mono, color: faint });
  p.drawText(title, { x: 40, y: 718, size: 16, font: sansBold, color: ink });
  p.drawLine({ start: { x: 40, y: 708 }, end: { x: 572, y: 708 }, thickness: 1, color: ink });
}
function rows(p, startY, pairs, { font = sans, size = 10, step = 22 } = {}) {
  let y = startY;
  for (const [label, value] of pairs) {
    p.drawText(label, { x: 48, y, size, font, color: faint });
    p.drawText(value, { x: 240, y, size, font: mono, color: ink });
    y -= step;
  }
  return y;
}

// p.1 — URLA / Form 1003 facsimile (form ID printed — the analyzer's split signal)
{
  const p = page();
  header(p, "Uniform Residential Loan Application — Fannie Mae Form 1003", "Section 1: Borrower Information");
  rows(p, 670, [
    ["Name", "Ana Torres"],
    ["Social Security Number", "***-**-0000 (SAMPLE)"],
    ["Date of Birth", "1989-03-14"],
    ["Citizenship", "U.S. Citizen"],
    ["Marital Status", "Unmarried"],
    ["Current Address", "418 Alder Ct, Sacramento, CA 95811"],
    ["Years at Address", "4"],
    ["Loan Amount", "$412,000"],
    ["Loan Purpose", "Purchase"],
    ["Property Address", "902 Meridian Ave, Sacramento, CA"],
  ]);
  p.drawText("Page 1 of 9 — Borrower signature: ________________________", { x: 48, y: 90, size: 10, font: sans, color: ink });
}

// p.2–3 — bank statement, two pages (p.3 gets re-inserted later as the duplicate)
function statementPage(n) {
  const p = page();
  header(p, "First Meridian Bank — Statement of Account", `Checking ****4821 — Statement p.${n}`);
  rows(p, 670, [
    ["Statement Period", "2026-06-01 to 2026-06-30"],
    ["Account Holder", "Ana Torres"],
    ["Opening Balance", "$18,204.11"],
    ["Closing Balance", "$21,378.65"],
  ]);
  let y = 560;
  p.drawText("Date        Description                        Amount      Balance", { x: 48, y, size: 10, font: mono, color: faint });
  y -= 18;
  const lines =
    n === 1
      ? [
          ["06-02", "PAYROLL NORTHWIND LLC", "+4,120.00", "22,324.11"],
          ["06-05", "RENT — ALDER CT LLC", "-2,150.00", "20,174.11"],
          ["06-09", "GROCER MART #204", "-182.44", "19,991.67"],
          ["06-16", "PAYROLL NORTHWIND LLC", "+4,120.00", "24,111.67"],
          ["06-18", "AUTO LOAN PAYMENT", "-389.00", "23,722.67"],
        ]
      : [
          ["06-21", "UTILITIES — SMUD", "-141.02", "23,581.65"],
          ["06-24", "TRANSFER TO SAVINGS", "-2,000.00", "21,581.65"],
          ["06-27", "CARD PAYMENT — VISTA", "-203.00", "21,378.65"],
        ];
  for (const [d, desc, amt, bal] of lines) {
    p.drawText(`${d}   ${desc.padEnd(34)} ${amt.padStart(10)}  ${bal.padStart(10)}`, { x: 48, y, size: 10, font: mono, color: ink });
    y -= 18;
  }
}
statementPage(1);
statementPage(2);

// p.4 — government ID facsimile
{
  const p = page();
  header(p, "CA DMV — Driver License (photocopy)", "Identification Document");
  p.drawRectangle({ x: 48, y: 430, width: 320, height: 200, borderColor: ink, borderWidth: 1.5 });
  p.drawRectangle({ x: 64, y: 470, width: 90, height: 110, borderColor: faint, borderWidth: 1 });
  p.drawText("PHOTO", { x: 84, y: 518, size: 10, font: sans, color: faint });
  p.drawText("CALIFORNIA  DRIVER LICENSE", { x: 170, y: 600, size: 11, font: sansBold, color: ink });
  p.drawText("DL  D4821907", { x: 170, y: 578, size: 10, font: mono, color: ink });
  p.drawText("LN  TORRES        FN  ANA", { x: 170, y: 560, size: 10, font: mono, color: ink });
  p.drawText("DOB 03/14/1989", { x: 170, y: 542, size: 10, font: mono, color: ink });
  p.drawText("EXP 03/14/2028", { x: 170, y: 524, size: 10, font: mono, color: ink });
  p.drawText("418 ALDER CT SACRAMENTO CA 95811", { x: 170, y: 506, size: 8.5, font: mono, color: ink });
}

// p.5 — deed page
{
  const p = page();
  header(p, "Recorded — Sacramento County Clerk-Recorder", "Grant Deed (excerpt)");
  const text = [
    "APN: 006-0231-018     Recording #2022-0048112",
    "",
    "FOR A VALUABLE CONSIDERATION, receipt of which is hereby",
    "acknowledged, MERIDIAN HOLDINGS LP hereby GRANT(S) to",
    "ANA TORRES, a single woman, the real property in the City",
    "of Sacramento, County of Sacramento, State of California,",
    "described as: LOT 18, TRACT 2031, per map recorded in Book",
    "144 of Maps, page 61, Sacramento County records.",
  ];
  let y = 660;
  for (const line of text) {
    p.drawText(line, { x: 48, y, size: 11, font: mono, color: ink });
    y -= 20;
  }
}

// p.6 — DELIBERATELY BLANK (pre-flight must flag this)
page();

// p.7 — exact duplicate of statement p.2 (pre-flight must flag this)
statementPage(2);

// p.8 — skewed page (parser-tier challenge; pre-flight does NOT claim skew detection)
{
  const p = page();
  const opts = { size: 11, font: mono, color: ink, rotate: degrees(4) };
  p.drawText("Northwind LLC — Verification of Employment", { x: 60, y: 640, ...opts, font: sansBold, size: 14 });
  p.drawText("Employee: Ana Torres      Title: Senior Analyst", { x: 60, y: 600, ...opts });
  p.drawText("Start date: 2021-02-01    Status: Full-time", { x: 60, y: 578, ...opts });
  p.drawText("Base salary: $107,100/yr  Verified by: R. Okafor (HR)", { x: 60, y: 556, ...opts });
  p.drawText("(This page is intentionally skewed ~4 degrees.)", { x: 60, y: 500, ...opts, color: faint });
}

// p.9 — closing page
{
  const p = page();
  header(p, "Packet Index", "Submitted Documents — Torres Purchase");
  rows(p, 670, [
    ["1", "URLA / Form 1003 (p.1)"],
    ["2-3", "Bank statement, June 2026 (p.2-3)"],
    ["4", "Driver license copy (p.4)"],
    ["5", "Grant deed excerpt (p.5)"],
    ["6-8", "(assembly padding)"],
  ]);
}

const bytes = await doc.save();
writeFileSync("test-assets/sample-packet-v1.pdf", bytes);
console.log(`wrote test-assets/sample-packet-v1.pdf (${bytes.length} bytes, ${doc.getPageCount()} pages)`);
