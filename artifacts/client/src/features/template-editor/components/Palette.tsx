import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import type { SavedSection, Template } from "@workspace/api-client-react";
import { templateStats } from "../../dimensions/helpers";
import type { DragPayload } from "../dnd/dndModel";

export const PALETTE = [
  { kind: "section" as const, label: "Section", hint: "Top-level group with an owner" },
  { kind: "subsection" as const, label: "Subsection", hint: "Group inside a section" },
  { kind: "document" as const, label: "Document upload", hint: "A required page or multi-page document" },
  { kind: "fields" as const, label: "Field group", hint: "Typed inputs — text, date, select" },
];

/**
 * Left rail: draggable block palette + saved sections. Items drag into the
 * canvas OR click-to-add via the + affordance — both end in the same reducer
 * action; drag only chooses the position.
 */
export function Palette({
  template,
  savedSections,
  readOnly,
  onQuickAdd,
  onQuickInsertSaved,
}: {
  template: Template;
  savedSections: SavedSection[];
  readOnly: boolean;
  onQuickAdd: (kind: (typeof PALETTE)[number]["kind"]) => void;
  onQuickInsertSaved: (saved: SavedSection) => void;
}) {
  const stats = templateStats(template);
  return (
    <aside className="w-[260px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 relative z-10">
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
        <div className={readOnly ? "opacity-50 pointer-events-none" : ""}>
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#64748B] mb-3">Blocks</div>
          <div className="space-y-2">
            {PALETTE.map((item) => (
              <PaletteCard
                key={item.kind}
                dragId={`palette:${item.kind}`}
                payload={{ type: "palette", kind: item.kind }}
                title={item.label}
                subtitle={item.hint}
                mono={false}
                testId={`palette-${item.kind}`}
                onAdd={() => onQuickAdd(item.kind)}
              />
            ))}
          </div>
        </div>

        <div className={readOnly ? "opacity-50 pointer-events-none" : ""}>
          <div className="h-px bg-[#E2E8F0] mb-4" />
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#64748B] mb-3">Saved Sections</div>
          <div className="space-y-2">
            {savedSections.length === 0 ? (
              <div className="text-[11px] text-[#94A3B8] italic">No saved sections.</div>
            ) : (
              savedSections.map((item) => (
                <PaletteCard
                  key={item.id}
                  dragId={`saved:${item.id}`}
                  payload={{ type: "saved-section", section: item.section }}
                  title={item.name}
                  subtitle={item.source}
                  mono
                  testId={`palette-saved-${item.id}`}
                  onAdd={() => onQuickInsertSaved(item)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="font-mono text-[10.5px] text-[#64748B] leading-relaxed">
          {stats.sections} sections · {stats.docs} documents
          <br />
          {stats.fieldGroups} field groups
        </div>
      </div>
    </aside>
  );
}

function PaletteCard({
  dragId,
  payload,
  title,
  subtitle,
  mono,
  testId,
  onAdd,
}: {
  dragId: string;
  payload: DragPayload;
  title: string;
  subtitle: string;
  mono: boolean;
  testId: string;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { payload },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={testId}
      className={`flex items-start gap-2 p-2.5 bg-white border border-[#E2E8F0] rounded-[4px] cursor-grab hover:border-[#94A3B8] transition-colors shadow-sm group select-none ${isDragging ? "opacity-40" : ""}`}
    >
      <GripVertical size={14} className="text-[#94A3B8] mt-[2px] opacity-60 group-hover:opacity-100 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[#0F172A] leading-tight">{title}</div>
        <div className={`${mono ? "font-mono text-[10px]" : "text-[11px]"} text-[#64748B] mt-1 leading-snug`}>{subtitle}</div>
      </div>
      <button
        data-testid={`${testId}-add`}
        title="Add to end"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-[#1D4ED8] transition-all rounded-[2px] hover:bg-[#EFF6FF] shrink-0"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
