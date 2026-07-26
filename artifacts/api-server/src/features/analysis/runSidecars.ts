import type { z } from "zod";
import type { IngestAnalysisRunBody } from "@workspace/api-zod";
import { putRunDocMarkdown } from "../../lib/packetObjectStore";

type AnalysisRun = z.infer<typeof IngestAnalysisRunBody>;
type RunDocument = AnalysisRun["documents"][number];

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
 * NOTE: page numbers are packet-global today; the file-native rework
 * (phase 3) switches them to (fileId, page). Regenerable, so no migration.
 */

const yamlStr = (s: string) => JSON.stringify(s);

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "doc";

async function fetchPageMarkdown(applicationId: string, runId: string, page: number): Promise<string> {
  const base = process.env["ANALYZER_URL"];
  if (!base) throw new Error("ANALYZER_URL is not configured — analyzer worker unreachable");
  const res = await fetch(`${base.replace(/\/$/, "")}/store/${applicationId}/${runId}/md/${page}`);
  if (!res.ok) throw new Error(`Analyzer store answered ${res.status} for page ${page} markdown`);
  return res.text();
}

export function buildRunDocMarkdown(opts: {
  applicationId: string;
  run: AnalysisRun;
  doc: RunDocument;
  packetSha256?: string;
  pageMarkdown: string[];
}): string {
  const { run, doc } = opts;
  const [first, last] = doc.segment.pages as [number, number];
  const lines: string[] = ["---"];
  lines.push(`applicationId: ${yamlStr(opts.applicationId)}`);
  lines.push(`runId: ${yamlStr(run.runId)}`);
  lines.push(`pipelineVersion: ${yamlStr(run.pipelineVersion)}`);
  lines.push(`suggestedBlockId: ${yamlStr(doc.suggestedBlockId)}`);
  lines.push(`suggestedName: ${yamlStr(doc.suggestedName)}`);
  lines.push(`confidence: ${doc.confidence}`);
  lines.push(`pages: [${first}, ${last}]`);
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
  lines.push(`  sourceKey: ${yamlStr(`applications/${opts.applicationId}/packet/packet.pdf`)}`);
  if (opts.packetSha256) lines.push(`  packetSha256: ${yamlStr(opts.packetSha256)}`);
  lines.push(`  analyzedAt: ${yamlStr(run.startedAt)}`);
  lines.push("status: analyzer_suggestion # human verdict/approval lives in the registry, not here");
  lines.push("---", "");
  opts.pageMarkdown.forEach((md, i) => {
    lines.push(`<!-- packet page ${first + i} -->`, md.trimEnd(), "");
  });
  return lines.join("\n");
}

/**
 * Write every document projection for a freshly ingested run. Throws on the
 * first failure — caller decides how loud to be (ingest must not roll back).
 */
export async function writeRunSidecars(
  applicationId: string,
  run: AnalysisRun,
  packetSha256?: string,
): Promise<number> {
  let n = 0;
  for (const doc of run.documents) {
    const [first, last] = doc.segment.pages as [number, number];
    const pageMarkdown = await Promise.all(
      Array.from({ length: last - first + 1 }, (_, i) => fetchPageMarkdown(applicationId, run.runId, first + i)),
    );
    const md = buildRunDocMarkdown({ applicationId, run, doc, pageMarkdown, ...(packetSha256 ? { packetSha256 } : {}) });
    const filename = `doc-${String(n + 1).padStart(2, "0")}_${slug(doc.suggestedBlockId)}.md`;
    await putRunDocMarkdown(applicationId, run.runId, filename, Buffer.from(md, "utf8"));
    n++;
  }
  return n;
}
