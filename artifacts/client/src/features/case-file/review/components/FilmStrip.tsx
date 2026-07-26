import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import type { ReviewModel } from '../reviewModel';

/** Bottom filmstrip — extracted verbatim from ReviewPage (step-0 split). */

const stripBar = (band: 'hold' | 'attend' | 'clean') =>
  band === 'hold'
    ? 'bg-[var(--ops-critical-solid)]'
    : band === 'attend'
      ? 'bg-[var(--ops-warning-solid)]'
      : 'bg-transparent';

export function FilmStrip({
  mode,
  review,
  pos,
  ack,
  onJump,
  imageUrl,
}: {
  mode: 'priority' | 'all';
  review: ReviewModel;
  pos: number;
  ack: Set<number>;
  onJump: (i: number) => void;
  imageUrl: (globalPage: number, size?: 'full' | 'thumb') => string;
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
              src={imageUrl(it.page, 'thumb')}
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
