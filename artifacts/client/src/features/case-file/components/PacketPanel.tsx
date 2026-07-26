import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAnalysisQueryKey,
  getGetApplicationQueryKey,
  useListModelOptions,
  type ModelStageOptions,
} from '@workspace/api-client-react';
import { AlertCircle, FileText, Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '../../auth/ProfileContext';
import { usePacketActions } from '../useCaseFile';
import type { CaseModel } from '../caseData';

/**
 * The packet lifecycle, from drop to gate. Pre-flight is deterministic and
 * costs nothing — the gate exists so a human sees the red flags BEFORE the
 * expensive pipeline spends money. States mirror the server exactly:
 * no packet → dropzone · gated → report card with a real decision ·
 * processing → quiet wait · report → this panel disappears, Intake shows the
 * completed card and Triage carries the report.
 */
export function PacketPanel({ model, applicationId }: { model: CaseModel; applicationId: string }) {
  const packet = model.app.packet;
  const queryClient = useQueryClient();

  // While the analyzer runs, keep the case fresh without user action.
  useEffect(() => {
    if (packet?.state !== 'processing') return;
    const t = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
      queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
    }, 2500);
    return () => clearInterval(t);
  }, [packet?.state, applicationId, queryClient]);

  if (packet?.state === 'report') return null;
  if (packet?.state === 'processing') return <ProcessingCard />;
  if (packet?.state === 'gated') return <GateCard model={model} applicationId={applicationId} />;
  // Multi-file intake: a pending (un-assembled) manifest replaces the dropzone.
  const manifest = model.app.packetManifest;
  if (manifest && !manifest.assembledAt) {
    return <ManifestCard manifest={manifest} applicationId={applicationId} />;
  }
  // preflight_running only survives a server crash mid-check — honest retry.
  return <Dropzone applicationId={applicationId} retry={packet?.state === 'preflight_running'} />;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'upload failed — try again');

// ─── no packet yet ──────────────────────────────────────────────────────────

