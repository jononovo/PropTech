import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { confidencePct, pageSpan, type CaseModel } from '../caseData';
import { useCaseFile } from '../useCaseFile';
import { buildReviewModel, globalPageImageUrl, type PageCell, type ReviewModel, type ReviewStop } from './reviewModel';
import { CenterCard, ModeButton, Room, ScoreChip } from './components/chrome';
import { AllClear, PageImage } from './components/PageViewer';
import { FilmStrip } from './components/FilmStrip';
import { Rail } from './components/Rail';
import { buildDocGroups, firstOpenGroup, type DocGroup } from './approval/docGroups';
import { useDocApproval } from './approval/useDocApproval';
import { DocGroupsStrip } from './approval/DocGroupsStrip';
import { DocApprovalRail } from './approval/DocApprovalRail';
import '../case-file.css';

/**
 * Filmstrip review room — full-screen, keyboard-first pass over the packet.
 * Two layers on one page:
 *   - DOCUMENT mode (landing): the approval flow — groups the analyzer split,
 *     page pre-steps on the strip, filing confirmation in the rail.
 *   - PAGE mode: the original stop/page walk (priority / all pages).
 * This file is the thin composition only — the pieces live in ./components
 * and ./approval.
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

/** One page in the document-mode spread — honest placeholder when no render exists. */
function SpreadPage({ src, page }: { src: string; page: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="shrink-0 h-full flex flex-col items-center gap-1.5">
      {broken ? (
        <div className="h-[calc(100%-24px)] aspect-[8.5/11] bg-white border border-dashed border-[var(--ops-strong-border)] rounded-[2px] flex flex-col items-center justify-center gap-2">
          <ImageOff className="w-5 h-5 text-[var(--ops-faint)]" />
          <span className="ops-mono text-[10px] text-[var(--ops-faint)] uppercase tracking-wider">no scan on file</span>
        </div>
      ) : (
        <img
          src={src}
          alt={`Page ${page}`}
          data-testid={`img-spread-page-${page}`}
          onError={() => setBroken(true)}
          className="h-[calc(100%-24px)] w-auto object-contain bg-white rounded-[2px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        />
      )}
      <span className="ops-mono text-[10px] text-[var(--ops-muted)]">p. {page}</span>
    </div>
  );
}

// ─── the room ────────────────────────────────────────────────────────────────

/** Citation deep-link (?file=&page=&quote=) parsed once at mount. */
function readCitationParams(): { fileId: string; page: number; quote: string } | null {
  const p = new URLSearchParams(window.location.search);
  const fileId = p.get('file');
  const page = Number(p.get('page'));
  const quote = p.get('quote');
  if (!fileId || !quote || !Number.isInteger(page) || page < 1) return null;
  return { fileId, page, quote };
}

