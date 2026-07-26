import { mistral } from "@ai-sdk/mistral";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Agent model resolution. Default is Fireworks GLM (strong tool-calling
 * reasoning, no per-minute free-tier throttle) — the Mistral key is on the
 * free tier (4 req/min) and an agent turn makes several model calls, so it
 * rate-limits itself mid-loop.
 *
 * Env override `QA_AGENT_MODEL` = `<backend>:<modelId>`, backend ∈
 * {fireworks, mistral}. Loud failure on unknown backend or missing key —
 * never a silent fallback (registry-is-truth discipline: model ids come from
 * services/analyzer/models.py).
 */
const DEFAULT = "fireworks:accounts/fireworks/models/glm-5p2";

export function resolveAgentModel(): { model: LanguageModel; label: string } {
  const spec = process.env["QA_AGENT_MODEL"] ?? DEFAULT;
  const sep = spec.indexOf(":");
  const backend = sep < 0 ? "" : spec.slice(0, sep);
  const modelId = spec.slice(sep + 1);
  if (backend === "mistral") {
    if (!process.env["MISTRAL_API_KEY"]) throw new Error("QA agent: MISTRAL_API_KEY is not set");
    return { model: mistral(modelId), label: spec };
  }
  if (backend === "fireworks") {
    const apiKey = process.env["FIREWORKS_API_KEY"];
    if (!apiKey) throw new Error("QA agent: FIREWORKS_API_KEY is not set");
    const fireworks = createOpenAICompatible({
      name: "fireworks",
      baseURL: "https://api.fireworks.ai/inference/v1",
      apiKey,
    });
    return { model: fireworks(modelId), label: spec };
  }
  throw new Error(`QA agent: unknown backend in QA_AGENT_MODEL="${spec}" (want fireworks:<id> or mistral:<id>)`);
}
