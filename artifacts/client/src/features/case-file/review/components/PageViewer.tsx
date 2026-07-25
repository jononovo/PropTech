import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { pageImageUrl } from '../reviewModel';

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

export function PageImage({ appId, runId, page }: { appId: string; runId: string; page: number }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  useEffect(() => setState('loading'), [page, runId]);

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
        <img
          key={`${runId}-${page}`}
          src={pageImageUrl(appId, runId, page)}
          alt={`Page ${page}`}
          data-testid="img-review-page"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          className={`max-h-full max-w-full object-contain bg-white rounded-[2px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-opacity ${
            state === 'ok' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
