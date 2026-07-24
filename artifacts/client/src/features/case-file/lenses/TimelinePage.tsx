import { ArrowRight, Check } from 'lucide-react';
import { addDays, band, daysBetween, fmt, fmtTime, type CaseModel, type CaseReq } from '../caseData';
import type { Lens } from '../CaseShell';

const opsBand = (days: number) => {
  const b = band(days);
  return b === 'escalate' ? 'blocker' : b === 'warn' ? 'warning' : 'faint';
};

export function TimelinePage({
  model,
  onLens,
}: {
  model: CaseModel;
  onLens: (lens: Lens, sectionId?: string) => void;
}) {
  const { today, closing } = model;
  const clocks = model.liveClocks;

  // chart window: two weeks back through the actionable horizon. Hard
  // expiries far past closing (e.g. a passport) don't stretch the window —
  // their tracks run off the right edge, the day-count chip tells the story.
  const start = addDays(today, -14);
  const candidates = [addDays(today, 60)];
  if (closing) candidates.push(addDays(closing, 45));
  for (const r of clocks) {
    if (r.clock!.kind === 'staleness') candidates.push(addDays(r.clock!.staleOn, 15));
  }
  const end = new Date(Math.max(...candidates.map((d) => d.getTime())));
  const totalMs = end.getTime() - start.getTime();

  const getLeft = (date: Date) => Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / totalMs) * 100));

  const todayPct = getLeft(today);
  const closingPct = closing ? getLeft(closing) : null;

  const ticks: { key: string; label: string; date: Date }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (cursor.getTime() < end.getTime()) {
    ticks.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label: `${cursor.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} 1`,
      date: new Date(cursor),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  let shownDiesWhisper = false;

  return (
    <div className="h-full overflow-y-auto flex flex-col pb-12">
      {/* header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end px-4 md:px-6 pt-6 md:pt-8 pb-4 gap-3">
        <div className="max-w-[480px]">
          <h1 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.01em] text-[var(--ops-ink)] mb-1.5">
            Document Clocks
          </h1>
          <p className="text-[13px] text-[var(--ops-body-sec)] leading-relaxed">
            Every time-bound document, ranked by urgency. Clocks run on the dates confirmed at verdict.
          </p>
        </div>
        <div className="md:text-right flex flex-col md:items-end">
          {closing && model.daysToClose !== null ? (
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="ops-mono text-[18px] leading-none text-[var(--ops-ink)] font-medium">
                {model.daysToClose}
              </span>
              <span className="text-[12px] text-[var(--ops-body-sec)] font-medium">
                days to close · <span className="ops-mono text-[var(--ops-muted)]">target {fmt(closing)}</span>
              </span>
            </div>
          ) : (
            <div className="text-[12px] text-[var(--ops-muted)] mb-1">
              no closing target set — set one in the case header
            </div>
          )}
          <div className="micro-label text-[10px] mt-1">
            Alarm ≤<span className="ops-mono font-normal text-[var(--ops-warning-text)]">30d</span> · Escalation ≤
            <span className="ops-mono font-normal text-[var(--ops-critical-text)]">7d</span>
          </div>
        </div>
      </div>

      {/* the chart is the alert surface — no banners restating its rows */}
      {clocks.length === 0 ? (
        <div className="mx-4 md:mx-6 mt-2 border border-[var(--ops-border)] bg-white rounded-[4px] p-8 text-center">
          <div className="text-[13px] text-[var(--ops-muted)]">
            No live clocks — nothing time-bound is at risk right now.
          </div>
        </div>
      ) : (
        <div className="mx-4 md:mx-6 mt-2 overflow-x-auto">
          <div className="min-w-[840px] relative border border-[var(--ops-border)] bg-white rounded-[4px]">
            {/* chart header */}
            <div className="h-7 relative border-b border-[var(--ops-border)] bg-[var(--ops-inset)] rounded-t-[4px]">
              <div className="absolute inset-y-0 left-[330px] right-[110px]">
                {ticks.map((t) => (
                  <div
                    key={t.key}
                    className="absolute top-0 bottom-0 border-l border-[var(--ops-inner-rule)]"
                    style={{ left: `${getLeft(t.date)}%` }}
                  >
                    <div className="micro-label text-[10px] ml-1.5 mt-1.5">{t.label}</div>
                  </div>
                ))}
                <div className="absolute top-0 bottom-0 border-l-[1.5px] border-[var(--ops-accent)] z-20" style={{ left: `${todayPct}%` }}>
                  <div className="absolute top-1 left-0 -translate-x-1/2 ops-mono text-[9px] text-[var(--ops-accent)] font-medium px-1 bg-white border border-[var(--ops-accent-wash-border)] rounded-[2px] leading-tight whitespace-nowrap">
                    TODAY
                  </div>
                </div>
                {closingPct !== null && closing && (
                  <div className="absolute top-0 bottom-0 border-l-[1.5px] border-dashed border-[var(--ops-ink)] z-20" style={{ left: `${closingPct}%` }}>
                    <div className="absolute top-1 left-0 -translate-x-1/2 ops-mono text-[9px] text-white bg-[var(--ops-ink)] px-1.5 py-[2px] rounded-[2px] leading-tight whitespace-nowrap font-medium">
                      CLOSING · {fmt(closing).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* body */}
            <div className="relative py-[2px] rounded-b-[4px] bg-white">
              <div className="absolute inset-y-0 left-[330px] right-[110px] pointer-events-none z-0">
                {ticks.map((t) => (
                  <div key={t.key} className="absolute top-0 bottom-0 border-l border-[var(--ops-inner-rule)]" style={{ left: `${getLeft(t.date)}%` }} />
                ))}
                <div className="absolute top-0 bottom-0 border-l-[1.5px] border-[var(--ops-accent)] opacity-15" style={{ left: `${todayPct}%` }} />
                {closingPct !== null && (
                  <div className="absolute top-0 bottom-0 border-l-[1.5px] border-dashed border-[var(--ops-ink)] opacity-15" style={{ left: `${closingPct}%` }} />
                )}
              </div>

              <div className="relative z-10 flex flex-col">
                {clocks.map((req) => {
                  const clock = req.clock!;
                  const stalePct = getLeft(clock.staleOn);
                  const b = opsBand(clock.days);
                  const diesBeforeClosing = !!closing && clock.staleOn.getTime() < closing.getTime();
                  const showWhisper = diesBeforeClosing && !shownDiesWhisper;
                  if (diesBeforeClosing) shownDiesWhisper = true;

                  return (
                    <div
                      key={req.block.id}
                      className="flex items-center h-[46px] relative group hover:bg-[var(--ops-inset)] transition-colors cursor-pointer border-b border-[var(--ops-inner-rule)] last:border-none"
                      onClick={() => onLens('workfile', req.sectionId)}
                      data-testid={`clock-row-${req.block.id}`}
                    >
                      <div className="w-[330px] shrink-0 pl-4 pr-4 flex flex-col justify-center h-full relative z-10 border-r border-[var(--ops-inner-rule)]">
                        <div className="text-[12.5px] font-medium text-[var(--ops-ink)] flex items-center gap-1.5 truncate">
                          <span className="truncate">{req.block.name}</span>
                          {clock.kind === 'hard' ? (
                            <span className="text-[9px] font-semibold uppercase tracking-[0.04em] px-1 py-[1px] bg-[var(--ops-critical-wash)] text-[var(--ops-critical-text)] border border-[var(--ops-critical-border)] rounded-[3px] shrink-0 mt-[1px]">
                              HARD EXPIRY
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold uppercase tracking-[0.04em] px-1 py-[1px] bg-[var(--ops-inset)] text-[var(--ops-muted)] border border-[var(--ops-border)] rounded-[3px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-[1px]">
                              STOPS ON ACCEPT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--ops-body-sec)] truncate relative h-[16px] mt-[2px]">
                          <span className="absolute inset-0 group-hover:opacity-0 transition-opacity flex items-center">
                            <span className="truncate">{clock.rule}</span>
                          </span>
                          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--ops-accent)] flex items-center truncate pr-2">
                            {clock.note}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 h-full relative z-10 overflow-hidden">
                        {diesBeforeClosing && closingPct !== null && (
                          <div
                            className="absolute inset-y-[3px] bg-[var(--ops-critical-wash)] z-0 opacity-80"
                            style={{ left: `${stalePct}%`, width: `${Math.max(0, closingPct - stalePct)}%` }}
                          >
                            {showWhisper && (
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ops-critical-text)] opacity-90 mt-[3px]">
                                dies before deal
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          className={`absolute h-[2px] top-1/2 -translate-y-1/2 track-${b} z-10`}
                          style={{ left: `${todayPct}%`, width: `${Math.max(0, stalePct - todayPct)}%` }}
                        />
                        {stalePct < 99.5 ? (
                          <>
                            <div
                              className={`absolute w-[3px] h-[10px] track-${b} top-1/2 z-20`}
                              style={{ left: `${stalePct}%`, transform: 'translate(-50%, -50%)', borderRadius: '1px' }}
                            />
                            <div
                              className="absolute top-1/2 mt-[5px] ops-mono text-[9px] text-[var(--ops-muted)] whitespace-nowrap z-20"
                              style={{ left: `${Math.min(97, stalePct)}%`, transform: 'translateX(-50%)' }}
                            >
                              {fmt(clock.staleOn)}
                            </div>
                          </>
                        ) : (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 right-1 ops-mono text-[9px] text-[var(--ops-muted)] whitespace-nowrap z-20"
                          >
                            {fmt(clock.staleOn)} →
                          </div>
                        )}
                      </div>

                      <div className="w-[110px] shrink-0 pl-4 pr-4 flex items-center justify-end h-full relative z-10 border-l border-[var(--ops-inner-rule)]">
                        <div className={`ops-mono text-[10.5px] px-[6px] py-[2px] rounded-[3px] chip-${b} flex items-center justify-center min-w-[56px] font-medium`}>
                          {clock.days} d
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* stopped clocks shelf */}
      {model.stoppedClocks.length > 0 && (
        <div className="mx-4 md:mx-6 mt-6 pt-3 pb-3 px-4 rounded-[4px] bg-[var(--ops-inset)] border border-[var(--ops-border)]">
          <div className="flex items-center gap-1.5 mb-2 micro-label text-[10px]">
            <Check size={12} className="text-[var(--ops-ok-text)] stroke-[3]" />
            CLOCKS STOPPED — accepted in underwriting
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[12px] text-[var(--ops-body-sec)]">
            {model.stoppedClocks.map((req) => (
              <div key={req.block.id} className="flex items-center gap-2 truncate">
                <Check size={11} className="text-[var(--ops-ok-text)] shrink-0 stroke-[3]" />
                <span className="truncate">
                  {req.block.name}
                  <span className="ops-mono text-[var(--ops-muted)] text-[11px] ml-1.5">
                    stopped {req.clock?.stoppedOn ? fmt(req.clock.stoppedOn) : ''}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* footer */}
      <div className="mx-4 md:mx-6 mt-4 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[11px] text-[var(--ops-muted)]">
        <div className="flex items-center gap-2.5">
          {model.run && (
            <>
              <span>
                Run received <span className="ops-mono">{fmtTime(new Date(model.run.startedAt))}</span>
              </span>
              <span className="text-[var(--ops-strong-border)]">|</span>
            </>
          )}
          <span>Clocks run on the dates confirmed at verdict</span>
        </div>
        <button
          onClick={() => onLens('register')}
          className="hover:text-[var(--ops-ink)] transition-colors inline-flex items-center font-medium"
        >
          Open Register <ArrowRight size={12} className="ml-1" />
        </button>
      </div>
    </div>
  );
}
