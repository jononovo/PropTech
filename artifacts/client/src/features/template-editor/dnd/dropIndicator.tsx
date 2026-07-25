import { createContext, useContext } from "react";

/**
 * Where a drop would land relative to the hovered card — the standard
 * sortable convention: pointer above the card's midpoint inserts ABOVE,
 * below inserts BELOW. BuilderDnd owns the state; cards render a 2px
 * #1D4ED8 rule at the exact insert position.
 */
export type DropSide = "above" | "below";
export const DropIndicatorContext = createContext<{ id: string; side: DropSide } | null>(null);

export function useDropIndicator(dndId: string): DropSide | null {
  const over = useContext(DropIndicatorContext);
  return over && over.id === dndId ? over.side : null;
}

/** The visual rule itself — absolutely positioned into the list gap. */
export function DropRule({ side }: { side: DropSide }) {
  return (
    <div
      data-testid={`drop-rule-${side}`}
      className={`absolute left-0 right-0 h-[2px] bg-[#1D4ED8] rounded-full z-30 pointer-events-none ${
        side === "above" ? "-top-[6px]" : "-bottom-[6px]"
      }`}
    />
  );
}
