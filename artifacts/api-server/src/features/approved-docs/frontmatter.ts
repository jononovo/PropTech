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
  /** document-flow provenance — outcome + the per-page pre-step decisions */
  approval?: {
    outcome: "approved" | "approved_incomplete";
    pageDecisions?: { fileId: string; page: number; decision: string; note?: string }[];
  };
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
    lines.push("  spans:");
    for (const s of doc.spans ?? []) {
      lines.push(`    - sourceKey: ${yamlStr(`applications/${doc.applicationId}/files/${s.fileId}`)}`);
      lines.push(`      pages: [${s.pages.join(", ")}]`);
    }
    if (doc.runId) lines.push(`  runId: ${yamlStr(doc.runId)}`);
  } else {
    lines.push(`  sourceKey: ${yamlStr(`applications/${doc.applicationId}/uploads/${doc.blockId}/${doc.sourceFilename ?? ""}`)}`);
  }
  lines.push(`  operation: ${yamlStr(doc.source)}`);
  lines.push(`  actor: ${yamlStr(doc.approvedBy)}`);
  lines.push(`  timestamp: ${yamlStr(doc.approvedAt)}`);
  if (opts.approval) {
    lines.push(`approvalOutcome: ${yamlStr(opts.approval.outcome)}`);
    if (opts.approval.pageDecisions && opts.approval.pageDecisions.length > 0) {
      lines.push("pageDecisions:");
      for (const d of opts.approval.pageDecisions) {
        lines.push(`  - fileId: ${yamlStr(d.fileId)}`);
        lines.push(`    page: ${d.page}`);
        lines.push(`    decision: ${yamlStr(d.decision)}`);
        if (d.note) lines.push(`    note: ${yamlStr(d.note)}`);
      }
    }
  }
  lines.push(`approvedBy: ${yamlStr(doc.approvedBy)}`);
  lines.push(`approvedAt: ${yamlStr(doc.approvedAt)}`);
  lines.push("---", "");

  if (doc.source === "copy") {
    lines.push("_Direct intake upload — no analyzer text available for this document._");
  } else {
    const pages = (doc.spans ?? []).flatMap((s) => {
      const [f, l] = s.pages as [number, number];
      return Array.from({ length: l - f + 1 }, (_, i) => ({ fileId: s.fileId, page: f + i }));
    });
    opts.pageMarkdown.forEach((md, i) => {
      const p = pages[i];
      lines.push(p ? `<!-- ${p.fileId} p.${p.page} -->` : "<!-- page -->", md.trimEnd(), "");
    });
  }
  return lines.join("\n");
}