function ReviewRoom({ id, model, review }: { id: string; model: CaseModel; review: ReviewModel }) {
  const [, setLocation] = useLocation();
  const run = model.run!;
  const [citation] = useState(readCitationParams);
  const citedGlobal = citation ? review.index.globalRange({ fileId: citation.fileId, pages: [citation.page, citation.page] })?.[0] : undefined;
  const [mode, setMode] = useState<'priority' | 'all'>(citedGlobal ? 'all' : review.stops.length > 0 ? 'priority' : 'all');
  const [idx, setIdx] = useState(citedGlobal ? citedGlobal - 1 : 0);
  // quote → bbox via the citation resolver; null = nothing to draw
  const [highlightBoxes, setHighlightBoxes] = useState<{ x: number; y: number; w: number; h: number }[] | null>(null);
  useEffect(() => {
    if (!citation || !citedGlobal) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const qs = new URLSearchParams({ fileId: citation.fileId, page: String(citation.page), quote: citation.quote });
    fetch(`${base}/api/applications/${id}/citations/resolve?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.matched && d.boxes?.length) setHighlightBoxes(d.boxes);
      })
      .catch(() => {}); // highlight is best-effort — the page itself already opened
  }, []);
  const [ack, setAck] = useState<Set<number>>(new Set());
  const [armTick, setArmTick] = useState(0);

  // global page numbers are the room's view currency; the index resolves them
  // back to (fileId, in-file page) for image URLs and submissions
  const imageUrl = (p: number, size?: 'full' | 'strip') =>
    globalPageImageUrl(id, run.runId, review.index, p, size);

  // ── document-approval layer ────────────────────────────────────────────────
  const approval = useDocApproval(id, review.index);
  const mergeRes = model.app.mergeResolutions ?? {};
  const groups = useMemo(() => buildDocGroups(model, mergeRes, review.index), [model, mergeRes, review.index]);
  // landing rule: DOCUMENT mode on the first unsettled document — unless a
  // citation deep-link points at a specific page
  const [docGroupId, setDocGroupId] = useState<string | null>(() => (citedGlobal ? null : (firstOpenGroup(groups)?.id ?? null)));
  const docGroup = docGroupId ? groups.find((g) => g.id === docGroupId) : undefined;

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
  const jumpToPage = (page: number) => {
    setDocGroupId(null);
    setMode('all');
    setIdx(Math.max(0, Math.min(review.cells.length - 1, page - 1)));
  };
  const nextOpenGroup = (after?: DocGroup) => {
    const open = groups.filter((g) => !g.settled && g.id !== after?.id);
    setDocGroupId(open[0]?.id ?? null);
  };

  /** merge recommendation state for a group (pending gates approval) */
  const mergeFor = (g: DocGroup) => {
    const partner = g.mergeWith ? groups.find((x) => x.id === g.mergeWith) : undefined;
    if (!partner) return undefined;
    const state: 'merged' | 'dismissed' | 'pending' =
      (g.mergeKey ? mergeRes[g.mergeKey]?.decision : undefined) ?? 'pending';
    return { state, partnerPages: partner.pages, onJump: () => setDocGroupId(partner.id) };
  };

  /** approve straight from the strip bubble — analyzer filing, no variant needed */
  const quickApprove = (g: DocGroup) => {
    if (!g.blockId || g.needsVariant || approval.isPending) return;
    if (mergeFor(g)?.state === 'pending') return;
    approval.submit(g, { blockId: g.blockId, outcome: 'approved', runId: run.runId }, () =>
      nextOpenGroup(g),
    );
  };

  // page pre-step: when the LAST page of a group gets a decision, the rail
  // auto-switches to document mode — the roll-up IS the rail, no popups.
  const onDecide = (groupId: string, page: number, value: 'good' | 'bad' | 'flag_accepted') => {
    approval.decide(groupId, page, value);
    const g = groups.find((x) => x.id === groupId);
    if (!g) return;
    const d = { ...(approval.decisions[groupId] ?? {}), [page]: value };
    if (g.pageList.every((p) => d[p] != null)) setDocGroupId(groupId);
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

  // keyboard: ← → navigate · ↵ arm accept (page verdict or whole-document approve) · esc leave
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') {
        if (!docGroup) next();
      } else if (e.key === 'ArrowLeft') {
        if (!docGroup) prev();
      } else if (e.key === 'Escape') setLocation(`/applications/${id}/intake`);
      else if (e.key === 'Enter') {
        if (docGroup && !docGroup.settled) {
          e.preventDefault();
          setArmTick((n) => n + 1);
        } else if (!docGroup && activeStop?.kind === 'document' && !activeStop.resolved) {
          e.preventDefault();
          setArmTick((n) => n + 1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [docGroup?.id, docGroup?.settled, activeStop?.id, activeStop?.kind, activeStop?.resolved, list.length, id, setLocation]);

  const emptyQueue = mode === 'priority' && review.stops.length === 0;
  const openGroups = groups.filter((g) => !g.settled);

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
            {groups.length > 0 ? `${openGroups.length} open · ${review.totalPages} pages` : `${review.openCount} open · ${review.totalPages} pages`}
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
                  {docGroup ? docGroup.title : emptyQueue ? 'All clear' : (activeStop?.title ?? cell?.title ?? '')}
                </div>
                <div className="ops-mono text-[10.5px] text-[var(--ops-muted)] whitespace-nowrap">
                  {docGroup
                    ? `${docGroup.doc ? `CONF ${Math.round(docGroup.doc.confidence * 100)}% · ` : ''}pp. ${docGroup.pages[0]}–${docGroup.pages[1]}`
                    : activeStop?.doc
                      ? `CONF ${confidencePct(activeStop.doc)}% · pp. ${pageSpan(activeStop.doc)}`
                      : activeStop?.kind === 'unassigned'
                        ? `no suggestion · pp. ${activeStop.pages[0]}–${activeStop.pages[1]}`
                        : emptyQueue
                          ? 'no stops in the queue'
                          : `p. ${activePage}`}
                </div>
              </div>
              {!docGroup && activeStop?.doc && (
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
                {docGroup
                  ? `GROUP ${Math.max(1, groups.indexOf(docGroup) + 1)} OF ${groups.length}`
                  : mode === 'priority'
                    ? emptyQueue
                      ? 'STOP 0 OF 0'
                      : `STOP ${pos + 1} OF ${review.stops.length} · P.${activePage}`
                    : `PAGE ${activePage} OF ${review.totalPages}`}
              </span>
              {groups.length > 0 && (
                <div className="flex bg-[var(--ops-inset)] p-0.5 rounded-[4px] border border-[var(--ops-border)]">
                  <ModeButton active={!docGroup} onClick={() => setDocGroupId(null)} testid="toggle-page-mode">
                    Page
                  </ModeButton>
                  <ModeButton
                    active={!!docGroup}
                    onClick={() => {
                      const g =
                        groups.find((x) => activePage >= x.pages[0] && activePage <= x.pages[1]) ??
                        firstOpenGroup(groups) ??
                        groups[0];
                      setDocGroupId(g?.id ?? null);
                    }}
                    testid="toggle-document-mode"
                  >
                    Document
                  </ModeButton>
                </div>
              )}
              {!docGroup && (
                <div className="flex bg-[var(--ops-inset)] p-0.5 rounded-[4px] border border-[var(--ops-border)]">
                  <ModeButton active={mode === 'priority'} onClick={() => switchMode('priority')} testid="toggle-priority">
                    Priority
                  </ModeButton>
                  <ModeButton active={mode === 'all'} onClick={() => switchMode('all')} testid="toggle-all">
                    All pages
                  </ModeButton>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-[32vh] md:min-h-0 relative overflow-hidden">
            {docGroup ? (
              <div className="absolute inset-0 overflow-auto p-4 md:p-6 flex items-start gap-6 bg-[var(--ops-inset)]">
                {docGroup.pageList.map((p) => (
                  <SpreadPage key={p} src={imageUrl(p)} page={p} />
                ))}
              </div>
            ) : emptyQueue ? (
              <AllClear onAll={() => switchMode('all')} onReport={() => setLocation(`/applications/${id}/triage`)} />
            ) : (
              <PageImage
                runId={run.runId}
                page={activePage}
                imageUrl={imageUrl}
                highlight={citedGlobal !== undefined && activePage === citedGlobal ? highlightBoxes : null}
              />
            )}
          </div>

          {groups.length > 0 ? (
            <DocGroupsStrip
              groups={groups}
              activePage={activePage}
              selectedGroupId={docGroup?.id ?? null}
              decisions={approval.decisions}
              mergeRes={mergeRes}
              onPageClick={jumpToPage}
              onGroupSelect={setDocGroupId}
              onDecide={onDecide}
              onResolveMerge={(spans, d) => approval.resolveMerge(run.runId, spans, d)}
              onQuickApprove={quickApprove}
              imageUrl={imageUrl}
            />
          ) : (
            <FilmStrip
              mode={mode}
              review={review}
              pos={pos}
              ack={ack}
              onJump={setIdx}
              imageUrl={imageUrl}
            />
          )}
        </div>

        {/* right rail / mobile bottom sheet */}
        <aside className="w-full md:w-[320px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-[var(--ops-border)] flex flex-col min-h-0 max-h-[46vh] md:max-h-none">
          <div className="flex-1 overflow-y-auto">
            {docGroup ? (
              <DocApprovalRail
                model={model}
                group={docGroup}
                decisions={approval.decisions[docGroup.id] ?? {}}
                armTick={armTick}
                isPending={approval.isPending}
                onSelectPage={jumpToPage}
                onSubmit={(opts) =>
                  approval.submit(docGroup, { ...opts, runId: run.runId }, () => nextOpenGroup(docGroup))
                }
                onNext={() => nextOpenGroup(docGroup)}
                merge={mergeFor(docGroup)}
              />
            ) : emptyQueue ? (
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
                onClick={docGroup ? () => nextOpenGroup(undefined) : prev}
                disabled={docGroup ? false : pos === 0}
                data-testid="button-prev"
                className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] disabled:opacity-30 min-h-[40px] px-1"
              >
                <ChevronLeft className="w-4 h-4" /> {docGroup ? 'First open' : 'Back'}
              </button>
              <button
                onClick={docGroup ? () => nextOpenGroup(docGroup) : next}
                disabled={docGroup ? openGroups.filter((g) => g.id !== docGroup.id).length === 0 : pos >= list.length - 1}
                data-testid="button-skip"
                className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] disabled:opacity-30 min-h-[40px] px-1"
              >
                Skip <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:flex items-center justify-between micro-label text-[9px] pt-2 border-t border-[var(--ops-border)]">
              <span>↵ {docGroup ? 'approve document' : 'accept'}</span>
              <span>← → navigate</span>
              <span>esc close</span>
            </div>
          </div>
        </aside>
      </div>
    </Room>
  );
}
