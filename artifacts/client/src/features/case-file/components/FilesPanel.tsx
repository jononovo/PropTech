import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAnalysisQueryKey,
  getGetApplicationQueryKey,
  useGetRunEstimate,
  useListModelOptions,
  type ModelStageOptions,
  type SourceFile,
} from '@workspace/api-client-react';
import { AlertCircle, FileText, Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '../../auth/ProfileContext';
import { useIntakeActions } from '../useCaseFile';
import type { CaseModel } from '../caseData';

/**
 * File-native intake: files land durably as immutable SourceFiles the moment
 * they drop — no packet, no assembly. Deterministic pre-flight runs per file
 * at drop and costs nothing; the GATE covers the ACTIVE FILE SET, so a human
 * sees the flags and picks the run plan BEFORE the pipeline spends money.
 * States mirror the server's RunState exactly: no active files → dropzone ·
 * gated → decision card over the set · processing → quiet wait · report →
 * this panel disappears (Intake shows the completed card, Triage the report).
 */
export function FilesPanel({ model, applicationId }: { model: CaseModel; applicationId: string }) {
  const run = model.app.run;
  const queryClient = useQueryClient();

  // While the analyzer runs, keep the case fresh without user action.
  useEffect(() => {
    if (run?.state !== 'processing') return;
    const t = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
      queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
    }, 2500);
    return () => clearInterval(t);
  }, [run?.state, applicationId, queryClient]);

  if (run?.state === 'report') return null;
  if (run?.state === 'processing') return <ProcessingCard input={run.input ?? []} />;
  // gated is implied: active files waiting + no run in flight (run stays null
  // until the first gate decision; a failed run reverts to explicit 'gated')
  if (activeFiles(model).length > 0) return <GateCard model={model} applicationId={applicationId} />;
  return <Dropzone applicationId={applicationId} />;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'upload failed — try again');

/** Active files on the application — the working set every run analyzes. */
const activeFiles = (model: CaseModel): SourceFile[] =>
  (model.app.files ?? []).filter((f) => f.status === 'active');

// ─── dropzone — files land durably, no packet ────────────────────────────────

