/**
 * Q&A agent chat route (spec: internal_docs/_future/qa-agent.md).
 *
 * One streaming POST per turn — AI SDK 7 `streamText` with server-side tools,
 * scoped to a single application. Deliberately OUTSIDE the OpenAPI contract
 * (like /healthz): the UIMessage stream protocol is the AI SDK's, not ours.
 *
 * Statelessness is deliberate: the client sends the full message history each
 * turn (useChat default), so there is no server-side conversation state to
 * migrate or lose. Persistence, if ever wanted, is an additive column.
 */
import { Router, type IRouter } from "express";
import { convertToModelMessages, stepCountIs, streamText, validateUIMessages } from "ai";
import { readApplication } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { buildTools } from "./registry";
import { resolveAgentModel } from "./model";
import { resolveCitation } from "./citations";
import { makePortal } from "./portal";
import type { AgentMode } from "./tools/types";
import instructions from "./instructions.md";

const router: IRouter = Router();

const MAX_STEPS = 12;

router.post("/applications/:applicationId/agent/chat", async (req, res): Promise<void> => {
  const id = req.params["applicationId"];
  if (!id || !isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = await readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const body = req.body as { messages?: unknown; mode?: unknown };
  let messages;
  try {
    messages = await validateUIMessages({ messages: body?.messages ?? [] });
  } catch (err) {
    res.status(400).json({ error: `Invalid messages: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }
  // Power tier comes from the panel toggle, per request — read-only unless
  // the client explicitly says "act". No stored config (ruling Jul 26 2026);
  // approvals for pending write calls therefore also require the toggle to
  // still be on when the approval response arrives.
  const mode: AgentMode = body?.mode === "act" ? "act" : "read";

  const result = streamText({
    model: resolveAgentModel().model,
    system:
      `${instructions}\n\n## Current application\n` +
      `id: ${app.id}\napplicant: ${app.applicantName}\n` +
      `active files: ${(app.files ?? []).filter((f) => f.status === "active").length}\n` +
      `run state: ${app.run?.state ?? "none"}\n` +
      `mode: ${mode === "act" ? "FULL CONTROL (write tools available, each call needs the human's approval card)" : "READ-ONLY (no write tools this turn — the user can flip the Full control toggle)"}`,
    messages: await convertToModelMessages(messages),
    tools: buildTools({ app, mode, decidedBy: "Underwriter", portal: makePortal(req) }),
    stopWhen: stepCountIs(MAX_STEPS),
  });
  result.pipeUIMessageStreamToResponse(res);
});

/**
 * Citation resolver — quote → fractional bbox(es) on a page, from the
 * elements projection. Read-only; used by the review room to draw the
 * highlight behind a citation chip. 200 {matched:false} when the quote
 * can't be located; 404 only when the page has no elements at all.
 */
router.get("/applications/:applicationId/citations/resolve", async (req, res): Promise<void> => {
  const id = req.params["applicationId"];
  if (!id || !isSafeSegment(id)) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const app = await readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const fileId = String(req.query["fileId"] ?? "");
  const page = Number(req.query["page"] ?? NaN);
  const quote = String(req.query["quote"] ?? "");
  if (!fileId || !isSafeSegment(fileId) || !Number.isInteger(page) || page < 1 || !quote) {
    res.status(400).json({ error: "fileId, page (>=1) and quote are required" });
    return;
  }
  const resolved = await resolveCitation(app.storageFolder, fileId, page, quote);
  if (!resolved) {
    res.status(404).json({ error: "No elements projection for that file/page" });
    return;
  }
  res.json(resolved);
});

export default router;
