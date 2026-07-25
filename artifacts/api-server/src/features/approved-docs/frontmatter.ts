import type { ApprovedDoc } from "./registry";

/**
 * The .md sidecar paired with every approved PDF: YAML front matter carrying
 * scores/flags/provenance, body carrying the analyzer's per-page markdown
 * (extract) or an explicit note (copy — direct uploads have no parsed text).
 * Pure function — no IO.
 */

const yamlStr = (s: string) => JSON.stringify(s); // JSON strings are valid YAML scalars

export function buildSidecarMarkdown(opts: {
  doc: ApprovedDoc;
  blockName: string;
  suggestedName?: string;
  scores?: Record<string, unknown>;
  flags?: { code: string; note?: string }[];
  coreFields?: Record<string, unknown>;
  variantLabel?: string;
  pageMarkdown: string[]; // one entry per page, in order (empty for copy)
}): string {
  const { doc } = opts;
  const lines: string[] = ["---"];
  lines.push(`id: ${yamlStr(doc.id)}`);
  lines.push(`applicationId: ${yamlStr(doc.applicationId)}`);
  lines.push(`taxonomyId: ${yamlStr(doc.blockId)}`);
  lines.push(`blockName: ${yamlStr(opts.blockName)}`);
  if (doc.variantId) lines.push(`variantId: ${yamlStr(doc.variantId)}`);
  if (opts.variantLabel) lines.push(`variantLabel: ${yamlStr(opts.variantLabel)}`);
  if (opts.suggestedName) lines.push(`description: ${yamlStr(opts.suggestedName)}`);
  if (opts.scores && Object.keys(opts.scores).length > 0) {
    lines.push("scores:");
    for (const [k, v] of Object.entries(opts.scores)) lines.push(`  ${k}: ${typeof v === "number" ? v : yamlStr(String(v))}`);
  }
  if (opts.flags && opts.flags.length > 0) {
    lines.push("flags:");
    for (const f of opts.flags) lines.push(`  - code: ${yamlStr(f.code)}${f.note ? `\n    note: ${yamlStr(f.note)}` : ""}`);
  }
  if (opts.coreFields && Object.keys(opts.coreFields).length > 0) {
    lines.push("coreFields:");
    for (const [k, v] of Object.entries(opts.coreFields)) lines.push(`  ${k}: ${yamlStr(String(v))}`);
  }
  lines.push("derivedFrom:");
  if (doc.source === "extract") {
    lines.push(`  sourceKey: ${yamlStr(`packets/${doc.applicationId}/packet.pdf`)}`);
    lines.push(`  pages: [${(doc.pages ?? []).join(", ")}]`);
    if (doc.runId) lines.push(`  runId: ${yamlStr(doc.runId)}`);
    if (doc.packetSha256) lines.push(`  packetSha256: ${yamlStr(doc.packetSha256)}`);
  } else {
    lines.push(`  sourceKey: ${yamlStr(`uploads/${doc.applicationId}/${doc.blockId}/${doc.sourceFilename ?? ""}`)}`);
  }
  lines.push(`  operation: ${yamlStr(doc.source)}`);
  lines.push(`  actor: ${yamlStr(doc.approvedBy)}`);
  lines.push(`  timestamp: ${yamlStr(doc.approvedAt)}`);
  lines.push(`approvedBy: ${yamlStr(doc.approvedBy)}`);
  lines.push(`approvedAt: ${yamlStr(doc.approvedAt)}`);
  lines.push("---", "");

  if (doc.source === "copy") {
    lines.push("_Direct intake upload — no analyzer text available for this document._");
  } else {
    opts.pageMarkdown.forEach((md, i) => {
      const page = (doc.pages?.[0] ?? 1) + i;
      lines.push(`<!-- packet page ${page} -->`, md.trimEnd(), "");
    });
  }
  return lines.join("\n");
}
