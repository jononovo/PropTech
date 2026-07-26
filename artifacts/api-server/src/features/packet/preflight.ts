import { execFile } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { statsFromPpmDir, type PageStat } from "./raster";

const run = promisify(execFile);

/**
 * Deterministic pre-flight (analyzer spec §3): file validity, page count, metadata
 * snapshot, per-page blank/contrast/duplicate/embedded-image-DPI checks. Poppler CLI
 * (pdfinfo/pdftoppm/pdfimages) — milliseconds per page, NO model calls, and no image
 * "enhancement" is ever applied: gate, don't retouch. Blur/skew scoring is
 * analyzer-tier and deliberately not claimed here.
 */

export type PdfInfo = {
  pages: number;
  encrypted: boolean;
  producer?: string;
  creator?: string;
  createdAt?: string;
  modifiedAt?: string;
};

export type PreflightReport = {
  verdict: string;
  flags: string[];
  estimateUsd: number;
  estimateMinutes: number;
  metadata: { producer?: string; creator?: string; createdAt?: string; modifiedAt?: string };
  thumbnails: { page: number; reason: string }[];
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
  } catch {
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

function buildFlags(stats: PageStat[], lowDpi: Map<number, number>): string[] {
  const flags: string[] = [];
  const seenHashes = new Map<string, number>();
  for (const s of stats) {
    if (s.blank) flags.push(`p.${s.page} appears blank`);
    else if (s.stddev < LOW_CONTRAST_MAX_STDDEV) flags.push(`p.${s.page} very low contrast`);
    const dup = seenHashes.get(s.hash);
    if (dup !== undefined) flags.push(`p.${s.page} exact duplicate of p.${dup}`);
    else seenHashes.set(s.hash, s.page);
  }
  for (const [page, ppi] of [...lowDpi.entries()].sort((a, b) => a[0] - b[0])) {
    flags.push(`p.${page} embedded image ~${ppi} DPI — below 150`);
  }
  return flags;
}

// Rough full-pipeline rates (July 2026, documented assumption for the staff-facing
// estimate): parse (hosted PaddleOCR-VL, per-token) ≈ $0.001/page; judge (Anthropic
// vision, ~1.5k tokens in + 400 out per page) ≈ $0.012/page; deep scans/retries ≈ +15%.
// The judge dominates at high page counts — that asymmetry is why the gate exists.
const PARSE_USD_PER_PAGE = 0.001;
const JUDGE_USD_PER_PAGE = 0.012;
const OVERHEAD_FACTOR = 1.15;

function estimate(pages: number): { usd: number; minutes: number } {
  const usd = Math.max(0.05, Math.round(pages * (PARSE_USD_PER_PAGE + JUDGE_USD_PER_PAGE) * OVERHEAD_FACTOR * 100) / 100);
  return { usd, minutes: Math.max(1, Math.ceil(pages / 25)) };
}

/** 2 worst pages (flagged first, then lowest contrast) + 1 best (highest contrast, unflagged). */
function pickThumbnails(stats: PageStat[], flags: string[]): { page: number; reason: string }[] {
  const flaggedPages = new Set<number>();
  for (const f of flags) {
    const m = /^p\.(\d+)/.exec(f);
    if (m?.[1]) flaggedPages.add(Number.parseInt(m[1], 10));
  }
  const reasonFor = (page: number): string => flags.find((f) => f.startsWith(`p.${page} `)) ?? "lowest contrast in packet";
  const worst = [
    ...stats.filter((s) => flaggedPages.has(s.page)),
    ...stats.filter((s) => !flaggedPages.has(s.page)).sort((a, b) => a.stddev - b.stddev),
  ].slice(0, 2);
  const best = stats
    .filter((s) => !flaggedPages.has(s.page) && !worst.some((w) => w.page === s.page))
    .sort((a, b) => b.stddev - a.stddev)[0];
  const picks = worst.map((w) => ({ page: w.page, reason: reasonFor(w.page) }));
  if (best) picks.push({ page: best.page, reason: "cleanest page in packet" });
  return picks;
}

async function renderThumbnail(pdfPath: string, page: number, thumbsDir: string): Promise<void> {
  const prefix = path.join(thumbsDir, `t${page}`);
  await run("pdftoppm", ["-png", "-r", "60", "-f", String(page), "-l", String(page), pdfPath, prefix]);
  const made = readdirSync(thumbsDir).find((n) => n.startsWith(`t${page}-`) && n.endsWith(".png"));
  if (made) renameSync(path.join(thumbsDir, made), path.join(thumbsDir, `page-${page}.png`));
}

/**
 * Per-file quality flags for the multi-file intake manifest (Phase 5) — the
 * SAME deterministic checks pre-flight runs (blank/contrast/duplicate raster
 * pass + embedded-image DPI), without thumbnails or estimates. No model calls.
 */
export async function quickFileFlags(pdfPath: string): Promise<string[]> {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "sheaf-manifest-"));
  try {
    await run("pdftoppm", ["-r", "36", pdfPath, path.join(tmp, "page")]);
    const stats = statsFromPpmDir(tmp, "page");
    return buildFlags(stats, await lowDpiPages(pdfPath));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export async function runPreflight(pdfPath: string, info: PdfInfo, thumbsDir: string): Promise<PreflightReport> {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "sheaf-preflight-"));
  try {
    // PPM is pdftoppm's default output format (no flag needed; -png etc. are the overrides).
    await run("pdftoppm", ["-r", "36", pdfPath, path.join(tmp, "page")]);
    const stats = statsFromPpmDir(tmp, "page");
    const flags = buildFlags(stats, await lowDpiPages(pdfPath));
    const { usd, minutes } = estimate(info.pages);
    const thumbnails = pickThumbnails(stats, flags);
    rmSync(thumbsDir, { recursive: true, force: true });
    mkdirSync(thumbsDir, { recursive: true });
    for (const t of thumbnails) await renderThumbnail(pdfPath, t.page, thumbsDir);
    const verdict =
      flags.length === 0
        ? `${info.pages} page${info.pages === 1 ? "" : "s"}, no red flags — clean pre-flight`
        : `${info.pages} page${info.pages === 1 ? "" : "s"}, ${flags.length} red flag${flags.length === 1 ? "" : "s"} — needs a human decision`;
    const metadata: PreflightReport["metadata"] = {};
    if (info.producer) metadata.producer = info.producer;
    if (info.creator) metadata.creator = info.creator;
    if (info.createdAt) metadata.createdAt = info.createdAt;
    if (info.modifiedAt) metadata.modifiedAt = info.modifiedAt;
    return { verdict, flags, estimateUsd: usd, estimateMinutes: minutes, metadata, thumbnails };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
