import type { Application } from "../../intake/store";
import type { Portal } from "../portal";

/** The agent's power tier for this request (qa-agent spec §2). */
export type AgentMode = "read" | "act";

/** Roles the portal's decidedBy fields accept — the agent acts AS the approving human's role. */
export type DecidedBy = "Originator" | "Underwriter" | "Manager";

/**
 * Per-request context handed to every tool factory. Tools are constructed
 * fresh per chat request, closed over the application — the model never
 * supplies (and can never vary) the application scope.
 *
 * `portal` (act mode only) self-calls the portal's own HTTP API with the
 * requesting user's credentials — write tools NEVER touch the DB or object
 * storage directly, so every guardrail, validation, transaction, and ledger
 * event in the routers applies unchanged.
 */
export type AgentCtx = {
  app: Application;
  mode: AgentMode;
  /** role recorded as decidedBy on agent-made writes (the approving human's role) */
  decidedBy: DecidedBy;
  portal: Portal;
};
