import type { VariantShape } from "@workspace/api-zod";
import { db, variantShapesTable } from "@workspace/db";
import { PRESET_SHAPES } from "./presets";

/** Postgres-backed, one jsonb row per shape (same pattern as saved sections). */

let seeded = false;
/** Idempotent preset seed — deterministic ids, upsert refreshes preset content. */
async function ensurePresets(): Promise<void> {
  if (seeded) return;
  for (const shape of PRESET_SHAPES) {
    await db
      .insert(variantShapesTable)
      .values({ id: shape.id, data: shape })
      .onConflictDoUpdate({ target: variantShapesTable.id, set: { data: shape, updatedAt: new Date() } });
  }
  seeded = true;
}

export async function listVariantShapes(): Promise<VariantShape[]> {
  await ensurePresets();
  const rows = await db.select({ data: variantShapesTable.data }).from(variantShapesTable);
  const shapes = rows.map((r) => r.data as VariantShape);
  // presets first, then saved; alphabetical within each group
  return shapes.sort((a, b) =>
    (a.preset ? 0 : 1) - (b.preset ? 0 : 1) || a.name.localeCompare(b.name),
  );
}

export async function writeVariantShape(shape: VariantShape): Promise<void> {
  await db
    .insert(variantShapesTable)
    .values({ id: shape.id, data: shape })
    .onConflictDoUpdate({ target: variantShapesTable.id, set: { data: shape, updatedAt: new Date() } });
}
