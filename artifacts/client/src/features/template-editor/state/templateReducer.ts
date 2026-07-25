import type { Block, Section, Subsection, Template } from "@workspace/api-client-react";
import type { TemplateAction } from "./templateActions";
import { cloneSectionWithNewIds, collectIds, mintId } from "./templateIds";
import { blockIdsIn, findBlock, findSubsection, insertAt, mapBlock, mapSection, mapSubsection, move, pruneAlternatives } from "./templateTree";

/**
 * Pure reducer for every builder mutation. No React, no fetching — fully
 * testable in isolation, and the ONLY place template structure changes.
 *
 * Invariants enforced here (not left to the UI):
 * - active templates are immutable: every action on a non-draft is a no-op;
 * - ids are minted once at creation and NEVER change on rename or move
 *   (applications pin block ids — uploads/verdicts/repin all key on them);
 * - removing entities strips dangling alternative-group references, so the
 *   saved JSON can never point at blocks that no longer exist.
 */
export function templateReducer(template: Template, action: TemplateAction): Template {
  if (template.status !== "draft") return template;

  switch (action.type) {
    case "RENAME_TEMPLATE":
      return { ...template, template: action.name };

    case "ADD_SECTION": {
      const taken = collectIds(template);
      const name = action.name ?? "New section";
      const section: Section = {
        id: mintId(taken, name),
        name,
        owner: "Originator",
        permissions: [
          { role: "Applicant", view: false, upload: false },
          { role: "Originator", view: true, upload: true },
          { role: "Underwriter", view: true, upload: false },
          { role: "Manager", view: true, upload: false },
        ],
        subsections: [],
      };
      return { ...template, sections: insertAt(template.sections, section, action.atIndex) };
    }
    case "RENAME_SECTION":
      return mapSection(template, action.sectionId, (s) => ({ ...s, name: action.name }));
    case "REMOVE_SECTION": {
      const removed = template.sections.find((s) => s.id === action.sectionId);
      const next = {
        ...template,
        sections: template.sections.filter((s) => s.id !== action.sectionId),
      };
      return removed ? pruneAlternatives(next, blockIdsIn(removed)) : next;
    }
    case "MOVE_SECTION": {
      const from = template.sections.findIndex((s) => s.id === action.sectionId);
      if (from < 0) return template;
      const to = action.toIndex > from ? action.toIndex - 1 : action.toIndex;
      return { ...template, sections: move(template.sections, from, to) };
    }
    case "SET_SECTION_OWNER":
      return mapSection(template, action.sectionId, (s) => ({ ...s, owner: action.owner }));
    case "SET_PERMISSION":
      return mapSection(template, action.sectionId, (s) => ({
        ...s,
        permissions: s.permissions.map((p) =>
          p.role === action.role ? { ...p, [action.field]: action.value } : p,
        ),
      }));

    case "ADD_SUBSECTION": {
      const taken = collectIds(template);
      const name = action.name ?? "New subsection";
      const subsection: Subsection = { id: mintId(taken, name), name, blocks: [] };
      return mapSection(template, action.sectionId, (s) => ({
        ...s,
        subsections: insertAt(s.subsections, subsection, action.atIndex),
      }));
    }
    case "RENAME_SUBSECTION":
      return mapSubsection(template, action.subsectionId, (ss) => ({ ...ss, name: action.name }));
    case "REMOVE_SUBSECTION": {
      let removedBlockIds: string[] = [];
      const next = {
        ...template,
        sections: template.sections.map((s) => {
          const target = s.subsections.find((ss) => ss.id === action.subsectionId);
          if (!target) return s;
          removedBlockIds = target.blocks.map((b) => b.id);
          return { ...s, subsections: s.subsections.filter((ss) => ss.id !== action.subsectionId) };
        }),
      };
      return pruneAlternatives(next, removedBlockIds);
    }
    case "MOVE_SUBSECTION": {
      let fromSectionId = "";
      let fromIndex = -1;
      for (const s of template.sections) {
        const i = s.subsections.findIndex((ss) => ss.id === action.subsectionId);
        if (i >= 0) {
          fromSectionId = s.id;
          fromIndex = i;
          break;
        }
      }
      if (fromIndex < 0) return template;
      if (fromSectionId === action.toSectionId) {
        const to = action.toIndex > fromIndex ? action.toIndex - 1 : action.toIndex;
        return mapSection(template, fromSectionId, (s) => ({
          ...s,
          subsections: move(s.subsections, fromIndex, to),
        }));
      }
      const moving = template.sections.find((s) => s.id === fromSectionId)!.subsections[fromIndex]!;
      return {
        ...template,
        sections: template.sections.map((s) => {
          if (s.id === fromSectionId)
            return { ...s, subsections: s.subsections.filter((ss) => ss.id !== action.subsectionId) };
          if (s.id === action.toSectionId)
            return { ...s, subsections: insertAt(s.subsections, moving, action.toIndex) };
          return s;
        }),
      };
    }

    case "ADD_BLOCK": {
      const taken = collectIds(template);
      const name = action.name ?? (action.kind === "document" ? "New document" : "New field group");
      const block: Block =
        action.kind === "document"
          ? {
              kind: "document",
              id: mintId(taken, name),
              name,
              formats: ["pdf"],
              requirement: "required",
              criticality: "standard",
              sourcing: "readily_available",
              expiry: null,
            }
          : { kind: "fields", id: mintId(taken, name), name, fields: [] };
      return mapSubsection(template, action.subsectionId, (ss) => ({
        ...ss,
        blocks: insertAt(ss.blocks, block, action.atIndex),
      }));
    }
    case "UPDATE_BLOCK": {
      const next = mapBlock(template, action.blockId, (b) => ({ ...b, ...action.patch }));
      // Schema-spec §3 invariant: requirement === "required_alt" ⇔ block is an
      // alternative-group primary. Leaving required_alt dissolves the group.
      if (action.patch.requirement !== undefined && action.patch.requirement !== "required_alt") {
        return {
          ...next,
          alternatives: next.alternatives.filter((g) => g.primary !== action.blockId),
        };
      }
      return next;
    }
    case "REMOVE_BLOCK": {
      const next = {
        ...template,
        sections: template.sections.map((s) => ({
          ...s,
          subsections: s.subsections.map((ss) => ({
            ...ss,
            blocks: ss.blocks.filter((b) => b.id !== action.blockId),
          })),
        })),
      };
      return pruneAlternatives(next, [action.blockId]);
    }
    case "MOVE_BLOCK": {
      let fromSubsectionId = "";
      let fromIndex = -1;
      for (const s of template.sections) {
        for (const ss of s.subsections) {
          const i = ss.blocks.findIndex((b) => b.id === action.blockId);
          if (i >= 0) {
            fromSubsectionId = ss.id;
            fromIndex = i;
            break;
          }
        }
        if (fromIndex >= 0) break;
      }
      if (fromIndex < 0) return template;
      if (fromSubsectionId === action.toSubsectionId) {
        const to = action.toIndex > fromIndex ? action.toIndex - 1 : action.toIndex;
        return mapSubsection(template, fromSubsectionId, (ss) => ({
          ...ss,
          blocks: move(ss.blocks, fromIndex, to),
        }));
      }
      const moving = findSubsection(template, fromSubsectionId)!.blocks[fromIndex]!;
      return {
        ...template,
        sections: template.sections.map((s) => ({
          ...s,
          subsections: s.subsections.map((ss) => {
            if (ss.id === fromSubsectionId)
              return { ...ss, blocks: ss.blocks.filter((b) => b.id !== action.blockId) };
            if (ss.id === action.toSubsectionId)
              return { ...ss, blocks: insertAt(ss.blocks, moving, action.toIndex) };
            return ss;
          }),
        })),
      };
    }

    case "ADD_ALTERNATIVE": {
      if (action.primaryBlockId === action.altBlockId) return template;
      const existing = template.alternatives.find((g) => g.primary === action.primaryBlockId);
      if (existing) {
        if (existing.satisfiedBy.includes(action.altBlockId)) return template;
        return {
          ...template,
          alternatives: template.alternatives.map((g) =>
            g.primary === action.primaryBlockId
              ? { ...g, satisfiedBy: [...g.satisfiedBy, action.altBlockId] }
              : g,
          ),
        };
      }
      const taken = collectIds(template);
      const primaryName = findBlock(template, action.primaryBlockId)?.name ?? "alternatives";
      return {
        ...template,
        alternatives: [
          ...template.alternatives,
          {
            id: mintId(taken, primaryName),
            name: primaryName,
            primary: action.primaryBlockId,
            satisfiedBy: [action.altBlockId],
          },
        ],
      };
    }
    case "REMOVE_ALTERNATIVE": {
      return {
        ...template,
        alternatives: template.alternatives
          .map((g) =>
            g.primary === action.primaryBlockId
              ? { ...g, satisfiedBy: g.satisfiedBy.filter((id) => id !== action.altBlockId) }
              : g,
          )
          .filter((g) => g.satisfiedBy.length > 0),
      };
    }

    case "ADD_FIELD": {
      const taken = new Set<string>();
      for (const s of template.sections)
        for (const ss of s.subsections)
          for (const b of ss.blocks) for (const f of b.fields ?? []) taken.add(f.id);
      const label = "New field";
      return mapBlock(template, action.blockId, (b) => ({
        ...b,
        fields: [
          ...(b.fields ?? []),
          { id: mintId(taken, label), type: action.fieldType, label, required: false },
        ],
      }));
    }
    case "UPDATE_FIELD":
      return mapBlock(template, action.blockId, (b) => ({
        ...b,
        fields: (b.fields ?? []).map((f) =>
          f.id === action.fieldId ? { ...f, ...action.patch } : f,
        ),
      }));
    case "REMOVE_FIELD":
      return mapBlock(template, action.blockId, (b) => ({
        ...b,
        fields: (b.fields ?? []).filter((f) => f.id !== action.fieldId),
      }));

    case "INSERT_SAVED_SECTION": {
      const taken = collectIds(template);
      const section = cloneSectionWithNewIds(action.section, taken);
      return { ...template, sections: insertAt(template.sections, section, action.atIndex) };
    }
  }
}
