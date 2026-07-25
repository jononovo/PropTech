import { useLocation } from 'wouter';

/** Small structural pieces of the review room — extracted verbatim from ReviewPage (step-0 split). */

export function Room({ children }: { children: React.ReactNode }) {
  return (
    <div className="case-root fixed inset-0 z-50 flex flex-col overflow-hidden" data-testid="page-review-room">
      {children}
    </div>
  );
}

export function CenterCard({ title, body, backTo }: { title: string; body?: string; backTo?: string }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white border border-[var(--ops-border)] rounded-[6px] p-6 max-w-[420px] text-center">
        <div className="font-semibold text-[15px] text-[var(--ops-ink)] mb-1.5">{title}</div>
        {body && <p className="text-[12.5px] text-[var(--ops-body-sec)] leading-relaxed mb-4">{body}</p>}
        {backTo && (
          <button onClick={() => setLocation(backTo)} data-testid="button-back-intake" className="btn-primary">
            Back to Intake
          </button>
        )}
      </div>
    </div>
  );
}

export function ModeButton({
  active,
  onClick,
  testid,
  children,
}: {
  active: boolean;
  onClick: () => void;
  testid: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`px-2.5 md:px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-[2px] transition-colors ${
        active
          ? 'bg-white shadow-sm text-[var(--ops-ink)] border border-[var(--ops-border)]'
          : 'text-[var(--ops-muted)] hover:text-[var(--ops-ink)] border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

export function ScoreChip({ label, value, invert = false }: { label: string; value?: number; invert?: boolean }) {
  if (value == null) {
    // honest absence — this run's plan skipped the score; never render a fake 0
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[var(--ops-inset)] border border-[var(--ops-border)]"
        title="not scored this run"
      >
        <span className="micro-label text-[9px]">{label}</span>
        <span className="ops-mono text-[11.5px] font-medium text-[var(--ops-faint)]">—</span>
      </div>
    );
  }
  const pct = Math.round(value * 100);
  const color = invert
    ? pct >= 30
      ? 'text-[var(--ops-critical-text)]'
      : pct >= 15
        ? 'text-[var(--ops-warning-text)]'
        : 'text-[var(--ops-ink)]'
    : pct < 60
      ? 'text-[var(--ops-critical-text)]'
      : pct < 90
        ? 'text-[var(--ops-warning-text)]'
        : 'text-[var(--ops-ink)]';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[var(--ops-inset)] border border-[var(--ops-border)]">
      <span className="micro-label text-[9px]">{label}</span>
      <span className={`ops-mono text-[11.5px] font-medium ${color}`}>{pct}</span>
    </div>
  );
}
