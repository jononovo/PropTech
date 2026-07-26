import { tool } from "ai";
import { z } from "zod";
import { attempt } from "../portal";
import type { AgentCtx } from "./types";

/**
 * Act-tier: add a variant (real-world instance) to a set block — e.g. a
 * newly discovered bank account that needs its own statement slot. The
 * portal validates the descriptor keys against the template's declaration.
 * Deleting variants stays human-only (destructive).
 */
export default function add_variant(ctx: AgentCtx) {
  return tool({
    description:
      "Add a variant to a set block (e.g. another bank account for 'Bank Statements'). Descriptor keys must exactly match the template block's descriptorFields. You cannot delete variants. Requires the human's confirmation card.",
    inputSchema: z.object({
      blockId: z.string().describe("set blockId on the pinned template"),
      descriptor: z.record(z.string(), z.string()).describe("descriptorField key → value, keys exactly as the template declares"),
    }),
    needsApproval: true,
    execute: async ({ blockId, descriptor }) =>
      attempt(() => ctx.portal.send("POST", `/applications/${ctx.app.id}/blocks/${blockId}/variants`, { descriptor })),
  });
}
