import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

/** Center pane pieces — extracted verbatim from ReviewPage (step-0 split). */

export function AllClear({ onAll, onReport }: { onAll: () => void; onReport: () => void }) {
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

/** Fractional page-space rectangle (0..1 of the page) — from the citation resolver. */
export type HighlightBox = { x: number; y: number; w: number; h: number };

export function PageImage({
  runId,
  page,
  imageUrl,
  highlight,
}: {
  runId: string;
  /** global page number (view currency); imageUrl resolves it to (fileId, page) */
  page: number;
  imageUrl: (globalPage: number, size?: 'full' | 'thumb') => string;
  /** citation highlight boxes for THIS page (already filtered by the caller) */
  highlight?: HighlightBox[] | null;
}) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);
  // rendered image rect (relative to the pane) — measured, because the img is
  // fit-to-screen via max-h/max-w and %-overlays have no reliable anchor box
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    setState('loading');
    setRect(null);
  }, [page, runId]);

  const measure = () => {
    const img = imgRef.current;
    const pane = img?.parentElement;
    if (!img || !pane) return;
    const ir = img.getBoundingClientRect();
    const pr = pane.getBoundingClientRect();
    setRect({ left: ir.left - pr.left, top: ir.top - pr.top, width: ir.width, height: ir.height });
  };

  useEffect(() => {
    if (state !== 'ok' || !highlight?.length) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [state, highlight]);

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
        <>
          <img
            ref={imgRef}
            key={`${runId}-${page}`}
            src={imageUrl(page)}
            alt={`Page ${page}`}
            data-testid="img-review-page"
            onLoad={() => {
              setState('ok');
              measure();
            }}
            onError={() => setState('error')}
            className={`max-h-full max-w-full object-contain bg-white rounded-[2px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-opacity ${
              state === 'ok' ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {state === 'ok' &&
            rect &&
            (highlight ?? []).map((b, i) => (
              <div
                key={i}
                data-testid="citation-highlight"
                className="absolute pointer-events-none rounded-[2px] border-2 border-[var(--ops-accent)] bg-[rgba(59,130,246,0.18)] animate-pulse"
                style={{
                  left: rect.left + b.x * rect.width,
                  top: rect.top + b.y * rect.height,
                  width: b.w * rect.width,
                  height: b.h * rect.height,
                }}
              />
            ))}
        </>
      )}
    </div>
  );
}
