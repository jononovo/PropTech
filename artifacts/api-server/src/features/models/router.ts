import { Router, type IRouter } from "express";
import { ListModelOptionsResponse } from "@workspace/api-zod";

/**
 * Per-stage model options for the run plan — proxied verbatim from the
 * analyzer worker's registry (single source of truth lives next to the
 * engines). Worker down = 502 with an honest message, never a guessed list.
 */
const router: IRouter = Router();

router.get("/models/options", async (_req, res): Promise<void> => {
  const base = process.env["ANALYZER_URL"];
  if (!base) {
    res.status(502).json({ error: "ANALYZER_URL is not configured — analyzer worker unreachable" });
    return;
  }
  try {
    const r = await fetch(`${base.replace(/\/$/, "")}/models`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) {
      res.status(502).json({ error: `Analyzer model registry returned ${r.status}` });
      return;
    }
    res.json(ListModelOptionsResponse.parse(await r.json()));
  } catch (err) {
    res.status(502).json({
      error: `Analyzer worker unreachable: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

export default router;
