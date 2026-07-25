import { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Template } from "@workspace/api-client-react";
import { findBlock, findSubsection } from "../state/templateTree";
import type { TemplateAction } from "../state/templateActions";
import { builderCollisionDetection, type DragPayload, type DropPayload } from "./dndModel";

const PALETTE_LABELS = { section: "Section", subsection: "Subsection", document: "Document upload", fields: "Field group" } as const;
const END = Number.MAX_SAFE_INTEGER; // reducer clamps to list length

/**
 * The DnD adapter: mounts the single DndContext and translates drops into the
 * SAME reducer actions the click-to-add buttons dispatch. Nothing outside
 * dnd/ imports @dnd-kit. Finalize-on-drop only (no live onDragOver mutation)
 * — simpler, and immune to the cross-container key-churn crashes.
 */
export function BuilderDnd({
  template,
  dispatch,
  children,
}: {
  template: Template;
  dispatch: (a: TemplateAction) => void;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<DragPayload | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) =>
    setActive((e.active.data.current?.["payload"] as DragPayload) ?? null);

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const drag = e.active.data.current?.["payload"] as DragPayload | undefined;
    const drop = e.over?.data.current?.["payload"] as DropPayload | undefined;
    if (!drag || !drop) return;
    const action = dropToAction(drag, drop);
    if (action) dispatch(action);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={builderCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
    >
      {children}
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {active && (
            <div className="px-3 py-2 bg-white border border-[#1D4ED8] rounded-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.18)] text-[12.5px] font-medium text-[#0F172A] rotate-2 cursor-grabbing max-w-[240px] truncate">
              {overlayLabel(template, active)}
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}

function overlayLabel(template: Template, p: DragPayload): string {
  switch (p.type) {
    case "palette":
      return PALETTE_LABELS[p.kind];
    case "saved-section":
      return p.section.name;
    case "section":
      return template.sections.find((s) => s.id === p.sectionId)?.name ?? "Section";
    case "subsection":
      return findSubsection(template, p.subsectionId)?.name ?? "Subsection";
    case "block":
      return findBlock(template, p.blockId)?.name ?? "Block";
  }
}

/** The single mapping from a drop to a reducer action. */
function dropToAction(drag: DragPayload, drop: DropPayload): TemplateAction | null {
  switch (drag.type) {
    case "palette":
      if (drag.kind === "section")
        return drop.type === "section"
          ? { type: "ADD_SECTION", atIndex: drop.index }
          : { type: "ADD_SECTION" };
      if (drag.kind === "subsection") {
        if (drop.type === "subsection")
          return { type: "ADD_SUBSECTION", sectionId: drop.sectionId, atIndex: drop.index };
        if (drop.type === "section-area") return { type: "ADD_SUBSECTION", sectionId: drop.sectionId };
        return null;
      }
      if (drop.type === "block")
        return { type: "ADD_BLOCK", subsectionId: drop.subsectionId, kind: drag.kind, atIndex: drop.index };
      if (drop.type === "block-list")
        return { type: "ADD_BLOCK", subsectionId: drop.subsectionId, kind: drag.kind };
      return null;

    case "saved-section":
      return {
        type: "INSERT_SAVED_SECTION",
        section: drag.section,
        ...(drop.type === "section" ? { atIndex: drop.index } : {}),
      };

    case "section":
      if (drop.type === "section" && drop.sectionId !== drag.sectionId)
        return { type: "MOVE_SECTION", fromIndex: drag.index, toIndex: drop.index };
      return null;

    case "subsection":
      if (drop.type === "subsection" && drop.subsectionId !== drag.subsectionId)
        return {
          type: "MOVE_SUBSECTION",
          fromSectionId: drag.sectionId,
          toSectionId: drop.sectionId,
          fromIndex: drag.index,
          toIndex: drop.index,
        };
      if (drop.type === "section-area" && drop.sectionId !== drag.sectionId)
        return {
          type: "MOVE_SUBSECTION",
          fromSectionId: drag.sectionId,
          toSectionId: drop.sectionId,
          fromIndex: drag.index,
          toIndex: END,
        };
      return null;

    case "block":
      if (drop.type === "block" && drop.blockId !== drag.blockId)
        return {
          type: "MOVE_BLOCK",
          fromSubsectionId: drag.subsectionId,
          toSubsectionId: drop.subsectionId,
          fromIndex: drag.index,
          toIndex: drop.index,
        };
      if (drop.type === "block-list" && drop.subsectionId !== drag.subsectionId)
        return {
          type: "MOVE_BLOCK",
          fromSubsectionId: drag.subsectionId,
          toSubsectionId: drop.subsectionId,
          fromIndex: drag.index,
          toIndex: END,
        };
      return null;
  }
}
