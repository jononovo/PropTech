import { Router, type IRouter } from "express";
import { GetTemplateResponse, SaveTemplateBody, SaveTemplateResponse } from "@workspace/api-zod";
import { readTemplate, writeTemplate } from "../template-library/store";
import { parseVersionParams } from "../template-library/params";
import { validateTemplateInvariants } from "./validate";

const router: IRouter = Router();

router.get("/templates/:family/:version", async (req, res): Promise<void> => {
  const p = parseVersionParams(req, res);
  if (!p) return;
  const tpl = readTemplate(p.family, p.version);
  if (!tpl) {
    res.status(404).json({ error: "Template version not found" });
    return;
  }
  res.json(GetTemplateResponse.parse(tpl));
});

router.put("/templates/:family/:version", async (req, res): Promise<void> => {
  const p = parseVersionParams(req, res);
  if (!p) return;
  const existing = readTemplate(p.family, p.version);
  if (!existing) {
    res.status(404).json({ error: "Template version not found" });
    return;
  }
  if (existing.status === "active") {
    res.status(409).json({ error: "Active versions are immutable. Update to a new version to make changes." });
    return;
  }
  const body = SaveTemplateBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  // Version and status come from the file system truth, not the client.
  const next = { ...body.data, version: p.version, status: existing.status };
  const invariantError = validateTemplateInvariants(next);
  if (invariantError) {
    res.status(400).json({ error: invariantError });
    return;
  }
  writeTemplate(p.family, next);
  res.json(SaveTemplateResponse.parse(next));
});

export default router;
