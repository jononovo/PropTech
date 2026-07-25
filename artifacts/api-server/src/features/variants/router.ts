import { nanoid } from "nanoid";
import { Router, type IRouter, type Request } from "express";
import { AddVariantBody, AddVariantResponse } from "@workspace/api-zod";
import { HttpError, isHttpError } from "../../lib/httpError";
import { updateApplication, type Application } from "../intake/store";
import { findBlock, isSafeSegment } from "../intake/blocks";

/**
 * Variants of a set block on ONE application. The template declares the
 * descriptor SHAPE (variantConfig.descriptorFields); the application holds the
 * actual instances ("Chase ····1234", "Jane Doe · 1990-04-24"). Intake-side
 * data — a variant and its uploads are never part of the application's
 * satisfied requirements until a human accepts (separation rule, master plan §2a).
 *
 * Rules:
 * - descriptor keys must equal the template block's descriptorFields keys exactly
 * - values non-empty; duplicate descriptor value-sets rejected (409)
 * - id minted once (uploads and later approvals key on it), label built here
 * - delete refused (409) while uploads are tagged to the variant — loud, no orphans
 */

type VariantRecord = { id: string; descriptor: Record<string, string>; label: string; createdAt: string };

function param(req: Request, key: string): string | undefined {
  const raw = req.params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

/** Same descriptor value-set (after trim) = same real-world thing. */
const descriptorFingerprint = (d: Record<string, string>) =>
  JSON.stringify(Object.keys(d).sort().map((k) => [k, d[k]?.trim().toLowerCase()]));

function buildVariant(app: Application, blockId: string, rawDescriptor: Record<string, string>): VariantRecord {
  const block = findBlock(app, blockId);
  if (!block || block.kind !== "document") throw new HttpError(400, "Block is not a document block on this application's template");
  if (block.arity !== "set" || !block.variantConfig) throw new HttpError(400, `"${block.name}" is not a set block — variants don't apply`);

  const expected = block.variantConfig.descriptorFields.map((f) => f.key);
  const got = Object.keys(rawDescriptor);
  const missing = expected.filter((k) => !(k in rawDescriptor));
  const extra = got.filter((k) => !expected.includes(k));
  if (missing.length || extra.length) {
    throw new HttpError(400, `Descriptor keys must be exactly [${expected.join(", ")}]${missing.length ? ` — missing: ${missing.join(", ")}` : ""}${extra.length ? ` — unknown: ${extra.join(", ")}` : ""}`);
  }
  const descriptor: Record<string, string> = {};
  for (const f of block.variantConfig.descriptorFields) {
    const v = (rawDescriptor[f.key] ?? "").trim();
    if (!v) throw new HttpError(400, `"${f.label}" is required`);
    descriptor[f.key] = v;
  }
  const existing = (app.variants?.[blockId] ?? []) as VariantRecord[];
  const fp = descriptorFingerprint(descriptor);
  if (existing.some((v) => descriptorFingerprint(v.descriptor) === fp)) {
    throw new HttpError(409, `This ${block.variantConfig.variantNoun.toLowerCase()} is already declared`);
  }
  return {
    id: `v-${nanoid(10)}`,
    descriptor,
    // display label follows descriptorFields order, not object-key order
    label: block.variantConfig.descriptorFields.map((f) => descriptor[f.key]).join(" · "),
    createdAt: new Date().toISOString(),
  };
}

const router: IRouter = Router();

router.post("/applications/:applicationId/blocks/:blockId/variants", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const blockId = param(req, "blockId");
  if (!isSafeSegment(id) || !isSafeSegment(blockId)) {
    res.status(400).json({ error: "Invalid application or block id" });
    return;
  }
  const parsed = AddVariantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Body must be { descriptor: { key: value } }" });
    return;
  }
  try {
    let created: VariantRecord | undefined;
    const app = await updateApplication(id, (app) => {
      created = buildVariant(app, blockId, parsed.data.descriptor as Record<string, string>);
      const variants = (app.variants ?? {}) as Record<string, VariantRecord[]>;
      variants[blockId] = [...(variants[blockId] ?? []), created];
      app.variants = variants;
      return app;
    });
    if (!app || !created) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.status(201).json(AddVariantResponse.parse(created));
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.delete("/applications/:applicationId/blocks/:blockId/variants/:variantId", async (req, res): Promise<void> => {
  const id = param(req, "applicationId");
  const blockId = param(req, "blockId");
  const variantId = param(req, "variantId");
  if (!isSafeSegment(id) || !isSafeSegment(blockId) || !isSafeSegment(variantId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const app = await updateApplication(id, (app) => {
      const variants = (app.variants ?? {}) as Record<string, VariantRecord[]>;
      const list = variants[blockId] ?? [];
      if (!list.some((v) => v.id === variantId)) throw new HttpError(404, "Variant not found");
      const tagged = (app.uploads[blockId] ?? []).filter((f) => (f as { variantId?: string }).variantId === variantId);
      if (tagged.length > 0) {
        throw new HttpError(409, `${tagged.length} upload(s) still tagged to this variant — delete or untag them first`);
      }
      variants[blockId] = list.filter((v) => v.id !== variantId);
      app.variants = variants;
      return app;
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
