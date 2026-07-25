import { useRef, useState } from "react";
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
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Template } from "@workspace/api-client-react";
import { findBlock, findSubsection } from "../state/templateTree";
import type { TemplateAction } from "../state/templateActions";
import { builderCollisionDetection, type DragPayload, type DropPayload } from "./dndModel";

const PALETTE_LABELS = { section: "Section", subsection: "Subsection", document: "Document upload", fields: "Field group" } as const;
const END = Number.MAX_SAFE_INTEGER; // reducer clamps to list length

type DraftSnapshot = { template: Template; dirty: boolean };

/**
 * The DnD adapter, kit-native (dnd-kit's standard multi-container pattern):
 *
 * - Same-container position preview comes from @dnd-kit/sortable's own
 *   sibling transforms — no custom indicator.
 * - Cross-container drags transfer the item LIVE in onDragOver (the real
 *   reducer MOVE, safe because ids are stable), so the preview is identical
 *   everywhere; onDragEnd only fixes the final position within the list.
 * - Esc or dropping outside any target restores the pre-drag snapshot.
 * - Palette / saved-section drags create nothing until drop: the container
 *   highlight shows the target list and the new item appends to its end.
 *
 * Every drop still resolves to the SAME reducer actions the buttons dispatch;
 * nothing outside dnd/ imports @dnd-kit.
 */
export function BuilderDnd({
  template,
  dispatch,
  getSnapshot,
  restoreSnapshot,
  children,
}: {
  template: Template;
  dispatch: (a: TemplateAction) => void;
  getSnapshot: () => DraftSnapshot | null;
  restoreSnapshot: (s: DraftSnapshot) => void;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<DragPayload | null>(null);
  const preDrag = useRef<DraftSnapshot | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => {
    preDrag.current = getSnapshot();
    setActive((e.active.data.current?.["payload"] as DragPayload) ?? null);
  };

  /** Live cross-container transfer. Payloads re-render after each move, so
   * `drag` always reflects the item's CURRENT container — the same-container
   * guard makes this settle instead of oscillate. */
  const onDragOver = (e: DragOverEvent) => {
    const drag = e.active.data.current?.["payload"] as DragPayload | undefined;
    const drop = e.over?.data.current?.["payload"] as DropPayload | undefined;
    if (!drag || !drop) return;

    if (drag.type === "block") {
      const toSubsectionId =
        drop.type === "block" ? drop.subsectionId : drop.type === "block-list" ? drop.subsectionId : null;
      if (toSubsectionId && toSubsectionId !== drag.subsectionId) {
        dispatch({
          type: "MOVE_BLOCK",
          blockId: drag.blockId,
          toSubsectionId,
          toIndex: drop.type === "block" ? drop.index : END,
        });
      }
      return;
    }
    if (drag.type === "subsection") {
      const toSectionId =
        drop.type === "subsection" ? drop.sectionId : drop.type === "section-area" ? drop.sectionId : null;
      if (toSectionId && toSectionId !== drag.sectionId) {
        dispatch({
          type: "MOVE_SUBSECTION",
          subsectionId: drag.subsectionId,
          toSectionId,
          toIndex: drop.type === "subsection" ? drop.index : END,
        });
      }
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const drag = e.active.data.current?.["payload"] as DragPayload | undefined;
    const drop = e.over?.data.current?.["payload"] as DropPayload | undefined;
    const snapshot = preDrag.current;
    preDrag.current = null;
    if (!drag) return;

    // Dropped outside any legal target → the drag is void; any live
    // transfers that happened along the way are rolled back.
    if (!drop) {
      if (snapshot) restoreSnapshot(snapshot);
      return;
    }

    if (drag.type === "palette" || drag.type === "saved-section") {
      const action = paletteDropAction(drag, drop);
      if (action) dispatch(action);
      return;
    }

    // Existing items: cross-container transfers already happened in
    // onDragOver — what's left is the final position within the list
    // (arrayMove semantics mapped to the reducer's insert-before contract).
    const insertBefore = (overIndex: number, activeIndex: number) =>
      overIndex > activeIndex ? overIndex + 1 : overIndex;

    if (drag.type === "block" && drop.type === "block" && drop.blockId !== drag.blockId) {
      dispatch({
        type: "MOVE_BLOCK",
        blockId: drag.blockId,
        toSubsectionId: drop.subsectionId,
        toIndex: insertBefore(drop.index, drag.index),
      });
    } else if (drag.type === "subsection" && drop.type === "subsection" && drop.subsectionId !== drag.subsectionId) {
      dispatch({
        type: "MOVE_SUBSECTION",
        subsectionId: drag.subsectionId,
        toSectionId: drop.sectionId,
        toIndex: insertBefore(drop.index, drag.index),
      });
    } else if (drag.type === "section" && drop.type === "section" && drop.sectionId !== drag.sectionId) {
      dispatch({
        type: "MOVE_SECTION",
        sectionId: drag.sectionId,
        toIndex: insertBefore(drop.index, drag.index),
      });
    }
  };

  const onDragCancel = () => {
    setActive(null);
    const snapshot = preDrag.current;
    preDrag.current = null;
    if (snapshot) restoreSnapshot(snapshot);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={builderCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
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

/** New items append to the end of the hovered container (the highlight is
 * the cue); repositioning afterwards gets the full live preview. */
function paletteDropAction(
  drag: Extract<DragPayload, { type: "palette" | "saved-section" }>,
  drop: DropPayload,
): TemplateAction | null {
  if (drag.type === "saved-section") return { type: "INSERT_SAVED_SECTION", section: drag.section };
  switch (drag.kind) {
    case "section":
      return { type: "ADD_SECTION" };
    case "subsection": {
      const sectionId =
        drop.type === "section-area" ? drop.sectionId : drop.type === "subsection" ? drop.sectionId : null;
      return sectionId ? { type: "ADD_SUBSECTION", sectionId } : null;
    }
    case "document":
    case "fields": {
      const subsectionId =
        drop.type === "block-list" ? drop.subsectionId : drop.type === "block" ? drop.subsectionId : null;
      return subsectionId ? { type: "ADD_BLOCK", subsectionId, kind: drag.kind } : null;
    }
  }
}
