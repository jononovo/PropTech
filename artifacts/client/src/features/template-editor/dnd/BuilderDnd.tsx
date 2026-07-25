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
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Template } from "@workspace/api-client-react";
import { findBlock, findSubsection } from "../state/templateTree";
import type { TemplateAction } from "../state/templateActions";
import { builderCollisionDetection, type DragPayload, type DropPayload } from "./dndModel";
import { DropIndicatorContext, type DropSide } from "./dropIndicator";

const PALETTE_LABELS = { section: "Section", subsection: "Subsection", document: "Document upload", fields: "Field group" } as const;
const END = Number.MAX_SAFE_INTEGER; // reducer clamps to list length

/**
 * The DnD adapter: mounts the single DndContext and translates drops into the
 * SAME reducer actions the click-to-add buttons dispatch. Standard sortable
 * convention throughout: hovering an item's upper half inserts above it,
 * lower half below — tracked on drag-move, rendered by the cards via
 * DropIndicatorContext, applied to the insert index on drop.
 * Finalize-on-drop only; nothing outside dnd/ imports @dnd-kit.
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
  const [over, setOver] = useState<{ id: string; side: DropSide } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) =>
    setActive((e.active.data.current?.["payload"] as DragPayload) ?? null);

  const onDragMove = (e: DragMoveEvent) => {
    const overNode = e.over;
    const activeRect = e.active.rect.current.translated ?? e.active.rect.current.initial;
    if (!overNode || !activeRect) {
      setOver(null);
      return;
    }
    const drop = overNode.data.current?.["payload"] as DropPayload | undefined;
    const isItem = drop && (drop.type === "section" || drop.type === "subsection" || drop.type === "block");
    if (!isItem) {
      setOver(null);
      return;
    }
    const activeMidY = activeRect.top + activeRect.height / 2;
    const overMidY = overNode.rect.top + overNode.rect.height / 2;
    setOver({ id: String(overNode.id), side: activeMidY < overMidY ? "above" : "below" });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const after = over?.side === "below";
    setActive(null);
    setOver(null);
    const drag = e.active.data.current?.["payload"] as DragPayload | undefined;
    const drop = e.over?.data.current?.["payload"] as DropPayload | undefined;
    if (!drag || !drop) return;
    const action = dropToAction(drag, drop, after);
    if (action) dispatch(action);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={builderCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActive(null);
        setOver(null);
      }}
    >
      <DropIndicatorContext.Provider value={over}>{children}</DropIndicatorContext.Provider>
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

/**
 * The single mapping from a drop to a reducer action. `after` = pointer was
 * below the hovered item's midpoint, so the insert lands AFTER it. Moves
 * address the dragged item by id (the WHAT); indices only say WHERE — the
 * reducer resolves the source position itself, so a stale index can never
 * move the wrong item.
 */
function dropToAction(drag: DragPayload, drop: DropPayload, after: boolean): TemplateAction | null {
  const at = (index: number) => index + (after ? 1 : 0);
  switch (drag.type) {
    case "palette":
      if (drag.kind === "section")
        return drop.type === "section"
          ? { type: "ADD_SECTION", atIndex: at(drop.index) }
          : { type: "ADD_SECTION" };
      if (drag.kind === "subsection") {
        if (drop.type === "subsection")
          return { type: "ADD_SUBSECTION", sectionId: drop.sectionId, atIndex: at(drop.index) };
        if (drop.type === "section-area") return { type: "ADD_SUBSECTION", sectionId: drop.sectionId };
        return null;
      }
      if (drop.type === "block")
        return { type: "ADD_BLOCK", subsectionId: drop.subsectionId, kind: drag.kind, atIndex: at(drop.index) };
      if (drop.type === "block-list")
        return { type: "ADD_BLOCK", subsectionId: drop.subsectionId, kind: drag.kind };
      return null;

    case "saved-section":
      return {
        type: "INSERT_SAVED_SECTION",
        section: drag.section,
        ...(drop.type === "section" ? { atIndex: at(drop.index) } : {}),
      };

    case "section":
      if (drop.type === "section" && drop.sectionId !== drag.sectionId)
        return { type: "MOVE_SECTION", sectionId: drag.sectionId, toIndex: at(drop.index) };
      return null;

    case "subsection":
      if (drop.type === "subsection" && drop.subsectionId !== drag.subsectionId)
        return {
          type: "MOVE_SUBSECTION",
          subsectionId: drag.subsectionId,
          toSectionId: drop.sectionId,
          toIndex: at(drop.index),
        };
      if (drop.type === "section-area" && drop.sectionId !== drag.sectionId)
        return {
          type: "MOVE_SUBSECTION",
          subsectionId: drag.subsectionId,
          toSectionId: drop.sectionId,
          toIndex: END,
        };
      return null;

    case "block":
      if (drop.type === "block" && drop.blockId !== drag.blockId)
        return {
          type: "MOVE_BLOCK",
          blockId: drag.blockId,
          toSubsectionId: drop.subsectionId,
          toIndex: at(drop.index),
        };
      if (drop.type === "block-list")
        return {
          type: "MOVE_BLOCK",
          blockId: drag.blockId,
          toSubsectionId: drop.subsectionId,
          toIndex: END,
        };
      return null;
  }
}
