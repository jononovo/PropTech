import type { Section, Template } from "@workspace/api-client-react";

/**
 * ID minting for template entities. House convention (see the seeded
 * purchase-loan-ca templates): human-readable slugs — "initial-application",
 * "urla-1003", "gov-id".
 *
 * THE invariant (repin/uploads/verdicts all key on block ids): an id is minted
 * ONCE, at creation, from the entity's initial name — renames and moves NEVER
 * change an id. Only genuinely new entities (click-to-add, palette drops,
 * saved-section inserts) mint ids.
 */

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

/** Every id currently used anywhere in the template (sections, subsections, blocks, alt groups). */
export function collectIds(template: Template): Set<string> {
  const ids = new Set<string>();
  for (const s of template.sections) {
    ids.add(s.id);
    for (const ss of s.subsections) {
      ids.add(ss.id);
      for (const b of ss.blocks) ids.add(b.id);
    }
  }
  for (const g of template.alternatives) ids.add(g.id);
  return ids;
}

/** Mint a unique id from a name: slug, then slug-2, slug-3, ... */
export function mintId(taken: Set<string>, name: string): string {
  const base = slugify(name);
  let candidate = base;
  for (let n = 2; taken.has(candidate); n++) candidate = `${base}-${n}`;
  taken.add(candidate);
  return candidate;
}

/**
 * Deep-clone a section with ALL-NEW ids (section, subsections, blocks).
 * Used when inserting a saved section: its contents are genuinely new blocks
 * in this template, so they mint fresh ids (never collide, never impersonate
 * ids some application already pinned).
 */
export function cloneSectionWithNewIds(section: Section, taken: Set<string>): Section {
  return {
    ...section,
    id: mintId(taken, section.name),
    permissions: section.permissions.map((p) => ({ ...p })),
    subsections: section.subsections.map((ss) => ({
      ...ss,
      id: mintId(taken, ss.name),
      blocks: ss.blocks.map((b) => ({ ...b, id: mintId(taken, b.name) })),
    })),
  };
}
