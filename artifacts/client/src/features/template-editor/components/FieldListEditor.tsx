import type { Block } from "@workspace/api-client-react";
import { Trash2 } from "lucide-react";
import type { FieldPatch, FieldType } from "../state/templateActions";

const FIELD_TYPES: FieldType[] = ["text", "number", "date", "select", "yesno"];

/** Field list for kind=fields blocks: label, type, required, select options. */
export function FieldListEditor({
  block,
  onAdd,
  onUpdate,
  onRemove,
}: {
  block: Block;
  onAdd: (t: FieldType) => void;
  onUpdate: (fieldId: string, patch: FieldPatch) => void;
  onRemove: (fieldId: string) => void;
}) {
  const fields = block.fields ?? [];
  return (
    <div className="mt-2.5 bg-[#F8FAFC] p-2 rounded-[2px] border border-[#E2E8F0] space-y-1.5" data-testid="field-list-editor">
      {fields.length === 0 && <div className="text-[11px] text-[#94A3B8] italic">No fields yet.</div>}
      {fields.map((f) => (
        <div key={f.id} className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
          <input
            value={f.label}
            onChange={(e) => onUpdate(f.id, { label: e.target.value })}
            data-testid={`field-${f.id}-label`}
            className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px w-40"
          />
          <select
            value={f.type}
            onChange={(e) => onUpdate(f.id, { type: e.target.value as FieldType })}
            data-testid={`field-${f.id}-type`}
            className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px cursor-pointer"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 cursor-pointer text-[#64748B]">
            <input
              type="checkbox"
              checked={!!f.required}
              onChange={(e) => onUpdate(f.id, { required: e.target.checked })}
              className="accent-[#1D4ED8]"
            />
            req
          </label>
          {f.type === "select" && (
            <input
              value={(f.options ?? []).join(", ")}
              onChange={(e) => onUpdate(f.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
              placeholder="options, comma-separated"
              data-testid={`field-${f.id}-options`}
              className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px flex-1 min-w-[120px]"
            />
          )}
          <button
            onClick={() => onRemove(f.id)}
            data-testid={`field-${f.id}-remove`}
            title="Remove field"
            className="p-0.5 text-[#94A3B8] hover:text-[#B91C1C] rounded-[2px]"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onAdd("text")}
        data-testid="field-add"
        className="text-[10.5px] text-[#64748B] border-b border-dashed border-[#CBD5E1] hover:text-[#0F172A] hover:border-[#94A3B8] transition-colors"
      >
        + add field
      </button>
    </div>
  );
}
