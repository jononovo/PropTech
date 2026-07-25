import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { Block, Template } from "@workspace/api-client-react";
import { DocDimensions } from "../../dimensions/DocDimensions";
import { expiryLabel } from "../../dimensions/helpers";

/**
 * Collapsed block row: sortable within (and across) subsections. Click opens
 * the editor; the trash affordance removes (reducer prunes any alternative
 * references). Display stays exception-based via DocDimensions.
 */
export function BlockCard({
  block,
  template,
  subsectionId,
  index,
  readOnly,
  onEdit,
  onRemove,
}: {
  block: Block;
  template: Template;
  subsectionId: string;
  index: number;
  readOnly: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `block:${block.id}`,
    data: { payload: { type: "block", blockId: block.id, subsectionId, index } },
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid={`block-${block.id}`}
      className={`bg-white border border-[#E2E8F0] rounded-[4px] p-2.5 flex group shadow-sm ${
        !readOnly ? "hover:border-[#CBD5E1] cursor-pointer" : ""
      } ${isDragging ? "opacity-40" : ""}`}
      onClick={() => !readOnly && onEdit()}
    >
      {!readOnly && (
        <span
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mr-2 mt-[1px] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity touch-none"
          data-testid={`block-${block.id}-grip`}
        >
          <GripVertical size={14} className="text-[#94A3B8]" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium text-[#0F172A]">{block.name}</div>
        {block.kind === "document" ? (
          <div className="font-mono text-[10.5px] mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
            <span className="text-[#64748B]">{(block.formats || []).join(", ")}</span>
            <span className="text-[#CBD5E1]">•</span>
            <DocDimensions block={block} template={template} variant="labels" />
            <span className="text-[#CBD5E1]">•</span>
            <span className="text-[#64748B]">{expiryLabel(block.expiry)}</span>
            {block.docType && (
              <>
                <span className="text-[#CBD5E1]">•</span>
                <span className="text-[#94A3B8]" title="Analyzer document type (exact classification)">
                  {block.docType}
                </span>
              </>
            )}
            {block.multiPage && (
              <>
                <span className="text-[#CBD5E1]">•</span>
                <span className="text-[#64748B]">multi-page</span>
              </>
            )}
          </div>
        ) : (
          <div className="font-mono text-[10.5px] text-[#64748B] mt-1">
            {(block.fields || []).map((f) => f.label).join(", ") || "no fields yet"}
          </div>
        )}
      </div>
      {!readOnly && (
        <button
          data-testid={`block-${block.id}-remove`}
          title="Remove block"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#B91C1C] transition-all ml-2 self-start rounded-[2px] hover:bg-[#FEF2F2]"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
