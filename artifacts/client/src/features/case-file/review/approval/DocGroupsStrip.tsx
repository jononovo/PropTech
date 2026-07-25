import { useEffect, useRef, useState } from 'react';
import { Check, Flag, Link as LinkIcon, X } from 'lucide-react';
import { pageImageUrl } from '../reviewModel';
import type { DocGroup, PageDecisionValue } from './docGroups';

/**
 * Grouped filmstrip — the whole application's working set, A1 treatment.
 * Visual grammar: color bands + title chips = analyzer split one file into
 * documents (a claim). Standalone one-document packets get no color.
 * Approved groups collapse to grayed chips; "show all" reveals them.
 * The rail is the ONLY confirm surface — the strip records page pre-steps.
 */

const PALETTE = [
  { bg: 'bg-sky-50/70', border: 'border-sky-300', text: 'text-sky-700' },
  { bg: 'bg-purple-50/70', border: 'border-purple-300', text: 'text-purple-700' },
  { bg: 'bg-teal-50/70', border: 'border-teal-300', text: 'text-teal-700' },
  { bg: 'bg-rose-50/70', border: 'border-rose-300', text: 'text-rose-700' },
  { bg: 'bg-indigo-50/70', border: 'border-indigo-300', text: 'text-indigo-700' },
  { bg: 'bg-amber-50/70', border: 'border-amber-300', text: 'text-amber-700' },
];
const NEUTRAL = { bg: 'bg-white/60', border: 'border-[var(--ops-border)]', text: 'text-[var(--ops-body-sec)]' };

