import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal } from "lucide-react";
import type { Section, Template } from "@workspace/api-client-react";
import type { TemplateAction } from "../state/templateActions";
import { SubsectionGroup } from "./SubsectionGroup";

const OWNERS: Section["owner"][] = ["Applicant", "Originator", "Escrow", "Homium"];

/** One section: sortable card with header (rename/owner/menu), working
 * permission toggles, and a sortable subsection area that accepts
 * palette-subsection drops. */
export function SectionCard({
  section,
  index,
  template,
  readOnly,
  editedBlockId,
  onEditBlock,
  onSaveToLibrary,
  dispatch,
}: {
  section: Section;
  index: number;
  template: Template;
  readOnly: boolean;
  editedBlockId: string | null;
  onEditBlock: (id: string | null) => void;
  onSaveToLibrary: (section: Section) => void;
  dispatch: (a: TemplateAction) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);

  const sortable = useSortable({
    id: `section:${section.id}`,
    data: { payload: { type: "section", sectionId: section.id, index } },
    disabled: readOnly,
  });
  const dropArea = useDroppable({
    id: `sectionarea:${section.id}`,
    data: { payload: { type: "section-area", sectionId: section.id } },
  });

  const blocks = section.subsections.reduce((n, ss) => n + ss.blocks.length, 0);
  const docs = section.subsections.reduce(
    (n, ss) => n + ss.blocks.filter((b) => b.kind === "document").length,
    0,
  );

  return (
    <div
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={`relative mb-10 last:mb-0 ${sortable.isDragging ? "opacity-40" : ""}`}
      data-testid={`section-${section.id}`}
    >
      <div className="flex items-center group mb-4 relative z-20">
        <button
          onClick={() => setCollapsed(!collapsed)}
          data-testid={`section-${section.id}-collapse`}
          className="p-1 -ml-1 mr-1 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-[2px] hover:bg-[#E2E8F0]"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className="font-mono text-[13px] text-[#94A3B8] w-6 font-medium">
          {(index + 1).toString().padStart(2, "0")}
        </div>

        <div className="text-[15px] font-semibold text-[#0F172A] flex-1 flex items-center">
          {readOnly ? (
            section.name
          ) : (
            <input
              value={section.name}
              onChange={(e) => dispatch({ type: "RENAME_SECTION", sectionId: section.id, name: e.target.value })}
              data-testid={`section-${section.id}-name`}
              className="bg-transparent outline-none border-b border-transparent focus:border-[#CBD5E1] min-w-0 flex-1 max-w-[320px]"
            />
          )}
          {collapsed && (
            <span className="font-mono text-[11px] text-[#64748B] ml-3 font-normal shrink-0">
              {blocks} blocks · {docs} documents
            </span>
          )}
        </div>

        {readOnly ? (
          <div className="px-1.5 py-0.5 bg-[#E2E8F0] text-[#475569] text-[9.5px] uppercase tracking-[0.06em] font-semibold rounded-[2px] mr-3">
            {section.owner}
          </div>
        ) : (
          <select
            value={section.owner}
            onChange={(e) => dispatch({ type: "SET_SECTION_OWNER", sectionId: section.id, owner: e.target.value as Section["owner"] })}
            data-testid={`section-${section.id}-owner`}
            title="Section owner — the responsible party"
            className="px-1 py-0.5 bg-[#E2E8F0] text-[#475569] text-[9.5px] uppercase tracking-[0.06em] font-semibold rounded-[2px] mr-3 outline-none cursor-pointer"
          >
            {OWNERS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )}

        {!readOnly && (
          <span
            {...sortable.attributes}
            {...sortable.listeners}
            data-testid={`section-${section.id}-grip`}
            className="opacity-0 group-hover:opacity-100 cursor-grab transition-opacity mr-2 touch-none"
          >
            <GripVertical size={15} className="text-[#94A3B8]" />
          </span>
        )}

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            data-testid={`section-${section.id}-menu`}
            className={`p-1 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-[2px] hover:bg-[#E2E8F0] ${menuOpen ? "opacity-100 bg-[#E2E8F0] text-[#0F172A]" : "opacity-0 group-hover:opacity-100"}`}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-[170px] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] rounded-[4px] py-1 z-50">
              <MenuItem testId={`section-${section.id}-permissions`} onClick={() => { setPermsOpen(!permsOpen); setMenuOpen(false); }}>
                Permissions
              </MenuItem>
              {!readOnly && (
                <>
                  <MenuItem testId={`section-${section.id}-save-library`} onClick={() => { onSaveToLibrary(section); setMenuOpen(false); }}>
                    Save to library
                  </MenuItem>
                  <MenuItem testId={`section-${section.id}-duplicate`} onClick={() => { dispatch({ type: "INSERT_SAVED_SECTION", section, atIndex: index + 1 }); setMenuOpen(false); }}>
                    Duplicate
                  </MenuItem>
                  <div className="h-px bg-[#E2E8F0] my-1" />
                  <MenuItem testId={`section-${section.id}-remove`} danger onClick={() => { dispatch({ type: "REMOVE_SECTION", sectionId: section.id }); setMenuOpen(false); }}>
                    Remove section
                  </MenuItem>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {permsOpen && (
        <div className="bg-[#F8FAFC] border-y border-[#E2E8F0] px-4 py-3 flex items-center mb-5 overflow-x-auto -ml-7 z-10 relative">
          <div className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-[0.08em] mr-8 shrink-0">Who sees · Who adds</div>
          <div className="flex items-center gap-8 flex-1">
            {section.permissions.map((perm) => (
              <div key={perm.role} className="flex flex-col gap-2 shrink-0">
                <div className="text-[11px] font-medium text-[#0F172A]">{perm.role}</div>
                <div className="flex items-center gap-3">
                  {(["view", "upload"] as const).map((field) => (
                    <div key={field} className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-wider">{field}</span>
                      <button
                        disabled={readOnly}
                        onClick={() => dispatch({ type: "SET_PERMISSION", sectionId: section.id, role: perm.role, field, value: !perm[field] })}
                        data-testid={`perm-${section.id}-${perm.role}-${field}`}
                        className={`w-6 h-[14px] rounded-[7px] relative transition-colors ${perm[field] ? "bg-[#1D4ED8]" : "bg-[#CBD5E1]"} ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className={`absolute top-[2px] left-[2px] w-[10px] h-[10px] bg-white rounded-full transition-transform ${perm[field] ? "translate-x-[10px]" : ""}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!collapsed && (
        <div
          ref={dropArea.setNodeRef}
          className={`pl-6 space-y-8 border-l border-[#E2E8F0] ml-3 mt-4 relative z-0 rounded-r-[4px] transition-colors ${dropArea.isOver ? "bg-[#EFF6FF]" : ""}`}
        >
          <SortableContext items={section.subsections.map((ss) => `sub:${ss.id}`)} strategy={verticalListSortingStrategy}>
            {section.subsections.map((ss, ssIdx) => (
              <SubsectionGroup
                key={ss.id}
                subsection={ss}
                sectionId={section.id}
                index={ssIdx}
                template={template}
                readOnly={readOnly}
                editedBlockId={editedBlockId}
                onEditBlock={onEditBlock}
                dispatch={dispatch}
              />
            ))}
          </SortableContext>
          {!readOnly && (
            <button
              onClick={() => dispatch({ type: "ADD_SUBSECTION", sectionId: section.id })}
              data-testid={`section-${section.id}-add-subsection`}
              className="text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors flex items-center -ml-[25px]"
            >
              <span className="border-b border-dashed border-[#CBD5E1] hover:border-[#94A3B8]">+ Add subsection</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger, testId }: { children: React.ReactNode; onClick: () => void; danger?: boolean; testId: string }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`w-full text-left px-3 py-1.5 text-[12.5px] transition-colors ${danger ? "text-[#B91C1C] hover:bg-[#FEF2F2]" : "text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]"}`}
    >
      {children}
    </button>
  );
}