export function Dropzone({ applicationId, compact = false }: { applicationId: string; compact?: boolean }) {
  const { dropFiles, receive } = useIntakeActions(applicationId);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (list: FileList | File[] | null | undefined) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const bad = files.find((f) => !(f.type === 'application/pdf' || /\.pdf$/i.test(f.name)));
    if (bad) {
      toast({ description: `${bad.name} is not a PDF — the drop was not accepted.` });
      return;
    }
    dropFiles(files);
  };

  if (receive.isPending) {
    return (
      <div
        className="bg-white border border-[var(--ops-border)] rounded-[6px] p-7 flex flex-col items-center text-center"
        data-testid="card-preflight-running"
      >
        <Loader2 className="w-5 h-5 text-[var(--ops-accent)] animate-spin mb-3" />
        <div className="text-[13.5px] font-medium text-[var(--ops-ink)] mb-1">Receiving files</div>
        <div className="ops-mono text-[11px] text-[var(--ops-muted)]">
          validity · page raster · duplicates · embedded-image DPI — per file, at drop
        </div>
        <div className="micro-label text-[9.5px] mt-2 text-[var(--ops-faint)]">
          deterministic checks — no AI spend
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        data-testid="dropzone-files"
        className={`cursor-pointer border-2 border-dashed rounded-[6px] ${compact ? 'p-5' : 'p-7 md:p-9'} flex flex-col items-center text-center transition-colors ${
          dragging
            ? 'border-[var(--ops-accent)] bg-[var(--ops-accent-wash)]'
            : 'border-[var(--ops-strong-border)] bg-white hover:bg-[var(--ops-inset)]'
        }`}
      >
        <div className="w-11 h-11 rounded bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] flex items-center justify-center mb-4">
          <UploadCloud className="w-5 h-5 text-[var(--ops-muted)]" />
        </div>
        <h2 className={`font-semibold ${compact ? 'text-[14px]' : 'text-[17px]'} text-[var(--ops-ink)] mb-1.5`}>
          Drop the applicant’s documents
        </h2>
        <p className="text-[12.5px] text-[var(--ops-muted)] max-w-[440px] leading-relaxed">
          Files stay exactly as dropped — nothing is stitched together. Every file lands durably,
          pre-flight runs instantly, and no money is spent before the gate decision.
        </p>
        <div className="micro-label text-[9.5px] mt-3">PDF only · one or many · click or drag</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          data-testid="input-intake-files"
          onChange={(e) => {
            take(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {receive.isError && (
        <div
          className="mt-3 bg-[var(--ops-critical-wash)] border border-[var(--ops-critical-border)] rounded p-3 flex items-start gap-2.5"
          data-testid="text-drop-error"
        >
          <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-critical-text)] shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-[var(--ops-critical-text)] leading-relaxed">
            {errMsg(receive.error)} — whole-drop validation: fix the file and drop again.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── gated — the decision card over the active file set ─────────────────────

const STAGE_COPY: Record<string, { title: string; hint: string }> = {
  parse: { title: 'Parse', hint: 'page OCR → markdown' },
  text: { title: 'Split / classify', hint: 'boundaries + taxonomy' },
  judge: { title: 'Judge', hint: 'scores + core fields' },
};

/** Per-stage engine dropdowns — the run plan travels with the gate decision. */
function RunPlanPicker({
  stages,
  plan,
  setPlan,
  fraudScoring,
  setFraudScoring,
}: {
  stages: ModelStageOptions[];
  plan: Record<string, string>;
  setPlan: (stage: string, id: string) => void;
  fraudScoring: boolean;
  setFraudScoring: (v: boolean) => void;
}) {
  return (
    <div className="bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] rounded p-3 flex flex-col gap-2.5">
      <div className="flex items-baseline gap-3">
        <span className="micro-label text-[9.5px]">run plan — engines for this run</span>
        <span className="text-[10.5px] text-[var(--ops-faint)]">recorded with the run, per-run cost varies</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-2.5">
        {stages.map((s) => {
          const copy = STAGE_COPY[s.stage] ?? { title: s.stage, hint: '' };
          const selected = s.options.find((o) => o.id === plan[s.stage]);
          return (
            <label key={s.stage} className="flex flex-col gap-1 min-w-0">
              <span className="micro-label text-[8.5px]">
                {copy.title}
                <span className="normal-case text-[var(--ops-faint)]"> · {copy.hint}</span>
              </span>
              <select
                value={plan[s.stage] ?? ''}
                disabled={s.locked}
                data-testid={`select-model-${s.stage}`}
                onChange={(e) => setPlan(s.stage, e.target.value)}
                className="h-8 rounded-[4px] border border-[var(--ops-strong-border)] bg-white px-2 text-[12px] text-[var(--ops-ink)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {s.options.map((o) => (
                  <option key={o.id} value={o.id} disabled={!o.available}>
                    {o.label}
                    {o.status === 'experimental' ? ' · experimental' : ''}
                    {!o.available ? ' · unavailable' : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] leading-snug text-[var(--ops-faint)]">
                {selected ? (selected.available ? selected.note : selected.unavailableReason) : ''}
                {s.locked ? ' (locked in v1)' : ''}
              </span>
            </label>
          );
        })}
      </div>
      <label className="flex items-start gap-2 cursor-pointer select-none border-t border-[var(--ops-inner-rule)] pt-2.5">
        <input
          type="checkbox"
          checked={fraudScoring}
          onChange={(e) => setFraudScoring(e.target.checked)}
          data-testid="toggle-fraud-scoring"
          className="mt-0.5 accent-[var(--ops-accent)]"
        />
        <span className="text-[11.5px] leading-snug text-[var(--ops-ink)]">
          Fraud scoring
          <span className="text-[var(--ops-faint)]"> · visual-anomaly signal on every judged document</span>
          {!fraudScoring && (
            <span className="block text-[10.5px] text-[var(--ops-warning-text)] mt-0.5">
              Off for this run — documents will read “fraud: not scored this run”. Recorded with the run, like the engines.
            </span>
          )}
        </span>
      </label>
    </div>
  );
}

function GateCard({ model, applicationId }: { model: CaseModel; applicationId: string }) {
  const files = activeFiles(model);
  const run = model.app.run;
  const { decide, gate } = useIntakeActions(applicationId);
  const { profile } = useProfile();
  const { toast } = useToast();

  const estimateQ = useGetRunEstimate(applicationId);
  const est = estimateQ.data;

  const optionsQ = useListModelOptions();
  const stages = optionsQ.data?.stages ?? [];
  const defaults = useMemo(() => {
    const d: Record<string, string> = {};
    for (const s of stages) {
      const pick = s.options.find((o) => o.default && o.available) ?? s.options.find((o) => o.available);
      if (pick) d[s.stage] = pick.id;
    }
    return d;
  }, [stages]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [fraudScoring, setFraudScoring] = useState(true);
  const plan = { ...defaults, ...overrides };

  const flagged = files.filter((f) => (f.flags?.length ?? 0) > 0);
  const flagCount = files.reduce((n, f) => n + (f.flags?.length ?? 0), 0);
  const totalPages = files.reduce((n, f) => n + (f.pages ?? 0), 0);
  const planReady = optionsQ.isSuccess && ['parse', 'text', 'judge'].every((s) => plan[s]);
  const start = (decision: 'confirmed' | 'bypassed') =>
    decide(decision, { parse: plan['parse'], text: plan['text'], judge: plan['judge'], fraudScoring });

  const copyLink = async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const url = `${window.location.origin}${base}/apply/${applicationId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ description: 'Applicant intake link copied — ask for cleaner documents.' });
    } catch {
      toast({ description: `Copy failed — the link is ${url}` });
    }
  };

  return (
    <div
      className="bg-white border border-[var(--ops-strong-border)] rounded-[6px] overflow-hidden text-left"
      data-testid="card-preflight-gate"
    >
      <div className="px-5 md:px-6 py-4 border-b border-[var(--ops-border)] flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-[15.5px] text-[var(--ops-ink)]">
          Pre-flight report — {files.length} {files.length === 1 ? 'file' : 'files'} · {totalPages} pages
        </h2>
        <span className="micro-label text-[9.5px]">deterministic checks · no AI spend yet</span>
      </div>

      <div className="px-5 md:px-6 py-4 flex flex-col gap-4">
        {run?.lastRunError && (
          <div
            className="flex items-start gap-2 rounded border bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] p-2.5"
            data-testid="text-run-error"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-warning-text)] shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-[var(--ops-warning-text)] leading-relaxed">
              Last analyzer run failed — {run.lastRunError}. The gate is open again; decide below to retry.
            </div>
          </div>
        )}

        {/* the active set, file by file, with its structured pre-flight flags */}
        <ul className="divide-y divide-[var(--ops-inner-rule)] border border-[var(--ops-inner-rule)] rounded">
          {files.map((f) => (
            <li key={f.id} className="px-3.5 py-2.5 flex items-start gap-3" data-testid={`gate-file-${f.id}`}>
              <FileText className="w-4 h-4 text-[var(--ops-muted)] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] text-[var(--ops-ink)] truncate">{f.filename}</div>
                <div className="ops-mono text-[10.5px] text-[var(--ops-muted)]">
                  {f.pages ?? '?'} {f.pages === 1 ? 'page' : 'pages'} · {(f.sizeBytes / 1024).toFixed(0)} KB
                  {f.sha256 ? ` · sha256 ${f.sha256.slice(0, 10)}…` : ''}
                </div>
                {(f.flags ?? []).map((fl, i) => (
                  <div
                    key={i}
                    className="mt-1 flex items-start gap-1.5 text-[11.5px] text-[var(--ops-critical-text)]"
                    data-testid={`gate-flag-${f.id}-${i}`}
                  >
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>
                      {fl.page ? `p.${fl.page} — ` : ''}
                      {fl.note}
                    </span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>

        {/* more files can join the set — a new drop re-gates automatically */}
        <Dropzone applicationId={applicationId} compact />

        {optionsQ.isError && (
          <div className="flex items-start gap-2 rounded border bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] p-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-warning-text)] shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-[var(--ops-warning-text)] leading-relaxed">
              Model options unavailable — the analyzer worker isn’t reachable, so a run can’t start.
            </div>
          </div>
        )}
        {stages.length > 0 && (
          <RunPlanPicker
            stages={stages}
            plan={plan}
            setPlan={(stage, id) => setOverrides((p) => ({ ...p, [stage]: id }))}
            fraudScoring={fraudScoring}
            setFraudScoring={setFraudScoring}
          />
        )}

        <div className="bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] rounded p-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="micro-label text-[9.5px]">full-run estimate</span>
          <span className="ops-mono text-[12.5px] text-[var(--ops-ink)]" data-testid="text-run-estimate">
            {est ? `$${est.estimateUsd.toFixed(2)} · ~${est.estimateMinutes} min` : estimateQ.isError ? 'unavailable' : '…'}
          </span>
          <span className="text-[11px] text-[var(--ops-muted)]">
            parse + judge + deep scans — staff-facing, never shown to applicants
          </span>
        </div>
      </div>

      <div className="px-5 md:px-6 py-4 border-t border-[var(--ops-border)] bg-[var(--ops-inset)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="micro-label text-[9.5px]">
          decision recorded as {profile.name} · {profile.role}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={copyLink} className="btn-secondary" data-testid="button-request-better-files">
            Request a better version
          </button>
          {flagCount > 0 ? (
            <button
              onClick={() => start('bypassed')}
              disabled={gate.isPending || !planReady}
              data-testid="button-process-anyway"
              className="h-9 px-3.5 rounded-[4px] border text-[12.5px] font-medium bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] hover:bg-[#FEF3C7] transition-colors disabled:opacity-60"
            >
              {gate.isPending
                ? 'Starting…'
                : `Process anyway — ${flagCount} flag${flagCount > 1 ? 's' : ''} on ${flagged.length} file${flagged.length > 1 ? 's' : ''}${est ? ` · $${est.estimateUsd.toFixed(2)}` : ''}`}
            </button>
          ) : (
            <button
              onClick={() => start('confirmed')}
              disabled={gate.isPending || !planReady}
              data-testid="button-process-files"
              className="btn-primary"
            >
              {gate.isPending ? 'Starting…' : `Process ${files.length} ${files.length === 1 ? 'file' : 'files'}${est ? ` — $${est.estimateUsd.toFixed(2)}` : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── processing — quiet wait over the frozen input set ──────────────────────

function ProcessingCard({ input }: { input: { filename: string; pages: number }[] }) {
  const pages = input.reduce((n, f) => n + f.pages, 0);
  return (
    <div
      className="bg-white border border-[var(--ops-border)] rounded-[6px] p-6 flex items-center gap-3"
      data-testid="card-run-processing"
    >
      <Loader2 className="w-[18px] h-[18px] text-[var(--ops-accent)] animate-spin shrink-0" />
      <div>
        <div className="text-[13.5px] font-medium text-[var(--ops-ink)]">
          Analyzer running — {input.length} {input.length === 1 ? 'file' : 'files'}, {pages} pages
        </div>
        <div className="text-[12px] text-[var(--ops-muted)]">
          This page refreshes itself — the report replaces this card when the run lands.
        </div>
      </div>
    </div>
  );
}
