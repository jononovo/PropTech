import type { Request } from "express";

/**
 * Portal self-client for agent write tools (qa-agent spec §2 "Act" tier,
 * portal-only guardrail). Tools call the SAME public HTTP endpoints a human
 * client would — never store/DB functions directly — so router validation,
 * row-locked transactions, and ledger emission apply identically to agent
 * writes. The original request's auth headers are forwarded, so the write
 * carries the approving user's identity.
 *
 * Failures surface as thrown Errors carrying the endpoint's own message;
 * tools convert them to `{ ok: false, error }` so the model can read the
 * refusal (e.g. "red flags — use bypassed") and explain it to the user
 * instead of the loop dying.
 */
export type Portal = {
  send: (method: "POST" | "PUT" | "PATCH", path: string, body: unknown) => Promise<unknown>;
};

const PORT = Number(process.env["PORT"] ?? 8080);

export function makePortal(req: Request): Portal {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const cookie = req.headers["cookie"];
  const profile = req.headers["x-profile"];
  if (typeof cookie === "string") headers["cookie"] = cookie;
  if (typeof profile === "string") headers["x-profile"] = profile;

  return {
    async send(method, path, body) {
      const res = await fetch(`http://localhost:${PORT}/api${path}`, {
        method,
        headers,
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let json: unknown;
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { raw: text };
      }
      if (!res.ok) {
        const msg = (json as { error?: string })?.error ?? text ?? res.statusText;
        throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
      }
      return json;
    },
  };
}

/** Uniform result envelope for write tools — the model reads `error` verbatim. */
export async function attempt<T>(fn: () => Promise<T>): Promise<{ ok: true; result: T } | { ok: false; error: string }> {
  try {
    return { ok: true, result: await fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
