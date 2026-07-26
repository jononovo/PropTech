import { tool } from "ai";
import { z } from "zod";
import { readCorpusText } from "../../../lib/packetObjectStore";
import type { AgentCtx } from "./types";

const MAX_CHARS = 60_000;

export default function read_corpus(ctx: AgentCtx) {
  return tool({
    description:
      "Read one corpus file by its relative key (from list_corpus or a grep_corpus match). Run sidecars carry YAML frontmatter naming the source file and page spans — use it for citations.",
    inputSchema: z.object({
      key: z.string().min(1).describe("Relative corpus key, e.g. runs/<runId>/doc-01_urla_1003.md"),
    }),
    execute: async ({ key }) => {
      let text: string | undefined;
      try {
        text = await readCorpusText(ctx.app.storageFolder, key);
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
      if (text === undefined) return { error: `No such corpus file: ${key}` };
      return {
        key,
        truncated: text.length > MAX_CHARS,
        content: text.slice(0, MAX_CHARS),
      };
    },
  });
}
