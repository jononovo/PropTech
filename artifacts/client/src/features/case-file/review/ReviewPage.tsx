import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderInput,
  Inbox,
} from 'lucide-react';
import { confidencePct, pageSpan, type CaseModel } from '../caseData';
import { useCaseFile, usePlacementActions } from '../useCaseFile';
import { VerdictButtons } from '../components/VerdictButtons';
import {
  buildReviewModel,
  pageImageUrl,
  type PageCell,
  type ReviewModel,
  type ReviewStop,
} from './reviewModel';
import '../case-file.css';

/**
 * Filmstrip review room — full-screen, keyboard-first pass over the packet.
 * Priority mode walks the stops (flagged documents + unassigned ranges);
 * all-pages mode walks every page. Real page renders from the analyzer's
 * run store; verdicts and filings hit the same APIs as the report.
 */
export function ReviewPage({ id }: { id: string }) {
  const { model, isLoading, error } = useCaseFile(id);
  const review = useMemo(() => (model ? buildReviewModel(model) : null), [model]);

  if (isLoading) {
    return (
      <Room>
        <CenterCard title="Loading the review room…" />
      </Room>
    );
  }
  if (error || !model) {
    return (
      <Room>
        <CenterCard
          title="Could not load this application"
          body={error instanceof Error ? error.message : 'Request failed — try again.'}
          backTo={`/applications/${id}/intake`}
        />
      </Room>
    );
  }
  if (!review || !model.run) {
    return (
      <Room>
        <CenterCard
          title="No analyzer run yet"
          body="The review room opens when a run lands. Drop a packet in Intake to start one."
          backTo={`/applications/${id}/intake`}
        />
      </Room>
    );
  }
  return <ReviewRoom id={id} model={model} review={review} />;
}

function Room({ children }: { children: React.ReactNode }) {
  return (
    <div className="case-root fixed inset-0 z-50 flex flex-col overflow-hidden" data-testid="page-review-room">
      {children}
    </div>
  );
}

function CenterCard({ title, body, backTo }: { title: string; body?: string; backTo?: string }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white border border-[var(--ops-border)] rounded-[6px] p-6 max-w-[420px] text-center">
        <div className="font-semibold text-[15px] text-[var(--ops-ink)] mb-1.5">{title}</div>
        {body && <p className="text-[12.5px] text-[var(--ops-body-sec)] leading-relaxed mb-4">{body}</p>}
        {backTo && (
          <button onClick={() => setLocation(backTo)} data-testid="button-back-intake" className="btn-primary">
            Back to Intake
          </button>
        )}
      </div>
    </div>
  );
}

// ─── the room ────────────────────────────────────────────────────────────────

