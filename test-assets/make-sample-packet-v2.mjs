// Generates test-assets/sample-packet-v2.pdf — the HARDER parser-stress packet
// (approved 2026-07-24): same Torres purchase universe as v1 so runs are
// comparable, but tuned to stress exactly what the interim-vs-Paddle
// comparison needs: dense label↔value forms, a long 5-column statement table
// with arithmetically consistent running balance, a low-contrast photocopy-
// style page, and a strongly skewed (8°) VOE with an embedded table.
// Preflight targets (one blank + one duplicate page) are kept so gate
// semantics stay exercised. All content synthetic — "SAMPLE" marked.
// Run: node test-assets/make-sample-packet-v2.mjs
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";

const LETTER = [612, 792];
const ink = rgb(0.12, 0.12, 0.14);
const faint = rgb(0.45, 0.45, 0.5);
const ghost = rgb(0.62, 0.62, 0.66); // photocopy-quality contrast

const doc = await PDFDocument.create();
doc.setProducer("Sheaf test-asset generator");
doc.setCreator("make-sample-packet-v2.mjs");
const mono = await doc.embedFont(StandardFonts.Courier);
const sans = await doc.embedFont(StandardFonts.Helvetica);
const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

const page = () => doc.addPage(LETTER);
function header(p, formId, title, color = ink) {
  p.drawText(formId, { x: 40, y: 750, size: 9, font: mono, color: faint });
  p.drawText("SAMPLE — NOT A REAL DOCUMENT", { x: 380, y: 750, size: 9, font: mono, color: faint });
  p.drawText(title, { x: 40, y: 718, size: 16, font: sansBold, color });
  p.drawLine({ start: { x: 40, y: 708 }, end: { x: 572, y: 708 }, thickness: 1, color });
}

// ---- p.1 URLA facsimile, DENSE two-column layout (label↔value association stress —
// the exact failure mode the judge caught on Paddle's first URLA parse)
{
  const p = page();
  header(p, "Uniform Residential Loan Application — Fannie Mae Form 1003", "Sections 1-4 (condensed)");
  const col = (pairs, x0, x1, startY) => {
    let y = startY;
    for (const [l, v] of pairs) {
      p.drawText(l, { x: x0, y, size: 8.5, font: sans, color: faint });
      p.drawText(v, { x: x1, y, size: 8.5, font: mono, color: ink });
      y -= 16;
    }
  };
  col(
    [
      ["Name", "Ana Torres"],
      ["SSN", "***-**-0000 (SAMPLE)"],
      ["DOB", "1989-03-14"],
      ["Citizenship", "U.S. Citizen"],
      ["Marital Status", "Unmarried"],
      ["Dependents", "0"],
      ["Current Address", "418 Alder Ct"],
      ["City/State/ZIP", "Sacramento CA 95811"],
      ["Years at Address", "4"],
      ["Housing", "Rent $2,150/mo"],
      ["Employer", "Northwind LLC"],
      ["Position", "Senior Analyst"],
      ["Start Date", "2021-02-01"],
      ["Work Phone", "(916) 555-0142"],
    ],
    48,
    150,
    668,
  );
  col(
    [
      ["Loan Amount", "$412,000"],
      ["Loan Purpose", "Purchase"],
      ["Property Address", "902 Meridian Ave"],
      ["Property City", "Sacramento CA 95811"],
      ["Property Value", "$515,000"],
      ["Occupancy", "Primary Residence"],
      ["Base Income (mo.)", "$8,925.00"],
      ["Other Income (mo.)", "$310.00"],
      ["Checking ****4821", "$21,378.65"],
      ["Savings ****7730", "$44,102.19"],
      ["Auto Loan balance", "$9,412.00 ($389/mo)"],
      ["Card VISTA balance", "$1,214.55 ($85/mo)"],
      ["Student Loan", "$0.00 (paid 2024)"],
      ["Judgments/Liens", "None"],
    ],
    318,
    430,
    668,
  );
  p.drawText("Borrower signature: ________________________   Date: ____________", { x: 48, y: 90, size: 10, font: sans, color: ink });
}

