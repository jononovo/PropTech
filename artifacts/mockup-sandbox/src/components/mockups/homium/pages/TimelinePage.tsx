import React from "react";
import type { Go } from "../Backbone";
import { 
  liveClocks, 
  stoppedClocks, 
  band, 
  daysTo, 
  fmt, 
  daysToClose, 
  TODAY, 
  CLOSING 
} from "../data";
import { Bell, ShieldAlert, Lock, ArrowRight } from "lucide-react";
import "./TimelinePage.css";

// Timeline Axis Definitions
const START = new Date(2026, 6, 15); // Jul 15
const END = new Date(2026, 9, 15); // Oct 15
const TOTAL_MS = END.getTime() - START.getTime();

const getLeft = (date: Date) => {
  const percent = ((date.getTime() - START.getTime()) / TOTAL_MS) * 100;
  return Math.max(0, Math.min(100, percent));
};

const TODAY_PCT = getLeft(TODAY);
const CLOSING_PCT = getLeft(CLOSING);

const TICKS = [
  { label: "AUG 1", date: new Date(2026, 7, 1) },
  { label: "SEP 1", date: new Date(2026, 8, 1) },
  { label: "OCT 1", date: new Date(2026, 9, 1) }
];

export default function TimelinePage({ go }: { go: Go }) {
  const clocks = liveClocks();
  const stopped = stoppedClocks();
  let hasShownArgument = false;

  return (
    <div className="homium-timeline h-full overflow-y-auto flex flex-col pb-16">
      
      {/* HEADER */}
      <div className="flex justify-between items-end px-8 pt-10 pb-4">
        <div className="max-w-[480px]">
          <h1 className="hm-serif text-3xl text-ink font-medium mb-3">Document clocks</h1>
          <p className="text-[13px] text-ink-60 leading-relaxed">
            Every time-bound document on this file, and the date it stops being admissible. Beat the closing date — or refresh the document.
          </p>
        </div>
        <div className="text-right flex flex-col items-end pt-2">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="hm-mono text-[56px] leading-[0.8] text-ink tracking-tighter font-bold">{daysToClose}</span>
            <span className="hm-mono text-[13px] text-ink-60 tracking-tight">days to close &middot; target {fmt(CLOSING)}</span>
          </div>
          <div className="hm-mono text-[10px] text-ink-40 mt-2">
            alarm at &le;30d &middot; escalation at &le;7d
          </div>
        </div>
      </div>

      {/* ALARM NARRATIVE */}
      <div className="flex items-center gap-3 px-4 py-2.5 mx-8 mt-2 text-[13px] rounded-sm bg-[rgba(184,92,56,0.03)] border border-[rgba(184,92,56,0.15)] shadow-sm">
        <Bell size={14} className="text-clay shrink-0" />
        <span className="text-ink-80">
          Background check goes stale in <span className="hm-mono font-bold text-clay">6</span> days — if underwriting isn't cleared by Jul 29 it must be re-ordered (3–5 business days).
        </span>
        <button onClick={() => go("workfile")} className="font-medium text-clay hover:underline inline-flex items-center ml-1 shrink-0">
          Review it now <ArrowRight size={12} className="ml-1" />
        </button>
      </div>

      {/* THE CHART */}
      <div className="relative mx-8 mt-10 border border-[var(--hm-ink-15)] bg-surface shadow-[0_2px_12px_rgba(26,29,26,0.03)] rounded-sm">
        
        {/* Chart Header (Ticks & Labels) */}
        <div className="h-8 relative border-b hm-hairline-b bg-paper rounded-t-sm">
          <div className="absolute inset-y-0 left-[300px] right-[110px]">
            {TICKS.map(t => (
              <div key={t.label} className="absolute top-0 bottom-0 border-l border-[var(--hm-ink-15)]" style={{ left: `${getLeft(t.date)}%` }}>
                <div className="hm-mono text-[9px] text-ink-40 ml-1.5 mt-2">{t.label}</div>
              </div>
            ))}
            
            {/* TODAY Tag */}
            <div className="absolute top-0 bottom-0 border-l border-ink" style={{ left: `${TODAY_PCT}%` }}>
              <div className="absolute top-2 left-0 -translate-x-1/2 hm-mono text-[9px] text-ink font-bold px-1.5 bg-paper leading-none">TODAY</div>
            </div>
            
            {/* CLOSING Tag */}
            <div className="absolute top-0 bottom-0 border-l border-green" style={{ left: `${CLOSING_PCT}%` }}>
              <div className="absolute top-1.5 left-0 -translate-x-1/2 hm-mono text-[9px] text-surface bg-green px-1.5 py-[3px] rounded-[2px] leading-none whitespace-nowrap shadow-sm font-semibold">CLOSING &middot; SEP 3</div>
            </div>
          </div>
        </div>

        {/* Chart Body */}
        <div className="relative py-2 rounded-b-sm bg-surface">
          
          {/* Vertical Guides Layer */}
          <div className="absolute inset-y-0 left-[300px] right-[110px] pointer-events-none z-0">
            {TICKS.map(t => (
              <div key={t.label} className="absolute top-0 bottom-0 border-l border-[var(--hm-ink-5)]" style={{ left: `${getLeft(t.date)}%` }} />
            ))}
            <div className="absolute top-0 bottom-0 border-l border-ink border-opacity-30" style={{ left: `${TODAY_PCT}%` }} />
            <div className="absolute top-0 bottom-0 border-l border-green opacity-30" style={{ left: `${CLOSING_PCT}%` }} />
          </div>

          {/* Rows Layer */}
          <div className="relative z-10 flex flex-col">
            {clocks.map((c) => {
              const req = c.req;
              const expiry = req.expiry!;
              const stalePct = getLeft(expiry.staleOn);
              const b = band(c.days);
              const isBeforeClosing = expiry.staleOn.getTime() < CLOSING.getTime();
              
              const showArgumentWhisper = isBeforeClosing && !hasShownArgument;
              if (isBeforeClosing) hasShownArgument = true;

              return (
                <div 
                  key={req.id}
                  className="flex items-center h-[54px] relative group hover:bg-white transition-colors cursor-pointer border-b border-[var(--hm-ink-5)] last:border-none"
                  onClick={() => go("workfile")}
                >
                  {/* Hover shadow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[0_2px_8px_rgba(26,29,26,0.04)] pointer-events-none transition-opacity" />
                  
                  {/* Left Column: Name & Rule */}
                  <div className="w-[330px] shrink-0 pl-5 pr-4 flex flex-col justify-center h-full relative z-10">
                    <div className="text-[13px] font-medium text-ink flex items-center gap-1.5 truncate">
                      <span className="truncate">{req.name}</span>
                      {expiry.kind === "hard" && (
                        <span className="hm-mono text-[9px] px-1.5 py-0.5 bg-ink-5 text-ink-60 rounded-sm flex items-center gap-1 shrink-0 mt-[1px]">
                          HARD EXPIRY <ShieldAlert size={9} className="opacity-80" />
                        </span>
                      )}
                      {expiry.kind === "staleness" && (
                        <span className="hm-mono text-[9px] px-1.5 py-0.5 bg-ink-5 text-ink-60 rounded-sm hidden group-hover:inline-flex shrink-0 mt-[1px]">
                          stops on acceptance
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-60 truncate relative h-[16px] mt-0.5">
                      <span className="absolute inset-0 group-hover:opacity-0 transition-opacity block leading-[16px] truncate">{expiry.rule}</span>
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity text-clay block leading-[16px] truncate pr-2">{expiry.note}</span>
                    </div>
                  </div>

                  {/* Middle Column: Track */}
                  <div className="flex-1 h-full relative z-10 overflow-hidden">
                    
                    {/* Argument gap (dies before the deal) */}
                    {isBeforeClosing && (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 h-[6px] hm-clay-wash z-0"
                        style={{ left: `${stalePct}%`, width: `${CLOSING_PCT - stalePct}%` }}
                      >
                        {showArgumentWhisper && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-clay opacity-90 hm-serif italic">dies before the deal</div>
                        )}
                      </div>
                    )}

                    {/* Track Line */}
                    <div 
                      className={`absolute h-[2px] top-1/2 -translate-y-1/2 rounded-full track-${b} z-10`}
                      style={{ left: `${TODAY_PCT}%`, width: `${Math.max(0, stalePct - TODAY_PCT)}%` }} 
                    />
                    
                    {/* Terminal Dot */}
                    <div 
                      className={`absolute w-[7px] h-[7px] rounded-full track-${b} top-1/2 -translate-y-1/2 z-20`}
                      style={{ left: `${stalePct}%`, transform: 'translate(-50%, -50%)', border: '1px solid var(--hm-surface)' }}
                    />
                    
                    {/* Mono Date Label */}
                    <div 
                      className="absolute top-1/2 mt-[7px] hm-mono text-[9px] text-ink-60 whitespace-nowrap z-20"
                      style={stalePct > 97 ? { right: '8px' } : { left: `${stalePct}%`, transform: 'translateX(-50%)' }}
                    >
                      {stalePct > 97 ? `${fmt(expiry.staleOn)} →` : fmt(expiry.staleOn)}
                    </div>

                  </div>

                  {/* Right Column: Days Chip */}
                  <div className="w-[110px] shrink-0 pl-6 pr-5 flex items-center justify-end h-full relative z-10">
                    <div className={`hm-mono text-[11px] px-2 py-1 rounded-sm chip-${b} flex items-center justify-center min-w-[64px] whitespace-nowrap`}>
                      {c.days} days
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* STOPPED CLOCKS SHELF */}
      <div className="mx-8 mt-8 pt-4 pb-4 px-5 rounded-sm" style={{ backgroundColor: 'rgba(108, 130, 118, 0.05)', border: '1px solid rgba(108, 130, 118, 0.15)' }}>
        <div className="flex items-center gap-1.5 mb-4 text-watch text-[11px] font-bold hm-mono tracking-wide">
          <Lock size={11} className="mb-[1px]" />
          CLOCKS STOPPED &mdash; accepted by underwriting
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-[12px] text-ink-80">
          {stopped.map(c => (
            <div key={c.req.id} className="flex items-center gap-2 truncate">
              <Lock size={10} className="text-watch opacity-60 shrink-0" />
              <span className="truncate">{c.req.name} &mdash; <span className="text-ink-60">accepted {c.req.acceptedOn || "Jul 20"}</span></span>
            </div>
          ))}
        </div>
        <div className="mt-5 text-[11px] text-ink-60 hm-serif italic">
          Acceptance stops a staleness clock — these can no longer go stale. Hard expiries (ID validity, credit currency) stay on the board above.
        </div>
      </div>

      {/* FOOTER WHISPER */}
      <div className="mx-8 mt-6 mb-8 flex justify-between items-center text-[10px] text-ink-40 hm-mono">
        <div>
          296-page package received Jul 18 &middot; clocks recompute nightly &middot; escalations notify the owner role
        </div>
        <button onClick={() => go("register")} className="hover:text-ink transition-colors inline-flex items-center tracking-wide">
          open the Register <ArrowRight size={10} className="ml-1" />
        </button>
      </div>

    </div>
  );
}
