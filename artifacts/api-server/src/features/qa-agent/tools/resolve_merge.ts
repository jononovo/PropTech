import { tool } from "ai";
import { z } from "zod";
import { attempt } from "../portal";
import { latestRunId } from "../runs";
import type { AgentCtx } from "./types";

/**
 * Act-tier: decide an analyzer merge suggestion — accept ("merged") or
 * dismiss ("dismissed") the recommendation that two spans are the same
 * document (POST /merge-resolutions, keyed on the latest run).
 */
export default function resolve_merge(ctx: AgentCtx) {
  return tool({
    description:
      "Resolve an analyzer merge suggestion: decision 'merged' accepts that the given spans are one document; 'dismissed' rejects the suggestion. Spans must match the suggestion from the analysis. Requires the human's confirmation card.",
    inputSchema: z.object({
      spans: z
        .array(z.object({ fileId: z.string(), pages: z.tuple([z.number().int().min(1), z.number().int().min(1)]) }))
        .min(2)
        .describe("the spans named by the merge suggestion"),
      decision: z.enum(["merged", "dismissed"]),
    }),
    needsApproval: true,
    execute: async ({ spans, decision }) =>
      attempt(async () => {
        const runId = await latestRunId(ctx.app.storageFolder);
        if (!runId) throw new Error("No analyzer run found — merge suggestions only exist after a run");
        return ctx.portal.send("POST", `/applications/${ctx.app.id}/merge-resolutions`, {
          runId,
          spans,
          decision,
          decidedBy: ctx.decidedBy,
        });
      }),
  });
}
