import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { ChevronDown, FolderOpen, History, Inbox, LayoutDashboard, ListChecks, MoreVertical, ScrollText, Sparkles } from 'lucide-react';
import { useListTemplates } from '@workspace/api-client-react';
import { PANEL, UserMenu } from '@/components/UserMenu';
import { fmt } from './caseData';
import type { CaseModel } from './caseData';
import { useClosingDate, useTemplateUpgrade } from './useCaseFile';
import { AgentPanel } from './components/AgentPanel';
import { AccessMatrixButton } from './components/AccessMatrixButton';

export type Lens = 'intake' | 'triage' | 'workfile' | 'timeline' | 'register' | 'ledger';

const LENSES: { key: Lens; label: string; icon: typeof Inbox }[] = [
  { key: 'intake', label: 'Intake', icon: Inbox },
  { key: 'triage', label: 'Triage', icon: LayoutDashboard },
  { key: 'workfile', label: 'Workfile', icon: FolderOpen },
  { key: 'timeline', label: 'Timeline', icon: History },
  { key: 'register', label: 'Register', icon: ListChecks },
];

/**
 * Single-bar case chrome (mockup: Backbone). Inside a case the global nav
 * disappears — identity, lens tabs, clock bell and account share one 52px
 * header. Everything that used to fill the big case header lives one reveal
 * deeper, in the applicant-name panel; Dashboard/Applications/Templates
 * moved into the avatar menu.
 */
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
  const [caseOpen, setCaseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="shrink-0 h-[52px] bg-white border-b border-[var(--ops-border)] flex items-center gap-1.5 md:gap-3 pl-3 md:pl-5 pr-2 md:pr-4 sticky top-0 z-30">
        <Link href="/" data-testid="link-brand-home" title="Sheaf — dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-[22px] h-[22px] bg-[#0F172A] rounded-[5px] flex items-center justify-center">
            <div className="w-[10px] h-[10px] border-[1.5px] border-white rounded-[2px]" />
          </div>
          <span className="hidden lg:inline text-[15px] font-bold tracking-[-0.01em]">Sheaf</span>
        </Link>
        <div className="hidden md:block h-5 w-px bg-[var(--ops-border)] shrink-0" />

        {/* case anchor — the name is the file */}
        <div className="relative min-w-0 flex-1 md:flex-none">
          {caseOpen && <div className="fixed inset-0 z-40" onClick={() => setCaseOpen(false)} />}
          <button
            onClick={() => setCaseOpen((o) => !o)}
            data-testid="button-case-menu"
            className="relative z-50 w-full md:w-auto flex items-center gap-1.5 px-2 py-1.5 -ml-2 rounded-[4px] hover:bg-[var(--ops-inner-rule)] transition-colors min-w-0"
          >
            <span className="text-[13px] font-semibold truncate md:max-w-[280px]">{app.applicantName}</span>
            <ChevronDown
              className={`w-3 h-3 text-[var(--ops-faint)] shrink-0 transition-transform duration-150 ${caseOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {caseOpen && <CasePanel model={model} />}
        </div>

        {/* lens tabs — labels on desktop, icons on mobile */}
        <nav className="ml-auto hidden md:flex items-stretch self-stretch shrink-0">
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
                className={`relative px-2.5 lg:px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                  active ? 'text-[var(--ops-ink)]' : 'text-[var(--ops-muted)] hover:text-[var(--ops-ink)]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className={`w-[13px] h-[13px] ${active ? 'text-[var(--ops-accent)]' : 'text-[var(--ops-faint)]'}`} strokeWidth={2} />
                  {label}
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
                </span>
                {active && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-[var(--ops-accent)]" />}
              </button>
            );
          })}
        </nav>
        <nav className="flex md:hidden items-center gap-0.5 shrink-0 ml-1" aria-label="Lenses">
          {LENSES.map(({ key, label, icon: Icon }) => {
            const active = key === lens;
            return (
              <button
                key={key}
                onClick={() => onLens(key)}
                data-testid={`tab-${key}-mobile`}
                aria-label={label}
                title={label}
                className={`w-8 h-9 flex items-center justify-center rounded-[4px] transition-colors ${
                  active
                    ? 'text-[var(--ops-accent)] bg-[var(--ops-accent-wash)]'
                    : 'text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)]'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </button>
            );
          })}
        </nav>

        {/* overflow — rare tools live here, out of the daily tab row */}
        <div className="relative shrink-0">
          {moreOpen && <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            data-testid="button-case-overflow"
            aria-label="More"
            title="More"
            className={`relative z-50 w-8 h-9 md:h-8 flex items-center justify-center rounded-[4px] transition-colors ${
              lens === 'ledger'
                ? 'text-[var(--ops-accent)] bg-[var(--ops-accent-wash)]'
                : 'text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)] hover:text-[var(--ops-ink)]'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {moreOpen && (
            <div className={`${PANEL} right-0 left-auto w-[200px]`} data-testid="menu-case-overflow">
              <button
                onClick={() => {
                  onLens('ledger');
                  setMoreOpen(false);
                }}
                data-testid="menu-item-ledger"
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium text-left transition-colors ${
                  lens === 'ledger'
                    ? 'text-[var(--ops-accent)]'
                    : 'text-[var(--ops-muted)] hover:text-[var(--ops-ink)] hover:bg-[var(--ops-inset)]'
                }`}
              >
                <ScrollText className="w-[13px] h-[13px]" strokeWidth={2} />
                Activity ledger
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:block h-5 w-px bg-[var(--ops-border)] shrink-0" />

        {/* case assistant — chat scoped to this application */}
        <button
          onClick={() => setAgentOpen((o) => !o)}
          data-testid="button-agent-toggle"
          title="Case assistant"
          className={`w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded-[4px] transition-colors shrink-0 ${
            agentOpen
              ? 'text-[var(--ops-accent)] bg-[var(--ops-accent-wash)]'
              : 'text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)] hover:text-[var(--ops-ink)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <AccessMatrixButton />
        <UserMenu />
      </header>

      <div className="flex-1 min-h-0">{children}</div>
      {agentOpen && (
        <AgentPanel
          applicationId={app.id}
          files={Object.fromEntries((app.files ?? []).map((f) => [f.id, f.filename]))}
          onClose={() => setAgentOpen(false)}
        />
      )}
    </div>
  );
}

/** Everything the old case header showed, one reveal deeper. */
function CasePanel({ model }: { model: CaseModel }) {
  const { app } = model;
  const simulated = model.run?.pipelineVersion?.startsWith('simulated');

  return (
    <div className={`${PANEL} md:left-0 md:w-[324px]`} data-testid="menu-case-panel">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2.5 border-b border-[var(--ops-inner-rule)]">
        <span className="ops-mono text-[11px] font-medium text-[var(--ops-ink)]">{app.id}</span>
        {simulated && (
          <span
            data-testid="chip-simulated"
            title="This report came from the deterministic simulator — the analyzer engine is not built yet."
            className="ops-mono text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--ops-warning-wash)] border border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] tracking-[0.08em]"
          >
            SIMULATED RUN
          </span>
        )}
      </div>
      <div className="px-4 py-2.5 space-y-1.5">
        <InfoRow k="Applicant" v={app.applicantName} />
        <InfoRow k="Template" v={`${app.template.template} · v${app.version}`} />
        <InfoRow k="Program" v={app.template.program} />
      </div>
      <TemplateUpgradeNudge model={model} />
      <ClosingTargetRow model={model} />
      <Link
        href="/applications"
        data-testid="link-back-applications"
        className="block px-4 py-2 border-t border-[var(--ops-inner-rule)] text-[11.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] hover:bg-[var(--ops-inset)] transition-colors"
      >
        ← All applications
      </Link>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 text-[11.5px] leading-snug">
      <span className="w-[64px] shrink-0 text-[var(--ops-muted)]">{k}</span>
      <span className="text-[var(--ops-ink)] min-w-0">{v}</span>
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
    <div className="px-4 pb-2.5">
      <button
        onClick={() => upgrade(newest)}
        disabled={isPending}
        data-testid="button-upgrade-template"
        title="Additive-only upgrade: existing uploads, verdicts and analysis stay attached. Recorded in the audit trail."
        className="w-full ops-mono text-[9px] px-1.5 py-1 rounded-[3px] bg-[var(--ops-warning-wash)] border border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] tracking-[0.06em] hover:bg-[#FEF3C7] transition-colors disabled:opacity-60"
      >
        {isPending ? 'UPGRADING…' : `TEMPLATE v${newest} AVAILABLE — UPGRADE`}
      </button>
    </div>
  );
}

function ClosingTargetRow({ model }: { model: CaseModel }) {
  const { setClosingDate, isPending } = useClosingDate(model.app.id);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(model.app.projectedClosingDate ?? '');

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-t border-[var(--ops-border)] bg-[var(--ops-inset)]">
        <input
          type="date"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="input-closing-date"
          className="ops-mono text-[12px] flex-1 min-w-0 bg-white border border-[var(--ops-strong-border)] rounded-[4px] px-2 py-1.5 focus:outline-none focus:border-[var(--ops-accent)]"
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
      className="w-full flex items-center justify-between px-4 py-2 border-t border-[var(--ops-border)] bg-[var(--ops-inset)] hover:bg-[var(--ops-inner-rule)] transition-colors"
    >
      <span className="text-[10.5px] text-[var(--ops-muted)]">Closing target</span>
      {model.closing ? (
        <span className="ops-mono text-[11px] font-medium text-[var(--ops-ink)]">
          {fmt(model.closing)} · {model.daysToClose}d out
        </span>
      ) : (
        <span className="text-[11.5px] text-[var(--ops-accent)] font-medium">set date</span>
      )}
    </button>
  );
}
