import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, CheckCircle2, Inbox } from 'lucide-react';
import { FilesPanel, Dropzone } from '../components/FilesPanel';
import { MissingActions } from '../components/MissingActions';
import type { CaseModel } from '../caseData';
import type { Lens } from '../CaseShell';

/**
 * Intake — where documents enter the case. Hosts the full packet lifecycle
 * (drop → pre-flight gate with run plan → processing). Once a run lands the
 * report lives in Triage; this lens shows a completed card and keeps accepting
 * replacement packets. The filmstrip review room takes over the post-run
 * handoff in phase 2.
 */
export function IntakePage({
  model,
  applicationId,
  onLens,
}: {
  model: CaseModel;
  applicationId: string;
  onLens: (lens: Lens, sectionId?: string) => void;
}) {
  const run = model.app.run;
  const hasFiles = (model.app.files ?? []).some((f) => f.status === 'active');
  const inDropState = !run && !hasFiles;
  const landed = run?.state === 'report';

  // auto-pivot: the moment a run lands while the user is watching processing,
  // hand off straight into the filmstrip review room
  const [, setLocation] = useLocation();
  const prevRunState = useRef(run?.state);
  useEffect(() => {
    if (prevRunState.current === 'processing' && run?.state === 'report' && model.run) {
      setLocation(`/applications/${applicationId}/review`);
    }
    prevRunState.current = run?.state;
  }, [run?.state, model.run, applicationId, setLocation]);

  return (
    <div className="overflow-y-auto h-full px-4 py-6 md:py-10 flex flex-col items-center">
      <div className="w-full max-w-[720px] animate-fade-in flex flex-col gap-6 pb-16">
        {landed && model.run ? (
          <RunLandedCard model={model} applicationId={applicationId} onLens={onLens} />
        ) : (
          <FilesPanel model={model} applicationId={applicationId} />
        )}

        {inDropState && <ConnectorsRow />}

        {landed && (
          <div>
            <div className="micro-label text-[9.5px] mb-2">add more files</div>
            <Dropzone applicationId={applicationId} />
          </div>
        )}

        <FileOneByOne model={model} applicationId={applicationId} />

        <div className="text-center micro-label text-[var(--ops-faint)]">
          Quiet automation — you'll only be asked about exceptions.
        </div>
      </div>
    </div>
  );
}

/** The run landed — hand off to the filmstrip review room (or the report). */
function RunLandedCard({
  model,
  applicationId,
  onLens,
}: {
  model: CaseModel;
  applicationId: string;
  onLens: (lens: Lens) => void;
}) {
  const run = model.run!;
  const { stats } = model;
  const [, setLocation] = useLocation();

  return (
    <div
      className="bg-white border border-[var(--ops-border)] rounded-[6px] p-5 md:p-6"
      data-testid="card-run-landed"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded bg-[var(--ops-ok-wash)] border border-[var(--ops-ok-border)] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[var(--ops-ok-text)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-[15px] text-[var(--ops-ink)] mb-1">Analysis complete</h2>
          <p className="text-[12.5px] text-[var(--ops-body-sec)] leading-relaxed">
            {stats.found} documents found across {run.preflight.pages} pages ·{' '}
            {stats.attention > 0 ? (
              <span className="text-[var(--ops-warning-text)] font-medium">
                {stats.attention} need{stats.attention === 1 ? 's' : ''} you
              </span>
            ) : (
              'nothing needs you'
            )}
            {stats.unassigned > 0 ? ` · ${stats.unassigned} unassigned` : ''}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button onClick={() => onLens('triage')} data-testid="button-open-report" className="btn-secondary">
          Open the report
        </button>
        <button
          onClick={() => setLocation(`/applications/${applicationId}/review`)}
          data-testid="button-review-pages"
          className="btn-primary flex items-center justify-center gap-1.5"
        >
          Review pages <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Grayed-out cloud sources — not wired yet, deliberately unlabeled. */
function ConnectorsRow() {
  return (
    <div
      aria-disabled="true"
      data-testid="row-connectors"
      className="flex items-center justify-center gap-2 text-[11.5px] text-[var(--ops-faint)] select-none -mt-2"
    >
      <span>or add from</span>
      <span className="cursor-not-allowed">Google Drive</span>
      <span>·</span>
      <span className="cursor-not-allowed">Dropbox</span>
      <span>·</span>
      <span className="cursor-not-allowed">Box</span>
    </div>
  );
}

function FileOneByOne({ model, applicationId }: { model: CaseModel; applicationId: string }) {
  const filed = model.reqs.filter((r) => r.uploads.length > 0).length;
  return (
    <div className="bg-white border border-[var(--ops-border)] rounded-[6px] p-5 md:p-6 flex flex-col items-center text-center">
      <div className="w-9 h-9 rounded bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] flex items-center justify-center mb-3">
        <Inbox className="w-4 h-4 text-[var(--ops-muted)]" />
      </div>
      <h2 className="font-semibold text-[15px] text-[var(--ops-ink)] mb-1.5">
        Or file documents one by one
      </h2>
      <p className="text-[12.5px] text-[var(--ops-muted)] max-w-[440px] leading-relaxed mb-1">
        The intake form works without a packet — anything filed there waits for the analyzer to
        confirm placement.
      </p>
      <p className="ops-mono text-[11.5px] text-[var(--ops-body-sec)] mb-5">
        {filed} of {model.reqs.length} requirements filed via intake so far
      </p>
      <MissingActions applicationId={applicationId} />
    </div>
  );
}
