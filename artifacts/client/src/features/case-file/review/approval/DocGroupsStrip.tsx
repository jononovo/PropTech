import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Flag, ImageOff, Link as LinkIcon, X } from 'lucide-react';
import { pageImageUrl } from '../reviewModel';
import type { DocGroup, MergeDecision, PageDecisionValue } from './docGroups';
import { mergePairKey } from './docGroups';

/**
 * Grouped filmstrip — A1 card treatment. Each group is a full card: header
 * band (title + subtitle, the whole band is the click target) over the page
 * thumbnails. Approved cards stay in place, grayed, with a header check —
 * nothing collapses or hides. Hovering an open card's header (after a beat)
 * reveals an inline approve bubble, so a whole document can be approved
 * without entering the rail. Merge affordances appear ONLY where the analyzer
 * recommends one; a pending recommendation gates approval until resolved.
 */

const PALETTE = [
  { bg: 'bg-sky-50/70', border: 'border-sky-200', text: 'text-sky-800', divider: 'border-sky-100' },
  { bg: 'bg-purple-50/70', border: 'border-purple-200', text: 'text-purple-800', divider: 'border-purple-100' },
  { bg: 'bg-teal-50/70', border: 'border-teal-200', text: 'text-teal-800', divider: 'border-teal-100' },
  { bg: 'bg-rose-50/70', border: 'border-rose-200', text: 'text-rose-800', divider: 'border-rose-100' },
  { bg: 'bg-indigo-50/70', border: 'border-indigo-200', text: 'text-indigo-800', divider: 'border-indigo-100' },
  { bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-800', divider: 'border-amber-100' },
];
const NEUTRAL = {
  bg: 'bg-white/70',
  border: 'border-[var(--ops-border)]',
  text: 'text-[var(--ops-body-sec)]',
  divider: 'border-[var(--ops-border)]',
};

export function DocGroupsStrip({
  appId,
  runId,
  groups,
  activePage,
  selectedGroupId,
  decisions,
  mergeRes,
  onPageClick,
  onGroupSelect,
  onDecide,
  onLink,
  onResolveMerge,
  onQuickApprove,
}: {
  appId: string;
  runId: string;
  groups: DocGroup[];
  activePage: number;
  selectedGroupId: string | null;
  decisions: Record<string, Record<number, PageDecisionValue>>;
  mergeRes: Record<string, MergeDecision>;
  onPageClick: (page: number) => void;
  onGroupSelect: (id: string) => void;
  onDecide: (groupId: string, page: number, value: PageDecisionValue) => void;
  onLink: (aId: string, bId: string) => void;
  onResolveMerge: (aId: string, bId: string, decision: MergeDecision) => void;
  onQuickApprove: (group: DocGroup) => void;
}) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selectedGroupId, activePage]);

  return (
    <div className="h-[136px] md:h-[156px] bg-[var(--ops-inset)] border-t border-[var(--ops-border)] flex items-stretch gap-3 px-3 py-2.5 overflow-x-auto overflow-y-hidden shrink-0">
      {groups.map((g, i) => {
        const isSettled = !!g.settled;
        const palette = g.colorSlot >= 0 && !isSettled ? PALETTE[g.colorSlot % PALETTE.length] : NEUTRAL;
        const selected = g.id === selectedGroupId;
        const partner = g.mergeWith ? groups.find((x) => x.id === g.mergeWith) : undefined;
        const pairKey = partner ? mergePairKey(g.id, partner.id) : null;
        const mergeState: MergeDecision | 'pending' | null = pairKey
          ? (mergeRes[pairKey] as MergeDecision | undefined) ?? 'pending'
          : null;
        const partnerAdjacent =
          !!partner && (g.pages[1] + 1 === partner.pages[0] || partner.pages[1] + 1 === g.pages[0]);
        const next = groups[i + 1];
        const betweenPair = partner && partnerAdjacent && next && partner.id === next.id;
        const mergeBlocked = !!partner && mergeState === 'pending';
        const outcome = g.settled?.outcome;

        return (
          <div key={g.id} className="flex items-stretch gap-3 shrink-0" ref={selected ? activeRef : undefined}>
            <div
              className={`flex flex-col w-min rounded-md border relative transition-all ${palette.bg} ${
                selected
                  ? 'border-[var(--ops-accent)] shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
                  : palette.border
              } ${isSettled ? 'opacity-70 hover:opacity-100' : ''}`}
              data-testid={`group-card-${g.pages[0]}`}
            >
              {/* header band — the whole band selects the group */}
              <div
                onClick={() => onGroupSelect(g.id)}
                data-testid={`chip-group-${g.pages[0]}`}
                className={`group/hdr relative w-full min-w-0 px-2 py-1 border-b ${palette.divider} bg-white/50 hover:bg-white/80 rounded-t-md flex items-center justify-between gap-1.5 min-h-[30px] cursor-pointer transition-colors`}
                title={`${g.title} · pp. ${g.pages[0]}–${g.pages[1]}`}
              >
                <div className="flex flex-col min-w-0 leading-tight">
                  <span
                    className={`text-[10.5px] font-bold truncate ${selected ? 'text-[var(--ops-accent)]' : palette.text}`}
                  >
                    {g.title}
                  </span>
                  {g.subtitle && (
                    <span className="text-[8.5px] uppercase tracking-wide truncate text-[var(--ops-muted)]">
                      {g.subtitle}
                    </span>
                  )}
                </div>
                {g.merged && <LinkIcon className="w-3 h-3 shrink-0 text-[var(--ops-muted)]" />}
                {isSettled &&
                  (outcome === 'rejected' ? (
                    <X className="w-3.5 h-3.5 shrink-0 text-[var(--ops-critical-solid)] stroke-[3]" />
                  ) : outcome === 'approved_incomplete' ? (
                    <Flag className="w-3.5 h-3.5 shrink-0 text-[var(--ops-warning-solid)] fill-[var(--ops-warning-wash)]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ops-ok-text)]" />
                  ))}

                {/* inline approve bubble — over the thumbnails, after a beat */}
                {!isSettled && (
                  <div className="absolute left-0 top-full mt-1 min-w-[200px] max-w-[260px] bg-white rounded-md shadow-[0_8px_30px_rgba(0,0,0,0.14)] border border-[var(--ops-border)] p-2.5 z-40 opacity-0 pointer-events-none transition-opacity duration-150 delay-0 group-hover/hdr:opacity-100 group-hover/hdr:pointer-events-auto group-hover/hdr:delay-[700ms]">
                    <div className="text-[11.5px] font-medium text-[var(--ops-ink)] leading-snug mb-2">
                      Approve {g.title} (pp. {g.pages[0]}–{g.pages[1]})?
                    </div>
                    {mergeBlocked ? (
                      <div className="text-[10.5px] text-[var(--ops-warning-text)] leading-snug">
                        Merge suggested with pp. {partner!.pages[0]}–{partner!.pages[1]} — resolve it first.
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGroupSelect(g.id);
                          }}
                          className="text-[10.5px] text-[var(--ops-accent)] hover:underline font-medium whitespace-nowrap"
                          data-testid={`bubble-review-${g.pages[0]}`}
                        >
                          review page-by-page →
                        </button>
                        {g.blockId && !g.needsVariant ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickApprove(g);
                            }}
                            className="btn-primary !py-1 !px-2 !text-[10.5px] whitespace-nowrap"
                            data-testid={`bubble-approve-${g.pages[0]}`}
                          >
                            Approve document
                          </button>
                        ) : (
                          <span className="text-[10px] text-[var(--ops-muted)] whitespace-nowrap">file in the rail</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* thumbnails */}
              <div className={`p-1.5 flex gap-1.5 items-end flex-1 ${isSettled ? 'grayscale-[0.6]' : ''}`}>
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

              {/* non-adjacent recommended merge: hop-over icon on the facing edge */}
              {partner && !partnerAdjacent && !isSettled && (
                <MergeIcon
                  side={partner.pages[0] > g.pages[0] ? 'right' : 'left'}
                  state={mergeState!}
                  partnerLabel={`pp. ${partner.pages[0]}–${partner.pages[1]}`}
                  onJump={() => onGroupSelect(partner.id)}
                  onResolve={(d) => onResolveMerge(g.id, partner.id, d)}
                  testid={`button-merge-hop-${g.pages[0]}`}
                />
              )}
            </div>

            {/* adjacent recommended merge: link affordance between the two cards */}
            {betweenPair && !isSettled && !next.settled && (
              <MergeIcon
                side="between"
                state={mergeState!}
                partnerLabel="adjacent"
                onJump={() => onLink(g.id, next.id)}
                onResolve={(d) => {
                  onResolveMerge(g.id, next.id, d);
                  if (d === 'merged') onLink(g.id, next.id);
                }}
                testid={`button-link-${g.pages[1]}`}
              />
            )}
          </div>
        );
      })}
      <div className="w-4 shrink-0" />
    </div>
  );
}

