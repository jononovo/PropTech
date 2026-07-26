import { tool } from "ai";
import { z } from "zod";
import { attempt } from "../portal";
import { latestRunId } from "../runs";
import type { AgentCtx } from "./types";

/**
 * Act-tier: file an APPROVAL for a document block. Approve-only by design —
 * rejection stays human-only (ruling Jul 26 2026); the agent flags problems
 * in chat instead of rejecting.
 *
 * Two portal paths, chosen by input:
 * - no spans → single-arity verdict accept (PUT /verdicts/:blockId), which
 *   materializes the approved pdf+md pair.
 * - spans given (set blocks / span-level approvals) → POST /document-approvals.
 */
export default function approve_document(ctx: AgentCtx) {
  return tool({
    description:
      "Approve a document block on this application (approve ONLY — you can never reject; flag concerns in chat instead). " +
      "For a plain single-arity block, pass just blockId to accept its verdict. For a set block (or to approve specific pages), " +
      "pass spans (and variantId for set blocks). Requires the human's confirmation card.",
    inputSchema: z.object({
      blockId: z.string().describe("document blockId on the pinned template"),
      variantId: z.string().optional().describe("required for set blocks — which variant this approval belongs to"),
      spans: z
        .array(z.object({ fileId: z.string(), pages: z.tuple([z.number().int().min(1), z.number().int().min(1)]) }))
        .optional()
        .describe("page spans ([first,last] 1-based within each source file); omit for a plain verdict accept"),
      note: z.string().optional(),
    }),
    needsApproval: true,
    execute: async ({ blockId, variantId, spans, note }) =>
      attempt(async () => {
        if (spans?.length) {
          const runId = await latestRunId(ctx.app.storageFolder);
          if (!runId) throw new Error("No analyzer run found — run the analyzer before span-level approvals");
          return ctx.portal.send("POST", `/applications/${ctx.app.id}/document-approvals`, {
            blockId,
            ...(variantId ? { variantId } : {}),
            runId,
            spans,
            outcome: "approved",
            decidedBy: ctx.decidedBy,
          });
        }
        return ctx.portal.send("PUT", `/applications/${ctx.app.id}/verdicts/${blockId}`, {
          verdict: "accepted",
          decidedBy: ctx.decidedBy,
          ...(note ? { note } : {}),
        });
      }),
  });
}
