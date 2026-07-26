import { tool } from "ai";
import { z } from "zod";
import { attempt } from "../portal";
import { latestRunId } from "../runs";
import type { AgentCtx } from "./types";

/**
 * Act-tier: manually file an unassigned page range to a document block, or
 * archive it (POST /placements). The portal validates the span against the
 * file's page count and the target against the pinned template.
 */
export default function file_pages(ctx: AgentCtx) {
  return tool({
    description:
      "File a contiguous page range of one source file to a document block, or to 'archive' for junk/irrelevant pages. Use for pages the analyzer left unassigned. Requires the human's confirmation card.",
    inputSchema: z.object({
      fileId: z.string().describe("source file id"),
      pages: z.tuple([z.number().int().min(1), z.number().int().min(1)]).describe("[first, last] inclusive, 1-based within the file"),
      target: z.string().describe("document blockId on the pinned template, or the literal 'archive'"),
      note: z.string().optional(),
    }),
    needsApproval: true,
    execute: async ({ fileId, pages, target, note }) =>
      attempt(async () => {
        const runId = await latestRunId(ctx.app.storageFolder);
        return ctx.portal.send("POST", `/applications/${ctx.app.id}/placements`, {
          span: { fileId, pages },
          target,
          decidedBy: ctx.decidedBy,
          ...(note ? { note } : {}),
          ...(runId ? { runId } : {}),
        });
      }),
  });
}
