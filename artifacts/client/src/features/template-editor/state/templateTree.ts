import type { Block, Section, Subsection, Template } from "@workspace/api-client-react";

/** Pure tree utilities for template structures. No React, no fetching, no ids. */


export function insertAt<T>(list: T[], item: T, index?: number): T[] {
  const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), item, ...list.slice(at)];
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item!);
  return next;
}

export function mapSection(t: Template, sectionId: string, fn: (s: Section) => Section): Template {
  return { ...t, sections: t.sections.map((s) => (s.id === sectionId ? fn(s) : s)) };
}

export function mapSubsection(t: Template, subsectionId: string, fn: (ss: Subsection) => Subsection): Template {
  return {
    ...t,
    sections: t.sections.map((s) => ({
      ...s,
      subsections: s.subsections.map((ss) => (ss.id === subsectionId ? fn(ss) : ss)),
    })),
  };
}

export function mapBlock(t: Template, blockId: string, fn: (b: Block) => Block): Template {
  return {
    ...t,
    sections: t.sections.map((s) => ({
      ...s,
      subsections: s.subsections.map((ss) => ({
        ...ss,
        blocks: ss.blocks.map((b) => (b.id === blockId ? fn(b) : b)),
      })),
    })),
  };
}

export function findSubsection(t: Template, subsectionId: string): Subsection | undefined {
  for (const s of t.sections)
    for (const ss of s.subsections) if (ss.id === subsectionId) return ss;
  return undefined;
}

export function findBlock(t: Template, blockId: string): Block | undefined {
  for (const s of t.sections)
    for (const ss of s.subsections)
      for (const b of ss.blocks) if (b.id === blockId) return b;
  return undefined;
}

export function blockIdsIn(section: Section): string[] {
  return section.subsections.flatMap((ss) => ss.blocks.map((b) => b.id));
}

/** Remove dangling references after deletions: groups keyed on a removed primary die; removed alts are stripped; empty groups die. */
export function pruneAlternatives(t: Template, removedBlockIds: string[]): Template {
  if (removedBlockIds.length === 0) return t;
  const gone = new Set(removedBlockIds);
  return {
    ...t,
    alternatives: t.alternatives
      .filter((g) => !gone.has(g.primary))
      .map((g) => ({ ...g, satisfiedBy: g.satisfiedBy.filter((id) => !gone.has(id)) }))
      .filter((g) => g.satisfiedBy.length > 0),
  };
}
