import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { statsFromPpmDir, type PageStat } from "./raster";

const run = promisify(execFile);

/**
 * Deterministic per-file pre-flight (analyzer spec §3, file-native intake):
 * file validity, page count, per-page blank/contrast/duplicate/embedded-image-DPI
 * checks. Poppler CLI (pdfinfo/pdftoppm/pdfimages) — milliseconds per page,
 * NO model calls, and no image "enhancement" is ever applied: gate, don't retouch.
 * Flags are STRUCTURED (code + 1-based in-file page + note); the fileId is
 * implicit on SourceFile.flags and stamped in by whoever aggregates across files.
 */

export type FileFlag = { page?: number; code: string; note: string };

export type PdfInfo = {
  pages: number;
  encrypted: boolean;
  producer?: string;
  creator?: string;
  createdAt?: string;
  modifiedAt?: string;
};

export async function readPdfInfo(pdfPath: string): Promise<PdfInfo | { error: string }> {
  try {
    const { stdout } = await run("pdfinfo", [pdfPath]);
    const get = (key: string): string | undefined => {
      const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(stdout);
      return m?.[1]?.trim();
    };
    const pages = Number.parseInt(get("Pages") ?? "", 10);
    if (!Number.isFinite(pages) || pages <= 0) return { error: "Could not read a page count — file does not parse as a PDF." };
    const info: PdfInfo = { pages, encrypted: (get("Encrypted") ?? "no").startsWith("yes") };
    const producer = get("Producer");
    const creator = get("Creator");
    const createdAt = get("CreationDate");
    const modifiedAt = get("ModDate");
    if (producer) info.producer = producer;
    if (creator) info.creator = creator;
    if (createdAt) info.createdAt = createdAt;
    if (modifiedAt) info.modifiedAt = modifiedAt;
    return info;
  } catch (err) {
    // Distinguish "your file is bad" from "our tooling is broken" — an
    // environment problem must never be blamed on the uploader's file.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error("[preflight] pdfinfo binary not found — poppler missing from this environment");
      return { error: "Pre-flight tooling unavailable on the server (pdfinfo missing) — this is an environment problem, not your file." };
    }
    console.error("[preflight] pdfinfo failed:", err instanceof Error ? err.message : err);
    return { error: "Not a valid PDF — pre-flight could not open it." };
  }
}

/**
 * Embedded-image DPI check via `pdfimages -list`. Only large rasters count —
 * a low-DPI logo is noise, a low-DPI page scan is a real legibility risk.
 * Heuristic: flag images under 150 DPI whose pixel area exceeds ~a half page at 72 DPI.
 */
async function lowDpiPages(pdfPath: string): Promise<Map<number, number>> {
  const flagged = new Map<number, number>();
  try {
    const { stdout } = await run("pdfimages", ["-list", pdfPath]);
    const lines = stdout.split("\n").slice(2);
    for (const line of lines) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 14 || cols[2] !== "image") continue;
      const page = Number.parseInt(cols[0] ?? "", 10);
      const width = Number.parseInt(cols[3] ?? "", 10);
      const height = Number.parseInt(cols[4] ?? "", 10);
      const xppi = Number.parseInt(cols[12] ?? "", 10);
      if (!Number.isFinite(page) || !Number.isFinite(xppi)) continue;
      if (xppi > 0 && xppi < 150 && width * height >= 200_000) {
        const prev = flagged.get(page);
        if (prev === undefined || xppi < prev) flagged.set(page, xppi);
      }
    }
  } catch {
    // No embedded images (pdfimages exits non-zero on some malformed streams) — not a red flag by itself.
  }
  return flagged;
}

const LOW_CONTRAST_MAX_STDDEV = 8;

function buildFlags(stats: PageStat[], lowDpi: Map<number, number>): FileFlag[] {
  const flags: FileFlag[] = [];
  const seenHashes = new Map<string, number>();
  for (const s of stats) {
    if (s.blank) flags.push({ page: s.page, code: "blank", note: `p.${s.page} appears blank` });
    else if (s.stddev < LOW_CONTRAST_MAX_STDDEV)
      flags.push({ page: s.page, code: "low_contrast", note: `p.${s.page} very low contrast` });
    const dup = seenHashes.get(s.hash);
    if (dup !== undefined) flags.push({ page: s.page, code: "duplicate", note: `p.${s.page} exact duplicate of p.${dup}` });
    else seenHashes.set(s.hash, s.page);
  }
  for (const [page, ppi] of [...lowDpi.entries()].sort((a, b) => a[0] - b[0])) {
    flags.push({ page, code: "low_dpi", note: `p.${page} embedded image ~${ppi} DPI — below 150` });
  }
  return flags;
}

/**
 * Per-file structured quality flags, computed once at drop and stored on the
 * SourceFile registry row (fileId implicit). Deterministic raster pass at 36 DPI
 * + embedded-image DPI listing; no thumbnails, no estimates, no model calls.
 */
export async function quickFileFlags(pdfPath: string): Promise<FileFlag[]> {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "sheaf-preflight-"));
  try {
    await run("pdftoppm", ["-r", "36", pdfPath, path.join(tmp, "page")]);
    const stats = statsFromPpmDir(tmp, "page");
    return buildFlags(stats, await lowDpiPages(pdfPath));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Rough full-pipeline rates (July 2026, documented assumption for the staff-facing
// estimate): parse (hosted PaddleOCR-VL, per-token) ≈ $0.001/page; judge (Anthropic
// vision, ~1.5k tokens in + 400 out per page) ≈ $0.012/page; deep scans/retries ≈ +15%.
// The judge dominates at high page counts — that asymmetry is why the gate exists.
const PARSE_USD_PER_PAGE = 0.001;
const JUDGE_USD_PER_PAGE = 0.012;
const OVERHEAD_FACTOR = 1.15;

export function estimateRun(pages: number): { usd: number; minutes: number } {
  const usd = Math.max(0.05, Math.round(pages * (PARSE_USD_PER_PAGE + JUDGE_USD_PER_PAGE) * OVERHEAD_FACTOR * 100) / 100);
  return { usd, minutes: Math.max(1, Math.ceil(pages / 25)) };
}
