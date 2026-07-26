import { tool } from "ai";
import { z } from "zod";
import { attempt } from "../portal";
import type { AgentCtx } from "./types";

/**
 * Act-tier: save form field values into a field-group block — e.g. filling
 * intake fields from values the agent extracted out of the corpus. Whole-map
 * PUT (portal semantics): pass the COMPLETE value map for the block, merged
 * from the current values in lookup_application.
 */
export default function update_fields(ctx: AgentCtx) {
  return tool({
    description:
      "Save form field values for a field-group block. IMPORTANT: this replaces the block's whole value map — first read current values via lookup_application, merge your changes in, then send the complete map. Requires the human's confirmation card.",
    inputSchema: z.object({
      blockId: z.string().describe("field-group blockId on the pinned template"),
      values: z.record(z.string(), z.string()).describe("COMPLETE field key → value map for the block"),
    }),
    needsApproval: true,
    execute: async ({ blockId, values }) =>
      attempt(() => ctx.portal.send("PUT", `/applications/${ctx.app.id}/fields/${blockId}`, { values })),
  });
}
