import { useState } from "react";
import type { Block, Template } from "@workspace/api-client-react";
import { getSectionNumber, groupForPrimary } from "../../dimensions/helpers";

/**
 * "+ add alternative" — picks another DOCUMENT block to satisfy the primary.
 * Candidates: any document block that isn't the primary, isn't already in the
 * group, and isn't itself a required_alt primary (one group per primary).
 */
export function AlternativePicker({
  template,
  primary,
  onPick,
}: {
  template: Template;
  primary: Block;
  onPick: (blockId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inGroup = new Set(groupForPrimary(template, primary.id)?.satisfiedBy ?? []);
  const primaries = new Set(template.alternatives.map((g) => g.primary));

  const candidates = template.sections.flatMap((s) =>
    s.subsections.flatMap((ss) =>
      ss.blocks.filter(
        (b) =>
          b.kind === "document" && b.id !== primary.id && !inGroup.has(b.id) && !primaries.has(b.id),
      ),
    ),
  );

  return (
    <span className="relative">
      <button
        data-testid="block-editor-add-alternative"
        onClick={() => setOpen(!open)}
        className="text-[10px] text-[#64748B] border-b border-dashed border-[#CBD5E1] hover:text-[#0F172A] hover:border-[#94A3B8] transition-colors ml-1"
      >
        + add alternative
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-[240px] max-h-[220px] overflow-auto bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] rounded-[4px] py-1 z-50">
          {candidates.length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-[#94A3B8] italic">No eligible document blocks.</div>
          ) : (
            candidates.map((b) => (
              <button
                key={b.id}
                data-testid={`alt-candidate-${b.id}`}
                onClick={() => {
                  onPick(b.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              >
                {b.name} <span className="font-mono text-[10px] text-[#94A3B8]">({getSectionNumber(template, b.id)})</span>
              </button>
            ))
          )}
        </div>
      )}
    </span>
  );
}