function ReviewRoom({ id, model, review }: { id: string; model: CaseModel; review: ReviewModel }) {
  const [, setLocation] = useLocation();
  const run = model.run!;
  const [mode, setMode] = useState<'priority' | 'all'>(review.stops.length > 0 ? 'priority' : 'all');
  const [idx, setIdx] = useState(0);
  const [ack, setAck] = useState<Set<number>>(new Set());
  const [armTick, setArmTick] = useState(0);

  const list: Array<ReviewStop | PageCell> = mode === 'priority' ? review.stops : review.cells;
  const pos = Math.min(idx, Math.max(0, list.length - 1));

  const cell = mode === 'all' ? review.cells[pos] : undefined;
  const activeStop: ReviewStop | undefined =
    mode === 'priority'
      ? review.stops[pos]
      : cell?.stopId
        ? review.stops.find((s) => s.id === cell.stopId)
        : undefined;
  const activePage = mode === 'priority' ? (activeStop?.page ?? 1) : (cell?.page ?? 1);

  const next = () => setIdx((i) => Math.min(list.length - 1, i + 1));
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const switchMode = (m: 'priority' | 'all') => {
    setMode(m);
    setIdx(0);
  };

  // verdict/filing landed for the active stop → advance after a beat
  const prevStopState = useRef<{ id: string; resolved: boolean } | null>(null);
  useEffect(() => {
    if (!activeStop) {
      prevStopState.current = null;
      return;
    }
    const before = prevStopState.current;
    prevStopState.current = { id: activeStop.id, resolved: activeStop.resolved };
    if (before && before.id === activeStop.id && !before.resolved && activeStop.resolved) {
      const t = setTimeout(next, 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [activeStop?.id, activeStop?.resolved]);

  // keyboard: ← → navigate · ↵ arm accept · esc leave (never while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') setLocation(`/applications/${id}/intake`);
      else if (e.key === 'Enter' && activeStop?.kind === 'document' && !activeStop.resolved) {
        e.preventDefault();
        setArmTick((n) => n + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStop?.id, activeStop?.kind, activeStop?.resolved, list.length, id, setLocation]);

  const emptyQueue = mode === 'priority' && review.stops.length === 0;

  return (
    <Room>
      {/* header */}
      <header className="h-12 bg-white border-b border-[var(--ops-border)] flex items-center px-3 md:px-4 gap-3 shrink-0">
        <button
          onClick={() => setLocation(`/applications/${id}/intake`)}
          data-testid="button-back-intake"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] transition-colors min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Intake</span>
        </button>
        <div className="h-4 w-px bg-[var(--ops-border)]" />
        <div className="font-semibold text-[14px] tracking-tight">Page Review</div>
        <div className="ops-mono text-[11px] text-[var(--ops-muted)] truncate hidden sm:block">
          {model.app.id} <span className="text-[var(--ops-faint)] px-1">/</span> {model.app.applicantName}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="ops-mono text-[11px] text-[var(--ops-muted)] hidden md:block" data-testid="text-open-count">
            {review.openCount} open · {review.totalPages} pages
          </span>
          <button
            onClick={() => setLocation(`/applications/${id}/triage`)}
            data-testid="button-open-report-review"
            className="btn-quiet"
          >
            Open the report →
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* left column: meta strip / page / filmstrip */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="bg-white border-b border-[var(--ops-border)] px-3 md:px-5 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[var(--ops-ink)] leading-tight truncate" data-testid="text-classified-as">
                  {emptyQueue ? 'All clear' : (activeStop?.title ?? cell?.title ?? '')}
                </div>
                <div className="ops-mono text-[10.5px] text-[var(--ops-muted)] whitespace-nowrap">
                  {activeStop?.doc
                    ? `CONF ${confidencePct(activeStop.doc)}% · pp. ${pageSpan(activeStop.doc)}`
                    : activeStop?.kind === 'unassigned'
                      ? `no suggestion · pp. ${activeStop.pages[0]}–${activeStop.pages[1]}`
                      : emptyQueue
                        ? 'no stops in the queue'
                        : `p. ${activePage}`}
                </div>
              </div>
              {activeStop?.doc && (
                <>
                  <div className="h-7 w-px bg-[var(--ops-border)] hidden sm:block" />
                  <div className="hidden sm:flex gap-1.5">
                    <ScoreChip label="Q" value={activeStop.doc.scores.quality} />
                    <ScoreChip label="FMT" value={activeStop.doc.scores.formatting} />
                    <ScoreChip label="FRD" value={activeStop.doc.scores.fraud_signal} invert />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              <span className="ops-mono text-[10.5px] text-[var(--ops-muted)] whitespace-nowrap" data-testid="text-stop-counter">
                {mode === 'priority'
                  ? emptyQueue
                    ? 'STOP 0 OF 0'
                    : `STOP ${pos + 1} OF ${review.stops.length} · P.${activePage}`
                  : `PAGE ${activePage} OF ${review.totalPages}`}
              </span>
              <div className="flex bg-[var(--ops-inset)] p-0.5 rounded-[4px] border border-[var(--ops-border)]">
                <ModeButton active={mode === 'priority'} onClick={() => switchMode('priority')} testid="toggle-priority">
                  Priority
                </ModeButton>
                <ModeButton active={mode === 'all'} onClick={() => switchMode('all')} testid="toggle-all">
                  All pages
                </ModeButton>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[32vh] md:min-h-0 relative overflow-hidden">
            {emptyQueue ? (
              <AllClear onAll={() => switchMode('all')} onReport={() => setLocation(`/applications/${id}/triage`)} />
            ) : (
              <PageImage appId={id} runId={run.runId} page={activePage} />
            )}
          </div>

          <FilmStrip
            appId={id}
            runId={run.runId}
            mode={mode}
            review={review}
            pos={pos}
            ack={ack}
            onJump={setIdx}
          />
        </div>

        {/* right rail / mobile bottom sheet */}
        <aside className="w-full md:w-[320px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-[var(--ops-border)] flex flex-col min-h-0 max-h-[46vh] md:max-h-none">
          <div className="flex-1 overflow-y-auto">
            {emptyQueue ? (
              <div className="p-5 text-center text-[12.5px] text-[var(--ops-muted)] leading-relaxed">
                Nothing needs you — every page filed quietly.
              </div>
            ) : (
              <Rail
                appId={id}
                model={model}
                stop={activeStop}
                cell={cell}
                armTick={armTick}
                acked={cell ? ack.has(cell.page) : false}
                onAck={() => {
                  if (!cell) return;
                  setAck((s) => new Set(s).add(cell.page));
                  setTimeout(next, 250);
                }}
                onNext={next}
              />
            )}
          </div>
          <div className="border-t border-[var(--ops-border)] bg-[var(--ops-inset)] p-3 md:p-4 flex flex-col gap-2.5 shrink-0">
            <div className="flex justify-between items-center">
              <button
                onClick={prev}
                disabled={pos === 0}
                data-testid="button-prev"
                className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] disabled:opacity-30 min-h-[40px] px-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={next}
                disabled={pos >= list.length - 1}
                data-testid="button-skip"
                className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] disabled:opacity-30 min-h-[40px] px-1"
              >
                Skip <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:flex items-center justify-between micro-label text-[9px] pt-2 border-t border-[var(--ops-border)]">
              <span>↵ accept</span>
              <span>← → navigate</span>
              <span>esc close</span>
            </div>
          </div>
        </aside>
      </div>
    </Room>
  );
}

// ─── pieces ──────────────────────────────────────────────────────────────────

function ModeButton({
  active,
  onClick,
  testid,
  children,
}: {
  active: boolean;
  onClick: () => void;
  testid: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`px-2.5 md:px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-[2px] transition-colors ${
        active
          ? 'bg-white shadow-sm text-[var(--ops-ink)] border border-[var(--ops-border)]'
          : 'text-[var(--ops-muted)] hover:text-[var(--ops-ink)] border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function ScoreChip({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const pct = Math.round(value * 100);
  const color = invert
    ? pct >= 30
      ? 'text-[var(--ops-critical-text)]'
      : pct >= 15
        ? 'text-[var(--ops-warning-text)]'
        : 'text-[var(--ops-ink)]'
    : pct < 60
      ? 'text-[var(--ops-critical-text)]'
      : pct < 90
        ? 'text-[var(--ops-warning-text)]'
        : 'text-[var(--ops-ink)]';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[var(--ops-inset)] border border-[var(--ops-border)]">
      <span className="micro-label text-[9px]">{label}</span>
      <span className={`ops-mono text-[11.5px] font-medium ${color}`}>{pct}</span>
    </div>
  );
}

function AllClear({ onAll, onReport }: { onAll: () => void; onReport: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-[380px]">
        <div className="w-10 h-10 mx-auto rounded bg-[var(--ops-ok-wash)] border border-[var(--ops-ok-border)] flex items-center justify-center mb-3">
          <Check className="w-5 h-5 text-[var(--ops-ok-text)]" />
        </div>
        <div className="font-semibold text-[15px] text-[var(--ops-ink)] mb-1">Nothing needs review</div>
        <p className="text-[12.5px] text-[var(--ops-body-sec)] leading-relaxed mb-4">
          Every document filed quietly and every page found a home.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={onAll} className="btn-secondary" data-testid="button-browse-all">
            Browse all pages
          </button>
          <button onClick={onReport} className="btn-primary" data-testid="button-open-report-clear">
            Open the report
          </button>
        </div>
      </div>
    </div>
  );
}

function PageImage({ appId, runId, page }: { appId: string; runId: string; page: number }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  useEffect(() => setState('loading'), [page, runId]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="ops-mono text-[11px] text-[var(--ops-faint)] animate-pulse">rendering p.{page}…</div>
        </div>
      )}
      {state === 'error' ? (
        <div className="bg-white border border-[var(--ops-border)] rounded p-4 text-center max-w-[320px]">
          <div className="text-[12.5px] text-[var(--ops-body-sec)]">
            Page render unavailable — the analyzer store did not return p.{page}.
          </div>
        </div>
      ) : (
        <img
          key={`${runId}-${page}`}
          src={pageImageUrl(appId, runId, page)}
          alt={`Page ${page}`}
          data-testid="img-review-page"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          className={`max-h-full max-w-full object-contain bg-white rounded-[2px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-opacity ${
            state === 'ok' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

const stripBar = (band: 'hold' | 'attend' | 'clean') =>
  band === 'hold'
    ? 'bg-[var(--ops-critical-solid)]'
    : band === 'attend'
      ? 'bg-[var(--ops-warning-solid)]'
      : 'bg-transparent';

function FilmStrip({
  appId,
  runId,
  mode,
  review,
  pos,
  ack,
  onJump,
}: {
  appId: string;
  runId: string;
  mode: 'priority' | 'all';
  review: ReviewModel;
  pos: number;
  ack: Set<number>;
  onJump: (i: number) => void;
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [pos, mode]);

  const items =
    mode === 'priority'
      ? review.stops.map((s) => ({
          key: s.id,
          page: s.page,
          band: s.band as 'hold' | 'attend' | 'clean',
          resolved: s.resolved,
          label: s.pages[0] === s.pages[1] ? `${s.pages[0]}` : `${s.pages[0]}–${s.pages[1]}`,
        }))
      : review.cells.map((c) => ({
          key: `p-${c.page}`,
          page: c.page,
          band: c.band,
          resolved: c.resolved || ack.has(c.page),
          label: `${c.page}`,
        }));

  return (
    <div className="h-[92px] md:h-[112px] bg-[var(--ops-inset)] border-t border-[var(--ops-border)] flex items-center gap-2 px-3 overflow-x-auto shrink-0">
      {items.map((it, i) => {
        const active = i === pos;
        return (
          <button
            key={it.key}
            ref={active ? activeRef : undefined}
            onClick={() => onJump(i)}
            data-testid={`strip-thumb-${it.page}`}
            className={`relative w-[52px] h-[68px] md:w-[62px] md:h-[82px] shrink-0 bg-white border overflow-hidden transition-all ${
              active
                ? 'border-[var(--ops-accent)] ring-1 ring-[var(--ops-accent)]'
                : 'border-[var(--ops-border)] hover:border-[var(--ops-strong-border)]'
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-[3px] z-10 ${stripBar(it.band)}`} />
            <img
              src={pageImageUrl(appId, runId, it.page, 'strip')}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <span
              className={`absolute bottom-0.5 left-0.5 px-1 rounded-[2px] ops-mono text-[9px] leading-[14px] ${
                active ? 'bg-[var(--ops-accent)] text-white' : 'bg-white/90 text-[var(--ops-muted)] border border-[var(--ops-border)]'
              }`}
            >
              {it.label}
            </span>
            {it.resolved && (
              <span className="absolute bottom-0.5 right-0.5 bg-[var(--ops-ok-text)] rounded-full p-[2px]">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── right rail content ──────────────────────────────────────────────────────

const sevDot: Record<string, string> = {
  clay: 'bg-[var(--ops-critical-wash)] border-[var(--ops-critical-solid)]',
  amber: 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-solid)]',
  slate: 'bg-[var(--ops-neutral-wash)] border-[var(--ops-strong-border)]',
};

function Rail({
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
