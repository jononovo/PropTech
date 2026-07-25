import type { Block, BlockCriticality, BlockRequirement, BlockSourcing, Template } from "@workspace/api-client-react";
import { blockName, criticalityLabel, getSectionNumber, groupForPrimary, requirementLabel, sourcingLabel } from "../../dimensions/helpers";
import type { BlockPatch, FieldType, TemplateAction } from "../state/templateActions";
import { DOC_TYPES } from "../state/docTypes";
import { AlternativePicker } from "./AlternativePicker";
import { FieldListEditor } from "./FieldListEditor";
import { VariantConfigEditor } from "./VariantConfigEditor";

const mono = "border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px cursor-pointer";

/**
 * Expanded editor for one block — the FULL contract surface. Every control is
 * controlled and dispatches UPDATE_BLOCK (or alternatives/field actions);
 * nothing here is local-only state, so Save Draft persists exactly what you see.
 */
export function BlockEditor({
  block,
  template,
  dispatch,
  onDone,
}: {
  block: Block;
  template: Template;
  dispatch: (a: TemplateAction) => void;
  onDone: () => void;
}) {
  const patch = (p: BlockPatch) => dispatch({ type: "UPDATE_BLOCK", blockId: block.id, patch: p });
  const group = groupForPrimary(template, block.id);
  const expiryKind = block.expiry?.kind ?? "none";

  return (
    <div className="bg-white border-2 border-[#1D4ED8] rounded-[4px] p-3 flex shadow-sm relative z-10 flex-col" data-testid={`block-editor-${block.id}`}>
      <div className="flex items-center">
        <input
          type="text"
          value={block.name}
          onChange={(e) => patch({ name: e.target.value })}
          data-testid="block-editor-name"
          className="text-[13px] font-medium text-[#0F172A] border-b border-dashed border-[#1D4ED8] bg-transparent outline-none pb-0.5 flex-1 focus:border-solid"
        />
        <button onClick={onDone} data-testid="block-editor-done" className="ml-2 text-[11px] text-[#1D4ED8] font-medium">
          Done
        </button>
      </div>

      {block.kind === "document" && (
        <div className="flex items-center gap-3 font-mono text-[11px] mt-2.5 bg-[#F8FAFC] p-2 rounded-[2px] border border-[#E2E8F0] flex-wrap">
          <label className="flex items-center gap-1.5">
            <span className="text-[#64748B]">Req:</span>
            <select
              value={block.requirement ?? "optional"}
              onChange={(e) => patch({ requirement: e.target.value as BlockRequirement })}
              data-testid="block-editor-requirement"
              className={mono}
            >
              {(["required", "required_alt", "recommended", "optional"] as const).map((r) => (
                <option key={r} value={r}>{requirementLabel(r)}</option>
              ))}
            </select>
          </label>
          <span className="text-[#CBD5E1]">|</span>
          <label className="flex items-center gap-1.5">
            <span className="text-[#64748B]">Weight:</span>
            <select
              value={block.criticality ?? "standard"}
              onChange={(e) => patch({ criticality: e.target.value as BlockCriticality })}
              data-testid="block-editor-criticality"
              className={mono}
            >
              {(["critical", "standard", "supporting"] as const).map((c) => (
                <option key={c} value={c}>{criticalityLabel(c)}</option>
              ))}
            </select>
          </label>
          <span className="text-[#CBD5E1]">|</span>
          <label className="flex items-center gap-1.5">
            <span className="text-[#64748B]">Sourcing:</span>
            <select
              value={block.sourcing ?? "readily_available"}
              onChange={(e) => patch({ sourcing: e.target.value as BlockSourcing })}
              data-testid="block-editor-sourcing"
              className={mono}
            >
              {(["readily_available", "constrained", "scarce"] as const).map((s) => (
                <option key={s} value={s}>{sourcingLabel(s)}</option>
              ))}
            </select>
          </label>
          <span className="text-[#CBD5E1]">|</span>
          <label className="flex items-center gap-1.5">
            <span className="text-[#64748B]">Fmt:</span>
            <input
              type="text"
              value={(block.formats || []).join(", ")}
              onChange={(e) => patch({ formats: e.target.value.split(",").map((f) => f.trim()).filter(Boolean) })}
              data-testid="block-editor-formats"
              className="border-b border-[#CBD5E1] outline-none text-[#0F172A] w-24 bg-transparent focus:border-[#1D4ED8] pb-px"
            />
          </label>
          <span className="text-[#CBD5E1]">|</span>
          <label className="flex items-center gap-1.5">
            <span className="text-[#64748B]">Type:</span>
            <select
              value={block.docType ?? ""}
              onChange={(e) => patch({ docType: e.target.value || undefined })}
              title="Analyzer document type — exact classification when set; falls back to name-matching on auto"
              data-testid="block-editor-doctype"
              className={mono}
            >
              <option value="">auto-match</option>
              {/* Guard: a tag from a future taxonomy version must stay visible and
                  selectable — never silently rewritten to auto-match. */}
              {block.docType && !DOC_TYPES.some((t) => t.id === block.docType) && (
                <option value={block.docType}>{block.docType}</option>
              )}
              {DOC_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>
          <span className="text-[#CBD5E1]">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!block.multiPage}
              onChange={(e) => patch({ multiPage: e.target.checked || undefined })}
              data-testid="block-editor-multipage"
              className="accent-[#1D4ED8]"
            />
            <span className="text-[#64748B]">multi-page</span>
          </label>
          <span className="text-[#CBD5E1]">|</span>
          <label className="flex items-center gap-1.5">
            <span className="text-[#64748B]">Exp:</span>
            <select
              value={expiryKind}
              onChange={(e) => {
                const kind = e.target.value;
                patch({
                  expiry:
                    kind === "none" ? null : kind === "hard" ? { kind: "hard" } : { kind: "staleness", days: block.expiry?.days ?? 90 },
                });
              }}
              data-testid="block-editor-expiry-kind"
              className={mono}
            >
              <option value="none">no clock</option>
              <option value="staleness">staleness</option>
              <option value="hard">hard (valid through closing)</option>
            </select>
            {expiryKind === "staleness" && (
              <input
                type="number"
                min={1}
                value={block.expiry?.days ?? 90}
                onChange={(e) => patch({ expiry: { kind: "staleness", days: Math.max(1, Number(e.target.value) || 1) } })}
                data-testid="block-editor-expiry-days"
                className="border-b border-[#CBD5E1] outline-none text-[#0F172A] w-12 bg-transparent focus:border-[#1D4ED8] pb-px"
              />
            )}
            {expiryKind === "staleness" && <span className="text-[#64748B]">days</span>}
          </label>
        </div>
      )}

      {block.kind === "document" && <VariantConfigEditor block={block} patch={patch} />}

      {block.kind === "document" && block.requirement === "required_alt" && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0] ml-1 flex-wrap">
          <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">Satisfied by any of:</span>
          {(group?.satisfiedBy ?? []).map((altId) => (
            <span key={altId} className="text-[11px] text-[#334155] inline-flex items-center gap-1">
              {blockName(template, altId)} <span className="text-[#94A3B8]">({getSectionNumber(template, altId)})</span>
              <button
                data-testid={`block-editor-alt-remove-${altId}`}
                title="Remove alternative"
                onClick={() => dispatch({ type: "REMOVE_ALTERNATIVE", primaryBlockId: block.id, altBlockId: altId })}
                className="text-[#94A3B8] hover:text-[#B91C1C] leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <AlternativePicker template={template} primary={block} onPick={(altId) => dispatch({ type: "ADD_ALTERNATIVE", primaryBlockId: block.id, altBlockId: altId })} />
        </div>
      )}

      {block.kind === "fields" && (
        <FieldListEditor
          block={block}
          onAdd={(fieldType: FieldType) => dispatch({ type: "ADD_FIELD", blockId: block.id, fieldType })}
          onUpdate={(fieldId, p) => dispatch({ type: "UPDATE_FIELD", blockId: block.id, fieldId, patch: p })}
          onRemove={(fieldId) => dispatch({ type: "REMOVE_FIELD", blockId: block.id, fieldId })}
        />
      )}
    </div>
  );
}
