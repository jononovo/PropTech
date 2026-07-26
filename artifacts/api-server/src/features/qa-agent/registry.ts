/**
 * Tool registry — eve-style convention: one file per tool under tools/,
 * FILENAME = TOOL NAME. Each file default-exports a factory (ctx) => tool.
 * Static imports (bundler-safe); the assertion below keeps the convention
 * honest if a file is renamed without its key.
 *
 * Two tiers (qa-agent spec §2):
 * - READ  — always available; never mutates anything.
 * - WRITE — built ONLY when the request's mode is "act" (the panel's
 *   Full-control toggle, off by default, sent per request — no stored
 *   config). Every write tool carries `needsApproval: true`, so each call
 *   pauses for a human approve/decline card in chat, and goes through the
 *   portal HTTP API (see portal.ts) — validated, transactional, ledgered.
 *   Template endpoints are deliberately absent: the agent may read the
 *   pinned template but must NEVER modify templates (ruling Jul 26 2026).
 *
 * Adding a tool = add tools/<name>.ts + one line in the right tier here.
 */
import type { Tool } from "ai";
import type { AgentCtx } from "./tools/types";
import lookup_application from "./tools/lookup_application";
import list_corpus from "./tools/list_corpus";
import grep_corpus from "./tools/grep_corpus";
import read_corpus from "./tools/read_corpus";
import approve_document from "./tools/approve_document";
import update_fields from "./tools/update_fields";
import trigger_rescan from "./tools/trigger_rescan";
import file_pages from "./tools/file_pages";
import resolve_merge from "./tools/resolve_merge";
import rename_file from "./tools/rename_file";
import add_variant from "./tools/add_variant";

const READ = { lookup_application, list_corpus, grep_corpus, read_corpus } as const;
const WRITE = { approve_document, update_fields, trigger_rescan, file_pages, resolve_merge, rename_file, add_variant } as const;

for (const [key, fn] of Object.entries({ ...READ, ...WRITE })) {
  if (fn.name !== key) throw new Error(`qa-agent registry: key "${key}" != factory "${fn.name}" — filename must equal tool name`);
}

export function buildTools(ctx: AgentCtx): Record<string, Tool> {
  const factories = ctx.mode === "act" ? { ...READ, ...WRITE } : READ;
  return Object.fromEntries(Object.entries(factories).map(([name, make]) => [name, make(ctx)]));
}
