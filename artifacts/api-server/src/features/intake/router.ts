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
  UpgradeTemplateVersionBody,
  UpgradeTemplateVersionResponse,
} from "@workspace/api-zod";
import { readTemplate } from "../template-library/store";
import { HttpError, isHttpError } from "../../lib/httpError";
import {
  insertApplication,
  listApplicationsRaw,
  readApplication,
  toSummary,
  updateApplication,
  type Application,
} from "./store";
import { findBlock, isSafeSegment } from "./blocks";
import { appendEvent } from "../ledger/store";
import { clientIp } from "../../lib/clientIp";

const router: IRouter = Router();

router.get("/applications", async (_req, res): Promise<void> => {
  const summaries = (await listApplicationsRaw())
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
  const tpl = await readTemplate(parsed.data.family, parsed.data.version);
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
  await insertApplication(app);
  await appendEvent({
    applicationId: app.id,
    actor: { kind: "user", ip: clientIp(req) },
    action: "application.created",
    detail: { applicantName: app.applicantName, family: app.family, version: app.version },
  });
  res.status(201).json(CreateApplicationResponse.parse(app));
});

router.get("/applications/:applicationId", async (req, res): Promise<void> => {
  const raw = req.params["applicationId"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  const app = id ? await readApplication(id) : undefined;
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(GetApplicationResponse.parse(app));
});

router.patch("/applications/:applicationId", async (req, res): Promise<void> => {
  const raw = req.params["applicationId"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const app = id
    ? await updateApplication(id, (app, emit) => {
        // projectedClosingDate is portal-owned (analyzer spec §8): string sets, null clears.
        if (parsed.data.projectedClosingDate === null) {
          delete app.projectedClosingDate;
          emit({ actor: { kind: "user", ip: clientIp(req) }, action: "closing-date.cleared" });
        } else if (parsed.data.projectedClosingDate !== undefined) {
          app.projectedClosingDate = parsed.data.projectedClosingDate;
          emit({
            actor: { kind: "user", ip: clientIp(req) },
            action: "closing-date.set",
            detail: { date: parsed.data.projectedClosingDate },
          });
        }
        return app;
      })
    : undefined;
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
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
  const parsed = SaveFieldValuesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const app = await updateApplication(id, (app, emit) => {
      const block = findBlock(app, blockId);
      if (!block || block.kind !== "fields") {
        throw new HttpError(400, "Block is not a field-group block on this application's template");
      }
      app.fieldValues[blockId] = parsed.data.values;
      emit({
        actor: { kind: "user", ip: clientIp(req) },
        action: "fields.saved",
        target: { type: "block", id: blockId, label: block.name },
      });
      return app;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(SaveFieldValuesResponse.parse(app));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

const templateBlockIds = (tpl: Application["template"]): string[] =>
  tpl.sections.flatMap((s) => s.subsections.flatMap((ss) => ss.blocks.map((b) => b.id)));

router.post("/applications/:applicationId/template-version", async (req, res): Promise<void> => {
  const raw = req.params["applicationId"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  const parsed = UpgradeTemplateVersionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const app = id
      ? await updateApplication(id, async (app, emit) => {
          const { targetVersion, decidedBy } = parsed.data;
          if (targetVersion <= app.version) {
            throw new HttpError(
              409,
              `Application pins v${app.version}; only upgrades to a newer version are allowed.`,
            );
          }
          const tpl = await readTemplate(app.family, targetVersion);
          if (!tpl) {
            throw new HttpError(404, "Template version not found");
          }
          if (tpl.status !== "active") {
            throw new HttpError(409, "Applications can only be re-pinned to an active template version.");
          }
          // Additive-only: every block on the current pin must survive the move —
          // uploads, verdicts and analysis mappings all key on these block ids.
          const nextIds = new Set(templateBlockIds(tpl));
          const missing = templateBlockIds(app.template).filter((b) => !nextIds.has(b));
          if (missing.length > 0) {
            throw new HttpError(
              409,
              `Target version removes blocks in use on this application: ${missing.join(", ")}`,
            );
          }
          app.templateHistory = [
            ...(app.templateHistory ?? []),
            {
              fromVersion: app.version,
              toVersion: targetVersion,
              decidedBy,
              decidedAt: new Date().toISOString(),
            },
          ];
          app.version = targetVersion;
          app.template = tpl;
          emit({
            actor: { kind: "user", name: decidedBy, ip: clientIp(req) },
            action: "template.repinned",
            detail: { fromVersion: app.templateHistory.at(-1)?.fromVersion, toVersion: targetVersion },
          });
          return app;
        })
      : undefined;
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(UpgradeTemplateVersionResponse.parse(app));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
