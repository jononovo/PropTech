// Generates test-assets/clean-sample-3p.pdf — a small CLEAN packet that passes the
// auto rule (< 20 pages AND zero red flags → auto-proceed). Run: node test-assets/make-clean-sample.mjs
import { PDFDocument, StandardFonts } from "pdf-lib";
import { writeFileSync } from "node:fs";
const doc = await PDFDocument.create();
doc.setProducer("Sheaf test-asset generator");
const sans = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
for (let i = 1; i <= 3; i++) {
  const p = doc.addPage([612, 792]);
  p.drawText(`Clean Sample Document — page ${i} of 3 (SAMPLE)`, { x: 60, y: 720, size: 14, font: bold });
  for (let y = 680; y > 120; y -= 24) {
    p.drawText(`Line ${Math.round((680 - y) / 24) + 1}: representative body text keeping healthy contrast 0123456789.`, { x: 60, y, size: 11, font: sans });
  }
}
writeFileSync("test-assets/clean-sample-3p.pdf", await doc.save());
console.log("wrote test-assets/clean-sample-3p.pdf");
