import { Block, ExpiryRule, BlockRequirement, BlockCriticality, BlockSourcing, Template, AlternativeGroup } from "@workspace/api-client-react";

// Re-export common helpers to keep it cohesive
export const templateStats = (t: Template) => {
  let docs = 0, fieldGroups = 0, fields = 0;
  for (const s of t.sections)
    for (const ss of s.subsections)
      for (const b of ss.blocks) {
        if (b.kind === "document") docs++;
        else if (b.kind === "fields") { fieldGroups++; fields += (b.fields?.length || 0); }
      }
  return { sections: t.sections.length, docs, fieldGroups, fields };
};

export const expiryLabel = (e: ExpiryRule | null | undefined): string =>
  !e ? "no clock" : e.kind === "hard" ? "valid through closing" : `stale after ${e.days}d`;

export const requirementLabel = (r: BlockRequirement): string =>
  r === "required" ? "required" : r === "required_alt" ? "required · alternatives accepted" : r === "recommended" ? "recommended" : "optional";

export const criticalityLabel = (c: BlockCriticality): string =>
  c === "critical" ? "critical" : c === "standard" ? "standard" : "supporting";

export const sourcingLabel = (s: BlockSourcing): string =>
  s === "readily_available" ? "readily available" : s === "constrained" ? "constrained" : "scarce";

export const groupForPrimary = (t: Template, blockId: string): AlternativeGroup | undefined =>
  t.alternatives?.find((g) => g.primary === blockId);

export const groupsSatisfiedBy = (t: Template, blockId: string): AlternativeGroup[] =>
  t.alternatives?.filter((g) => g.satisfiedBy?.includes(blockId)) || [];

export const blockName = (t: Template, blockId: string): string => {
  for (const s of t.sections) for (const ss of s.subsections) for (const b of ss.blocks) if (b.id === blockId) return b.name;
  return blockId;
};

export const getSectionNumber = (t: Template, bId: string) => {
  for (let i = 0; i < t.sections.length; i++) {
    for (const ss of t.sections[i].subsections) {
      for (const b of ss.blocks) {
        if (b.id === bId) return (i + 1).toString().padStart(2, '0');
      }
    }
  }
  return "00";
};
