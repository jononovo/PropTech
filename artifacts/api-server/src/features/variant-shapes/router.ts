import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { CreateVariantShapeBody, CreateVariantShapeResponse, ListVariantShapesResponse } from "@workspace/api-zod";
import { listVariantShapes, writeVariantShape } from "./store";

/**
 * Variant shape library — saved descriptor conventions. Copy-on-use: the
 * builder copies a shape's fields into the block's variantConfig; nothing
 * references the library row afterwards.
 */

const router: IRouter = Router();

router.get("/variant-shapes", async (_req, res): Promise<void> => {
  res.json(ListVariantShapesResponse.parse(await listVariantShapes()));
});

router.post("/variant-shapes", async (req, res): Promise<void> => {
  const parsed = CreateVariantShapeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const name = parsed.data.name.trim();
  const noun = parsed.data.variantNoun.trim();
  const fields = parsed.data.descriptorFields.filter((f) => f.key.trim() !== "");
  if (!name || !noun || fields.length === 0) {
    res.status(400).json({ error: "A shape needs a name, a variant noun, and at least one descriptor field with a key" });
    return;
  }
  const existing = await listVariantShapes();
  if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    res.status(409).json({ error: `A shape named "${name}" already exists` });
    return;
  }
  const saved = { id: `vs-${nanoid(10)}`, ...parsed.data, name, variantNoun: noun, descriptorFields: fields };
  await writeVariantShape(saved);
  res.status(201).json(CreateVariantShapeResponse.parse(saved));
});

export default router;
