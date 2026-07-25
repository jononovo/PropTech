import { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Hourglass,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  UploadCloud,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Bell } from 'lucide-react';
import { fmt, pageSpan, confidencePct, type CaseModel, type CaseReq, type CaseSection } from '../caseData';
import { VerdictButtons } from '../components/VerdictButtons';
import { MissingActions } from '../components/MissingActions';
import { VariantPanel } from '../components/VariantPanel';
import { useMaterializeRetry } from '../useCaseFile';
import type { Lens } from '../CaseShell';

function defaultSection(model: CaseModel): string {
  const blocker = model.sections.find((s) => s.dot === 'blocker');
  if (blocker) return blocker.id;
  const warning = model.sections.find((s) => s.dot === 'warning');
  if (warning) return warning.id;
  const open = model.sections.find((s) => !s.done);
  return (open ?? model.sections[0]).id;
}

export function WorkfilePage({
  model,
  applicationId,
  onLens,
  focusSectionId,
}: {
  model: CaseModel;
  applicationId: string;
  onLens: (lens: Lens, sectionId?: string) => void;
  focusSectionId?: string | null;
}) {
  const [currentId, setCurrentId] = useState<string>(() => focusSectionId ?? defaultSection(model));
  const [railCollapsed, setRailCollapsed] = useState(false);
  const section = model.sections.find((s) => s.id === currentId) ?? model.sections[0];
  const sectionIdx = model.sections.indexOf(section);
  const nextSection = model.sections[sectionIdx + 1];
  const itemsLeft = section.total - section.cleared;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden flex justify-center pb-8 md:pb-24">
      <div className="w-full max-w-[1100px] flex flex-col md:flex-row px-4 md:px-8 mt-4 md:mt-10 gap-6 md:gap-12">
        {/* rail */}
        <aside
          className={`shrink-0 flex flex-col pt-2 transition-[width] duration-200 ${
            railCollapsed ? 'w-full md:w-[52px]' : 'w-full md:w-[280px]'
          }`}
        >
          <div className="hidden md:flex items-center mb-6 h-[26px]">
            {!railCollapsed && (
              <div className="micro-label text-[10px] flex-1 truncate pr-2">
                {model.stats.quiet} OF {model.reqs.length} FILED CLEAN · {model.stats.attention} NEED YOU
              </div>
            )}
            <button
              onClick={() => setRailCollapsed(!railCollapsed)}
              className={`w-[26px] h-[26px] shrink-0 rounded-[4px] flex items-center justify-center text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)] transition-colors ${railCollapsed ? 'mx-auto' : ''}`}
              title={railCollapsed ? 'Expand rail' : 'Collapse rail'}
              data-testid="button-toggle-rail"
            >
              {railCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </div>

          <div className="md:hidden mb-3 micro-label text-[10px]">
            {model.stats.quiet} OF {model.reqs.length} FILED CLEAN · {model.stats.attention} NEED YOU
          </div>

          {/* mobile rail */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-2 -mx-4 px-4 snap-x" style={{ scrollbarWidth: 'none' }}>
            {model.sections.map((s) => (
              <MobileRailNode key={s.id} section={s} active={s.id === section.id} onClick={() => setCurrentId(s.id)} />
            ))}
          </div>

          {/* desktop rail */}
          {!railCollapsed ? (
            <div className="hidden md:flex relative flex-col gap-5 ml-2 animate-fade-in">
              <div className="absolute left-[7px] top-[14px] bottom-4 w-[1px] bg-[var(--ops-border)]" />
              {model.sections.map((s) => (
                <RailNode key={s.id} section={s} active={s.id === section.id} onClick={() => setCurrentId(s.id)} />
              ))}
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-center gap-1 w-full animate-fade-in">
              {model.sections.map((s) => (
                <CollapsedRailNode key={s.id} section={s} active={s.id === section.id} onClick={() => setCurrentId(s.id)} />
              ))}
            </div>
          )}

          {/* waiting on others */}
          {model.waiting.length > 0 && !railCollapsed && (
            <div className="hidden md:block mt-10 bg-white border border-[var(--ops-border)] rounded p-3">
              <div className="micro-label text-[10px] mb-2.5">Waiting on others</div>
              <div className="flex flex-col gap-2.5">
                {model.waiting.map((r) => (
                  <WaitingRow key={r.block.id} req={r} />
                ))}
              </div>
            </div>
          )}
          {model.waiting.length > 0 && railCollapsed && (
            <div className="hidden md:flex mt-10 flex-col items-center">
              <div
                className="w-[40px] h-[40px] rounded-[4px] border border-[var(--ops-border)] bg-white flex flex-col items-center justify-center"
                title={model.waiting.map((r) => r.block.name).join('\n')}
              >
                <Hourglass className="w-3.5 h-3.5 text-[var(--ops-warning-solid)] mb-[2px]" />
                <span className="ops-mono text-[10px] text-[var(--ops-muted)] leading-none">
                  {model.waiting.length}
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* working column */}
        <main className="flex-1 w-full max-w-[880px] flex flex-col">
          <header className="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-0">
            <div>
              <div className="micro-label text-[10px] mb-1.5">
                Section {section.num} of {String(model.sections.length).padStart(2, '0')}
              </div>
              <h1 className="font-semibold text-[20px] md:text-[22px] tracking-[-0.01em] text-[var(--ops-ink)] mb-1">
                {section.name}
              </h1>
              <p className="text-[13px] text-[var(--ops-body-sec)]">
                Owned by {section.owner} · {section.cleared} of {section.total} clear
              </p>
            </div>
            <button
              onClick={() => onLens('register')}
              className="text-[13px] font-medium text-[var(--ops-accent)] hover:text-[var(--ops-accent-hover)] transition-colors"
            >
              see this section in the Register →
            </button>
          </header>

          <div className="flex flex-col gap-3">
            {section.reqs.map((req) => (
              <div key={req.block.id} className="flex flex-col">
                <ReqCard req={req} applicationId={applicationId} onLens={onLens} />
                {req.block.arity === 'set' && req.status !== 'accepted' && (
                  <VariantPanel req={req} applicationId={applicationId} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-[var(--ops-border)] pt-4 gap-4 md:gap-0">
            <div className="ops-mono text-[11px] md:text-[12px] text-[var(--ops-muted)]">
              {itemsLeft === 0 ? 'section clear' : `${itemsLeft} ${itemsLeft === 1 ? 'item' : 'items'} left in this section`}
            </div>
            {nextSection ? (
              <button
                onClick={() => setCurrentId(nextSection.id)}
                data-testid="button-next-section"
                className="btn-primary flex items-center justify-center gap-1.5 w-full md:w-auto"
              >
                Continue to {nextSection.num} {nextSection.name} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onLens('triage')}
                data-testid="button-back-to-triage"
                className="btn-secondary w-full md:w-auto"
              >
                Back to triage
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── requirement cards by status ────────────────────────────────────────────

function ReqCard({
  req,
  applicationId,
  onLens,
}: {
  req: CaseReq;
  applicationId: string;
  onLens: (lens: Lens, sectionId?: string) => void;
}) {
  const [, setLocation] = useLocation();

  if (req.status === 'accepted') {
    return (
      <div className="bg-white rounded border border-[var(--ops-border)] flex flex-col hover:bg-[var(--ops-inset)] transition-colors">
        <div className="p-3 md:px-4 md:py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--ops-ok-wash)] border border-[var(--ops-ok-border)] flex items-center justify-center shrink-0">
              <Lock className="w-3 h-3 text-[var(--ops-ok-text)]" />
            </div>
            <div className="text-[13px] font-medium text-[var(--ops-ink)]">{req.block.name}</div>
          </div>
          <div className="ops-mono text-[11px] md:text-[12px] text-[var(--ops-ok-text)] ml-8 md:ml-0">
            accepted {req.verdict ? fmt(new Date(req.verdict.decidedAt)) : ''}
            {req.clock?.kind === 'staleness' && ' — clock stopped'}
            {req.clock?.kind === 'hard' && ' — hard expiry stays live'}
          </div>
        </div>
        {req.materializationError && (
          <MaterializationErrorBar req={req} applicationId={applicationId} />
        )}
      </div>
    );
  }

  if (req.status === 'requested') {
    return (
      <div className="bg-white rounded border border-[var(--ops-warning-border)] p-3 md:px-4 md:py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[var(--ops-warning-wash)] border border-[var(--ops-warning-border)] flex items-center justify-center shrink-0">
            <Hourglass className="w-3 h-3 text-[var(--ops-warning-text)]" />
          </div>
          <div className="text-[13px] font-medium text-[var(--ops-ink)]">{req.block.name}</div>
        </div>
        <div className="ops-mono text-[11px] text-[var(--ops-warning-text)] ml-8 md:ml-0">
          new version requested {req.verdict ? fmt(new Date(req.verdict.decidedAt)) : ''} · {req.verdict?.decidedBy}
        </div>
      </div>
    );
  }

  if (req.status === 'covered') {
    return (
      <div className="bg-[var(--ops-neutral-wash)] rounded border border-[var(--ops-neutral-border)] p-3 md:px-4 md:py-2.5 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-white border border-[var(--ops-neutral-border)] flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-[var(--ops-neutral-text)]" />
        </div>
        <div>
          <span className="text-[13px] font-medium text-[var(--ops-ink)] mr-2">{req.block.name}</span>
          <span className="text-[12.5px] text-[var(--ops-neutral-text)]">{req.flagNote}</span>
        </div>
      </div>
    );
  }

  if (req.status === 'flagged') {
    return (
      <div className="bg-white rounded border border-[var(--ops-critical-border)] relative flex flex-col">
        <div className="absolute top-0 left-0 w-[2px] h-full bg-[var(--ops-critical-solid)] rounded-l" />
        <div className="p-3 pl-4 md:p-4 md:pl-5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-5 h-5 rounded-full bg-[var(--ops-critical-wash)] flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-critical-text)]" />
            </div>
            <div className="text-[13px] md:text-[14px] font-semibold text-[var(--ops-ink)]">{req.block.name}</div>
            <StatusChip tone="critical">{req.flagTitle ?? 'Flagged'}</StatusChip>
          </div>
          <div className="pl-0 md:pl-8 flex flex-col gap-3.5 mt-2 md:mt-0">
            <p className="text-[13px] text-[var(--ops-ink)] leading-relaxed max-w-[560px]">{req.flagNote}</p>
            {req.doc && (
              <div className="inline-flex items-center gap-1.5 ops-mono text-[11px] text-[var(--ops-muted)]">
                <FileText className="w-3 h-3 shrink-0" />
                {req.doc.suggestedName} · pp. {pageSpan(req.doc)} · {confidencePct(req.doc)}% match
              </div>
            )}
            <VerdictButtons req={req} applicationId={applicationId} />
          </div>
        </div>
        {req.clock && (
          <div className="bg-[var(--ops-inset)] border-t border-[var(--ops-inner-rule)] px-4 md:px-5 py-2 md:pl-[52px]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[var(--ops-warning-text)]" />
              <span className="text-[11px] md:text-[12px] text-[var(--ops-body-sec)]">
                {req.clock.rule} — {req.clock.note}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (req.status === 'missing') {
    const critical = req.block.criticality === 'critical';
    return (
      <div className="bg-white rounded border border-[var(--ops-border)] p-3 md:px-4 md:py-4 flex flex-col gap-3 hover:bg-[var(--ops-inset)] transition-colors">
        <div className="flex flex-col md:flex-row items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--ops-inset)] border border-[var(--ops-border)] flex items-center justify-center shrink-0">
              <FileText className="w-3 h-3 text-[var(--ops-faint)]" />
            </div>
            <div className="text-[13px] md:text-[14px] font-semibold text-[var(--ops-ink)]">{req.block.name}</div>
            <StatusChip tone={critical ? 'critical' : 'warning'}>
              {req.block.criticality === 'supporting' ? 'Not found' : 'Missing'}
            </StatusChip>
          </div>
          {critical && <StatusChip tone="critical">blocks underwriting until filed</StatusChip>}
        </div>
        <div className="pl-0 md:pl-8 flex flex-col gap-3">
          <p className="text-[13px] text-[var(--ops-body-sec)] max-w-[600px]">{req.flagNote}</p>
          <button
            onClick={() => setLocation(`/apply/${applicationId}`)}
            className="border border-dashed border-[var(--ops-strong-border)] rounded bg-[var(--ops-inset)] p-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-[var(--ops-inner-rule)] hover:border-[var(--ops-faint)] w-full"
            data-testid={`button-file-missing-${req.block.id}`}
          >
            <UploadCloud className="w-5 h-5 text-[var(--ops-muted)] mb-1.5" />
            <div className="text-[12px] md:text-[13px] text-[var(--ops-ink)] font-medium">
              File it through the intake form
            </div>
            <div className="text-[11px] md:text-[12px] text-[var(--ops-muted)]">PDF or photo is fine</div>
          </button>
          <div>
            <MissingActions applicationId={applicationId} />
          </div>
        </div>
      </div>
    );
  }

  if (req.status === 'filed') {
    return (
      <div className="bg-white rounded border border-[var(--ops-border)] p-3 md:px-4 md:py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 hover:bg-[var(--ops-inset)] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[var(--ops-inset)] border border-[var(--ops-border)] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-[var(--ops-neutral-text)]" />
          </div>
          <div className="text-[13px] font-medium text-[var(--ops-ink)]">{req.block.name}</div>
        </div>
        <div className="ops-mono text-[11px] md:text-[12px] text-[var(--ops-muted)] ml-8 md:ml-0">
          filed via intake · awaiting analyzer
        </div>
      </div>
    );
  }

  // clean
  return (
    <div className="bg-white rounded border border-[var(--ops-border)] p-3 md:px-4 md:py-3 flex flex-col gap-2 hover:bg-[var(--ops-inset)] transition-colors">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[var(--ops-inset)] border border-[var(--ops-border)] flex items-center justify-center shrink-0">
            <FileText className="w-3 h-3 text-[var(--ops-neutral-text)]" />
          </div>
          <div className="text-[13px] font-medium text-[var(--ops-ink)]">{req.block.name}</div>
          <StatusChip tone="neutral">clean</StatusChip>
        </div>
        {req.clock && !req.clock.stopped && (
          <button
            onClick={() => onLens('timeline')}
            className="flex items-center justify-center gap-1.5 bg-[var(--ops-warning-wash)] border border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] px-2 py-1.5 md:py-0.5 rounded-[3px] hover:bg-[#FEF3C7] transition-colors w-full md:w-auto"
          >
            <Bell className="w-3 h-3" />
            <span className="ops-mono text-[11px] font-medium">
              goes stale {fmt(req.clock.staleOn)} · {req.clock.days}d
            </span>
          </button>
        )}
      </div>
      <div className="text-[12.5px] text-[var(--ops-body-sec)] pl-0 md:pl-8">
        {req.clock ? `${req.clock.rule}. ` : ''}
        {req.doc && (
          <span className="ops-mono text-[11px] text-[var(--ops-muted)]">
            {req.doc.suggestedName} · pp. {pageSpan(req.doc)} · {confidencePct(req.doc)}% match
          </span>
        )}
      </div>
      {req.severity === 'slate' && req.flagNote && (
        <div className="text-[12px] text-[var(--ops-neutral-text)] pl-0 md:pl-8">{req.flagNote}</div>
      )}
    </div>
  );
}

/** Verdict stood, but the approved-registry copy failed — loud, with retry. */
function MaterializationErrorBar({ req, applicationId }: { req: CaseReq; applicationId: string }) {
  const { retry, isPending } = useMaterializeRetry(applicationId);
  return (
    <div className="bg-[var(--ops-critical-wash)] border-t border-[var(--ops-critical-border)] px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-b">
      <div className="flex items-start gap-2 min-w-0">
        <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-critical-text)] mt-[1px] shrink-0" />
        <span className="text-[12px] text-[var(--ops-critical-text)] leading-snug">
          Not saved to the approved registry — {req.materializationError?.message}
        </span>
      </div>
      <button
        onClick={() => retry(req.block.id)}
        disabled={isPending}
        className="btn-secondary shrink-0 self-start md:self-auto disabled:opacity-50"
        data-testid={`button-retry-materialize-${req.block.id}`}
      >
        {isPending ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}

// ─── small pieces ───────────────────────────────────────────────────────────

function StatusChip({ tone, children }: { tone: 'critical' | 'warning' | 'neutral'; children: React.ReactNode }) {
  const cls =
    tone === 'critical'
      ? 'text-[var(--ops-critical-text)] bg-[var(--ops-critical-wash)] border-[var(--ops-critical-border)]'
      : tone === 'warning'
        ? 'text-[var(--ops-warning-text)] bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)]'
        : 'text-[var(--ops-neutral-text)] bg-[var(--ops-neutral-wash)] border-[var(--ops-neutral-border)]';
  return (
    <div className={`font-semibold text-[9.5px] uppercase tracking-[0.06em] border px-1.5 py-0.5 rounded-[3px] ${cls}`}>
      {children}
    </div>
  );
}

function Dot({ dot }: { dot?: CaseSection['dot'] }) {
  if (!dot) return null;
  const color =
    dot === 'blocker'
      ? 'bg-[var(--ops-critical-solid)]'
      : dot === 'warning'
        ? 'bg-[var(--ops-warning-solid)]'
        : 'bg-[var(--ops-faint)]';
  return <div className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}

function RailNode({ section, active, onClick }: { section: CaseSection; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-start gap-3.5 relative z-10 group text-left" data-testid={`rail-${section.id}`}>
      <div
        className={`w-[15px] h-[15px] rounded-full mt-[1.5px] flex items-center justify-center shrink-0 border bg-[var(--ops-ground)] transition-colors ${
          section.done ? 'border-[var(--ops-ink)] bg-[var(--ops-ink)]' : active ? 'border-[var(--ops-accent)] border-2' : 'border-[var(--ops-strong-border)] group-hover:border-[var(--ops-faint)]'
        }`}
      >
        {section.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        {!section.done && active && <div className="w-1.5 h-1.5 rounded-full bg-[var(--ops-accent)]" />}
      </div>
      <div className={`flex flex-col ${active ? '' : 'opacity-80 group-hover:opacity-100'} transition-opacity`}>
        <div className="flex items-center gap-2">
          <span className={`ops-mono text-[11px] ${active ? 'text-[var(--ops-accent)] font-medium' : 'text-[var(--ops-muted)]'}`}>
            {section.num}
          </span>
          <span className={`text-[13px] ${active ? 'font-semibold text-[var(--ops-ink)]' : 'text-[var(--ops-body-sec)] font-medium'}`}>
            {section.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="ops-mono text-[10.5px] text-[var(--ops-muted)]">
            {section.cleared}/{section.total}
          </span>
          <Dot dot={section.dot} />
        </div>
      </div>
    </button>
  );
}

function CollapsedRailNode({ section, active, onClick }: { section: CaseSection; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${section.name} (${section.cleared}/${section.total})`}
      className={`relative w-[40px] h-[40px] flex flex-col items-center justify-center rounded-[3px] transition-colors ${
        active ? 'bg-[var(--ops-accent-wash)] shadow-[inset_2px_0_0_0_var(--ops-accent)]' : 'hover:bg-[var(--ops-inset)]'
      }`}
    >
      <span className={`ops-mono text-[10.5px] ${active ? 'text-[var(--ops-accent)] font-medium' : 'text-[var(--ops-muted)]'}`}>
        {section.num}
      </span>
      {section.dot && (
        <div
          className={`absolute top-[6px] right-[6px] w-[5px] h-[5px] rounded-[1px] ${
            section.dot === 'blocker'
              ? 'bg-[var(--ops-critical-solid)]'
              : section.dot === 'warning'
                ? 'bg-[var(--ops-warning-solid)]'
                : 'bg-[var(--ops-faint)]'
          }`}
        />
      )}
    </button>
  );
}

function MobileRailNode({ section, active, onClick }: { section: CaseSection; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 shrink-0 px-2.5 py-2 rounded-[4px] border snap-start transition-colors ${
        active ? 'border-[var(--ops-accent)] bg-[var(--ops-accent-wash)]' : 'border-[var(--ops-border)] bg-white'
      }`}
    >
      <span className={`ops-mono text-[11px] ${active ? 'text-[var(--ops-accent)] font-medium' : 'text-[var(--ops-muted)]'}`}>
        {section.num}
      </span>
      <span className={`text-[12px] whitespace-nowrap ${active ? 'font-semibold text-[var(--ops-ink)]' : 'text-[var(--ops-body-sec)] font-medium'}`}>
        {section.name}
      </span>
      <div className="w-[1px] h-3 bg-[var(--ops-strong-border)] mx-0.5" />
      <span className="ops-mono text-[10.5px] text-[var(--ops-muted)]">
        {section.cleared}/{section.total}
      </span>
      <Dot dot={section.dot} />
    </button>
  );
}

function WaitingRow({ req }: { req: CaseReq }) {
  return (
    <div className="flex items-start gap-2">
      <Hourglass className="w-3.5 h-3.5 text-[var(--ops-warning-solid)] mt-[2px] shrink-0" />
      <div className="text-[13px] leading-tight text-[var(--ops-body-sec)]">
        <span className="font-medium text-[var(--ops-ink)]">{req.block.name}</span>
        {req.status === 'requested' && req.verdict ? (
          <span>
            {' '}
            — requested <span className="ops-mono text-[var(--ops-ink)]">{fmt(new Date(req.verdict.decidedAt))}</span> by{' '}
            {req.verdict.decidedBy}
          </span>
        ) : (
          <span> — due from {req.owner.toLowerCase()}</span>
        )}
      </div>
    </div>
  );
}
