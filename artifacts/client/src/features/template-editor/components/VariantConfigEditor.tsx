import type { Block, DescriptorField, DocsPerVariant, VariantConfig } from "@workspace/api-client-react";
import type { BlockPatch } from "../state/templateActions";

const mono = "border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px";

/** Fresh default when the author flips a block to arity:"set". */
const DEFAULT_CONFIG: VariantConfig = {
  variantNoun: "Variant",
  descriptorFields: [{ key: "name", label: "Name" }],
  docsPerVariant: { mode: "single" },
};

/**
 * Set-block configuration inside the block editor. The template declares the
 * SHAPE of a variant (noun + descriptor identity fields + docs-per-variant
 * rules); actual variants ("Chase ····1234", "Jane Doe · 1990-04-24") are
 * added per application, never here. Every change is one UPDATE_BLOCK patch —
 * same single mutation path as the rest of the builder.
 *
 * Descriptor KEYS are the stable identity applications will store descriptor
 * values under — editable here (power-user surface), but once applications
 * exist against a version they should not be changed casually; labels are the
 * safe thing to rename. Rules are data, never code (no conditional logic, v1).
 */
export function VariantConfigEditor({ block, patch }: { block: Block; patch: (p: BlockPatch) => void }) {
  const isSet = block.arity === "set";
  const vc = block.variantConfig ?? DEFAULT_CONFIG;
  const setVc = (next: Partial<VariantConfig>) => patch({ variantConfig: { ...vc, ...next } });
  const setDocs = (next: Partial<DocsPerVariant>) => setVc({ docsPerVariant: { ...vc.docsPerVariant, ...next } });
  const setField = (i: number, next: Partial<DescriptorField>) =>
    setVc({ descriptorFields: vc.descriptorFields.map((f, j) => (j === i ? { ...f, ...next } : f)) });

  return (
    <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
      <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[11px]">
        <input
          type="checkbox"
          checked={isSet}
          onChange={(e) =>
            e.target.checked
              ? patch({ arity: "set", variantConfig: block.variantConfig ?? DEFAULT_CONFIG })
              : patch({ arity: undefined, variantConfig: undefined })
          }
          data-testid="block-editor-arity"
          className="accent-[#1D4ED8]"
        />
        <span className="text-[#64748B]">
          multiple variants <span className="normal-case">— N instances (accounts, persons…), each with its own document/s, added per application</span>
        </span>
      </label>

      {isSet && (
        <div className="mt-2 ml-5 flex flex-col gap-2 font-mono text-[11px]" data-testid="block-editor-variant-config">
          <label className="flex items-center gap-1.5">
            <span className="text-[#64748B]">One variant is a:</span>
            <input
              type="text"
              value={vc.variantNoun}
              onChange={(e) => setVc({ variantNoun: e.target.value })}
              placeholder="Bank account / Person"
              data-testid="block-editor-variant-noun"
              className={`${mono} w-40`}
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-[#64748B]">Identified by (as specific as possible):</span>
            {vc.descriptorFields.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 ml-2">
                <input
                  type="text"
                  value={f.key}
                  onChange={(e) => setField(i, { key: e.target.value })}
                  placeholder="account_last4"
                  title="Stable snake_case key — applications store descriptor values under it; rename labels, not keys"
                  data-testid={`block-editor-descriptor-key-${i}`}
                  className={`${mono} w-28 text-[#64748B]`}
                />
                <input
                  type="text"
                  value={f.label}
                  onChange={(e) => setField(i, { label: e.target.value })}
                  placeholder="Account (last 4)"
                  data-testid={`block-editor-descriptor-label-${i}`}
                  className={`${mono} w-36`}
                />
                {vc.descriptorFields.length > 1 && (
                  <button
                    onClick={() => setVc({ descriptorFields: vc.descriptorFields.filter((_, j) => j !== i) })}
                    title="Remove descriptor field"
                    data-testid={`block-editor-descriptor-remove-${i}`}
                    className="text-[#94A3B8] hover:text-[#B91C1C] leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setVc({ descriptorFields: [...vc.descriptorFields, { key: "", label: "" }] })}
              data-testid="block-editor-descriptor-add"
              className="self-start ml-2 text-[#1D4ED8]"
            >
              + descriptor field
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5">
              <span className="text-[#64748B]">Docs per variant:</span>
              <select
                value={vc.docsPerVariant.mode}
                onChange={(e) =>
                  e.target.value === "sequence"
                    ? setDocs({ mode: "sequence" })
                    : setVc({ docsPerVariant: { mode: "single" } })
                }
                data-testid="block-editor-docs-mode"
                className={`${mono} cursor-pointer`}
              >
                <option value="single">exactly one</option>
                <option value="sequence">one or more</option>
              </select>
            </label>
            {vc.docsPerVariant.mode === "sequence" && (
              <>
                {/* Guidance, never a gate: one document never fails a sequence.
                    Recency is the block's existing expiry clock — not duplicated here. */}
                <label className="flex items-center gap-1.5">
                  <span className="text-[#64748B]">typically:</span>
                  <input
                    type="number"
                    min={1}
                    value={vc.docsPerVariant.expectedCount ?? ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setDocs({ expectedCount: n >= 1 ? n : undefined });
                    }}
                    placeholder="—"
                    title="Recommended amount — guidance for review, never a hard limit or requirement"
                    data-testid="block-editor-docs-count"
                    className={`${mono} w-10`}
                  />
                  <span className="text-[#64748B]">docs (recommended, not enforced)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vc.docsPerVariant.coverage === "consecutive_months"}
                    onChange={(e) => setDocs({ coverage: e.target.checked ? "consecutive_months" : undefined })}
                    data-testid="block-editor-docs-coverage"
                    className="accent-[#1D4ED8]"
                  />
                  <span className="text-[#64748B]">consecutive months</span>
                </label>
              </>
            )}
          </div>
        </div>
      )}

      <label className="flex items-start gap-1.5 font-mono text-[11px] mt-2">
        <span className="text-[#64748B] pt-0.5 whitespace-nowrap">Analysis note:</span>
        <textarea
          value={block.analysisNote ?? ""}
          onChange={(e) => patch({ analysisNote: e.target.value || undefined })}
          placeholder="expert guidance for the analyzer (never applicant-facing)"
          rows={1}
          data-testid="block-editor-analysis-note"
          className="flex-1 border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px resize-y font-mono text-[11px]"
        />
      </label>
    </div>
  );
}
