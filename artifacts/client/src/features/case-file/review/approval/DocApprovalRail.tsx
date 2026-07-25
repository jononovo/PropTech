import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Flag, X, XCircle } from 'lucide-react';
import type { CaseModel } from '../../caseData';
import type { DocGroup, PageDecisionValue } from './docGroups';

/**
 * Document-mode rail — the ONE confirm surface. The confirmation is a FILING
 * decision: "saving as <block> → <variant> — correct?" Correcting the
 * analyzer's guess is first-class, not an edge case.
 */
export function DocApprovalRail({
  model,
  group,
  decisions,
  armTick,
  isPending,
  onSelectPage,
  onSubmit,
  onNext,
}: {
  model: CaseModel;
  group: DocGroup;
  decisions: Record<number, PageDecisionValue>;
  armTick: number;
  isPending: boolean;
  onSelectPage: (page: number) => void;
  onSubmit: (opts: { blockId: string; variantId?: string; outcome: 'approved' | 'approved_incomplete' | 'rejected' }) => void;
  onNext: () => void;
}) {
  const [blockId, setBlockId] = useState(group.blockId ?? '');
  useEffect(() => setBlockId(group.blockId ?? ''), [group.id, group.blockId]);

  const req = model.reqs.find((r) => r.block.id === blockId);
  const isSet = req?.block.arity === 'set';
  const variants = useMemo(
    () => (isSet ? (model.app.variants?.[blockId] ?? []) : []),
    [isSet, model.app.variants, blockId],
  );
  const [variantId, setVariantId] = useState('');
  useEffect(() => setVariantId(variants[0]?.id ?? ''), [blockId, group.id, variants]);

  const badCount = group.pageList.filter((p) => decisions[p] === 'bad').length;
  const canFile = !!blockId && (!isSet || !!variantId);

  // ↵ ACCEPT in document mode = approve the whole document
  const lastArm = useRef(armTick);
  useEffect(() => {
    if (armTick !== lastArm.current) {
      lastArm.current = armTick;
      if (canFile && !group.settled && !isPending) {
        onSubmit({ blockId, ...(isSet ? { variantId } : {}), outcome: badCount > 0 ? 'approved_incomplete' : 'approved' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armTick]);

  if (group.settled) {
    const s = group.settled;
    return (
      <div className="p-4 md:p-5 flex flex-col gap-4">
        <RailHeading group={group} req={req} />
        <div
          className={`rounded border p-3 text-[12.5px] leading-relaxed ${
            s.outcome === 'rejected'
              ? 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] text-[var(--ops-warning-text)]'
              : 'bg-[var(--ops-ok-wash)] border-[var(--ops-ok-border)] text-[var(--ops-ok-text)]'
          }`}
          data-testid="text-doc-approval-recorded"
        >
          {s.outcome === 'rejected'
            ? `Rejected by ${s.decidedBy} — on the audit trail.`
            : s.outcome === 'approved_incomplete'
              ? `Approved INCOMPLETE by ${s.decidedBy} — new version requested; filed to the approved registry.`
              : `Approved by ${s.decidedBy} — filed to the approved registry.`}
          <button onClick={onNext} className="btn-secondary w-full mt-3" data-testid="button-next-group">
            Next document →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5 flex flex-col gap-4">
      <RailHeading group={group} req={req} />

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="micro-label text-[9px]">saving as</span>
          <select
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            data-testid="select-doc-block"
            className="text-[12.5px] bg-white border border-[var(--ops-strong-border)] rounded-[4px] px-2 py-2 focus:outline-none focus:border-[var(--ops-accent)]"
          >
            <option value="">Choose a requirement…</option>
            {model.sections.map((s) => (
              <optgroup key={s.id} label={`${s.num} ${s.name}`}>
                {s.reqs.map((r) => (
                  <option key={r.block.id} value={r.block.id}>
                    {r.block.name}
                    {r.block.id === group.blockId ? ' — analyzer suggestion' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {isSet && (
          <label className="flex flex-col gap-1.5">
            <span className="micro-label text-[9px]">variant</span>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              data-testid="select-doc-variant"
              className="text-[12.5px] bg-white border border-[var(--ops-strong-border)] rounded-[4px] px-2 py-2 focus:outline-none focus:border-[var(--ops-accent)]"
            >
              <option value="">Choose a variant…</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            {variants.length === 0 && (
              <span className="text-[11px] text-[var(--ops-warning-text)]">
                No variants declared yet — add one in Intake first.
              </span>
            )}
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {badCount === 0 ? (
          <button
            onClick={() => onSubmit({ blockId, ...(isSet ? { variantId } : {}), outcome: 'approved' })}
            disabled={!canFile || isPending}
            data-testid="button-approve-doc"
            className="btn-primary flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> {isPending ? 'Saving…' : 'Approve document'}
          </button>
        ) : (
          <button
            onClick={() => onSubmit({ blockId, ...(isSet ? { variantId } : {}), outcome: 'approved_incomplete' })}
            disabled={!canFile || isPending}
            data-testid="button-approve-incomplete"
            className="bg-[var(--ops-warning-wash)] hover:brightness-95 text-[var(--ops-warning-text)] border border-[var(--ops-warning-border)] rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <AlertCircle className="w-4 h-4" />
            {isPending ? 'Saving…' : `Approve INCOMPLETE — ${badCount} page${badCount > 1 ? 's' : ''} rejected`}
          </button>
        )}
        {badCount === 0 && (
          <button
            onClick={() => onSubmit({ blockId, ...(isSet ? { variantId } : {}), outcome: 'approved_incomplete' })}
            disabled={!canFile || isPending}
            data-testid="button-approve-request-new"
            className="btn-secondary flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" /> Approve & request new version
          </button>
        )}
        <button
          onClick={() => onSubmit({ blockId: blockId || (group.blockId ?? ''), ...(isSet ? { variantId } : {}), outcome: 'rejected' })}
          disabled={!blockId || isPending}
          data-testid="button-reject-doc"
          className="bg-white hover:bg-[var(--ops-critical-wash)] text-[var(--ops-critical-solid)] border border-[var(--ops-strong-border)] rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <XCircle className="w-4 h-4" /> Reject document
        </button>
      </div>

      <div>
        <div className="micro-label text-[9px] mb-2.5">page decisions ({group.pageList.length})</div>
        <div className="flex flex-col gap-2.5">
          {group.pageList.map((p) => {
            const d = decisions[p];
            return (
              <button
                key={p}
                onClick={() => onSelectPage(p)}
                data-testid={`row-page-decision-${p}`}
                className="flex items-center gap-2 text-left group"
              >
                <span
                  className={`shrink-0 w-2 h-2 rounded-[2px] border ${
                    d === 'bad'
                      ? 'bg-[var(--ops-critical-wash)] border-[var(--ops-critical-solid)]'
                      : d === 'flag_accepted'
                        ? 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-solid)]'
                        : d === 'good'
                          ? 'bg-[var(--ops-ok-wash)] border-[var(--ops-ok-border)]'
                          : 'bg-[var(--ops-inset)] border-[var(--ops-border)]'
                  }`}
                />
                <span className="text-[12.5px] font-medium text-[var(--ops-ink)] group-hover:text-[var(--ops-accent)] transition-colors">
                  Page {p}
                </span>
                <span className="ml-auto text-[10.5px] text-[var(--ops-muted)] flex items-center gap-1">
                  {d === 'good' ? (
                    <>
                      <Check className="w-3 h-3 text-[var(--ops-ok-text)]" /> good
                    </>
                  ) : d === 'bad' ? (
                    <>
                      <X className="w-3 h-3 text-[var(--ops-critical-solid)]" /> rejected
                    </>
                  ) : d === 'flag_accepted' ? (
                    <>
                      <Flag className="w-3 h-3 text-[var(--ops-warning-solid)]" /> flag retained
                    </>
                  ) : (
                    <span className="italic">inherited good</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RailHeading({ group, req }: { group: DocGroup; req?: CaseModel['reqs'][number] }) {
  return (
    <div>
      <div className="micro-label text-[9px] mb-1">document · file & approve</div>
      <div className="font-semibold text-[14px] text-[var(--ops-ink)] leading-snug">{group.title}</div>
      <div className="ops-mono text-[10.5px] text-[var(--ops-muted)] mt-0.5">
        pp. {group.pages[0]}–{group.pages[1]}
        {group.doc ? ` · CONF ${Math.round(group.doc.confidence * 100)}%` : ''}
        {req ? ` · ${req.sectionNum} ${req.sectionName}` : ''}
      </div>
    </div>
  );
}
