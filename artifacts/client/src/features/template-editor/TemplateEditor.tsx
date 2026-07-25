import { useState } from "react";
import { Link, useRoute } from "wouter";
import { ChevronRight } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { SavedSection } from "@workspace/api-client-react";
import { BuilderDnd } from "./dnd/BuilderDnd";
import { Palette, PALETTE } from "./components/Palette";
import { SectionCard } from "./components/SectionCard";
import { useTemplateDraft } from "./useTemplateDraft";

/**
 * Builder shell: header (title, status, JSON, Save Draft), palette, canvas.
 * All mutations flow through useTemplateDraft's dispatch → templateReducer —
 * the palette + buttons + drags share that single path. Active templates
 * render fully read-only (server enforces with a 409 regardless).
 */
export function TemplateEditor() {
  const [, params] = useRoute("/builder/:family/:version");
  const family = params?.family || "";
  const version = parseInt(params?.version || "1", 10);
  const draft = useTemplateDraft(family, version);
  const [editedBlockId, setEditedBlockId] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  if (draft.isLoading || !draft.template)
    return <div className="p-8 font-mono text-sm text-[#64748B]">Loading template...</div>;
  if (draft.loadError)
    return <div className="p-8 font-mono text-sm text-[#B91C1C]">Failed to load template.</div>;

  const template = draft.template;
  const readOnly = template.status === "active";

  const quickAdd = (kind: (typeof PALETTE)[number]["kind"]) => {
    if (kind === "section") return draft.dispatch({ type: "ADD_SECTION" });
    const firstSection = template.sections[0];
    if (kind === "subsection") {
      if (firstSection) draft.dispatch({ type: "ADD_SUBSECTION", sectionId: firstSection.id });
      return;
    }
    const firstSubsection = template.sections.flatMap((s) => s.subsections)[0];
    if (firstSubsection)
      draft.dispatch({ type: "ADD_BLOCK", subsectionId: firstSubsection.id, kind });
  };
  const quickInsertSaved = (saved: SavedSection) =>
    draft.dispatch({ type: "INSERT_SAVED_SECTION", section: saved.section });

  return (
    <div className="w-full h-[100dvh] flex flex-col font-sans bg-[#F3F5F7] text-[#0F172A] overflow-hidden relative selection:bg-[#BFDBFE] selection:text-[#1E40AF]">
      <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 z-10">
        <Link href="/templates" className="text-[#64748B] hover:text-[#0F172A] mr-4 transition-colors" data-testid="builder-back">
          <ChevronRight size={18} className="rotate-180" />
        </Link>
        <div className="text-[14px] font-medium text-[#0F172A] mr-2">
          {readOnly ? (
            template.template
          ) : (
            <input
              value={template.template}
              onChange={(e) => draft.dispatch({ type: "RENAME_TEMPLATE", name: e.target.value })}
              data-testid="builder-title"
              className="border-b border-dashed border-[#94A3B8] pb-[1px] bg-transparent outline-none focus:border-solid focus:border-[#1D4ED8]"
            />
          )}
        </div>

        <div className="flex-1" />

        {draft.saveError && (
          <div className="text-[11px] text-[#B91C1C] mr-4 max-w-[320px] truncate" title={draft.saveError} data-testid="builder-save-error">
            {draft.saveError}
          </div>
        )}

        <div className="font-mono text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[2px] mr-2">
          v{template.version}
        </div>
        {template.status === "draft" ? (
          <div className="font-mono text-[10px] font-medium text-[#64748B] uppercase tracking-[0.06em] border border-[#CBD5E1] px-1.5 py-0.5 rounded-[2px] mr-6">
            draft{draft.dirty ? " · unsaved" : ""}
          </div>
        ) : (
          <div className="font-mono text-[10px] font-medium text-[#1D4ED8] uppercase tracking-[0.06em] border border-[#BFDBFE] px-1.5 py-0.5 rounded-[2px] mr-6">
            active
          </div>
        )}

        <button
          onClick={() => setShowJson(!showJson)}
          data-testid="builder-json"
          className="font-mono text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] mr-4 transition-colors"
        >
          {`{ } JSON`}
        </button>

        {!readOnly && (
          <button
            onClick={draft.save}
            disabled={draft.saving || !draft.dirty}
            data-testid="builder-save"
            className="bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#94A3B8] transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px] shadow-sm"
          >
            {draft.saving ? "Saving..." : "Save Draft"}
          </button>
        )}
      </header>

      <BuilderDnd template={template} dispatch={draft.dispatch}>
        <div className="flex flex-1 overflow-hidden">
          <Palette
            template={template}
            savedSections={draft.savedSections}
            readOnly={readOnly}
            onQuickAdd={quickAdd}
            onQuickInsertSaved={quickInsertSaved}
          />
          <Canvas
            draft={draft}
            readOnly={readOnly}
            editedBlockId={editedBlockId}
            onEditBlock={setEditedBlockId}
          />
        </div>
      </BuilderDnd>

      {showJson && (
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#0F172A] border-t border-[#334155] z-50 flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
            <div className="text-[11px] font-mono text-[#94A3B8]">template.json</div>
            <button onClick={() => setShowJson(false)} className="text-[11px] text-[#94A3B8] hover:text-white transition-colors">
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className="font-mono text-[11px] text-[#E2E8F0] leading-relaxed">{JSON.stringify(template, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Canvas({
  draft,
  readOnly,
  editedBlockId,
  onEditBlock,
}: {
  draft: ReturnType<typeof useTemplateDraft>;
  readOnly: boolean;
  editedBlockId: string | null;
  onEditBlock: (id: string | null) => void;
}) {
  const template = draft.template!;
  const drop = useDroppable({ id: "canvas", data: { payload: { type: "canvas" } } });
  return (
    <main className="flex-1 overflow-auto p-8 pb-40">
      <div
        ref={drop.setNodeRef}
        className={`max-w-[760px] mx-auto rounded-[6px] transition-colors ${drop.isOver ? "bg-[#EFF6FF]" : ""}`}
      >
        <SortableContext items={template.sections.map((s) => `section:${s.id}`)} strategy={verticalListSortingStrategy}>
          {template.sections.map((section, sIdx) => (
            <SectionCard
              key={section.id}
              section={section}
              index={sIdx}
              template={template}
              readOnly={readOnly}
              editedBlockId={editedBlockId}
              onEditBlock={onEditBlock}
              onSaveToLibrary={draft.saveSectionToLibrary}
              dispatch={draft.dispatch}
            />
          ))}
        </SortableContext>
        {!readOnly && (
          <button
            onClick={() => draft.dispatch({ type: "ADD_SECTION" })}
            data-testid="add-section"
            className="text-[13px] font-medium text-[#64748B] border-2 border-dashed border-[#CBD5E1] rounded-[6px] w-full py-4 hover:border-[#94A3B8] hover:text-[#0F172A] transition-colors bg-white/50"
          >
            + Add Section
          </button>
        )}
      </div>
    </main>
  );
}
