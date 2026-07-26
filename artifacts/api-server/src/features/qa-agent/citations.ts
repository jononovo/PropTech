import { readFileParseText } from "../../lib/packetObjectStore";

/**
 * Citation resolver — quote → on-page bounding box(es) (qa-agent spec §5).
 * Consumes the elements projection (typed blocks + pixel bboxes + page
 * dimensions) written at ingest. The agent NEVER greps elements; this module
 * is the only reader, and only to resolve an already-made citation.
 *
 * Matching is deliberately forgiving: OCR text and model quotes differ in
 * whitespace/punctuation, so we match on a normalized alphanumeric form,
 * falling back to best token overlap. Returns fractional coords (0..1 of the
 * page) so the client can overlay any rendered size.
 */

type ElementsBlock = {
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
  content: string;
  type: string;
};

type ElementsPage = {
  source: string;
  blocks: ElementsBlock[];
  dimensions: { width: number; height: number; dpi?: number };
};

export type ResolvedCitation = {
  matched: boolean;
  /** how the match was made — exact normalized substring vs token overlap */
  method?: "exact" | "overlap";
  boxes: { x: number; y: number; w: number; h: number }[];
};

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (s: string): Set<string> => new Set(normalize(s).split(" ").filter((t) => t.length > 2));

/** File-keyed elements JSON for (fileId, page), or undefined. Each file is parsed exactly once. */
async function loadElements(storageFolder: string, fileId: string, page: number): Promise<ElementsPage | undefined> {
  const raw = await readFileParseText(storageFolder, fileId, "elements", page);
  return raw ? (JSON.parse(raw) as ElementsPage) : undefined;
}

const frac = (b: ElementsBlock, d: { width: number; height: number }) => ({
  x: b.top_left_x / d.width,
  y: b.top_left_y / d.height,
  w: (b.bottom_right_x - b.top_left_x) / d.width,
  h: (b.bottom_right_y - b.top_left_y) / d.height,
});

export async function resolveCitation(
  storageFolder: string,
  fileId: string,
  page: number,
  quote: string,
): Promise<ResolvedCitation | undefined> {
  const els = await loadElements(storageFolder, fileId, page);
  if (!els?.blocks?.length || !els.dimensions?.width || !els.dimensions?.height) return undefined;
  const q = normalize(quote);
  if (!q) return { matched: false, boxes: [] };

  // exact: quote is a substring of one block, or a block is a substring of the quote
  const exact = els.blocks.filter((b) => {
    const n = normalize(b.content);
    return n.length > 0 && (n.includes(q) || (n.length > 8 && q.includes(n)));
  });
  if (exact.length > 0) {
    return { matched: true, method: "exact", boxes: exact.slice(0, 6).map((b) => frac(b, els.dimensions)) };
  }

  // fallback: single best block by token overlap
  const qt = tokens(quote);
  if (qt.size === 0) return { matched: false, boxes: [] };
  let best: ElementsBlock | undefined;
  let bestScore = 0;
  for (const b of els.blocks) {
    const bt = tokens(b.content);
    if (bt.size === 0) continue;
    let hit = 0;
    for (const t of qt) if (bt.has(t)) hit++;
    const score = hit / qt.size;
    if (score > bestScore) {
      bestScore = score;
      best = b;
    }
  }
  if (best && bestScore >= 0.5) {
    return { matched: true, method: "overlap", boxes: [frac(best, els.dimensions)] };
  }
  return { matched: false, boxes: [] };
}