// ---- p.2-3 statement with a LONG arithmetically-consistent table (integer-cents math)
let bal = 1820411; // $18,204.11 opening, cents
const fmt = (c) => (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const txns = [
  ["06-01", "OPENING BALANCE", 0],
  ["06-02", "PAYROLL NORTHWIND LLC DIR DEP", 412000],
  ["06-02", "ZELLE FROM R TORRES MEMO RENT SHARE", 62500],
  ["06-03", "GROCER MART #204 SACRAMENTO CA", -18244],
  ["06-05", "RENT ALDER CT LLC ACH REF 88213-A", -215000],
  ["06-05", "COFFEE COLLECTIVE #12", -675],
  ["06-06", "CHECK #1104 CLEARED", -12000],
  ["06-08", "SMUD UTILITIES AUTOPAY JUNE", -14102],
  ["06-09", "TRANSFER TO SAVINGS ****7730 SCHEDULED", -100000],
  ["06-10", "PHARMACY 24 REFUND", 1899],
  ["06-11", "GROCER MART #204 SACRAMENTO CA", -20411],
  ["06-12", "RIDESHARE 3 TRIPS", -4720],
  ["06-13", "INTEREST PAYMENT", 41],
  ["06-16", "PAYROLL NORTHWIND LLC DIR DEP", 412000],
  ["06-16", "CARD PAYMENT VISTA EPAY CONF 2210", -8500],
  ["06-17", "STREAMING SVC MONTHLY", -1599],
  ["06-18", "AUTO LOAN PAYMENT WESTBRIDGE FIN", -38900],
  ["06-19", "CHECK #1105 CLEARED", -7550],
  ["06-20", "GROCER MART #204 SACRAMENTO CA", -19023],
  ["06-21", "SMUD UTILITIES BALANCE ADJ", -102],
  ["06-23", "ZELLE TO M OKAFOR MEMO DINNER", -6200],
  ["06-24", "TRANSFER TO SAVINGS ****7730 SCHEDULED", -100000],
  ["06-25", "ATM WITHDRAWAL BRANCH 0042", -20000],
  ["06-26", "PAYROLL ADJUSTMENT NORTHWIND LLC", 12750],
  ["06-27", "CARD PAYMENT VISTA EPAY CONF 2287", -20300],
  ["06-28", "GROCER MART #204 SACRAMENTO CA", -17688],
  ["06-29", "CHECK #1106 CLEARED", -30000],
  ["06-30", "MONTHLY SERVICE FEE WAIVED", 0],
];
const rowsWithBal = txns.map(([d, desc, amt]) => {
  bal += amt;
  return [d, desc, amt, bal];
});
const closing = bal;
function statementPageV2(n, slice, opening) {
  const p = page();
  header(p, "First Meridian Bank — Statement of Account", `Checking ****4821 — June 2026 — p.${n} of 2`);
  let y = 660;
  if (n === 1) {
    p.drawText(`Opening 06-01: $${fmt(1820411)}    Closing 06-30: $${fmt(closing)}    Holder: Ana Torres`, { x: 48, y, size: 9.5, font: sans, color: ink });
    y -= 26;
  }
  p.drawText("Date   Description                                    Debit       Credit      Balance", { x: 48, y, size: 9, font: mono, color: faint });
  y -= 15;
  for (const [d, desc, amt, b] of slice) {
    const debit = amt < 0 ? fmt(-amt) : "";
    const credit = amt > 0 ? fmt(amt) : "";
    p.drawText(`${d}  ${desc.slice(0, 42).padEnd(42)} ${debit.padStart(10)}  ${credit.padStart(10)}  ${fmt(b).padStart(11)}`, { x: 48, y, size: 9, font: mono, color: ink });
    y -= 14.5;
  }
  if (n === 2) {
    y -= 8;
    p.drawText(`TOTAL DEBITS: $${fmt(rowsWithBal.reduce((s, [, , a]) => (a < 0 ? s - a : s), 0))}   TOTAL CREDITS: $${fmt(rowsWithBal.reduce((s, [, , a]) => (a > 0 ? s + a : s), 0))}`, { x: 48, y, size: 9.5, font: mono, color: ink });
    y -= 16;
    p.drawText(`CLOSING BALANCE 06-30: $${fmt(closing)}`, { x: 48, y, size: 10, font: sansBold, color: ink });
  }
  return p;
}
statementPageV2(1, rowsWithBal.slice(0, 17));
statementPageV2(2, rowsWithBal.slice(17));

// ---- p.4 gov-id (unchanged difficulty — control variable across packets)
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

// ---- p.5 deed page 1 (clean) + p.6 deed page 2 (photocopy-quality: low contrast, 2° skew)
{
  const p = page();
  header(p, "Recorded — Sacramento County Clerk-Recorder", "Grant Deed (p.1 of 2)");
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
{
  const p = page();
  const opts = { size: 9, font: mono, color: ghost, rotate: degrees(2) };
  p.drawText("Grant Deed (p.2 of 2) — recorder stamp page  [photocopy quality]", { x: 52, y: 700, ...opts, font: sansBold, size: 11 });
  const lines = [
    "MAIL TAX STATEMENTS TO: ANA TORRES, 902 MERIDIAN AVE,",
    "SACRAMENTO CA 95811",
    "",
    "Dated: March 2, 2022        MERIDIAN HOLDINGS LP",
    "By: ____________________    Title: Managing Member",
    "",
    "State of California / County of Sacramento",
    "On March 2, 2022 before me, K. Duval, Notary Public,",
    "personally appeared ______________, who proved to me on",
    "the basis of satisfactory evidence to be the person whose",
    "name is subscribed to the within instrument.",
    "",
    "WITNESS my hand and official seal.   [SEAL]",
    "",
    "DOCUMENT #2022-0048112  FEES $27.00  PAGES 2",
    "SACRAMENTO COUNTY CLERK-RECORDER  03/02/2022 11:42 AM",
  ];
  let y = 660;
  let drift = 0;
  for (const line of lines) {
    p.drawText(line, { x: 52 + drift, y, ...opts });
    y -= 18;
    drift += 0.6; // scanner drift
  }
  p.drawText("SAMPLE — NOT A REAL DOCUMENT", { x: 380, y: 750, size: 9, font: mono, color: ghost });
}

// ---- p.7 DELIBERATELY BLANK (preflight target)
page();

// ---- p.8 exact duplicate of statement p.2 (preflight target)
statementPageV2(2, rowsWithBal.slice(17));

// ---- p.9 VOE, skewed 8° WITH an embedded table (skew + table combo — the money shot)
{
  const p = page();
  const skew = degrees(8);
  const line = (t, x, y, extra = {}) => p.drawText(t, { x, y, size: 10, font: mono, color: ink, rotate: skew, ...extra });
  line("Northwind LLC — Verification of Employment", 56, 640, { font: sansBold, size: 14 });
  line("SAMPLE — NOT A REAL DOCUMENT", 340, 690, { color: faint, size: 9 });
  line("Employee: Ana Torres          Title: Senior Analyst", 58, 600);
  line("Start date: 2021-02-01        Status: Full-time", 60, 578);
  line("Verified by: R. Okafor (HR)   Phone: (916) 555-0107", 62, 556);
  line("Compensation history:", 64, 520, { font: sansBold, size: 11 });
  line("Year      Base salary      Bonus        Total", 66, 498, { color: faint, size: 9 });
  line("2024      $ 98,400.00      $ 4,000.00   $102,400.00", 68, 480);
  line("2025      $103,700.00      $ 5,500.00   $109,200.00", 70, 462);
  line("2026 YTD  $107,100.00 /yr  $     0.00   $ 53,550.00", 72, 444);
  line("(This page is intentionally skewed ~8 degrees.)", 74, 400, { color: faint, size: 9 });
}

// ---- p.10 index
{
  const p = page();
  header(p, "Packet Index", "Submitted Documents — Torres Purchase (v2)");
  let y = 670;
  for (const [n, t] of [
    ["1", "URLA / Form 1003, condensed sections (p.1)"],
    ["2-3", "Bank statement, June 2026, full transaction table (p.2-3)"],
    ["4", "Driver license copy (p.4)"],
    ["5-6", "Grant deed, 2 pages incl. recorder stamp page (p.5-6)"],
    ["7-9", "(assembly padding)"],
  ]) {
    p.drawText(n, { x: 48, y, size: 10, font: sans, color: faint });
    p.drawText(t, { x: 240, y, size: 10, font: mono, color: ink });
    y -= 22;
  }
}

const bytes = await doc.save();
writeFileSync("test-assets/sample-packet-v2.pdf", bytes);
console.log(`wrote test-assets/sample-packet-v2.pdf (${bytes.length} bytes, ${doc.getPageCount()} pages)`);
console.log(`closing balance check: $${fmt(closing)} (opening $18,204.11 + net of ${txns.length} txns)`);
