import {
  closestCorners,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";
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

  const within = pointerWithin(scoped);
  if (within.length > 0) return within;
  const intersecting = rectIntersection(scoped);
  if (intersecting.length > 0) return intersecting;
  return closestCorners(scoped);
};
