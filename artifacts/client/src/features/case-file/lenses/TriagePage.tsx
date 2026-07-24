import { AlertCircle, FileText, Inbox, Sparkles } from 'lucide-react';
import { fmtTime, pageSpan, confidencePct, type CaseModel, type CaseReq } from '../caseData';
import { VerdictButtons } from '../components/VerdictButtons';
import { MissingActions } from '../components/MissingActions';
import { PacketPanel } from '../components/PacketPanel';
import type { Lens } from '../CaseShell';

export function TriagePage({
  model,
  applicationId,
  onLens,
}: {
  model: CaseModel;
  applicationId: string;
  onLens: (lens: Lens, sectionId?: string) => void;
}) {
  if (!model.run) return <NoRunYet model={model} applicationId={applicationId} />;

  const { stats } = model;
  const run = model.run;

  return (
    <div className="overflow-y-auto h-full px-4 py-6 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-[960px] animate-slide-up pb-16">
        {/* a re-dropped packet gates again even while the old report shows */}
        {model.app.packet && model.app.packet.state !== 'report' && (
          <div className="mb-8">
            <PacketPanel model={model} applicationId={applicationId} />
          </div>
        )}

        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-5">
          <StatCell val={String(stats.found)} label="documents found" sub={`from ${run.preflight.pages} pages`} />
          <StatCell val={String(stats.quiet)} label="filed quietly" sub="no action needed" />
          <StatCell
            val={String(stats.attention)}
            label="need you"
            sub="exceptions below"
            alert={stats.attention > 0 ? 'warning' : undefined}
          />
          <StatCell val={String(stats.unassigned)} label="unassigned" sub="review anytime" />
        </div>

        {model.alarmCount > 0 && (
          <div className="flex justify-center mb-8 md:mb-10">
            <button
              onClick={() => onLens('timeline')}
              data-testid="link-clocks-timeline"
              className="micro-label hover:text-[var(--ops-accent)] transition-colors min-h-[40px] px-4"
            >
              {model.alarmCount} {model.alarmCount === 1 ? 'document is' : 'documents are'} on the clock — see
              timeline →
            </button>
          </div>
        )}

        {/* whisper lines from the run — display-only */}
        {run.whisper.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-8">
            {run.whisper.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 py-2 px-3 bg-[var(--ops-accent-wash)] border border-[var(--ops-accent-wash-border)] rounded"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--ops-accent)] shrink-0 mt-0.5" />
                <div className="text-[12px] md:text-[12.5px] text-[#1E40AF] leading-snug">{line}</div>
              </div>
            ))}
          </div>
        )}

        {/* exceptions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline mb-4 border-b border-[var(--ops-border)] pb-3 gap-2 sm:gap-0">
          <h3 className="font-semibold tracking-[-0.01em] text-[17px] md:text-[18px] text-[var(--ops-ink)]">
            Needs Your Attention
          </h3>
          <button
            onClick={() => onLens('workfile')}
            className="micro-label hover:text-[var(--ops-accent)] transition-colors text-left sm:text-right"
          >
            resolve in workfile →
          </button>
        </div>

        <div className="space-y-3 mb-10">
          {model.exceptions.length === 0 ? (
            <div className="bg-[var(--ops-ok-wash)] border border-[var(--ops-ok-border)] rounded p-4 text-[13px] text-[var(--ops-ok-text)]">
              Nothing needs you — every exception has a verdict.
            </div>
          ) : (
            model.exceptions.map((req) => (
              <ExceptionRow key={req.block.id} req={req} applicationId={applicationId} />
            ))
          )}
        </div>

        {/* substitutions — informational */}
        {model.covered.length > 0 && (
          <div className="space-y-2 mb-10">
            {model.covered.map((req) => (
              <div
                key={req.block.id}
                className="bg-[var(--ops-neutral-wash)] border border-[var(--ops-neutral-border)] rounded p-3 flex items-start gap-2.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-neutral-text)] shrink-0 mt-0.5" />
                <div className="text-[12.5px] text-[var(--ops-neutral-text)]">
                  <span className="font-medium text-[var(--ops-ink)]">{req.block.name}</span> — {req.flagNote}{' '}
                  <span className="micro-label text-[9px] ml-1">no action needed</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* unassigned */}
        <div className="flex justify-between items-baseline mb-4 border-b border-[var(--ops-border)] pb-3">
          <h3 className="font-semibold tracking-[-0.01em] text-[17px] md:text-[18px] text-[var(--ops-ink)]">
            Unassigned
          </h3>
          <span className="micro-label">never blocks the application</span>
        </div>
        <div className="space-y-3 mb-12">
          {run.unassigned.length === 0 ? (
            <div className="text-[12.5px] text-[var(--ops-muted)]">
              Every page found a home — nothing left over.
            </div>
          ) : (
            run.unassigned.map((u, i) => (
              <div
                key={i}
                className="bg-white border border-[var(--ops-border)] rounded p-3 md:p-4 flex flex-col md:flex-row items-start justify-between gap-3 hover:bg-[var(--ops-inset)] transition-colors"
              >
                <div className="flex flex-col md:flex-row items-start gap-2 md:gap-5 w-full">
                  <div className="w-full md:min-w-[140px] md:w-auto shrink-0">
                    <div className="ops-mono text-[11px] text-[var(--ops-muted)]">
                      pp. {u.pages[0]}–{u.pages[1]}
                    </div>
                  </div>
                  <div className="text-[12.5px] text-[var(--ops-body-sec)] leading-relaxed border-l-2 md:border-l border-[var(--ops-inner-rule)] md:border-[var(--ops-border)] pl-3 md:pl-4">
                    {u.description}
                  </div>
                </div>
                <span className="micro-label text-[9px] shrink-0 mt-1">file manually · review room soon</span>
              </div>
            ))
          )}
        </div>

        {/* audit trail */}
        <div className="mb-8">
          <h3 className="font-semibold tracking-[-0.01em] text-[14px] md:text-[15px] text-[var(--ops-ink)] mb-4">
            Audit Trail
          </h3>
          <div className="pl-4 border-l-2 border-[var(--ops-inner-rule)] space-y-4 ml-1">
            {model.audit.map((a, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 relative">
                <div className="absolute -left-[21px] w-2.5 h-2.5 rounded bg-white border-2 border-[var(--ops-strong-border)] mt-[3px]" />
                <div className="ops-mono text-[11px] text-[var(--ops-muted)] md:w-28 shrink-0 pt-0.5 tracking-wide">
                  {fmtTime(a.when)}
                </div>
                <div className="text-[12px] md:text-[13px] text-[var(--ops-body-sec)] pt-px leading-relaxed">
                  {a.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--ops-border)] text-center micro-label text-[var(--ops-faint)]">
          Your assignments win — Sheaf respects manual placement.
        </div>
      </div>
    </div>
  );
}

function NoRunYet({ model, applicationId }: { model: CaseModel; applicationId: string }) {
  const filed = model.reqs.filter((r) => r.uploads.length > 0).length;
  return (
    <div className="overflow-y-auto h-full px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-[720px] animate-fade-in flex flex-col gap-6 pb-16">
        <PacketPanel model={model} applicationId={applicationId} />

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

        <div className="text-center micro-label text-[var(--ops-faint)]">
          Quiet automation — you'll only be asked about exceptions.
        </div>
      </div>
    </div>
  );
}

function StatCell({
  val,
  label,
  sub,
  alert,
}: {
  val: string;
  label: string;
  sub: string;
  alert?: 'warning' | 'critical';
}) {
  const bg =
    alert === 'warning'
      ? 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)]'
      : alert === 'critical'
        ? 'bg-[var(--ops-critical-wash)] border-[var(--ops-critical-border)]'
        : 'bg-white border-[var(--ops-border)]';
  const textVal =
    alert === 'warning'
      ? 'text-[var(--ops-warning-text)]'
      : alert === 'critical'
        ? 'text-[var(--ops-critical-text)]'
        : 'text-[var(--ops-ink)]';

  return (
    <div className={`border rounded p-3 md:p-4 flex flex-col items-center text-center ${bg}`}>
      <div className={`ops-mono text-[24px] md:text-[28px] leading-none mb-1 md:mb-2 font-medium ${textVal}`}>
        {val}
      </div>
      <div className="micro-label mb-1 text-[9.5px] md:text-[10.5px]">{label}</div>
      <div className="text-[11px] md:text-[12px] text-[var(--ops-muted)]">{sub}</div>
    </div>
  );
}

function ExceptionRow({ req, applicationId }: { req: CaseReq; applicationId: string }) {
  const sevWash =
    req.severity === 'clay'
      ? 'bg-[var(--ops-critical-wash)] border-[var(--ops-critical-border)]'
      : 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)]';
  const sevText = req.severity === 'clay' ? 'text-[var(--ops-critical-text)]' : 'text-[var(--ops-warning-text)]';

  return (
    <div className="bg-white border border-[var(--ops-border)] rounded hover:bg-[var(--ops-inset)] transition-colors p-3 md:p-4">
      <div className="flex flex-col justify-between items-start mb-3 gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5">
            <h4 className="text-[14px] md:text-[15px] font-medium text-[var(--ops-ink)]">{req.block.name}</h4>
            <div className="px-1.5 py-0.5 rounded-[3px] bg-[var(--ops-inset)] border border-[var(--ops-border)] micro-label text-[9.5px]">
              {req.sectionNum} · {req.sectionName}
            </div>
          </div>
          {req.doc && (
            <div className="inline-flex items-center gap-1.5 ops-mono text-[11px] text-[var(--ops-muted)] break-all">
              <FileText className="w-3 h-3 shrink-0" />
              <span>
                {req.doc.suggestedName} · pp. {pageSpan(req.doc)} · {confidencePct(req.doc)}% match
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-4">
        <div className={`flex items-start gap-2 w-full md:max-w-[520px] rounded p-2.5 border ${sevWash}`}>
          <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${sevText}`} />
          <div>
            <div className={`text-[12px] font-semibold mb-0.5 ${sevText}`}>{req.flagTitle}</div>
            <div className={`text-[12px] md:text-[13px] leading-relaxed ${sevText}`}>{req.flagNote}</div>
          </div>
        </div>
        <div className="shrink-0">
          {req.status === 'flagged' ? (
            <VerdictButtons req={req} applicationId={applicationId} />
          ) : (
            <MissingActions applicationId={applicationId} />
          )}
        </div>
      </div>
    </div>
  );
}