/**
 * Merge affordance with its own tiny decision cluster (Merge / Dismiss).
 * Dismissed grays out but never disappears — the reviewer may change their
 * mind. For non-adjacent pairs, clicking the icon hops to the partner group.
 */
function MergeIcon({
  side,
  state,
  partnerLabel,
  onJump,
  onResolve,
  testid,
}: {
  side: 'left' | 'right' | 'between';
  state: MergeDecision | 'pending';
  partnerLabel: string;
  onJump: () => void;
  onResolve: (d: MergeDecision) => void;
  testid: string;
}) {
  const pos =
    side === 'between'
      ? 'self-center -mx-1.5 relative'
      : `absolute top-1/2 -translate-y-1/2 z-30 ${side === 'right' ? '-right-3' : '-left-3'}`;
  const look =
    state === 'merged'
      ? 'bg-[var(--ops-accent)] border-[var(--ops-accent)] text-white'
      : state === 'dismissed'
        ? 'bg-white border-[var(--ops-border)] text-[var(--ops-faint)]'
        : 'bg-white border-dashed border-[var(--ops-accent)] text-[var(--ops-accent)]';
  return (
    <div className={`${pos} group/merge shrink-0`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onJump();
        }}
        data-testid={testid}
        title={
          state === 'dismissed'
            ? `Merge suggestion dismissed (${partnerLabel}) — hover to change your mind`
            : state === 'merged'
              ? `Linked with ${partnerLabel}`
              : side === 'between'
                ? 'Recommended merge — link as one document'
                : `Recommended merge — same requirement as ${partnerLabel}. Click to jump.`
        }
        className={`w-7 h-7 rounded-full border flex items-center justify-center shadow-sm transition-colors ${look}`}
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>
      {/* hover cluster: Merge / Dismiss */}
      {state !== 'merged' && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 flex items-center bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full border border-[var(--ops-border)] p-0.5 z-40 opacity-0 pointer-events-none transition-opacity duration-150 delay-0 group-hover/merge:opacity-100 group-hover/merge:pointer-events-auto group-hover/merge:delay-[500ms]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResolve('merged');
            }}
            data-testid={`${testid}-accept`}
            className="p-1 rounded-full text-[var(--ops-muted)] hover:text-[var(--ops-ok-text)] hover:bg-[var(--ops-ok-wash)] transition-colors"
            title="Merge — these are one document"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-[var(--ops-border)] mx-px" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResolve('dismissed');
            }}
            data-testid={`${testid}-dismiss`}
            className="p-1 rounded-full text-[var(--ops-muted)] hover:text-[var(--ops-critical-solid)] hover:bg-[var(--ops-critical-wash)] transition-colors"
            title="Dismiss — they are separate documents"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
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
  const [broken, setBroken] = useState(false);
  return (
    <div
      className={`relative w-[52px] h-[68px] md:w-[62px] md:h-[82px] shrink-0 bg-white border overflow-visible transition-all group/thumb cursor-pointer rounded-[2px] ${
        active
          ? 'border-[var(--ops-accent)] ring-1 ring-[var(--ops-accent)]'
          : 'border-[var(--ops-border)] hover:border-[var(--ops-strong-border)]'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      data-testid={`strip-thumb-${page}`}
    >
      {broken ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--ops-inset)]">
          <ImageOff className="w-4 h-4 text-[var(--ops-faint)]" />
          <span className="ops-mono text-[8px] text-[var(--ops-faint)] uppercase tracking-wider">no scan</span>
        </div>
      ) : (
        <img
          src={pageImageUrl(appId, runId, page, 'strip')}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-150 delay-0 ${
            !settled ? 'group-hover/thumb:blur-[1px] group-hover/thumb:opacity-40 group-hover/thumb:delay-[700ms]' : ''
          }`}
        />
      )}
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
      {/* hover ✓/✕/⚑ cluster — centered floating pill, the page pre-step */}
      {!settled && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full border border-[var(--ops-border)] p-0.5 z-20 opacity-0 pointer-events-none transition-opacity duration-150 delay-0 group-hover/thumb:opacity-100 group-hover/thumb:pointer-events-auto group-hover/thumb:delay-[700ms]">
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
