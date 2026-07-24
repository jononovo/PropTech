import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Bell, FolderOpen, History, Inbox, LayoutDashboard, ListChecks } from 'lucide-react';
import { useListTemplates } from '@workspace/api-client-react';
import { fmt } from './caseData';
import type { CaseModel } from './caseData';
import { useClosingDate, useTemplateUpgrade } from './useCaseFile';

export type Lens = 'intake' | 'triage' | 'workfile' | 'timeline' | 'register';

const LENSES: { key: Lens; label: string; icon: typeof Inbox }[] = [
  { key: 'intake', label: 'Intake', icon: Inbox },
  { key: 'triage', label: 'Triage', icon: LayoutDashboard },
  { key: 'workfile', label: 'Workfile', icon: FolderOpen },
  { key: 'timeline', label: 'Timeline', icon: History },
  { key: 'register', label: 'Register', icon: ListChecks },
];

export function CaseShell({
  model,
  lens,
  onLens,
  children,
}: {
  model: CaseModel;
  lens: Lens;
  onLens: (lens: Lens) => void;
  children: ReactNode;
}) {
  const { app } = model;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* case header */}
      <div className="bg-white border-b border-[var(--ops-border)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-3.5 pb-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href="/applications"
                data-testid="link-back-applications"
                className="micro-label text-[9.5px] hover:text-[var(--ops-accent)] transition-colors inline-flex items-center gap-1 mb-1"
              >
                <ArrowLeft className="w-3 h-3" /> applications
              </Link>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--ops-ink)] truncate">
                  {app.applicantName}
                </h1>
                <span className="ops-mono text-[11px] text-[var(--ops-muted)]">{app.id}</span>
                {model.run?.pipelineVersion?.startsWith('simulated') && (
                  <span
                    title="This report came from the deterministic simulator — the analyzer engine is not built yet."
                    data-testid="chip-simulated"
                    className="ops-mono text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--ops-warning-wash)] border border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] tracking-[0.08em]"
                  >
                    SIMULATED RUN
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[var(--ops-body-sec)] flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span className="truncate">
                  {app.template.template}{' '}
                  <span className="ops-mono text-[10.5px] text-[var(--ops-muted)]">v{app.version}</span>
                  <span className="text-[var(--ops-faint)]"> · </span>
                  <span className="text-[var(--ops-muted)]">{app.template.program}</span>
                </span>
                <TemplateUpgradeNudge model={model} />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <ClosingTarget model={model} />
              <button
                onClick={() => onLens('timeline')}
                title={`${model.alarmCount} live ${model.alarmCount === 1 ? 'clock' : 'clocks'} inside 30 days`}
                data-testid="button-clock-bell"
                className={`relative flex items-center gap-1.5 h-9 px-2.5 rounded-[4px] border transition-colors ${
                  model.alarmCount > 0
                    ? 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] hover:bg-[#FEF3C7]'
                    : 'bg-white border-[var(--ops-border)] text-[var(--ops-muted)] hover:bg-[var(--ops-inset)]'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                {model.alarmCount > 0 && (
                  <span className="ops-mono text-[11px] font-medium">{model.alarmCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* lens tabs */}
          <nav className="flex items-stretch gap-5 mt-2.5">
            {LENSES.map(({ key, label, icon: Icon }) => {
              const active = key === lens;
              const count =
                key === 'triage' && model.stats.attention > 0
                  ? model.stats.attention
                  : key === 'timeline' && model.alarmCount > 0
                    ? model.alarmCount
                    : null;
              return (
                <button
                  key={key}
                  onClick={() => onLens(key)}
                  data-testid={`tab-${key}`}
                  className={`flex items-center gap-1.5 pb-2 pt-1 text-[12.5px] font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-[var(--ops-accent)] text-[var(--ops-ink)]'
                      : 'border-transparent text-[var(--ops-muted)] hover:text-[var(--ops-ink)]'
                  }`}
                >
                  <Icon className={`w-[13px] h-[13px] ${active ? 'text-[var(--ops-accent)]' : ''}`} />
                  <span className="hidden sm:inline">{label}</span>
                  {count !== null && (
                    <span
                      className={`ops-mono text-[10px] px-1 rounded-[2px] border ${
                        key === 'triage'
                          ? 'bg-[var(--ops-critical-wash)] text-[var(--ops-critical-text)] border-[var(--ops-critical-border)]'
                          : 'bg-[var(--ops-warning-wash)] text-[var(--ops-warning-text)] border-[var(--ops-warning-border)]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

/**
 * Shown only when a newer ACTIVE version of this application's template family
 * exists. One click re-pins (server enforces additive-only) and records the
 * upgrade in the audit trail.
 */
function TemplateUpgradeNudge({ model }: { model: CaseModel }) {
  const { app } = model;
  const templatesQ = useListTemplates();
  const { upgrade, isPending } = useTemplateUpgrade(app.id);

  const newest = (templatesQ.data ?? [])
    .filter((t) => t.family === app.family && t.status === 'active' && t.version > app.version)
    .reduce((max, t) => Math.max(max, t.version), 0);

  if (newest === 0) return null;

  return (
    <button
      onClick={() => upgrade(newest)}
      disabled={isPending}
      data-testid="button-upgrade-template"
      title="Additive-only upgrade: existing uploads, verdicts and analysis stay attached. Recorded in the audit trail."
      className="ops-mono text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--ops-warning-wash)] border border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] tracking-[0.06em] hover:bg-[#FEF3C7] transition-colors disabled:opacity-60"
    >
      {isPending ? 'UPGRADING…' : `TEMPLATE v${newest} AVAILABLE — UPGRADE`}
    </button>
  );
}

function ClosingTarget({ model }: { model: CaseModel }) {
  const { setClosingDate, isPending } = useClosingDate(model.app.id);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(model.app.projectedClosingDate ?? '');

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="input-closing-date"
          className="ops-mono text-[12px] bg-white border border-[var(--ops-strong-border)] rounded-[4px] px-2 py-1.5 focus:outline-none focus:border-[var(--ops-accent)]"
        />
        <button
          className="btn-primary"
          disabled={isPending || !value}
          data-testid="button-save-closing-date"
          onClick={() => {
            setClosingDate(value);
            setEditing(false);
          }}
        >
          Save
        </button>
        <button className="btn-quiet" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setValue(model.app.projectedClosingDate ?? '');
        setEditing(true);
      }}
      data-testid="button-edit-closing-date"
      title="Edit closing target"
      className="text-right hover:bg-[var(--ops-inset)] rounded-[4px] px-2.5 py-1 transition-colors"
    >
      <div className="micro-label text-[9px] mb-0.5">closing target</div>
      {model.closing ? (
        <div className="ops-mono text-[12.5px] text-[var(--ops-ink)]">
          {fmt(model.closing)} · {model.daysToClose}d out
        </div>
      ) : (
        <div className="text-[12px] text-[var(--ops-accent)] font-medium">set date</div>
      )}
    </button>
  );
}
