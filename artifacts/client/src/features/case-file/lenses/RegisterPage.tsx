import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Lock, Search as SearchIcon } from 'lucide-react';
import {
  band,
  checksSummary,
  confidencePct,
  fmt,
  fmtTime,
  pageSpan,
  type CaseModel,
  type CaseReq,
} from '../caseData';
import { VerdictButtons } from '../components/VerdictButtons';
import { ApprovedDocsPanel } from '../approved/ApprovedDocsPanel';
import type { Lens } from '../CaseShell';

export function RegisterPage({
  model,
  applicationId,
  onLens,
}: {
  model: CaseModel;
  applicationId: string;
  onLens: (lens: Lens, sectionId?: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = (r: CaseReq) =>
    !q ||
    r.block.name.toLowerCase().includes(q) ||
    (r.doc?.suggestedName.toLowerCase().includes(q) ?? false) ||
    (r.block.docType?.toLowerCase().includes(q) ?? false);

  const total = model.reqs.length;
  const cleanCount = model.reqs.filter((r) => ['clean', 'accepted', 'covered'].includes(r.status)).length;
  const needYou = model.stats.attention;
  const clockCount = model.alarmCount;

  return (
    <div className="h-full overflow-y-auto bg-white flex flex-col">
      {/* top strip */}
      <div className="flex-none px-4 md:px-6 py-2.5 border-b border-[var(--ops-border)] bg-[var(--ops-inset)] flex flex-col md:flex-row md:items-center justify-between gap-2 sticky top-0 z-20">
        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ops-faint)]" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requirements or files…"
            data-testid="input-register-search"
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[var(--ops-border)] rounded-[4px] text-[13px] focus:outline-none focus:border-[var(--ops-accent)] focus:ring-1 focus:ring-[var(--ops-accent)] transition-shadow placeholder:text-[var(--ops-faint)]"
          />
        </div>
        <div className="ops-mono text-[11px] text-[var(--ops-muted)] flex items-center gap-2">
          <span>
            {cleanCount} of {total} filed clean
          </span>
          <span className="text-[var(--ops-strong-border)]">·</span>
          <span className={needYou > 0 ? 'text-[var(--ops-critical-text)]' : ''}>{needYou} need you</span>
          <span className="text-[var(--ops-strong-border)]">·</span>
          <span className={clockCount > 0 ? 'text-[var(--ops-warning-text)]' : ''}>
            {clockCount} on the clock ≤30d
          </span>
        </div>
      </div>

      {/* the sheet */}
      <div className="flex-1 w-full pt-4 pb-12 px-2 md:px-0 overflow-x-auto">
        <div className="max-w-[1200px] mx-auto min-w-[900px]">
          <table className="sheaf-register-table border border-[var(--ops-strong-border)]">
            <colgroup>
              <col style={{ width: '24%' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
            <thead className="z-10">
              <tr>
                <th>Requirement</th>
                <th>Document</th>
                <th>Received</th>
                <th className="text-right">Checks</th>
                <th className="text-right">Validity</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {model.sections.map((sec) => {
                const rows = sec.reqs.filter(matches);
                if (rows.length === 0) return null;
                const progressPct = sec.total > 0 ? Math.round((sec.cleared / sec.total) * 100) : 0;

                return (
                  <React.Fragment key={sec.id}>
                    <tr className="sheaf-section-band">
                      <td colSpan={7}>
                        <div className="flex items-center justify-between pr-4">
                          <div className="flex items-center gap-2">
                            <span className="ops-mono text-[11px] text-[var(--ops-muted)]">{sec.num}</span>
                            <span className="text-[12px] font-semibold text-[var(--ops-ink)]">{sec.name}</span>
                            <span className="ml-2 px-1.5 py-0.5 rounded-[3px] border border-[var(--ops-border)] text-[9.5px] uppercase tracking-wider font-semibold text-[var(--ops-muted)] bg-white">
                              {sec.owner}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 w-48">
                            <span className="ops-mono text-[10px] text-[var(--ops-muted)] shrink-0">
                              {sec.cleared} of {sec.total} clear
                            </span>
                            <div className="sheaf-micro-progress flex-1">
                              <div className="sheaf-micro-progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {rows.map((req) => (
                      <RegisterRow
                        key={req.block.id}
                        req={req}
                        model={model}
                        applicationId={applicationId}
                        expanded={!!expanded[req.block.id]}
                        onToggle={() => setExpanded((p) => ({ ...p, [req.block.id]: !p[req.block.id] }))}
                        onLens={onLens}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <ApprovedDocsPanel model={model} applicationId={applicationId} />
      </div>

      {/* footer */}
      <div className="flex-none px-4 md:px-6 py-2 border-t border-[var(--ops-border)] bg-[var(--ops-inset)] flex items-center justify-between ops-mono text-[10px] text-[var(--ops-muted)] mt-auto sticky bottom-0 z-20">
        <div className="flex items-center gap-3">
          {model.run ? (
            <>
              <span>{model.run.preflight.pages} pages</span>
              <span className="text-[var(--ops-strong-border)]">·</span>
              <span>{model.run.documents.length} documents</span>
              <span className="text-[var(--ops-strong-border)]">·</span>
              <span>{model.run.unassigned.length} unassigned</span>
              <span className="text-[var(--ops-strong-border)]">·</span>
              <span>updated {fmtTime(new Date(model.run.startedAt))}</span>
            </>
          ) : (
            <span>no analyzer run yet — showing checklist only</span>
          )}
        </div>
        <div className="hidden md:block">
          Press{' '}
          <kbd className="px-1 py-0.5 border border-[var(--ops-border)] rounded-[3px] bg-white text-[var(--ops-ink)]">/</kbd>{' '}
          to search
        </div>
      </div>
    </div>
  );
}

function RegisterRow({
  req,
  model,
  applicationId,
  expanded,
  onToggle,
  onLens,
}: {
  req: CaseReq;
  model: CaseModel;
  applicationId: string;
  expanded: boolean;
  onToggle: () => void;
  onLens: (lens: Lens, sectionId?: string) => void;
}) {
  // checks
  let checksText = '—';
  let checksTint = 'text-[var(--ops-muted)]';
  if (req.doc) {
    const { passed, total } = checksSummary(req.doc);
    checksText = `${passed}/${total}`;
    checksTint = passed === total ? 'text-[var(--ops-ok-text)]' : 'text-[var(--ops-critical-text)]';
  }

  // validity
  let validityNode: React.ReactNode = <span className="text-[var(--ops-faint)]">—</span>;
  if (req.clock) {
    const clock = req.clock;
    if (clock.stopped) {
      validityNode = (
        <div className="inline-flex items-center gap-1 ops-mono text-[10px] text-[var(--ops-ok-text)]">
          <Lock className="w-3 h-3" />
          <span>stopped {clock.stoppedOn ? fmt(clock.stoppedOn) : ''}</span>
        </div>
      );
    } else {
      const b = band(clock.days);
      let cls = 'bg-[var(--ops-inset)] text-[var(--ops-neutral-text)] border-[var(--ops-border)]';
      if (b === 'escalate') cls = 'bg-[var(--ops-critical-wash)] text-[var(--ops-critical-text)] border-[var(--ops-critical-border)]';
      else if (b === 'warn') cls = 'bg-[var(--ops-warning-wash)] text-[var(--ops-warning-text)] border-[var(--ops-warning-border)]';
      validityNode = (
        <button
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border ops-mono text-[10px] hover:opacity-80 transition-opacity ${cls}`}
          onClick={(e) => {
            e.stopPropagation();
            onLens('timeline');
          }}
        >
          {clock.kind === 'hard' && (
            <>
              <span>hard</span>
              <span className="opacity-40">·</span>
            </>
          )}
          <span>{fmt(clock.staleOn)}</span>
        </button>
      );
    }
  }

  // status
  const tagBase =
    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border text-[9.5px] uppercase tracking-wider font-semibold';
  let statusNode: React.ReactNode = null;
  switch (req.status) {
    case 'accepted':
      statusNode = (
        <div className={`${tagBase} bg-[var(--ops-ok-wash)] text-[var(--ops-ok-text)] border-[var(--ops-ok-border)]`}>
          <Check className="w-3 h-3" />
          <span>
            Accepted{' '}
            <span className="ops-mono ml-0.5">{req.verdict ? fmt(new Date(req.verdict.decidedAt)) : ''}</span>
          </span>
        </div>
      );
      break;
    case 'clean':
      statusNode = <div className={`${tagBase} bg-[var(--ops-inset)] text-[var(--ops-neutral-text)] border-[var(--ops-border)]`}>Filed</div>;
      break;
    case 'filed':
      statusNode = <div className={`${tagBase} bg-[var(--ops-inset)] text-[var(--ops-neutral-text)] border-[var(--ops-border)]`}>Intake</div>;
      break;
    case 'flagged':
      statusNode = (
        <button
          className={`${tagBase} bg-[var(--ops-critical-wash)] text-[var(--ops-critical-text)] border-[var(--ops-critical-border)] hover:bg-[#FEE2E2] transition-colors`}
          onClick={(e) => {
            e.stopPropagation();
            onLens('workfile', req.sectionId);
          }}
        >
          Needs you
        </button>
      );
      break;
    case 'missing':
      statusNode = <div className={`${tagBase} bg-[var(--ops-critical-wash)] text-[var(--ops-critical-text)] border-[var(--ops-critical-border)]`}>Not found</div>;
      break;
    case 'requested':
      statusNode = <div className={`${tagBase} bg-[var(--ops-warning-wash)] text-[var(--ops-warning-text)] border-[var(--ops-warning-border)]`}>Requested</div>;
      break;
    case 'covered':
      statusNode = <div className={`${tagBase} bg-[var(--ops-neutral-wash)] text-[var(--ops-neutral-text)] border-[var(--ops-neutral-border)]`}>Covered</div>;
      break;
  }

  // document cell
  let docCell: React.ReactNode;
  if (req.doc) {
    docCell = (
      <div className="flex flex-col gap-0.5">
        <span className="ops-mono text-[11px] text-[var(--ops-body-sec)] break-all">{req.doc.suggestedName}</span>
        <span className="text-[10px] text-[var(--ops-muted)]">
          pp. <span className="ops-mono">{pageSpan(req.doc)}</span>
          <span className="mx-1 text-[var(--ops-strong-border)]">·</span>
          <span className="ops-mono">{confidencePct(req.doc)}%</span> match
        </span>
      </div>
    );
  } else if (req.status === 'filed' && req.uploads.length > 0) {
    docCell = (
      <div className="flex flex-col gap-0.5">
        <span className="ops-mono text-[11px] text-[var(--ops-body-sec)] break-all">{req.uploads[req.uploads.length - 1].filename}</span>
        <span className="text-[10px] text-[var(--ops-muted)]">via intake · awaiting analyzer</span>
      </div>
    );
  } else if (req.status === 'requested') {
    docCell = <span className="text-[11px] text-[var(--ops-muted)]">Requested — waiting on a new version</span>;
  } else if (req.status === 'covered') {
    docCell = <span className="text-[11px] text-[var(--ops-muted)]">Covered by {req.coveredBy}</span>;
  } else {
    docCell = <span className="text-[11px] text-[var(--ops-muted)]">Not in the packet</span>;
  }

  const received = req.doc
    ? model.run
      ? fmt(new Date(model.run.startedAt))
      : '—'
    : req.uploads.length > 0
      ? fmt(new Date(req.uploads[req.uploads.length - 1].uploadedAt))
      : '—';

  return (
    <React.Fragment>
      <tr className="sheaf-register-row cursor-pointer" onClick={onToggle} data-testid={`register-row-${req.block.id}`}>
        <td>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-medium text-[var(--ops-ink)]">{req.block.name}</span>
            <span className="text-[10px] uppercase font-semibold tracking-wide text-[var(--ops-muted)]">
              {req.block.formats?.map((f) => `.${f.replace(/^\./, '').toUpperCase()}`).join(' ') ||
                req.block.docType?.replace(/_/g, ' ') ||
                '—'}
            </span>
          </div>
        </td>
        <td>{docCell}</td>
        <td>
          <span className="ops-mono text-[11px] text-[var(--ops-neutral-text)]">{received}</span>
        </td>
        <td className="text-right">
          <span className={`ops-mono text-[11px] ${checksTint}`}>{checksText}</span>
        </td>
        <td className="text-right">{validityNode}</td>
        <td>{statusNode}</td>
        <td className="text-center">
          <ChevronDown
            className={`w-3.5 h-3.5 inline-block text-[var(--ops-faint)] transition-transform ${expanded ? 'rotate-180 text-[var(--ops-ink)]' : ''}`}
          />
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} className="p-0 border-b border-[var(--ops-border)]">
            <div className="sheaf-expanded-panel p-4 md:pl-[24%] flex flex-col md:flex-row gap-6 relative">
              {req.status === 'flagged' && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--ops-critical-solid)]" />
              )}
              <div className="flex-1 flex flex-col gap-2.5 py-1">
                {req.flagTitle && req.status !== 'accepted' && (
                  <div className="text-[12.5px] text-[var(--ops-ink)] leading-relaxed">
                    <strong
                      className={`font-semibold mr-2 ${
                        req.severity === 'clay'
                          ? 'text-[var(--ops-critical-text)]'
                          : req.severity === 'amber'
                            ? 'text-[var(--ops-warning-text)]'
                            : 'text-[var(--ops-neutral-text)]'
                      }`}
                    >
                      {req.flagTitle}:
                    </strong>
                    {req.flagNote}
                  </div>
                )}
                {req.doc && (
                  <>
                    <div className="text-[12.5px] text-[var(--ops-body-sec)] leading-relaxed">
                      {req.doc.coreFields.issuing_party ? `Issued by ${req.doc.coreFields.issuing_party} · ` : ''}
                      {req.doc.coreFields.primary_party_name}
                      {req.documentDate ? ` · dated ${req.documentDate}` : ''}
                      {req.expiryDate ? ` · expires ${req.expiryDate}` : ''}
                    </div>
                    <div className="ops-mono text-[10.5px] text-[var(--ops-muted)] flex items-center gap-3">
                      <span>Quality {Math.round(req.doc.scores.quality * 100)}</span>
                      <span className="text-[var(--ops-strong-border)]">·</span>
                      <span>Format {Math.round(req.doc.scores.formatting * 100)}</span>
                      <span className="text-[var(--ops-strong-border)]">·</span>
                      <span>
                        {req.doc.scores.fraud_signal != null
                          ? `Fraud ${Math.round(req.doc.scores.fraud_signal * 100)}%`
                          : 'Fraud — not scored this run'}
                      </span>
                      <span className="text-[var(--ops-strong-border)]">·</span>
                      <span>scrutiny {req.doc.scores.scrutinyTier}</span>
                    </div>
                  </>
                )}
                {req.clock && <div className="text-[11px] text-[var(--ops-muted)] mt-0.5">{req.clock.note}</div>}
              </div>

              <div className="w-full md:w-52 flex flex-col gap-2 shrink-0 md:border-l border-[var(--ops-inner-rule)] md:pl-6 justify-center">
                {req.status === 'flagged' ? (
                  <VerdictButtons req={req} applicationId={applicationId} stack />
                ) : (
                  <button
                    className="btn-secondary w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLens('workfile', req.sectionId);
                    }}
                  >
                    View in Workfile
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
