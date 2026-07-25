import type { Block, Section } from "@workspace/api-client-react";

/**
 * Every mutation the builder can perform, as one discriminated union.
 * Click-to-add buttons and drag-and-drop dispatch THE SAME actions — DnD is
 * only a different way of choosing an action's target indices. That single
 * mutation path is what keeps the builder simple and testable.
 */

/** Patchable per-block details (the advanced editor). id/kind are immutable. */
export type BlockPatch = Partial<
  Pick<
    Block,
    | "name"
    | "docType"
    | "formats"
    | "requirement"
    | "criticality"
    | "sourcing"
    | "multiPage"
    | "expiry"
  >
>;

export type TemplateAction =
  // template header
  | { type: "RENAME_TEMPLATE"; name: string }
  // sections
  | { type: "ADD_SECTION"; name?: string; atIndex?: number }
  | { type: "RENAME_SECTION"; sectionId: string; name: string }
  | { type: "REMOVE_SECTION"; sectionId: string }
  // Moves address the dragged item by id (WHAT); toIndex is the insert-before
  // position in the PRE-removal list (WHERE). The reducer resolves the source
  // position itself — a stale index can never move the wrong item.
  | { type: "MOVE_SECTION"; sectionId: string; toIndex: number }
  | { type: "SET_SECTION_OWNER"; sectionId: string; owner: Section["owner"] }
  | {
      type: "SET_PERMISSION";
      sectionId: string;
      role: string;
      field: "view" | "upload";
      value: boolean;
    }
  // subsections
  | { type: "ADD_SUBSECTION"; sectionId: string; name?: string; atIndex?: number }
  | { type: "RENAME_SUBSECTION"; subsectionId: string; name: string }
  | { type: "REMOVE_SUBSECTION"; subsectionId: string }
  | { type: "MOVE_SUBSECTION"; subsectionId: string; toSectionId: string; toIndex: number }
  // blocks
  | {
      type: "ADD_BLOCK";
      subsectionId: string;
      kind: Block["kind"];
      name?: string;
      atIndex?: number;
    }
  | { type: "UPDATE_BLOCK"; blockId: string; patch: BlockPatch }
  | { type: "REMOVE_BLOCK"; blockId: string }
  | { type: "MOVE_BLOCK"; blockId: string; toSubsectionId: string; toIndex: number }
  // alternatives (satisfied-by-any-of groups)
  | { type: "ADD_ALTERNATIVE"; primaryBlockId: string; altBlockId: string }
  | { type: "REMOVE_ALTERNATIVE"; primaryBlockId: string; altBlockId: string }
  // fields inside a kind=fields block
  | { type: "ADD_FIELD"; blockId: string; fieldType: FieldType }
  | { type: "UPDATE_FIELD"; blockId: string; fieldId: string; patch: FieldPatch }
  | { type: "REMOVE_FIELD"; blockId: string; fieldId: string }
  // palette: saved sections
  | { type: "INSERT_SAVED_SECTION"; section: Section; atIndex?: number };

export type FieldType = "text" | "number" | "date" | "select" | "yesno";
export type FieldPatch = Partial<{ label: string; type: FieldType; required: boolean; options: string[] }>;
