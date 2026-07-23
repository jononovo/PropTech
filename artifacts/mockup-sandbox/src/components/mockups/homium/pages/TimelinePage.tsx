import React from "react";
import type { Go } from "../Backbone";
import { 
  liveClocks, 
  stoppedClocks, 
  daysTo, 
  fmt, 
  daysToClose, 
  TODAY, 
  CLOSING 
} from "../data";
import { Bell, Check, ArrowRight } from "lucide-react";
import "./TimelinePage.css";

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

const getOpsBand = (days: number) => {
  if (days <= 7) return "blocker";
  if (days <= 30) return "warning";
  return "faint";
};

export default function TimelinePage({ go }: { go: Go }) {
  const clocks = liveClocks();
  const stopped = stoppedClocks();
  let hasShownArgument = false;

  return (
    <div className="homium-timeline h-full overflow-y-auto flex flex-col pb-12 bg-[#F3F5F7] text-[#0F172A]">
      
      {/* HEADER */}
      <div className="flex justify-between items-end px-6 pt-8 pb-4">
        <div className="max-w-[480px]">
          <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[#0F172A] mb-1.5">Document Clocks</h1>
          <p className="text-[13px] text-[#334155] leading-relaxed">
            Monitor time-bound documents and their admissibility status. Refresh documents before closing date to maintain compliance.
          </p>
        </div>
        <div className="text-right flex flex-col items-end pt-2">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="ops-mono text-[42px] leading-[0.8] text-[#0F172A] tracking-tight font-medium">{daysToClose}</span>
            <span className="text-[12px] text-[#334155] font-medium">days to close &middot; <span className="ops-mono text-[#64748B]">target {fmt(CLOSING)}</span></span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B] mt-2">
            Alarm &le;<span className="ops-mono font-normal text-[#B45309]">30d</span> &middot; Escalation &le;<span className="ops-mono font-normal text-[#B91C1C]">7d</span>
          </div>
        </div>
      </div>

      {/* ALARM NARRATIVE */}
      <div className="flex items-center gap-3 px-4 py-2 mx-6 mt-4 text-[13px] rounded-[4px] bg-[#FEF2F2] border border-[#FECACA]">
        <Bell size={14} className="text-[#B91C1C] shrink-0" />
        <span className="text-[#0F172A]">
          Background check goes stale in <span className="ops-mono font-medium text-[#B91C1C]">6</span> days — if underwriting isn't cleared by <span className="ops-mono">Jul 29</span> it must be re-ordered.
        </span>
        <button onClick={() => go("workfile")} className="font-medium text-[#1D4ED8] hover:text-[#1E40AF] inline-flex items-center ml-auto shrink-0 transition-colors">
          Review file <ArrowRight size={12} className="ml-1" />
        </button>
      </div>

      {/* THE CHART */}
      <div className="relative mx-6 mt-6 border border-[#E2E8F0] bg-[#FFFFFF] rounded-[4px] shadow-none">
        
        {/* Chart Header */}
        <div className="h-7 relative border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-[4px]">
          <div className="absolute inset-y-0 left-[330px] right-[110px]">
            {TICKS.map(t => (
              <div key={t.label} className="absolute top-0 bottom-0 border-l border-[#F1F5F9]" style={{ left: `${getLeft(t.date)}%` }}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B] ml-1.5 mt-1.5">{t.label}</div>
              </div>
            ))}
            
            {/* TODAY Tag */}
            <div className="absolute top-0 bottom-0 border-l-[1.5px] border-[#1D4ED8] z-20" style={{ left: `${TODAY_PCT}%` }}>
              <div className="absolute top-1 left-0 -translate-x-1/2 ops-mono text-[9px] text-[#1D4ED8] font-medium px-1 bg-[#FFFFFF] border border-[#BFDBFE] rounded-[2px] leading-tight whitespace-nowrap">TODAY</div>
            </div>
            
            {/* CLOSING Tag */}
            <div className="absolute top-0 bottom-0 border-l-[1.5px] border-dashed border-[#0F172A] z-20" style={{ left: `${CLOSING_PCT}%` }}>
              <div className="absolute top-1 left-0 -translate-x-1/2 ops-mono text-[9px] text-[#FFFFFF] bg-[#0F172A] px-1.5 py-[2px] rounded-[2px] leading-tight whitespace-nowrap font-medium">CLOSING &middot; SEP 3</div>
            </div>
          </div>
        </div>

        {/* Chart Body */}
        <div className="relative py-[2px] rounded-b-[4px] bg-[#FFFFFF]">
          
          {/* Gridlines */}
          <div className="absolute inset-y-0 left-[330px] right-[110px] pointer-events-none z-0">
            {TICKS.map(t => (
              <div key={t.label} className="absolute top-0 bottom-0 border-l border-[#F1F5F9]" style={{ left: `${getLeft(t.date)}%` }} />
            ))}
            <div className="absolute top-0 bottom-0 border-l-[1.5px] border-[#1D4ED8] opacity-15" style={{ left: `${TODAY_PCT}%` }} />
            <div className="absolute top-0 bottom-0 border-l-[1.5px] border-dashed border-[#0F172A] opacity-15" style={{ left: `${CLOSING_PCT}%` }} />
          </div>

          {/* Rows */}
          <div className="relative z-10 flex flex-col">
            {clocks.map((c) => {
              const req = c.req;
              const expiry = req.expiry!;
              const stalePct = getLeft(expiry.staleOn);
              const b = getOpsBand(c.days);
              const isBeforeClosing = expiry.staleOn.getTime() < CLOSING.getTime();
              
              const showArgumentWhisper = isBeforeClosing && !hasShownArgument;
              if (isBeforeClosing) hasShownArgument = true;

              return (
                <div 
                  key={req.id}
                  className="flex items-center h-[46px] relative group hover:bg-[#F8FAFC] transition-colors cursor-pointer border-b border-[#F1F5F9] last:border-none"
                  onClick={() => go("workfile")}
                >
                  {/* Left Column */}
                  <div className="w-[330px] shrink-0 pl-4 pr-4 flex flex-col justify-center h-full relative z-10 bg-transparent border-r border-[#F1F5F9]">
                    <div className="text-[12.5px] font-medium text-[#0F172A] flex items-center gap-1.5 truncate">
                      <span className="truncate">{req.name}</span>
                      {expiry.kind === "hard" && (
                        <span className="text-[9px] font-semibold uppercase tracking-[0.04em] px-1 py-[1px] bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] rounded-[3px] flex items-center shrink-0 mt-[1px]">
                          HARD EXPIRY
                        </span>
                      )}
                      {expiry.kind === "staleness" && (
                        <span className="text-[9px] font-semibold uppercase tracking-[0.04em] px-1 py-[1px] bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] rounded-[3px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-[1px]">
                          STOPS ON ACCEPT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#334155] truncate relative h-[16px] mt-[2px]">
                      <span className="absolute inset-0 group-hover:opacity-0 transition-opacity flex items-center"><span className="truncate">{expiry.rule}</span></span>
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#1D4ED8] flex items-center truncate pr-2">{expiry.note}</span>
                    </div>
                  </div>

                  {/* Track */}
                  <div className="flex-1 h-full relative z-10 overflow-hidden">
                    {/* Dies zone */}
                    {isBeforeClosing && (
                      <div 
                        className="absolute inset-y-[3px] bg-[#FEF2F2] z-0 opacity-80 border border-[#FECACA] border-y-0"
                        style={{ left: `${stalePct}%`, width: `${CLOSING_PCT - stalePct}%` }}
                      >
                        {showArgumentWhisper && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-[0.06em] text-[#B91C1C] opacity-90 mt-[3px]">
                            dies before deal
                          </div>
                        )}
                      </div>
                    )}

                    {/* Track Line */}
                    <div 
                      className={`absolute h-[2px] top-1/2 -translate-y-1/2 track-${b} z-10`}
                      style={{ left: `${TODAY_PCT}%`, width: `${Math.max(0, stalePct - TODAY_PCT)}%` }} 
                    />
                    
                    {/* Terminal Dot (Rectangle) */}
                    <div 
                      className={`absolute w-[3px] h-[10px] track-${b} top-1/2 -translate-y-1/2 z-20`}
                      style={{ left: `${stalePct}%`, transform: 'translate(-50%, -50%)', borderRadius: '1px' }}
                    />
                    
                    {/* Mono Date Label */}
                    <div 
                      className="absolute top-1/2 mt-[5px] ops-mono text-[9px] text-[#64748B] whitespace-nowrap z-20"
                      style={{ left: `${Math.min(97, stalePct)}%`, transform: 'translateX(-50%)' }}
                    >
                      {fmt(expiry.staleOn)}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="w-[110px] shrink-0 pl-4 pr-4 flex items-center justify-end h-full relative z-10 border-l border-[#F1F5F9]">
                    <div className={`ops-mono text-[10.5px] px-[6px] py-[2px] rounded-[3px] chip-${b} flex items-center justify-center min-w-[56px] font-medium`}>
                      {c.days} d
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* STOPPED CLOCKS SHELF */}
      <div className="mx-6 mt-6 pt-3 pb-3 px-4 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0]">
        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
          <Check size={12} className="text-[#15803D] stroke-[3]" />
          CLOCKS STOPPED &mdash; accepted by underwriting
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] text-[#334155]">
          {stopped.map(c => (
            <div key={c.req.id} className="flex items-center gap-2 truncate">
              <Check size={11} className="text-[#15803D] shrink-0 stroke-[3]" />
              <span className="truncate">{c.req.name} <span className="ops-mono text-[#64748B] text-[11px] ml-1.5">stopped {c.req.acceptedOn || "Jul 20"}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mx-6 mt-4 mb-6 flex justify-between items-center text-[11px] text-[#64748B]">
        <div className="flex items-center gap-2.5">
          <span>Package received <span className="ops-mono">Jul 18</span></span>
          <span className="text-[#CBD5E1]">|</span>
          <span>Clocks recompute nightly</span>
        </div>
        <button onClick={() => go("register")} className="hover:text-[#0F172A] transition-colors inline-flex items-center font-medium">
          Open Register <ArrowRight size={12} className="ml-1" />
        </button>
      </div>

    </div>
  );
}
