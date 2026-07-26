import type { Application } from "../../intake/store";

/**
 * Per-request context handed to every tool factory. Tools are constructed
 * fresh per chat request, closed over the application — the model never
 * supplies (and can never vary) the application scope.
 */
export type AgentCtx = {
  app: Application;
};
