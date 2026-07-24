import { useEffect, useState } from 'react';
import { addDays, fmt, parseDate, type CaseReq } from '../caseData';
import { useVerdictActions } from '../useCaseFile';
import { useProfile } from '../../auth/ProfileContext';

/**
 * Two-layer armed verdict (Ops Desk doctrine): clicking Accept arms the
 * decision and shows the dates the clock will run on — per analyzer spec §1.4,
 * accepting explicitly confirms document_date / expiry_date. Dates are
 * editable at verdict; edits are recorded.
 */
export function VerdictButtons({
  req,
  applicationId,
  stack = false,
  armSignal,
}: {
  req: CaseReq;
  applicationId: string;
  stack?: boolean;
  /** increment to arm the accept flow from outside (review room ↵ key) */
  armSignal?: number;
}) {
  const { accept, requestNewVersion, isPending } = useVerdictActions(applicationId);
  const { profile } = useProfile();
  const [armed, setArmed] = useState(false);
  const [docDate, setDocDate] = useState(req.documentDate ?? '');
  const [expDate, setExpDate] = useState(req.expiryDate ?? '');

  useEffect(() => {
    if (armSignal !== undefined && armSignal > 0) setArmed(true);
  }, [armSignal]);

  const expiry = req.block.expiry;
  const isHard = expiry?.kind === 'hard';
  const isStaleness = expiry?.kind === 'staleness';

  const stalePreview =
    isStaleness && expiry?.days && docDate ? fmt(addDays(parseDate(docDate), expiry.days)) : null;

  const confirm = () => {
    const datesEdited = docDate !== (req.documentDate ?? '') || expDate !== (req.expiryDate ?? '');
    accept(
      req.block.id,
      {
        documentDate: docDate || undefined,
        expiryDate: expDate || undefined,
        datesEdited,
      },
      { stopsClock: isStaleness, onDone: () => setArmed(false) },
    );
  };

  if (armed) {
    return (
      <div className="w-full md:max-w-[420px] border border-[var(--ops-accent-wash-border)] bg-[var(--ops-accent-wash)] rounded p-3 flex flex-col gap-2.5 animate-fade-in">
        <div className="text-[12px] font-semibold text-[var(--ops-ink)]">
          Accepting confirms the dates this document's clock runs on
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="micro-label text-[9.5px]">document date</span>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              data-testid={`input-document-date-${req.block.id}`}
              className="ops-mono text-[12px] bg-white border border-[var(--ops-strong-border)] rounded-[4px] px-2 py-1 focus:outline-none focus:border-[var(--ops-accent)]"
            />
          </label>
          {isHard && (
            <label className="flex flex-col gap-1">
              <span className="micro-label text-[9.5px]">expiry date</span>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                data-testid={`input-expiry-date-${req.block.id}`}
                className="ops-mono text-[12px] bg-white border border-[var(--ops-strong-border)] rounded-[4px] px-2 py-1 focus:outline-none focus:border-[var(--ops-accent)]"
              />
            </label>
          )}
          {stalePreview && (
            <div className="ops-mono text-[11px] text-[var(--ops-body-sec)] pb-1.5">
              + {expiry?.days}d → stale {stalePreview} · clock stops on accept
            </div>
          )}
          {isHard && (
            <div className="ops-mono text-[11px] text-[var(--ops-body-sec)] pb-1.5">
              hard expiry — survives acceptance
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={confirm}
            disabled={isPending}
            data-testid={`button-confirm-accept-${req.block.id}`}
            className="btn-primary"
          >
            {isPending ? 'Saving…' : 'Confirm accept'}
          </button>
          <button onClick={() => setArmed(false)} className="btn-quiet" data-testid={`button-cancel-accept-${req.block.id}`}>
            Cancel
          </button>
          <span className="micro-label text-[9px] ml-auto hidden sm:block">
            as {profile.name} · {profile.role}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${stack ? 'flex-col' : 'flex-col sm:flex-row'} gap-2 w-full md:w-auto`}>
      <button
        onClick={() => setArmed(true)}
        disabled={isPending}
        data-testid={`button-accept-${req.block.id}`}
        className="btn-secondary"
      >
        Accept as-is
      </button>
      <button
        onClick={() => requestNewVersion(req.block.id, req.block.name)}
        disabled={isPending}
        data-testid={`button-request-rescan-${req.block.id}`}
        className="btn-primary"
      >
        {isPending ? 'Saving…' : 'Request re-scan'}
      </button>
    </div>
  );
}
