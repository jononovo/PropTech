import { tool } from "ai";
import { z } from "zod";
import { listApprovedDocs } from "../../approved-docs/registry";
import type { AgentCtx } from "./types";

/** Tier-1 structured lookup — answers most status questions without touching the corpus. */
export default function lookup_application(ctx: AgentCtx) {
  return tool({
    description:
      "Structured snapshot of this application: core fields, source-file registry, run state, per-block field values, verdicts, and the approved-documents registry. Always try this first.",
    inputSchema: z.object({}),
    execute: async () => {
      const { app } = ctx;
      const approved = await listApprovedDocs(app.id);
      return {
        id: app.id,
        applicantName: app.applicantName,
        family: app.family,
        templateVersion: app.version,
        createdAt: app.createdAt,
        projectedClosingDate: app.projectedClosingDate ?? null,
        files: (app.files ?? []).map((f) => ({
          fileId: f.id,
          filename: f.filename,
          pages: f.pages,
          status: f.status,
          receivedAt: f.receivedAt,
          flags: f.flags,
        })),
        run: app.run
          ? {
              state: app.run.state,
              gate: app.run.gate ?? null,
              input: app.run.input ?? null,
              lastRunError: app.run.lastRunError ?? null,
            }
          : null,
        fieldValues: app.fieldValues,
        verdicts: app.verdicts ?? {},
        approvedDocuments: approved.map((d) => ({
          approvedDocId: d.id,
          blockId: d.blockId,
          basename: d.basename,
          spans: d.spans ?? null,
          approvedAt: d.approvedAt,
          supersededBy: d.supersededBy ?? null,
        })),
      };
    },
  });
}
