import type { NextFunction, Request, Response } from "express";
import { listUsers } from "../users/store";
import { roleHas, type AccessRight } from "./matrix";

/**
 * Central authorization for /api (retention/access-controls gate, Jul 26 2026).
 *
 * Identity: the `x-profile` header carries the signed-in username (demo
 * sign-in; real auth later replaces WHO the caller is, this module keeps
 * deciding WHAT they may do). Role is looked up from the users store with a
 * short cache.
 *
 * Right required per request:
 *   GET/HEAD                → view
 *   file/packet uploads     → upload   (intake-uploads, POST .../files)
 *   agent chat POST         → view     (the agent's own write tools re-enter
 *                                       the API with the caller's headers and
 *                                       are checked individually there)
 *   any other mutation      → edit
 *
 * Exempt (no identity possible or service traffic):
 *   /health, POST /login, GET /users (login page), and the analyzer worker's
 *   loopback callbacks (analysis ingest + run-failed).
 */

const CACHE_MS = 60_000;
let cache: { at: number; roles: Map<string, string> } | undefined;

async function roleFor(username: string): Promise<string | undefined> {
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    const users = await listUsers();
    cache = { at: Date.now(), roles: new Map(users.map((u) => [u.username, u.role])) };
  }
  return cache.roles.get(username);
}

const UPLOAD_PATH = /^\/intake-uploads(\/|$)|^\/applications\/[^/]+\/files$/;
const AGENT_CHAT = /^\/applications\/[^/]+\/agent\/chat$/;

function requiredRight(method: string, path: string): AccessRight {
  if (method === "GET" || method === "HEAD") return "view";
  if (UPLOAD_PATH.test(path)) return "upload";
  if (AGENT_CHAT.test(path)) return "view";
  return "edit";
}

export async function accessControl(req: Request, res: Response, next: NextFunction): Promise<void> {
  const path = (req.path.length > 1 ? req.path.replace(/\/+$/, "") : req.path) || "/";

  if (
    path === "/healthz" ||
    (path === "/login" && req.method === "POST") ||
    (path === "/users" && req.method === "GET") ||
    // Analyzer worker loopback traffic (fetch application + source bytes,
    // post results). Service identity, not a human — the matrix doesn't apply.
    req.header("x-sheaf-service") === "analyzer-worker"
  ) {
    next();
    return;
  }

  const username = req.header("x-profile");
  if (!username) {
    res.status(401).json({ error: "Not signed in — x-profile header missing" });
    return;
  }
  const role = await roleFor(username);
  if (!role) {
    res.status(401).json({ error: `Unknown profile "${username}"` });
    return;
  }

  const right = requiredRight(req.method, path);
  if (!roleHas(role, right)) {
    res.status(403).json({ error: `${role} does not have the "${right}" right (access matrix)` });
    return;
  }

  res.locals["profile"] = { username, role };
  next();
}
