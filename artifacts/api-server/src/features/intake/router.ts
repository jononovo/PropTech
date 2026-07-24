import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import {
  CreateApplicationBody,
  CreateApplicationResponse,
  GetApplicationResponse,
  ListApplicationsResponse,
  SaveFieldValuesBody,
  SaveFieldValuesResponse,
  UpdateApplicationBody,
  UpdateApplicationResponse,
} from "@workspace/api-zod";
import { readTemplate } from "../template-library/store";
import { listApplicationsRaw, readApplication, toSummary, writeApplication, type Application } from "./store";
import { findBlock, isSafeSegment } from "./blocks";

const router: IRouter = Router();

router.get("/applications", async (_req, res): Promise<void> => {
  const summaries = listApplicationsRaw()
    .map(toSummary)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(ListApplicationsResponse.parse(summaries));
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const tpl = readTemplate(parsed.data.family, parsed.data.version);
  if (!tpl) {
    res.status(404).json({ error: "Template version not found" });
    return;
  }
  if (tpl.status !== "active") {
    res.status(409).json({ error: "Applications can only be started on an active template version." });
    return;
  }
  // The application pins a full copy of the template version forever.
  const app: Application = {
    id: nanoid(10),
    family: parsed.data.family,
    version: parsed.data.version,
    applicantName: parsed.data.applicantName,
    createdAt: new Date().toISOString(),
    fieldValues: {},
    uploads: {},
    ...(parsed.data.projectedClosingDate ? { projectedClosingDate: parsed.data.projectedClosingDate } : {}),
    template: tpl,
  };
  writeApplication(app);
  res.status(201).json(CreateApplicationResponse.parse(app));
});

router.get("/applications/:applicationId", async (req, res): Promise<void> => {
  const raw = req.params["applicationId"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  const app = id ? readApplication(id) : undefined;
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(GetApplicationResponse.parse(app));
});

router.patch("/applications/:applicationId", async (req, res): Promise<void> => {
  const raw = req.params["applicationId"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  const app = id ? readApplication(id) : undefined;
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // projectedClosingDate is portal-owned (analyzer spec §8): string sets, null clears.
  if (parsed.data.projectedClosingDate === null) {
    delete app.projectedClosingDate;
  } else if (parsed.data.projectedClosingDate !== undefined) {
    app.projectedClosingDate = parsed.data.projectedClosingDate;
  }
  writeApplication(app);
  res.json(UpdateApplicationResponse.parse(app));
});

router.put("/applications/:applicationId/fields/:blockId", async (req, res): Promise<void> => {
  const rawId = req.params["applicationId"];
  const rawBlock = req.params["blockId"];
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const blockId = Array.isArray(rawBlock) ? rawBlock[0] : rawBlock;
  if (!isSafeSegment(id) || !isSafeSegment(blockId)) {
    res.status(400).json({ error: "Invalid application or block id" });
    return;
  }
  const app = readApplication(id);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const block = findBlock(app, blockId);
  if (!block || block.kind !== "fields") {
    res.status(400).json({ error: "Block is not a field-group block on this application's template" });
    return;
  }
  const parsed = SaveFieldValuesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  app.fieldValues[blockId] = parsed.data.values;
  writeApplication(app);
  res.json(SaveFieldValuesResponse.parse(app));
});

export default router;
