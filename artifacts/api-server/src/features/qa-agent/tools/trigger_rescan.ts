import { tool } from "ai";
import { z } from "zod";
import { attempt } from "../portal";
import type { AgentCtx } from "./types";

/**
 * Act-tier: kick the analyzer (gate decision "confirmed" ONLY). The agent is
 * never allowed to bypass red flags — if the file set is flagged, the portal
 * refuses and the agent must tell the human to use "Process anyway"
 * themselves. Double-runs are refused by the portal (409).
 */
export default function trigger_rescan(ctx: AgentCtx) {
  return tool({
    description:
      "Start an analyzer run on the current active files (gate decision 'confirmed'). You can NOT bypass red flags — if the portal refuses because of flags, tell the user to press 'Process anyway' themselves. Requires the human's confirmation card.",
    inputSchema: z.object({
      reason: z.string().optional().describe("why a run is needed now (for the chat transcript only)"),
    }),
    needsApproval: true,
    execute: async () =>
      attempt(() =>
        ctx.portal.send("POST", `/applications/${ctx.app.id}/run/gate`, {
          decision: "confirmed",
          decidedBy: "Sheaf Agent",
        }),
      ),
  });
}
