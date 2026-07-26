/**
 * Tool registry — eve-style convention: one file per tool under tools/,
 * FILENAME = TOOL NAME. Each file default-exports a factory (ctx) => tool.
 * Static imports (bundler-safe); the assertion below keeps the convention
 * honest if a file is renamed without its key.
 *
 * Adding a tool = add tools/<name>.ts + one line here.
 * Write tools (future): same shape, plus `needsApproval` — see qa-agent spec
 * §2 "Act" tier for the contract (approval-gated, portal-only, ledgered).
 */
import type { Tool } from "ai";
import type { AgentCtx } from "./tools/types";
import lookup_application from "./tools/lookup_application";
import list_corpus from "./tools/list_corpus";
import grep_corpus from "./tools/grep_corpus";
import read_corpus from "./tools/read_corpus";

const FACTORIES = { lookup_application, list_corpus, grep_corpus, read_corpus } as const;

for (const [key, fn] of Object.entries(FACTORIES)) {
  if (fn.name !== key) throw new Error(`qa-agent registry: key "${key}" != factory "${fn.name}" — filename must equal tool name`);
}

export function buildTools(ctx: AgentCtx): Record<string, Tool> {
  return Object.fromEntries(Object.entries(FACTORIES).map(([name, make]) => [name, make(ctx)]));
}
