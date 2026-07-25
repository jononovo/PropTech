import type { Template } from "../template-library/store";

/**
 * Contract invariants beyond shape validation:
 * - block ids unique across the template
 * - alternative groups reference existing document block ids
 * - a block may be primary of at most one group
 * - satisfiedBy lists are non-empty and don't contain the primary
 * - set blocks (arity:"set") are document-kind, carry a variantConfig with >=1
 *   descriptor field, unique descriptor keys, and sequence mode has requiredCount;
 *   variantConfig without arity:"set" is rejected (half-configured blocks confuse intake)
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
        const err = validateSetBlock(b);
        if (err) return err;
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

type AnyBlock = Template["sections"][number]["subsections"][number]["blocks"][number];

function validateSetBlock(b: AnyBlock): string | undefined {
  const isSet = b.arity === "set";
  if (!isSet) {
    if (b.variantConfig) return `Block "${b.name}" has a variantConfig but arity is not "set"`;
    return undefined;
  }
  if (b.kind !== "document") return `Set block "${b.name}" must be a document block`;
  const vc = b.variantConfig;
  if (!vc) return `Set block "${b.name}" is missing its variantConfig`;
  if (!vc.variantNoun.trim()) return `Set block "${b.name}" needs a variant noun`;
  if (vc.descriptorFields.length === 0) return `Set block "${b.name}" needs at least one descriptor field`;
  const keys = new Set<string>();
  for (const f of vc.descriptorFields) {
    if (!f.key.trim() || !f.label.trim()) return `Set block "${b.name}" has a descriptor field with an empty key or label`;
    if (keys.has(f.key)) return `Set block "${b.name}" repeats descriptor key "${f.key}"`;
    keys.add(f.key);
  }
  if (vc.docsPerVariant.mode === "sequence" && !(vc.docsPerVariant.requiredCount && vc.docsPerVariant.requiredCount >= 1)) {
    return `Set block "${b.name}" uses sequence mode without a requiredCount`;
  }
  return undefined;
}
