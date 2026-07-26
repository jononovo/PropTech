import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowUp, Search, FileText, List, Database, X } from 'lucide-react';

/**
 * Case assistant — chat panel scoped to one application (qa-agent spec).
 * Slide-over on the right; conversation lives in component state only
 * (server is stateless; closing the panel keeps the thread until unmount).
 */

const TOOL_META: Record<string, { label: string; icon: typeof Search }> = {
  lookup_application: { label: 'Checked the application record', icon: Database },
  list_corpus: { label: 'Listed the document corpus', icon: List },
  grep_corpus: { label: 'Searched the documents', icon: Search },
  read_corpus: { label: 'Read a document', icon: FileText },
};

export function AgentPanel({ applicationId, onClose }: { applicationId: string; onClose: () => void }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: `${base}/api/applications/${applicationId}/agent/chat` }),
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
        <span className="ops-mono text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] text-[var(--ops-muted)]">READ-ONLY</span>
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
                        {p.text}
                      </div>
                    );
                  }
                  if (p.type.startsWith('tool-')) {
                    const meta = TOOL_META[p.type.slice(5)];
                    if (!meta) return null;
                    const done = 'state' in p && p.state === 'output-available';
                    const Icon = meta.icon;
                    return (
                      <div key={i} className="inline-flex items-center gap-1.5 mr-1.5 ops-mono text-[9.5px] px-1.5 py-0.5 rounded-[3px] bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] text-[var(--ops-muted)]">
                        <Icon className="w-[10px] h-[10px]" />
                        {meta.label}
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
