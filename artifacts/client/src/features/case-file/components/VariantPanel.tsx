import { useRef, useState } from 'react';
import { FileText, Plus, Sparkles, Trash2, UploadCloud, X } from 'lucide-react';
import type { BlockSatisfaction } from '@workspace/api-client-react';
import type { CaseReq } from '../caseData';
import { useVariantActions } from '../useCaseFile';

/**
 * Set-block variant registry — declare the real-world instances this
 * application needs ("Chase ····1234", "Jane Doe"), tag uploads to each.
 * Counts are guidance only ("typically N"), never gates. Everything here is
 * intake-side: nothing counts toward completeness until a human accepts.
 */
export function VariantPanel({
  req,
  applicationId,
  satisfaction,
}: {
  req: CaseReq;
  applicationId: string;
  satisfaction?: BlockSatisfaction;
}) {
  const cfg = req.block.variantConfig;
  if (!cfg) return null;
  const variants = req.variants ?? [];
  const noun = cfg.variantNoun.toLowerCase();

  return (
    <div className="border border-[var(--ops-border)] border-t-0 rounded-b bg-[var(--ops-inset)] px-3 md:px-4 py-3 -mt-1">
      <div className="flex items-center justify-between mb-2">
        <div className="micro-label text-[10px]">
          {cfg.variantNoun}s on this application · {variants.length} declared
          {cfg.docsPerVariant.expectedCount
            ? ` · typically ${cfg.docsPerVariant.expectedCount} doc${cfg.docsPerVariant.expectedCount === 1 ? '' : 's'} each (guidance, not a gate)`
            : ''}
        </div>
      </div>

      {variants.length === 0 && (
        <p className="text-[12px] text-[var(--ops-muted)] mb-2">
          No {noun}s declared yet — add each one this application actually has.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {variants.map(({ variant, uploads }) => (
          <VariantRow
            key={variant.id}
            blockId={req.block.id}
            applicationId={applicationId}
            variant={variant}
            uploads={uploads}
            mode={cfg.docsPerVariant.mode}
          />
        ))}
      </div>

      <AddVariantForm req={req} applicationId={applicationId} />

      {satisfaction && <SatisfactionCard sat={satisfaction} blockId={req.block.id} />}
    </div>
  );
}

/**
 * Analyzer's satisfaction read (Phase 4) — assistive only, never a gate.
 * Humans re-assign and approve regardless of what this says.
 */
function SatisfactionCard({ sat, blockId }: { sat: BlockSatisfaction; blockId: string }) {
  return (
    <div
      className="mt-3 bg-white border border-[var(--ops-border)] rounded p-3 flex flex-col gap-2"
      data-testid={`satisfaction-card-${blockId}`}
    >
      <div className="flex items-center gap-1.5 micro-label text-[10px]">
        <Sparkles size={11} className="text-[var(--ops-accent)]" />
        Analyzer read — assistive, not a gate
      </div>
      <p className="text-[12px] text-[var(--ops-body-sec)] leading-relaxed">{sat.summary}</p>
      {sat.groups.length > 0 && (
        <div className="flex flex-col gap-1">
          {sat.groups.map((g, i) => (
            <div key={i} className="ops-mono text-[10.5px] text-[var(--ops-muted)]">
              {g.descriptorGuess && Object.values(g.descriptorGuess).filter(Boolean).length > 0
                ? Object.values(g.descriptorGuess).join(' · ')
                : g.variantId ?? `pile ${i + 1}`}
              {' — '}
              {g.docSpans
                .map((spans) =>
                  spans
                    .map((s) => {
                      const [f, l] = [s.pages[0], s.pages[1]];
                      return f === l ? `p.${f}` : `pp.${f}–${l}`;
                    })
                    .join('+'),
                )
                .join(', ')}
              {g.coverage ? ` · ${g.coverage}` : ''}
            </div>
          ))}
        </div>
      )}
      {sat.gaps.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {sat.gaps.map((gap, i) => (
            <li key={i} className="text-[11.5px] text-[var(--ops-warning-text)] flex gap-1.5">
              <span className="shrink-0">•</span>
              {gap}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VariantRow({
  applicationId,
  blockId,
  variant,
  uploads,
  mode,
}: {
  applicationId: string;
  blockId: string;
  variant: { id: string; label: string };
  uploads: { filename: string }[];
  mode: 'single' | 'sequence';
}) {
  const { deleteVariant, uploadToVariant, isUploading } = useVariantActions(applicationId);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white border border-[var(--ops-border)] rounded px-3 py-2" data-testid={`variant-row-${variant.id}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12.5px] font-medium text-[var(--ops-ink)] truncate">{variant.label}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="ops-mono text-[10.5px] text-[var(--ops-muted)]">
            {uploads.length} {uploads.length === 1 ? 'doc' : 'docs'}
            {mode === 'single' ? ' · exactly one expected' : ' · one or more'}
          </span>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadToVariant(blockId, variant.id, f);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            title={`Upload to ${variant.label}`}
            className="w-[24px] h-[24px] rounded-[3px] flex items-center justify-center text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)] transition-colors disabled:opacity-50"
            data-testid={`button-upload-variant-${variant.id}`}
          >
            <UploadCloud size={13} />
          </button>
          <button
            onClick={() => deleteVariant(blockId, variant.id, variant.label)}
            title={uploads.length ? 'Remove (refused while docs are tagged to it)' : 'Remove'}
            className="w-[24px] h-[24px] rounded-[3px] flex items-center justify-center text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)] hover:text-[var(--ops-critical-text)] transition-colors"
            data-testid={`button-delete-variant-${variant.id}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {uploads.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-0.5">
          {uploads.map((f) => (
            <div key={f.filename} className="flex items-center gap-1.5 ops-mono text-[10.5px] text-[var(--ops-muted)]">
              <FileText size={11} className="shrink-0" /> {f.filename}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddVariantForm({ req, applicationId }: { req: CaseReq; applicationId: string }) {
  const cfg = req.block.variantConfig!;
  const { addVariant, isAdding } = useVariantActions(applicationId);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--ops-accent)] hover:text-[var(--ops-accent-hover)] transition-colors"
        data-testid={`button-add-variant-${req.block.id}`}
      >
        <Plus size={13} /> Add {cfg.variantNoun.toLowerCase()}
      </button>
    );
  }

  const complete = cfg.descriptorFields.every((f) => (values[f.key] ?? '').trim());

  return (
    <div className="mt-2 bg-white border border-[var(--ops-border)] rounded p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="micro-label text-[10px]">New {cfg.variantNoun.toLowerCase()}</div>
        <button onClick={() => setOpen(false)} className="text-[var(--ops-muted)] hover:text-[var(--ops-ink)]">
          <X size={13} />
        </button>
      </div>
      {cfg.descriptorFields.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="text-[11px] text-[var(--ops-body-sec)]">{f.label}</span>
          <input
            value={values[f.key] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            className="border border-[var(--ops-border)] rounded-[3px] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-[var(--ops-accent)]"
            data-testid={`input-variant-${f.key}`}
          />
        </label>
      ))}
      <button
        onClick={() =>
          addVariant(req.block.id, values, () => {
            setValues({});
            setOpen(false);
          })
        }
        disabled={!complete || isAdding}
        className="btn-primary self-start disabled:opacity-50"
        data-testid={`button-save-variant-${req.block.id}`}
      >
        Add {cfg.variantNoun.toLowerCase()}
      </button>
    </div>
  );
}
