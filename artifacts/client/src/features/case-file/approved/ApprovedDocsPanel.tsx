import { useState } from 'react';
import { ChevronDown, Download, FileText, Flag, History } from 'lucide-react';
import { useListApprovedDocs, type ApprovedDocument } from '@workspace/api-client-react';
import type { CaseModel } from '../caseData';
import { fmt } from '../caseData';

/**
 * Read-only surface of the approved-document registry (Phase 3D). Live rows
 * first; superseded history collapsed behind a per-basename toggle. Everything
 * here is materialized truth — bytes exist in the approved store, and each row
 * links its .pdf and .md sidecar. No mutations; approvals happen in the review
 * room and via block verdicts.
 */

const fileUrl = (applicationId: string, docId: string, kind: 'pdf' | 'md') =>
  `/api/applications/${applicationId}/approved-docs/${docId}/file?kind=${kind}`;

export function ApprovedDocsPanel({ model, applicationId }: { model: CaseModel; applicationId: string }) {
  const { data: rows } = useListApprovedDocs(applicationId);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!rows || rows.length === 0) return null;

  const live = rows.filter((r) => !r.supersededBy);
  const superseded = rows.filter((r) => r.supersededBy);

  return (
    <div className="max-w-[1200px] mx-auto min-w-[900px] mt-8" data-testid="approved-docs-panel">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[var(--ops-muted)]" />
          <span className="text-[12px] font-semibold text-[var(--ops-ink)]">Approved documents</span>
          <span className="ops-mono text-[10px] text-[var(--ops-muted)]">{live.length} live</span>
        </div>
        {superseded.length > 0 && (
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            data-testid="button-approved-history"
            className="flex items-center gap-1 text-[10.5px] text-[var(--ops-muted)] hover:text-[var(--ops-ink)] transition-colors"
          >
            <History className="w-3 h-3" />
            {superseded.length} superseded
            <ChevronDown className={`w-3 h-3 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      <div className="border border-[var(--ops-strong-border)] rounded-[4px] overflow-hidden divide-y divide-[var(--ops-border)]">
        {live.map((doc) => (
          <ApprovedDocRow key={doc.id} doc={doc} model={model} applicationId={applicationId} />
        ))}
        {historyOpen &&
          superseded.map((doc) => (
            <ApprovedDocRow key={doc.id} doc={doc} model={model} applicationId={applicationId} superseded />
          ))}
      </div>
    </div>
  );
}

function ApprovedDocRow({
  doc,
  model,
  applicationId,
  superseded = false,
}: {
  doc: ApprovedDocument;
  model: CaseModel;
  applicationId: string;
  superseded?: boolean;
}) {
  const blockName = model.reqs.find((r) => r.block.id === doc.blockId)?.block.name ?? doc.blockId;
  const variantLabel = doc.variantId
    ? (model.app.variants?.[doc.blockId] ?? []).find((v) => v.id === doc.variantId)?.label
    : undefined;
  // the decision trail knows whether this row was approved incomplete
  const approval = (model.app.documentApprovals ?? []).find((a) => a.approvedDocId === doc.id);
  const incomplete = approval?.outcome === 'approved_incomplete';
  const pagesText = doc.pageRanges?.length
    ? doc.pageRanges.map(([f, l]) => (f === l ? `p. ${f}` : `pp. ${f}–${l}`)).join(' + ')
    : doc.pages
      ? doc.pages[0] === doc.pages[1]
        ? `p. ${doc.pages[0]}`
        : `pp. ${doc.pages[0]}–${doc.pages[1]}`
      : null;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 bg-white ${superseded ? 'opacity-50' : ''}`}
      data-testid={`approved-doc-${doc.basename}`}
    >
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="ops-mono text-[11.5px] text-[var(--ops-ink)] truncate">{doc.basename}</span>
          {incomplete && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[var(--ops-warning-border)] bg-[var(--ops-warning-wash)] text-[var(--ops-warning-text)] text-[9px] uppercase tracking-wider font-semibold shrink-0">
              <Flag className="w-2.5 h-2.5" /> incomplete — new version requested
            </span>
          )}
          {superseded && (
            <span className="px-1.5 py-0.5 rounded-[3px] border border-[var(--ops-border)] bg-[var(--ops-inset)] text-[var(--ops-muted)] text-[9px] uppercase tracking-wider font-semibold shrink-0">
              superseded
            </span>
          )}
        </div>
        <span className="text-[10.5px] text-[var(--ops-muted)] truncate">
          {blockName}
          {variantLabel ? ` · ${variantLabel}` : ''}
          {pagesText ? ` · ${pagesText}` : ''}
          {doc.source === 'copy' ? ' · uploaded file' : ''}
        </span>
      </div>
      <span className="ops-mono text-[10px] text-[var(--ops-muted)] shrink-0 hidden md:block">
        {doc.approvedBy} · {fmt(new Date(doc.approvedAt))}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={fileUrl(applicationId, doc.id, 'pdf')}
          target="_blank"
          rel="noreferrer"
          data-testid={`link-approved-pdf-${doc.basename}`}
          className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-[var(--ops-border)] text-[10px] font-semibold text-[var(--ops-body-sec)] hover:border-[var(--ops-accent)] hover:text-[var(--ops-accent)] transition-colors"
        >
          <Download className="w-3 h-3" /> PDF
        </a>
        <a
          href={fileUrl(applicationId, doc.id, 'md')}
          target="_blank"
          rel="noreferrer"
          data-testid={`link-approved-md-${doc.basename}`}
          className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-[var(--ops-border)] text-[10px] font-semibold text-[var(--ops-body-sec)] hover:border-[var(--ops-accent)] hover:text-[var(--ops-accent)] transition-colors"
        >
          <FileText className="w-3 h-3" /> MD
        </a>
      </div>
    </div>
  );
}
