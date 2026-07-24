import type { Template } from "../template-library/store";

/**
 * Contract invariants beyond shape validation:
 * - block ids unique across the template
 * - alternative groups reference existing document block ids
 * - a block may be primary of at most one group
 * - satisfiedBy lists are non-empty and don't contain the primary
 */
export function validateTemplateInvariants(tpl: Template): string | undefined {
  const blockIds = new Set<string>();
  const docIds = new Set<string>();
  for (const section of tpl.sections) {
    for (const ss of section.subsections) {
      for (const b of ss.blocks) {
        if (blockIds.has(b.id)) return `Duplicate block id "${b.id}"`;
        blockIds.add(b.id);
        if (b.kind === "document") docIds.add(b.id);
      }
    }
  }
  const primaries = new Set<string>();
  for (const g of tpl.alternatives) {
    if (!docIds.has(g.primary)) return `Alternative group "${g.name}" references unknown primary "${g.primary}"`;
    if (primaries.has(g.primary)) return `Document "${g.primary}" is primary of more than one group`;
    primaries.add(g.primary);
    if (g.satisfiedBy.length === 0) return `Alternative group "${g.name}" has an empty satisfiedBy list`;
    for (const id of g.satisfiedBy) {
      if (id === g.primary) return `Alternative group "${g.name}" lists its primary in satisfiedBy`;
      if (!docIds.has(id)) return `Alternative group "${g.name}" references unknown document "${id}"`;
    }
  }
  return undefined;
}
