import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { ArrowUp, ExternalLink, Search, FileText, List, Database, X, Check, Ban, Stamp, PenLine, RefreshCw, FolderInput, GitMerge, Pencil, Layers, ShieldCheck, Zap } from 'lucide-react';

/**
 * Case assistant — chat panel scoped to one application (qa-agent spec).
 * Slide-over on the right; conversation lives in component state only
 * (server is stateless; closing the panel keeps the thread until unmount).
 *
 * Power tier: the Read-only / Full-control toggle (default read-only, never
 * persisted) is sent as `mode` with every request; in full control the
 * server exposes write tools, each pausing on an approve/decline card here.
 */

const TOOL_META: Record<string, { label: string; icon: typeof Search; write?: boolean }> = {
  lookup_application: { label: 'Checked the application record', icon: Database },
  list_corpus: { label: 'Listed the document corpus', icon: List },
  grep_corpus: { label: 'Searched the documents', icon: Search },
  read_corpus: { label: 'Read a document', icon: FileText },
  approve_document: { label: 'Approve document', icon: Stamp, write: true },
  update_fields: { label: 'Save field values', icon: PenLine, write: true },
  trigger_rescan: { label: 'Start analyzer run', icon: RefreshCw, write: true },
  file_pages: { label: 'File pages', icon: FolderInput, write: true },
  resolve_merge: { label: 'Resolve merge suggestion', icon: GitMerge, write: true },
  rename_file: { label: 'Rename file', icon: Pencil, write: true },
  add_variant: { label: 'Add variant', icon: Layers, write: true },
};

/** Approve/decline card for a write tool paused on `needsApproval`. */
function ApprovalCard({
  toolName,
  input,
  approval,
  onRespond,
}: {
  toolName: string;
  input: unknown;
  approval: { id: string; approved?: boolean };
  onRespond: (id: string, approved: boolean) => void;
}) {
  const meta = TOOL_META[toolName];
  const Icon = meta?.icon ?? Zap;
  const pending = approval.approved === undefined;
  return (
    <div
      data-testid={`card-approval-${toolName}`}
      className="rounded-[6px] border border-[var(--ops-warn-border,#f0c36d)] bg-[var(--ops-warn-wash,#fdf6e3)] px-3 py-2 space-y-1.5"
    >
      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--ops-ink)]">
        <Icon className="w-[12px] h-[12px]" />
        {meta?.label ?? toolName}
        <span className="ops-mono text-[8.5px] px-1 py-px rounded-[3px] bg-white/70 border border-[var(--ops-inner-rule)] text-[var(--ops-muted)]">WRITE</span>
      </div>
      <pre className="ops-mono text-[9.5px] leading-relaxed text-[var(--ops-body-sec)] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
        {JSON.stringify(input, null, 1)}
      </pre>
      {pending ? (
        <div className="flex gap-2 pt-0.5">
          <button
            onClick={() => onRespond(approval.id, true)}
            data-testid="button-approve-tool"
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[4px] bg-[var(--ops-accent)] text-white"
          >
            <Check className="w-3 h-3" /> Approve
          </button>
          <button
            onClick={() => onRespond(approval.id, false)}
            data-testid="button-decline-tool"
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[4px] border border-[var(--ops-strong-border)] text-[var(--ops-ink)]"
          >
            <Ban className="w-3 h-3" /> Decline
          </button>
        </div>
      ) : (
        <div className={`ops-mono text-[9.5px] ${approval.approved ? 'text-[var(--ops-accent)]' : 'text-[var(--ops-muted)]'}`}>
          {approval.approved ? '✓ approved' : '✕ declined'}
        </div>
      )}
    </div>
  );
}

/**
 * Inline citation markers — the model emits
 * `[cite file=<id> page=<N> quote="<verbatim>"]` after each claim; we render
 * them as link chips that open the review room at that page with the quote
 * highlighted (resolver draws the bbox).
 */
const CITE_RE = /\[cite\s+file=([\w-]+)\s+page=(\d+)\s+quote="((?:[^"\\]|\\.)*)"\s*\]/g;

function CitedText({
  text,
  files,
  onOpen,
}: {
  text: string;
  files: Record<string, string>;
  onOpen: (fileId: string, page: number, quote: string) => void;
}) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  CITE_RE.lastIndex = 0;
  while ((m = CITE_RE.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={last}>{text.slice(last, m.index)}</span>);
    const [, fileId, pageStr, rawQuote] = m;
    const page = Number(pageStr);
    const quote = rawQuote!.replace(/\\(.)/g, '$1');
    const label = `${files[fileId!] ?? fileId} p.${page}`;
    out.push(
      <button
        key={`c${m.index}`}
        onClick={() => onOpen(fileId!, page, quote)}
        data-testid="chip-citation"
        title={`Open ${label} — "${quote}"`}
        className="inline-flex items-center gap-1 align-baseline mx-0.5 ops-mono text-[9.5px] px-1.5 py-[1px] rounded-[3px] bg-[var(--ops-accent-wash)] border border-[var(--ops-inner-rule)] text-[var(--ops-accent)] hover:border-[var(--ops-accent)] transition-colors"
      >
        <ExternalLink className="w-[9px] h-[9px]" />
        {label}
      </button>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={last}>{text.slice(last)}</span>);
  return <>{out}</>;
}

