import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { Subsection, Template } from "@workspace/api-client-react";
import type { TemplateAction } from "../state/templateActions";
import { BlockCard } from "./BlockCard";
import { BlockEditor } from "./BlockEditor";

/**
 * One subsection: sortable itself (within/across sections), its blocks a
 * sortable list that also accepts palette document/fields drops. Click-to-add
 * buttons dispatch the same ADD_BLOCK the drops do.
 */
export function SubsectionGroup({
  subsection,
  sectionId,
  index,
  template,
  readOnly,
  editedBlockId,
  onEditBlock,
  dispatch,
}: {
  subsection: Subsection;
  sectionId: string;
  index: number;
  template: Template;
  readOnly: boolean;
  editedBlockId: string | null;
  onEditBlock: (id: string | null) => void;
  dispatch: (a: TemplateAction) => void;
}) {
  const sortable = useSortable({
    id: `sub:${subsection.id}`,
    data: { payload: { type: "subsection", subsectionId: subsection.id, sectionId, index } },
    disabled: readOnly,
  });
  // Registered on the WHOLE card (not just the inner list): with pointerWithin
  // collision, an inner-only droppable leaves the header row as dead space and
  // block drops there silently void. Block cards still beat this container in
  // collision, so precise reordering is unaffected.
  const dropList = useDroppable({
    id: `blocklist:${subsection.id}`,
    data: { payload: { type: "block-list", subsectionId: subsection.id } },
  });

  return (
    <div
      ref={(el) => {
        sortable.setNodeRef(el);
        dropList.setNodeRef(el);
      }}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={`relative ${sortable.isDragging ? "opacity-40" : ""}`}
      data-testid={`subsection-${subsection.id}`}
    >
      <div className="mb-3 -ml-[25px] bg-[#F3F5F7] px-1 inline-flex items-center gap-1.5 group/sub">
        {!readOnly && (
          <span
            {...sortable.attributes}
            {...sortable.listeners}
            className="opacity-0 group-hover/sub:opacity-100 cursor-grab transition-opacity touch-none"
            data-testid={`subsection-${subsection.id}-grip`}
          >
            <GripVertical size={12} className="text-[#94A3B8]" />
          </span>
        )}
        {readOnly ? (
          <span className="text-[10.5px] font-semibold text-[#64748B] uppercase tracking-[0.08em]">{subsection.name}</span>
        ) : (
          <input
            value={subsection.name}
            onChange={(e) => dispatch({ type: "RENAME_SUBSECTION", subsectionId: subsection.id, name: e.target.value })}
            data-testid={`subsection-${subsection.id}-name`}
            className="text-[10.5px] font-semibold text-[#64748B] uppercase tracking-[0.08em] bg-transparent outline-none border-b border-transparent focus:border-[#CBD5E1] w-44"
          />
        )}
        {!readOnly && (
          <button
            onClick={() => dispatch({ type: "REMOVE_SUBSECTION", subsectionId: subsection.id })}
            data-testid={`subsection-${subsection.id}-remove`}
            title="Remove subsection (and its blocks)"
            className="opacity-0 group-hover/sub:opacity-100 p-0.5 text-[#94A3B8] hover:text-[#B91C1C] rounded-[2px] transition-all"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      <div
        className={`space-y-2.5 ml-4 rounded-[4px] transition-colors ${dropList.isOver ? "bg-[#EFF6FF] outline outline-1 outline-[#BFDBFE] -m-1 p-1 ml-3" : ""}`}
      >
        <SortableContext
          items={subsection.blocks.map((b) => `block:${b.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {subsection.blocks.map((block, bIdx) =>
            block.id === editedBlockId && !readOnly ? (
              <BlockEditor key={block.id} block={block} template={template} dispatch={dispatch} onDone={() => onEditBlock(null)} />
            ) : (
              <BlockCard
                key={block.id}
                block={block}
                template={template}
                subsectionId={subsection.id}
                index={bIdx}
                readOnly={readOnly}
                onEdit={() => onEditBlock(block.id)}
                onRemove={() => dispatch({ type: "REMOVE_BLOCK", blockId: block.id })}
              />
            ),
          )}
        </SortableContext>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: "ADD_BLOCK", subsectionId: subsection.id, kind: "document" })}
              data-testid={`subsection-${subsection.id}-add-document`}
              className="text-[11px] font-medium text-[#64748B] border border-dashed border-[#CBD5E1] rounded-[4px] flex-1 py-2 hover:border-[#94A3B8] hover:text-[#0F172A] transition-colors bg-white/50"
            >
              + Add document
            </button>
            <button
              onClick={() => dispatch({ type: "ADD_BLOCK", subsectionId: subsection.id, kind: "fields" })}
              data-testid={`subsection-${subsection.id}-add-fields`}
              className="text-[11px] font-medium text-[#64748B] border border-dashed border-[#CBD5E1] rounded-[4px] px-3 py-2 hover:border-[#94A3B8] hover:text-[#0F172A] transition-colors bg-white/50"
            >
              + Field group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