export function DocGroupsStrip({
  appId,
  runId,
  groups,
  activePage,
  selectedGroupId,
  decisions,
  onPageClick,
  onGroupSelect,
  onDecide,
  onLink,
}: {
  appId: string;
  runId: string;
  groups: DocGroup[];
  activePage: number;
  selectedGroupId: string | null;
  decisions: Record<string, Record<number, PageDecisionValue>>;
  onPageClick: (page: number) => void;
  onGroupSelect: (id: string) => void;
  onDecide: (groupId: string, page: number, value: PageDecisionValue) => void;
  onLink: (aId: string, bId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const activeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selectedGroupId, activePage]);

  const settledCount = groups.filter((g) => g.settled).length;
  const visible = showAll ? groups : groups.filter((g) => !g.settled);

  return (
    <div className="h-[128px] md:h-[152px] bg-[var(--ops-inset)] border-t border-[var(--ops-border)] flex items-end gap-3 px-3 pb-2.5 pt-7 overflow-x-auto overflow-y-hidden shrink-0">
      {settledCount > 0 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          data-testid="toggle-show-settled"
          className="shrink-0 self-center ops-mono text-[9.5px] uppercase tracking-wider text-[var(--ops-muted)] hover:text-[var(--ops-ink)] border border-[var(--ops-border)] bg-white rounded-[3px] px-1.5 py-1 [writing-mode:vertical-rl] rotate-180"
        >
          {showAll ? 'open only' : `show all · ${settledCount} ✓`}
        </button>
      )}
      {visible.map((g, i) => {
        const isSettled = !!g.settled;
        if (isSettled && !expanded.has(g.id)) {
          // collapsed chip: "Chase Jan ✓ · 3 pp"
          const outcome = g.settled!.outcome;
          return (
            <button
              key={g.id}
              onClick={() => setExpanded((s) => new Set(s).add(g.id))}
              data-testid={`chip-settled-${g.pages[0]}`}
              className="shrink-0 self-center flex items-center gap-1.5 bg-white border border-[var(--ops-border)] rounded-[4px] px-2.5 py-2 text-[11px] text-[var(--ops-muted)] hover:text-[var(--ops-ink)] hover:border-[var(--ops-strong-border)] transition-colors"
              title="Expand pages"
            >
              <span className="font-medium truncate max-w-[130px]">{g.title}</span>
              {outcome === 'rejected' ? (
                <X className="w-3 h-3 text-[var(--ops-critical-solid)] stroke-[3]" />
              ) : outcome === 'approved_incomplete' ? (
                <Flag className="w-3 h-3 text-[var(--ops-warning-solid)]" />
              ) : (
                <Check className="w-3 h-3 text-[var(--ops-ok-text)] stroke-[3]" />
              )}
              <span className="ops-mono text-[9.5px]">
                {g.pageList.length} pp
              </span>
            </button>
          );
        }
        const palette = g.colorSlot >= 0 ? PALETTE[g.colorSlot % PALETTE.length] : NEUTRAL;
        const selected = g.id === selectedGroupId;
        const next = visible[i + 1];
        const linkable = !isSettled && next && !next.settled && g.pages[1] + 1 === next.pages[0];
        return (
          <div key={g.id} className="flex items-end gap-3 shrink-0" ref={selected ? activeRef : undefined}>
            <div
              className={`flex gap-1.5 p-1.5 rounded-[4px] relative border transition-all ${palette.bg} ${
                selected
                  ? 'border-[var(--ops-accent)] shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
                  : `${palette.border}`
              } ${isSettled ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
            >
              <button
                onClick={() => onGroupSelect(g.id)}
                data-testid={`chip-group-${g.pages[0]}`}
                className="absolute -top-[21px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden cursor-pointer text-left"
                title={`${g.title} · pp. ${g.pages[0]}–${g.pages[1]}`}
              >
                <span className={`text-[10.5px] font-bold truncate min-w-0 ${selected ? 'text-[var(--ops-accent)]' : palette.text}`}>
                  {g.title}
                </span>
                {g.merged && <LinkIcon className="w-3 h-3 shrink-0 text-[var(--ops-muted)]" />}
                {g.band && !isSettled && (
                  <span
                    className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                      g.band === 'hold' ? 'bg-[var(--ops-critical-solid)]' : 'bg-[var(--ops-warning-solid)]'
                    }`}
                  />
                )}
                {isSettled && <Check className="w-3.5 h-3.5 text-[var(--ops-ok-text)] stroke-[3] shrink-0" />}
              </button>
              {g.pageList.map((p) => (
                <StripThumb
                  key={p}
                  appId={appId}
                  runId={runId}
                  page={p}
                  active={p === activePage && !selectedGroupId}
                  decision={decisions[g.id]?.[p]}
                  settled={isSettled}
                  onClick={() => onPageClick(p)}
                  onDecide={(v) => onDecide(g.id, p, v)}
                />
              ))}
            </div>
            {linkable && (
              <button
                onClick={() => onLink(g.id, next.id)}
                data-testid={`button-link-${g.pages[1]}`}
                className="self-center shrink-0 w-7 h-7 -mx-1.5 rounded-full bg-white border border-[var(--ops-border)] flex items-center justify-center text-[var(--ops-faint)] hover:text-[var(--ops-accent)] hover:border-[var(--ops-accent)] transition-colors"
                title="Link as one document"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
      <div className="w-4 shrink-0" />
    </div>
  );
}

function StripThumb({
  appId,
  runId,
  page,
  active,
  decision,
  settled,
  onClick,
  onDecide,
}: {
  appId: string;
  runId: string;
  page: number;
  active: boolean;
  decision?: PageDecisionValue;
  settled: boolean;
  onClick: () => void;
  onDecide: (v: PageDecisionValue) => void;
}) {
  return (
    <div
      className={`relative w-[52px] h-[68px] md:w-[62px] md:h-[82px] shrink-0 bg-white border overflow-visible transition-all group/thumb cursor-pointer ${
        active
          ? 'border-[var(--ops-accent)] ring-1 ring-[var(--ops-accent)]'
          : 'border-[var(--ops-border)] hover:border-[var(--ops-strong-border)]'
      }`}
      onClick={onClick}
      data-testid={`strip-thumb-${page}`}
    >
      <img
        src={pageImageUrl(appId, runId, page, 'strip')}
        alt=""
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover object-top transition-all ${
          !settled ? 'group-hover/thumb:blur-[1px] group-hover/thumb:opacity-40' : ''
        }`}
      />
      <span
        className={`absolute bottom-0.5 left-0.5 px-1 rounded-[2px] ops-mono text-[9px] leading-[14px] z-10 ${
          active ? 'bg-[var(--ops-accent)] text-white' : 'bg-white/90 text-[var(--ops-muted)] border border-[var(--ops-border)]'
        }`}
      >
        {page}
      </span>
      {decision === 'good' && (
        <span className="absolute top-0.5 right-0.5 bg-[var(--ops-ok-text)] rounded-full p-[2px] z-10">
          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
        </span>
      )}
      {decision === 'flag_accepted' && (
        <span className="absolute top-0.5 right-0.5 bg-[var(--ops-warning-solid)] rounded-full p-[2px] z-10">
          <Flag className="w-2.5 h-2.5 text-white fill-white" />
        </span>
      )}
      {decision === 'bad' && (
        <>
          <span className="absolute top-0.5 right-0.5 bg-[var(--ops-critical-solid)] rounded-full p-[2px] z-10">
            <X className="w-2.5 h-2.5 text-white stroke-[3]" />
          </span>
          <span className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            <span className="absolute w-[150%] h-px bg-[var(--ops-critical-solid)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-60" />
          </span>
        </>
      )}
      {/* hover ✓/✕/⚑ cluster — centered floating pill (A1), the page pre-step, no popups */}
      {!settled && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover/thumb:flex items-center bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full border border-[var(--ops-border)] p-0.5 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecide('good');
            }}
            data-testid={`decide-good-${page}`}
            className="p-1 rounded-full text-[var(--ops-muted)] hover:text-[var(--ops-ok-text)] hover:bg-[var(--ops-ok-wash)] transition-colors"
            title="Good"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-[var(--ops-border)] mx-px" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecide('bad');
            }}
            data-testid={`decide-bad-${page}`}
            className="p-1 rounded-full text-[var(--ops-muted)] hover:text-[var(--ops-critical-solid)] hover:bg-[var(--ops-critical-wash)] transition-colors"
            title="Not good"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-[var(--ops-border)] mx-px" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecide('flag_accepted');
            }}
            data-testid={`decide-flag-${page}`}
            className="p-1 rounded-full text-[var(--ops-muted)] hover:text-[var(--ops-warning-text)] hover:bg-[var(--ops-warning-wash)] transition-colors"
            title="Accept with flag retained"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
