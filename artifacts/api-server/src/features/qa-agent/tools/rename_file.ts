import { tool } from "ai";
import { z } from "zod";
import { attempt } from "../portal";
import type { AgentCtx } from "./types";

/**
 * Act-tier: rename a source file (metadata only — bytes and id unchanged,
 * ledger records from→to). Useful for normalizing upload names like
 * "scan_final_v2 (3).pdf".
 */
export default function rename_file(ctx: AgentCtx) {
  return tool({
    description:
      "Rename a source file (display name only; content and id unchanged). Requires the human's confirmation card.",
    inputSchema: z.object({
      fileId: z.string().describe("source file id"),
      filename: z.string().min(1).describe("new display name, keep the extension"),
    }),
    needsApproval: true,
    execute: async ({ fileId, filename }) =>
      attempt(() => ctx.portal.send("PATCH", `/applications/${ctx.app.id}/files/${fileId}`, { filename })),
  });
}
