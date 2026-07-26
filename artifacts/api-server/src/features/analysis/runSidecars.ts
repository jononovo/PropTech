import type { z } from "zod";
import type { IngestAnalysisRunBody } from "@workspace/api-zod";
import { putRunDocMarkdown, readFileParseText } from "../../lib/packetObjectStore";

type AnalysisRun = z.infer<typeof IngestAnalysisRunBody>;
type RunDocument = AnalysisRun["documents"][number];
type FileSpan = RunDocument["spans"][number];

/**
 * Analysis-time markdown projections — the intelligence corpus.
 *
 * At run ingest, every analyzer-suggested document gets ONE frontmattered .md
 * in App Storage (applications/<appId>/runs/<runId>/doc-NN_<slug>.md): scores,
 * flags, coreFields and provenance as YAML front matter, per-page transcript
 * as the body. Same pattern as the approved-doc sidecar, just earlier in the
 * lifecycle.
 *
 * These files are PROJECTIONS — derived and regenerable. Postgres
 * (analysis_runs) stays the authority for anything the app behaves on; the
 * corpus exists for humans, grep, and agents/RAG. Failure to write them is
 * loud (ledger event) but never fails the ingest.
 *
 * File-native: every page is addressed (fileId, in-file page) via FileSpans;
 * provenance points at the SourceFile registry entries in the run's input.
 */

const yamlStr = (s: string) => JSON.stringify(s);

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "doc";

/** One page's parse transcript from object storage (worker pushed it at parse time). */
async function readPageMarkdown(storageFolder: string, fileId: string, page: number): Promise<string> {
  const md = await readFileParseText(storageFolder, fileId, "md", page);
  if (md === undefined) throw new Error(`No parse markdown in storage for ${fileId} p.${page}`);
  return md;
}

function spanPages(spans: FileSpan[]): { fileId: string; page: number }[] {
  return spans.flatMap((s) => {
    const [f, l] = s.pages as [number, number];
    return Array.from({ length: l - f + 1 }, (_, i) => ({ fileId: s.fileId, page: f + i }));
  });
}

export function buildRunDocMarkdown(opts: {
  applicationId: string;
  storageFolder: string;
  run: AnalysisRun;
  doc: RunDocument;
  pageMarkdown: string[];
}): string {
  const { run, doc } = opts;
  const lines: string[] = ["---"];
  lines.push(`applicationId: ${yamlStr(opts.applicationId)}`);
  lines.push(`runId: ${yamlStr(run.runId)}`);
  lines.push(`pipelineVersion: ${yamlStr(run.pipelineVersion)}`);
  lines.push(`suggestedBlockId: ${yamlStr(doc.suggestedBlockId)}`);
  lines.push(`suggestedName: ${yamlStr(doc.suggestedName)}`);
  lines.push(`confidence: ${doc.confidence}`);
  lines.push("spans:");
  for (const s of doc.spans) lines.push(`  - fileId: ${yamlStr(s.fileId)}`, `    pages: [${s.pages[0]}, ${s.pages[1]}]`);
  lines.push("scores:");
  for (const [k, v] of Object.entries(doc.scores)) {
    lines.push(`  ${k}: ${typeof v === "number" ? v : yamlStr(String(v))}`);
  }
  if (run.fraudScoring === false) lines.push("fraudScoring: false # not scored this run");
  if (doc.flags.length > 0) {
    lines.push("flags:");
    for (const f of doc.flags) lines.push(`  - code: ${yamlStr(f.code)}\n    detail: ${yamlStr(f.detail)}`);
  }
  lines.push("coreFields:");
  for (const [k, v] of Object.entries(doc.coreFields)) lines.push(`  ${k}: ${yamlStr(String(v))}`);
  lines.push("derivedFrom:");
  lines.push("  sources:");
  const fileIds = [...new Set(doc.spans.map((s) => s.fileId))];
  for (const fileId of fileIds) {
    const input = run.input.find((f) => f.fileId === fileId);
    lines.push(`    - sourceKey: ${yamlStr(`applications/${opts.storageFolder}/files/${fileId}`)}`);
    if (input) lines.push(`      sha256: ${yamlStr(input.sha256)}`, `      filename: ${yamlStr(input.filename)}`);
  }
  lines.push(`  analyzedAt: ${yamlStr(run.startedAt)}`);
  lines.push("status: analyzer_suggestion # human verdict/approval lives in the registry, not here");
  lines.push("---", "");
  const pages = spanPages(doc.spans);
  opts.pageMarkdown.forEach((md, i) => {
    const p = pages[i]!;
    lines.push(`<!-- ${p.fileId} p.${p.page} -->`, md.trimEnd(), "");
  });
  return lines.join("\n");
}

/**
 * Write every document projection for a freshly ingested run. Throws on the
 * first failure — caller decides how loud to be (ingest must not roll back).
 */
export async function writeRunSidecars(applicationId: string, storageFolder: string, run: AnalysisRun): Promise<number> {
  let n = 0;
  for (const doc of run.documents) {
    const pageMarkdown = await Promise.all(
      spanPages(doc.spans).map((p) => readPageMarkdown(storageFolder, p.fileId, p.page)),
    );
    const md = buildRunDocMarkdown({ applicationId, storageFolder, run, doc, pageMarkdown });
    const filename = `doc-${String(n + 1).padStart(2, "0")}_${slug(doc.suggestedBlockId)}.md`;
    await putRunDocMarkdown(storageFolder, run.runId, filename, Buffer.from(md, "utf8"));
    n++;
  }
  return n;
}
