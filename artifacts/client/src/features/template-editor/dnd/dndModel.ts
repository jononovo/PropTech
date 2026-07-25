import { pointerWithin, rectIntersection, type CollisionDetection } from "@dnd-kit/core";
import type { Section } from "@workspace/api-client-react";

/**
 * Drag payload contract for the builder. Every draggable/droppable carries a
 * typed `data.payload` so handlers can decide legality without string-parsing
 * ids. Palette ids are namespaced (`palette:*`) and NEVER enter template
 * state — a drop dispatches a reducer action, which mints real ids.
 */

export type DragPayload =
  | { type: "palette"; kind: "section" | "subsection" | "document" | "fields" }
  | { type: "saved-section"; section: Section }
  | { type: "section"; sectionId: string; index: number }
  | { type: "subsection"; subsectionId: string; sectionId: string; index: number }
  | { type: "block"; blockId: string; subsectionId: string; index: number };

export type DropPayload =
  | { type: "canvas" } // root: accepts sections / saved sections / palette-section
  | { type: "section-area"; sectionId: string } // accepts subsections / palette-subsection
  | { type: "block-list"; subsectionId: string } // accepts blocks / palette document+fields
  | DragPayload; // sortable items are droppable too

const isContainerFor = (drop: DropPayload, drag: DragPayload): boolean => {
  switch (drag.type) {
    case "palette":
      if (drag.kind === "section") return drop.type === "canvas" || drop.type === "section";
      if (drag.kind === "subsection")
        return drop.type === "section-area" || drop.type === "subsection";
      return drop.type === "block-list" || drop.type === "block";
    case "saved-section":
    case "section":
      return drop.type === "canvas" || drop.type === "section";
    case "subsection":
      return drop.type === "section-area" || drop.type === "subsection";
    case "block":
      return drop.type === "block-list" || drop.type === "block";
  }
};

/**
 * Nested-container collision detection (dnd-kit's defaults pick outer
 * containers when droppables nest): pointerWithin first, then
 * rectIntersection, then closestCorners — always filtered to droppables that
 * may legally receive the active item's type.
 */
export const builderCollisionDetection: CollisionDetection = (args) => {
  const drag = args.active.data.current?.["payload"] as DragPayload | undefined;
  if (!drag) return pointerWithin(args);

  const legal = args.droppableContainers.filter((c) => {
    const drop = c.data.current?.["payload"] as DropPayload | undefined;
    return drop ? isContainerFor(drop, drag) : false;
  });
  const scoped = { ...args, droppableContainers: legal };

  const specific = (collisions: ReturnType<CollisionDetection>) => {
    // Items always beat their wrapping containers: when the pointer is over a
    // card, the card is the target (drop position = above/below its midpoint);
    // containers only catch drops on genuinely empty space.
    const isItem = (id: unknown) => {
      const c = legal.find((d) => d.id === id);
      const p = c?.data.current?.["payload"] as DropPayload | undefined;
      return p ? p.type === "section" || p.type === "subsection" || p.type === "block" : false;
    };
    const items = collisions.filter((c) => isItem(c.id));
    return items.length > 0 ? items : collisions;
  };

  // Pointer-based when a pointer exists: targets are exactly what the cursor
  // is inside, and genuinely empty space yields over=null so an aborted drag
  // rolls back ("pull it out → it goes back"). Rect overlap would defeat
  // both — block cards are nearly full-width, so their translated rect still
  // overlaps the canvas from the margin. Keyboard drags have no pointer and
  // use rect overlap instead.
  if (args.pointerCoordinates) return specific(pointerWithin(scoped));
  return specific(rectIntersection(scoped));
};
