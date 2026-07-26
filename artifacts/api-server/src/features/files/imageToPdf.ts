import { PDFDocument } from "pdf-lib";

/**
 * Image intake — phone photos of licenses, paystubs, insurance cards.
 *
 * One image becomes one single-page PDF at the receive seam, BEFORE anything
 * else sees it. The rest of the pipeline (pre-flight, analyzer, approval,
 * storage) keeps its single assumption: every SourceFile is a PDF.
 * Deliberately jpg/png only — HEIC needs a native decoder, Word/Excel need
 * lossy conversion; neither belongs in an audit trail (ruled Jul 26 2026).
 */
export const CONVERTIBLE_IMAGE_RE = /\.(jpe?g|png)$/i;

/** Wrap one jpg/png in a single-page PDF sized to the image (1px = 1pt). */
export async function imageToPdf(bytes: Buffer, filename: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const image = /\.png$/i.test(filename) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  const page = doc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  return Buffer.from(await doc.save());
}
