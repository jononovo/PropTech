import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Per-page deterministic raster statistics, computed from low-DPI PPM renders
 * (pdftoppm -ppm). PPM (P6) is parsed by hand — header + raw RGB — so no image
 * library is needed. These stats power the HONEST pre-flight checks only:
 * blank detection, contrast, exact-duplicate pages. Blur/skew are analyzer-tier.
 */
export type PageStat = {
  page: number;
  /** mean luminance 0–255 (255 = white) */
  mean: number;
  /** luminance standard deviation — the contrast proxy */
  stddev: number;
  blank: boolean;
  /** sha1 of the raw raster bytes — exact-duplicate detection */
  hash: string;
};

/** A page is "blank" when it is near-uniform and near-white at 36 DPI. */
const BLANK_MAX_STDDEV = 4;
const BLANK_MIN_MEAN = 240;

function parsePpmStats(buf: Buffer): { mean: number; stddev: number } {
  // P6\n<width> <height>\n<maxval>\n<raw RGB…> — whitespace-tolerant header parse.
  if (buf[0] !== 0x50 || buf[1] !== 0x36) throw new Error("not a P6 PPM");
  let pos = 2;
  const ints: number[] = [];
  while (ints.length < 3 && pos < buf.length) {
    // skip whitespace and comments
    while (pos < buf.length) {
      const c = buf[pos] ?? 0;
      if (c === 0x23 /* # */) {
        while (pos < buf.length && buf[pos] !== 0x0a) pos++;
      } else if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) {
        pos++;
      } else break;
    }
    let val = 0;
    let seen = false;
    while (pos < buf.length) {
      const c = buf[pos] ?? 0;
      if (c < 0x30 || c > 0x39) break;
      val = val * 10 + (c - 0x30);
      seen = true;
      pos++;
    }
    if (!seen) throw new Error("malformed PPM header");
    ints.push(val);
  }
  pos++; // single whitespace after maxval
  const [width, height] = [ints[0] ?? 0, ints[1] ?? 0];
  const pixels = width * height;
  if (pixels === 0) throw new Error("empty PPM");
  // Sample every 4th pixel — plenty at 36 DPI, keeps 300-page packets in ms range.
  const step = 4 * 3;
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let i = pos; i + 2 < buf.length; i += step) {
    const lum = ((buf[i] ?? 0) + (buf[i + 1] ?? 0) + (buf[i + 2] ?? 0)) / 3;
    sum += lum;
    sumSq += lum * lum;
    n++;
  }
  if (n === 0) throw new Error("no pixels sampled");
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  return { mean, stddev: Math.sqrt(variance) };
}

/** Page number from a pdftoppm output filename like `page-07.ppm`. */
function pageFromFilename(name: string): number | undefined {
  const m = /-(\d+)\.ppm$/.exec(name);
  return m?.[1] ? Number.parseInt(m[1], 10) : undefined;
}

/** Read every `<prefix>-N.ppm` in dir and compute per-page stats, sorted by page. */
export function statsFromPpmDir(dir: string, prefix: string): PageStat[] {
  const stats: PageStat[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.startsWith(prefix) || !name.endsWith(".ppm")) continue;
    const page = pageFromFilename(name);
    if (page === undefined) continue;
    const buf = readFileSync(path.join(dir, name));
    const { mean, stddev } = parsePpmStats(buf);
    stats.push({
      page,
      mean,
      stddev,
      blank: stddev < BLANK_MAX_STDDEV && mean > BLANK_MIN_MEAN,
      hash: createHash("sha1").update(buf).digest("hex"),
    });
  }
  return stats.sort((a, b) => a.page - b.page);
}
