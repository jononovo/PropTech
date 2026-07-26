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
import { mistral } from "@ai-sdk/mistral";
import { readApplication } from "../intake/store";
import { isSafeSegment } from "../intake/blocks";
import { buildTools } from "./registry";
import instructions from "./instructions.md";

const router: IRouter = Router();

// Registry-is-truth discipline applies when this graduates; for burn-in the
// model is env-switchable without a deploy.
const MODEL_ID = process.env["QA_AGENT_MODEL"] ?? "mistral-large-latest";
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
  let messages;
  try {
    messages = await validateUIMessages({ messages: (req.body as { messages?: unknown })?.messages ?? [] });
  } catch (err) {
    res.status(400).json({ error: `Invalid messages: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }

  const result = streamText({
    model: mistral(MODEL_ID),
    system:
      `${instructions}\n\n## Current application\n` +
      `id: ${app.id}\napplicant: ${app.applicantName}\n` +
      `active files: ${(app.files ?? []).filter((f) => f.status === "active").length}\n` +
      `run state: ${app.run?.state ?? "none"}`,
    messages: await convertToModelMessages(messages),
    tools: buildTools({ app }),
    stopWhen: stepCountIs(MAX_STEPS),
  });
  result.pipeUIMessageStreamToResponse(res);
});

export default router;
