import { Router, type IRouter } from "express";
import {
  CreateTemplateBody,
  DuplicateTemplateBody,
  ListTemplatesResponse,
  CreateTemplateResponse,
  CreateNewVersionResponse,
  DuplicateTemplateResponse,
  ActivateTemplateResponse,
} from "@workspace/api-zod";
import {
  familyExists,
  familyVersions,
  listAllListings,
  readTemplate,
  slugify,
  toListing,
  writeTemplate,
  type Template,
} from "./store";
import { parseVersionParams } from "./params";

const router: IRouter = Router();

router.get("/templates", async (_req, res): Promise<void> => {
  res.json(ListTemplatesResponse.parse(await listAllListings()));
});

router.post("/templates", async (req, res): Promise<void> => {
  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const family = slugify(parsed.data.name);
  if (familyExists(family)) {
    res.status(409).json({ error: `A template family "${family}" already exists.` });
    return;
  }
  const tpl: Template = {
    template: parsed.data.name,
    version: 1,
    status: "draft",
    program: parsed.data.program,
    alternatives: [],
    sections: [],
  };
  writeTemplate(family, tpl);
  res.status(201).json(CreateTemplateResponse.parse({ family, version: 1 }));
});

router.post("/templates/:family/:version/new-version", async (req, res): Promise<void> => {
  const p = parseVersionParams(req, res);
  if (!p) return;
  const tpl = readTemplate(p.family, p.version);
  if (!tpl) {
    res.status(404).json({ error: "Template version not found" });
    return;
  }
  const latest = familyVersions(p.family)[0] ?? 0;
  if (latest > p.version) {
    res.status(409).json({ error: `v${latest} already exists in this family.` });
    return;
  }
  const next: Template = { ...tpl, version: p.version + 1, status: "draft" };
  writeTemplate(p.family, next);
  res.status(201).json(CreateNewVersionResponse.parse({ family: p.family, version: next.version }));
});

router.post("/templates/:family/:version/duplicate", async (req, res): Promise<void> => {
  const p = parseVersionParams(req, res);
  if (!p) return;
  const body = DuplicateTemplateBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const tpl = readTemplate(p.family, p.version);
  if (!tpl) {
    res.status(404).json({ error: "Template version not found" });
    return;
  }
  const family = slugify(body.data.name);
  if (familyExists(family)) {
    res.status(409).json({ error: `A template family "${family}" already exists.` });
    return;
  }
  const copy: Template = { ...tpl, template: body.data.name, version: 1, status: "draft" };
  writeTemplate(family, copy);
  res.status(201).json(DuplicateTemplateResponse.parse({ family, version: 1 }));
});

router.post("/templates/:family/:version/activate", async (req, res): Promise<void> => {
  const p = parseVersionParams(req, res);
  if (!p) return;
  const tpl = readTemplate(p.family, p.version);
  if (!tpl) {
    res.status(404).json({ error: "Template version not found" });
    return;
  }
  if (tpl.status === "active") {
    res.status(409).json({ error: "This version is already active." });
    return;
  }
  const activated: Template = { ...tpl, status: "active" };
  writeTemplate(p.family, activated);
  res.json(ActivateTemplateResponse.parse(await toListing(p.family, activated)));
});

export default router;
