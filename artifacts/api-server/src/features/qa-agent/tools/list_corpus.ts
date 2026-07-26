import { tool } from "ai";
import { z } from "zod";
import { listCorpusKeys } from "../../../lib/packetObjectStore";
import type { AgentCtx } from "./types";

export default function list_corpus(ctx: AgentCtx) {
  return tool({
    description:
      "List this application's text corpus: per-run document markdown under runs/<runId>/, approved document markdown under approved/. Keys are relative to the application; pass them to grep_corpus/read_corpus. Skip elements/*.json — that is citation geometry, not content.",
    inputSchema: z.object({}),
    execute: async () => {
      const keys = await listCorpusKeys(ctx.app.storageFolder);
      // Geometry JSONs are never content for the agent (spec §3).
      return { keys: keys.filter((k) => !k.includes("/elements/")) };
    },
  });
}
