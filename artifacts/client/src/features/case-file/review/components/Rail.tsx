import { useState } from 'react';
import { Archive, Check, FolderInput, Inbox } from 'lucide-react';
import { pageSpan, type CaseModel, type Severity } from '../../caseData';
import { usePlacementActions } from '../../useCaseFile';
import { VerdictButtons } from '../../components/VerdictButtons';
import type { PageCell, ReviewStop } from '../reviewModel';

/** Right rail content — extracted verbatim from ReviewPage (step-0 split). */

const sevDot: Record<Severity, string> = {
  clay: 'bg-[var(--ops-critical-wash)] border-[var(--ops-critical-solid)]',
  amber: 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-solid)]',
  slate: 'bg-[var(--ops-neutral-wash)] border-[var(--ops-strong-border)]',
};

export function Rail({
  appId,
  model,
  stop,
  cell,
  armTick,
  acked,
  onAck,
  onNext,
}: {
  appId: string;
  model: CaseModel;
  stop?: ReviewStop;
  cell?: PageCell;
  armTick: number;
  acked: boolean;
  onAck: () => void;
  onNext: () => void;
}) {
  if (stop?.kind === 'document' && stop.req && stop.doc) {
    return (
      <div className="p-4 md:p-5 flex flex-col gap-4">
        <div>
          <div className="micro-label text-[9px] mb-1">{stop.band === 'hold' ? 'exception · hold' : 'exception · attend'}</div>
          <div className="font-semibold text-[14px] text-[var(--ops-ink)] leading-snug">{stop.title}</div>
          <div className="ops-mono text-[10.5px] text-[var(--ops-muted)] mt-0.5">
            {stop.req.sectionNum} {stop.req.sectionName} · pp. {pageSpan(stop.doc)}
          </div>
        </div>

        {stop.resolved && stop.req.verdict ? (
          <div
            className={`rounded border p-3 text-[12.5px] leading-relaxed ${
              stop.req.verdict.verdict === 'accepted'
                ? 'bg-[var(--ops-ok-wash)] border-[var(--ops-ok-border)] text-[var(--ops-ok-text)]'
                : 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] text-[var(--ops-warning-text)]'
            }`}
            data-testid="text-verdict-recorded"
          >
            {stop.req.verdict.verdict === 'accepted'
              ? `Accepted by ${stop.req.verdict.decidedBy} — on the audit trail.`
              : `New version requested by ${stop.req.verdict.decidedBy} — waiting on the other side.`}
            <button onClick={onNext} className="btn-secondary w-full mt-3" data-testid="button-next-stop">
              Next stop →
            </button>
          </div>
        ) : (
          <VerdictButtons req={stop.req} applicationId={appId} stack armSignal={armTick} />
        )}

        <div>
          <div className="micro-label text-[9px] mb-2.5">callouts ({stop.callouts.length})</div>
          <div className="flex flex-col gap-3.5">
            {stop.callouts.map((c, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <span className={`mt-[4px] shrink-0 w-2 h-2 rounded-[2px] border ${sevDot[c.severity]}`} />
                  <span className="text-[12.5px] font-medium text-[var(--ops-ink)] leading-snug">{c.label}</span>
                </div>
                {c.detail && <div className="text-[11.5px] text-[var(--ops-muted)] pl-4 leading-relaxed">{c.detail}</div>}
              </div>
            ))}
          </div>
        </div>

        {(stop.doc.coreFields.document_date || stop.doc.coreFields.issuing_party) && (
          <div className="border-t border-[var(--ops-inner-rule)] pt-3 flex flex-col gap-1.5">
            {stop.doc.coreFields.document_date && (
              <div className="flex justify-between gap-3">
                <span className="micro-label text-[9px]">doc date</span>
                <span className="ops-mono text-[11px] text-[var(--ops-body-sec)]">{stop.doc.coreFields.document_date}</span>
              </div>
            )}
            {stop.doc.coreFields.issuing_party && (
              <div className="flex justify-between gap-3 min-w-0">
                <span className="micro-label text-[9px] shrink-0">issuer</span>
                <span className="text-[11px] text-[var(--ops-body-sec)] truncate">{stop.doc.coreFields.issuing_party}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (stop?.kind === 'unassigned') {
    return <UnassignedRail appId={appId} model={model} stop={stop} />;
  }

  // clean page (all-pages mode)
  return (
    <div className="p-5 flex flex-col items-center text-center gap-2 pt-8">
      <div className="w-9 h-9 rounded bg-[var(--ops-ok-wash)] border border-[var(--ops-ok-border)] flex items-center justify-center">
        <Check className="w-4 h-4 text-[var(--ops-ok-text)]" />
      </div>
      <div className="font-medium text-[14px] text-[var(--ops-ink)]">Clean page</div>
      <div className="text-[12.5px] text-[var(--ops-muted)] leading-relaxed">
        {cell?.title ? (
          <>
            Filed as <span className="text-[var(--ops-body-sec)] font-medium">{cell.title}</span> — no exceptions.
          </>
        ) : (
          'No exceptions found.'
        )}
      </div>
      {acked || cell?.resolved ? (
        <div className="ops-mono text-[11px] text-[var(--ops-ok-text)] mt-2" data-testid="text-acknowledged">
          ✓ {cell?.resolved ? 'reviewed' : 'acknowledged'}
        </div>
      ) : (
        <button onClick={onAck} className="btn-secondary mt-2" data-testid="button-acknowledge">
          Acknowledge
        </button>
      )}
    </div>
  );
}

function UnassignedRail({ appId, model, stop }: { appId: string; model: CaseModel; stop: ReviewStop }) {
  const { fileAs, archive, isPending } = usePlacementActions(appId);
  const [target, setTarget] = useState('');
  const runId = model.run?.runId;
  const targetName = model.reqs.find((r) => r.block.id === target)?.block.name ?? '';

  return (
    <div className="p-4 md:p-5 flex flex-col gap-4">
      <div>
        <div className="micro-label text-[9px] mb-1">unassigned · never blocks</div>
        <div className="font-semibold text-[14px] text-[var(--ops-ink)] leading-snug">
          pp. {stop.pages[0]}–{stop.pages[1]}
        </div>
        {stop.description && (
          <p className="text-[12.5px] text-[var(--ops-body-sec)] leading-relaxed mt-1.5">{stop.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="micro-label text-[9px]">file into a requirement</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            data-testid="select-file-target"
            className="text-[12.5px] bg-white border border-[var(--ops-strong-border)] rounded-[4px] px-2 py-2 focus:outline-none focus:border-[var(--ops-accent)]"
          >
            <option value="">Choose a requirement…</option>
            {model.sections.map((s) => (
              <optgroup key={s.id} label={`${s.num} ${s.name}`}>
                {s.reqs.map((r) => (
                  <option key={r.block.id} value={r.block.id}>
                    {r.block.name}
                    {r.status === 'missing' ? ' — missing' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <button
          onClick={() => fileAs(stop.pages, target, targetName, runId)}
          disabled={!target || isPending}
          data-testid="button-file-here"
          className="btn-primary flex items-center justify-center gap-1.5"
        >
          <FolderInput className="w-3.5 h-3.5" /> {isPending ? 'Saving…' : 'File here'}
        </button>
        <button
          onClick={() => archive(stop.pages, runId)}
          disabled={isPending}
          data-testid="button-archive-range"
          className="btn-secondary flex items-center justify-center gap-1.5"
        >
          <Archive className="w-3.5 h-3.5" /> Archive — not relevant
        </button>
      </div>

      <p className="text-[11px] text-[var(--ops-faint)] leading-relaxed flex items-start gap-1.5">
        <Inbox className="w-3 h-3 mt-0.5 shrink-0" />
        Your assignments win — the analyzer treats manual placement as ground truth on the next run.
      </p>
    </div>
  );
}
