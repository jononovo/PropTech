import { tool } from "ai";
import { z } from "zod";
import { listCorpusKeys } from "../../../lib/packetObjectStore";
import type { AgentCtx } from "./types";

export default function list_corpus(ctx: AgentCtx) {
  return tool({
    description:
      "List this application's text corpus: per-run document markdown under runs/<runId>/, approved document markdown under approved/. Keys are relative to the application; pass them to grep_corpus/read_corpus.",
    inputSchema: z.object({}),
    execute: async () => {
      const keys = await listCorpusKeys(ctx.app.storageFolder);
      // files/ holds raw per-page parse artifacts (md duplicated into run docs,
      // elements = citation geometry) — never corpus content for the agent.
      return { keys: keys.filter((k) => !k.startsWith("files/")) };
    },
  });
}
