import { tool } from "ai";
import { z } from "zod";
import { listCorpusKeys, readCorpusText } from "../../../lib/packetObjectStore";
import type { AgentCtx } from "./types";

const MAX_MATCHES = 40;
const CONTEXT_CHARS = 240;

export default function grep_corpus(ctx: AgentCtx) {
  return tool({
    description:
      "Case-insensitive regex search across every markdown file in this application's corpus. Returns matching lines with their key and line number. Refine the pattern instead of reading whole files.",
    inputSchema: z.object({
      pattern: z.string().min(1).describe("JavaScript regular expression, matched per line, case-insensitive"),
    }),
    execute: async ({ pattern }) => {
      let re: RegExp;
      try {
        re = new RegExp(pattern, "i");
      } catch (err) {
        return { error: `Invalid regex: ${err instanceof Error ? err.message : String(err)}` };
      }
      const keys = (await listCorpusKeys(ctx.app.storageFolder)).filter(
        (k) => k.endsWith(".md") && !k.startsWith("files/"),
      );
      const matches: { key: string; line: number; text: string }[] = [];
      for (const key of keys) {
        const text = await readCorpusText(ctx.app.storageFolder, key);
        if (!text) continue;
        const lines = text.split("\n");
        for (let i = 0; i < lines.length && matches.length < MAX_MATCHES; i++) {
          if (re.test(lines[i]!)) {
            matches.push({ key, line: i + 1, text: lines[i]!.slice(0, CONTEXT_CHARS) });
          }
        }
        if (matches.length >= MAX_MATCHES) break;
      }
      return { matches, truncated: matches.length >= MAX_MATCHES };
    },
  });
}