export function AgentPanel({
  applicationId,
  files,
  onClose,
}: {
  applicationId: string;
  /** fileId → filename, for citation chip labels */
  files: Record<string, string>;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  const openCitation = (fileId: string, page: number, quote: string) => {
    const qs = new URLSearchParams({ file: fileId, page: String(page), quote });
    setLocation(`/applications/${applicationId}/review?${qs}`);
  };
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [input, setInput] = useState('');
  // Read-only vs Full control — default read-only, never persisted (ruling).
  // A ref feeds the transport so auto-resends (approval responses) carry the
  // CURRENT toggle state, not the one captured at construction.
  const [mode, setMode] = useState<'read' | 'act'>('read');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${base}/api/applications/${applicationId}/agent/chat`,
        body: () => ({ mode: modeRef.current }),
      }),
    [base, applicationId],
  );
  const { messages, sendMessage, status, error, addToolApprovalResponse } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const busy = status === 'submitted' || status === 'streaming';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    void sendMessage({ text });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white border-l border-[var(--ops-border)] shadow-xl flex flex-col" data-testid="panel-agent">
      <div className="shrink-0 h-[52px] flex items-center gap-2 px-4 border-b border-[var(--ops-border)]">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ops-ink)]">Case assistant</span>
        <button
          onClick={() => setMode((m) => (m === 'read' ? 'act' : 'read'))}
          data-testid="button-agent-mode"
          title={mode === 'read' ? 'Agent can only read. Click to allow actions (each action still asks you first).' : 'Agent may propose actions — every action needs your approval. Click for read-only.'}
          className={`inline-flex items-center gap-1 ops-mono text-[9px] px-1.5 py-0.5 rounded-[3px] border transition-colors ${
            mode === 'read'
              ? 'bg-[var(--ops-inset)] border-[var(--ops-inner-rule)] text-[var(--ops-muted)]'
              : 'bg-[var(--ops-warn-wash,#fdf6e3)] border-[var(--ops-warn-border,#f0c36d)] text-[var(--ops-ink)]'
          }`}
        >
          {mode === 'read' ? <ShieldCheck className="w-[10px] h-[10px]" /> : <Zap className="w-[10px] h-[10px]" />}
          {mode === 'read' ? 'READ-ONLY' : 'FULL CONTROL'}
        </button>
        <button onClick={onClose} data-testid="button-agent-close" aria-label="Close" className="ml-auto w-8 h-8 flex items-center justify-center rounded-[4px] text-[var(--ops-muted)] hover:bg-[var(--ops-inner-rule)] hover:text-[var(--ops-ink)]">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-[12px] text-[var(--ops-muted)] leading-relaxed pt-2">
            Ask about this application — status, files, or anything inside the scanned documents.
            Answers cite their source (document, page).
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} data-testid={`agent-msg-${m.role}`}>
            {m.role === 'user' ? (
              <div className="ml-8 rounded-[6px] bg-[var(--ops-accent-wash)] border border-[var(--ops-inner-rule)] px-3 py-2 text-[12.5px] text-[var(--ops-ink)] whitespace-pre-wrap">
                {m.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
              </div>
            ) : (
              <div className="mr-4 space-y-1.5">
                {m.parts.map((p, i) => {
                  if (p.type === 'text') {
                    return (
                      <div key={i} className="text-[12.5px] leading-relaxed text-[var(--ops-ink)] whitespace-pre-wrap">
                        <CitedText text={p.text} files={files} onOpen={openCitation} />
                      </div>
                    );
                  }
                  if (p.type.startsWith('tool-')) {
                    const toolName = p.type.slice(5);
                    const meta = TOOL_META[toolName];
                    if (!meta) return null;
                    // write tool paused for (or already given) a human decision
                    if ('state' in p && (p.state === 'approval-requested' || p.state === 'approval-responded') && 'approval' in p && p.approval) {
                      return (
                        <ApprovalCard
                          key={i}
                          toolName={toolName}
                          input={'input' in p ? p.input : undefined}
                          approval={p.approval as { id: string; approved?: boolean }}
                          onRespond={(id, approved) => addToolApprovalResponse({ id, approved })}
                        />
                      );
                    }
                    const done = 'state' in p && p.state === 'output-available';
                    const failed =
                      done && meta.write && typeof p.output === 'object' && p.output !== null && (p.output as { ok?: boolean }).ok === false;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={i}
                        className={`inline-flex items-center gap-1.5 mr-1.5 ops-mono text-[9.5px] px-1.5 py-0.5 rounded-[3px] border ${
                          failed
                            ? 'bg-[var(--ops-critical-wash)] border-[var(--ops-critical-border)] text-[var(--ops-critical-text)]'
                            : 'bg-[var(--ops-inset)] border-[var(--ops-inner-rule)] text-[var(--ops-muted)]'
                        }`}
                      >
                        <Icon className="w-[10px] h-[10px]" />
                        {meta.label}
                        {failed && ' — refused'}
                        {!done && <span className="animate-pulse">…</span>}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === 'user' && (
          <div className="text-[11px] text-[var(--ops-muted)] animate-pulse">Working…</div>
        )}
        {error && (
          <div className="text-[11.5px] text-[var(--ops-critical-text)] bg-[var(--ops-critical-wash)] border border-[var(--ops-critical-border)] rounded-[4px] px-3 py-2">
            {error.message}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="shrink-0 border-t border-[var(--ops-border)] p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          rows={2}
          placeholder="Ask about this application…"
          data-testid="input-agent-message"
          className="flex-1 resize-none text-[12.5px] leading-snug bg-[var(--ops-inset)] border border-[var(--ops-strong-border)] rounded-[5px] px-2.5 py-2 focus:outline-none focus:border-[var(--ops-accent)]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          data-testid="button-agent-send"
          aria-label="Send"
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[5px] bg-[var(--ops-accent)] text-white disabled:opacity-40"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