export function Dropzone({ applicationId, retry }: { applicationId: string; retry: boolean }) {
  const { uploadPacket, upload, uploadPacketFiles, uploadFiles } = usePacketActions(applicationId);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // One PDF goes straight to pre-flight; several become a reviewable manifest.
  const take = (list: FileList | File[] | null | undefined) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const bad = files.find((f) => !(f.type === 'application/pdf' || /\.pdf$/i.test(f.name)));
    if (bad) {
      toast({ description: `${bad.name} is not a PDF — the drop was not accepted.` });
      return;
    }
    if (files.length === 1) uploadPacket(files[0]!);
    else uploadPacketFiles(files);
  };

  if (upload.isPending || uploadFiles.isPending) {
    return (
      <div
        className="bg-white border border-[var(--ops-border)] rounded-[6px] p-7 flex flex-col items-center text-center"
        data-testid="card-preflight-running"
      >
        <Loader2 className="w-5 h-5 text-[var(--ops-accent)] animate-spin mb-3" />
        <div className="text-[13.5px] font-medium text-[var(--ops-ink)] mb-1">Pre-flight running</div>
        <div className="ops-mono text-[11px] text-[var(--ops-muted)]">
          validity · page raster · duplicates · embedded-image DPI
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
        data-testid="dropzone-packet"
        className={`cursor-pointer border-2 border-dashed rounded-[6px] p-7 md:p-9 flex flex-col items-center text-center transition-colors ${
          dragging
            ? 'border-[var(--ops-accent)] bg-[var(--ops-accent-wash)]'
            : 'border-[var(--ops-strong-border)] bg-white hover:bg-[var(--ops-inset)]'
        }`}
      >
        <div className="w-11 h-11 rounded bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] flex items-center justify-center mb-4">
          <UploadCloud className="w-5 h-5 text-[var(--ops-muted)]" />
        </div>
        <h2 className="font-semibold text-[17px] text-[var(--ops-ink)] mb-1.5">
          {retry ? 'Pre-flight didn’t finish — drop the packet again' : 'Drop the application packet'}
        </h2>
        <p className="text-[12.5px] text-[var(--ops-muted)] max-w-[420px] leading-relaxed">
          Everything the applicant sent — one PDF goes straight to pre-flight; several PDFs become a
          reviewable file list first. No money is spent before the verdict lands here.
        </p>
        <div className="micro-label text-[9.5px] mt-3">PDF only · one or many · click or drag</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          data-testid="input-packet-file"
          onChange={(e) => {
            take(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {(upload.isError || uploadFiles.isError) && (
        <div
          className="mt-3 bg-[var(--ops-critical-wash)] border border-[var(--ops-critical-border)] rounded p-3 flex items-start gap-2.5"
          data-testid="text-packet-error"
        >
          <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-critical-text)] shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-[var(--ops-critical-text)] leading-relaxed">
            {errMsg(upload.isError ? upload.error : uploadFiles.error)} — fix the file and drop it
            again.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── manifest — multi-file intake, reviewable before assembly ───────────────

/**
 * The drop became a file list, not a packet yet. Each file shows the same
 * deterministic quality flags pre-flight uses; the X removes it from the
 * eventual packet (reversible until Build). Build concatenates the kept files
 * into ONE packet PDF that flows through the normal pre-flight → gate path.
 */
function ManifestCard({
  manifest,
  applicationId,
}: {
  manifest: NonNullable<CaseModel['app']['packetManifest']>;
  applicationId: string;
}) {
  const { toggleFileRemoved, setFileRemoved, assemblePacket, assemble } =
    usePacketActions(applicationId);
  const kept = manifest.files.filter((f) => !f.removed);
  const keptPages = kept.reduce((n, f) => n + f.pages, 0);

  if (assemble.isPending) {
    return (
      <div
        className="bg-white border border-[var(--ops-border)] rounded-[6px] p-7 flex flex-col items-center text-center"
        data-testid="card-assembling"
      >
        <Loader2 className="w-5 h-5 text-[var(--ops-accent)] animate-spin mb-3" />
        <div className="text-[13.5px] font-medium text-[var(--ops-ink)] mb-1">
          Building the packet
        </div>
        <div className="ops-mono text-[11px] text-[var(--ops-muted)]">
          {kept.length} files → one PDF · then pre-flight
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-[var(--ops-border)] rounded-[6px]"
      data-testid="card-packet-manifest"
    >
      <div className="px-5 pt-4 pb-3 border-b border-[var(--ops-inner-rule)]">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-[15px] text-[var(--ops-ink)]">
            {manifest.files.length} files dropped — review before building the packet
          </h2>
          <span className="ops-mono text-[11px] text-[var(--ops-muted)] whitespace-nowrap">
            keeping {kept.length}/{manifest.files.length} · {keptPages} pages
          </span>
        </div>
        <p className="text-[12px] text-[var(--ops-muted)] mt-1 leading-relaxed">
          Removed files are simply left out of the packet — re-drop to start over. Nothing is
          analyzed until you build.
        </p>
      </div>
      <ul className="divide-y divide-[var(--ops-inner-rule)]">
        {manifest.files.map((f) => (
          <li
            key={f.id}
            className={`px-5 py-2.5 flex items-center gap-3 ${f.removed ? 'opacity-45' : ''}`}
            data-testid={`manifest-file-${f.id}`}
          >
            <FileText className="w-4 h-4 text-[var(--ops-muted)] shrink-0" />
            <div className="min-w-0 flex-1">
              <div
                className={`text-[12.5px] text-[var(--ops-ink)] truncate ${f.removed ? 'line-through' : ''}`}
              >
                {f.filename}
              </div>
              <div className="ops-mono text-[10.5px] text-[var(--ops-muted)]">
                {f.pages} {f.pages === 1 ? 'page' : 'pages'} ·{' '}
                {(f.sizeBytes / 1024).toFixed(0)} KB
                {f.flags.length > 0 && (
                  <span className="text-[var(--ops-critical-text)]"> · {f.flags.join(' · ')}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleFileRemoved(f.id, !f.removed)}
              disabled={setFileRemoved.isPending}
              className="text-[11px] ops-mono px-2 py-1 rounded border border-[var(--ops-border)] hover:bg-[var(--ops-inset)] text-[var(--ops-muted)] shrink-0"
              data-testid={`button-manifest-${f.removed ? 'restore' : 'remove'}-${f.id}`}
            >
              {f.removed ? 'restore' : '✕ remove'}
            </button>
          </li>
        ))}
      </ul>
      <div className="px-5 py-3.5 border-t border-[var(--ops-inner-rule)] flex items-center justify-between gap-3">
        <span className="micro-label text-[9.5px] text-[var(--ops-faint)]">
          files are concatenated in this order · one packet · normal pre-flight follows
        </span>
        <button
          onClick={() => assemblePacket()}
          disabled={kept.length === 0}
          className="px-4 py-2 rounded bg-[var(--ops-accent)] text-white text-[12.5px] font-medium disabled:opacity-40 hover:opacity-90"
          data-testid="button-assemble-packet"
        >
          Build packet ({kept.length} {kept.length === 1 ? 'file' : 'files'}, {keptPages} pages)
        </button>
      </div>
    </div>
  );
}

// ─── gated — the decision card ──────────────────────────────────────────────

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
  const packet = model.app.packet;
  const pf = packet?.preflight;
  const { decide, gate } = usePacketActions(applicationId);
  const { profile } = useProfile();
  const { toast } = useToast();

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

  if (!packet || !pf) return null;
  const flags = pf.flags;
  const planReady = optionsQ.isSuccess && ['parse', 'text', 'judge'].every((s) => plan[s]);
  const start = (decision: 'confirmed' | 'bypassed') =>
    decide(decision, { parse: plan['parse'], text: plan['text'], judge: plan['judge'], fraudScoring });

  const copyLink = async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const url = `${window.location.origin}${base}/apply/${applicationId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ description: 'Applicant intake link copied — ask for a cleaner packet.' });
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
        <h2 className="font-semibold text-[15.5px] text-[var(--ops-ink)]">Pre-flight report</h2>
        <span className="micro-label text-[9.5px]">deterministic checks · no AI spend yet</span>
      </div>

      <div className="px-5 md:px-6 py-4 flex flex-col gap-4">
        <div className="flex items-start gap-2.5">
          <FileText className="w-4 h-4 text-[var(--ops-muted)] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="ops-mono text-[12px] text-[var(--ops-ink)] break-all">
              {packet.filename} · {packet.pages} pages · {(packet.sizeBytes / 1024).toFixed(1)} KB
            </div>
            <div className="ops-mono text-[10.5px] text-[var(--ops-faint)] break-all">
              sha256 {packet.sha256.slice(0, 12)}…
              {pf.metadata?.producer ? ` · ${pf.metadata.producer}` : ''}
            </div>
          </div>
        </div>

        <div className="text-[13px] font-medium text-[var(--ops-ink)]" data-testid="text-preflight-verdict">
          {pf.verdict}
        </div>

        {packet.lastRunError && (
          <div
            className="flex items-start gap-2 rounded border bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] p-2.5"
            data-testid="text-run-error"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-warning-text)] shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-[var(--ops-warning-text)] leading-relaxed">
              Last analyzer run failed — {packet.lastRunError}. The gate is open again; decide below to retry.
            </div>
          </div>
        )}

        {flags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {flags.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded border bg-[var(--ops-critical-wash)] border-[var(--ops-critical-border)] p-2.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[var(--ops-critical-text)] shrink-0 mt-0.5" />
                <div className="text-[12.5px] text-[var(--ops-critical-text)]">{f}</div>
              </div>
            ))}
          </div>
        )}

        {pf.thumbnails.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {pf.thumbnails.map((t) => (
              <figure key={t.page} className="w-[104px]">
                <img
                  src={`/api/applications/${applicationId}/packet/thumbnails/${t.page}?v=${packet.sha256.slice(0, 8)}`}
                  alt={`packet page ${t.page}`}
                  data-testid={`img-thumb-${t.page}`}
                  className="w-full border border-[var(--ops-border)] rounded-[4px] bg-white"
                />
                <figcaption className="micro-label text-[8.5px] mt-1 leading-snug normal-case">
                  {t.reason}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

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
          <span className="ops-mono text-[12.5px] text-[var(--ops-ink)]">
            ${pf.estimateUsd.toFixed(2)} · ~{pf.estimateMinutes} min
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
          <button onClick={copyLink} className="btn-secondary" data-testid="button-request-better-packet">
            Request a better version
          </button>
          {flags.length > 0 ? (
            <button
              onClick={() => start('bypassed')}
              disabled={gate.isPending || !planReady}
              data-testid="button-process-anyway"
              className="h-9 px-3.5 rounded-[4px] border text-[12.5px] font-medium bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)] text-[var(--ops-warning-text)] hover:bg-[#FEF3C7] transition-colors disabled:opacity-60"
            >
              {gate.isPending ? 'Starting…' : `Process anyway — $${pf.estimateUsd.toFixed(2)}`}
            </button>
          ) : (
            <button
              onClick={() => start('confirmed')}
              disabled={gate.isPending || !planReady}
              data-testid="button-process-packet"
              className="btn-primary"
            >
              {gate.isPending ? 'Starting…' : `Process packet — $${pf.estimateUsd.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── processing — quiet wait ────────────────────────────────────────────────

function ProcessingCard() {
  return (
    <div
      className="bg-white border border-[var(--ops-border)] rounded-[6px] p-6 flex items-center gap-3"
      data-testid="card-packet-processing"
    >
      <Loader2 className="w-4.5 h-4.5 w-[18px] h-[18px] text-[var(--ops-accent)] animate-spin shrink-0" />
      <div>
        <div className="text-[13.5px] font-medium text-[var(--ops-ink)]">Analyzer running</div>
        <div className="text-[12px] text-[var(--ops-muted)]">
          This page refreshes itself — the report replaces this card when the run lands.
        </div>
      </div>
    </div>
  );
}
