import React, { useState } from 'react';
import { CASE } from './data';
import { REVIEW_QUEUE, CLEAN_RUN, MODES, PageVisual, Callout, ReviewStop, CleanPage, CalloutSeverity } from './reviewData';
import { Sparkles, Check, ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';

type PageItem = (ReviewStop | CleanPage) & { isStop: boolean };

const sev: Record<CalloutSeverity, { text: string, border: string, bg: string }> = {
  red: { text: "text-[#B91C1C]", border: "border-[#DC2626]", bg: "bg-[#FEF2F2]" },
  amber: { text: "text-[#B45309]", border: "border-[#D97706]", bg: "bg-[#FFFBEB]" },
  slate: { text: "text-[#64748B]", border: "border-[#64748B]", bg: "bg-[#F8FAFC]" },
  ok: { text: "text-[#15803D]", border: "border-[#15803D]", bg: "bg-[#F0FDF4]" }
};

const renderVisual = (v: PageVisual) => {
  switch(v) {
    case 'form':
      return <div className="p-[8%] flex flex-col gap-[4%] h-full">
        <div className="h-[4%] w-[30%] bg-[#E2E8F0]" />
        <div className="grid grid-cols-2 gap-[4%]">
          <div className="h-[20%] bg-[#F1F5F9] border border-[#E2E8F0]" />
          <div className="h-[20%] bg-[#F1F5F9] border border-[#E2E8F0]" />
        </div>
        <div className="h-[40%] bg-[#F1F5F9] border border-[#E2E8F0]" />
      </div>;
    case 'form-signed':
      return <div className="p-[8%] flex flex-col gap-[4%] h-full">
        <div className="h-[4%] w-[40%] bg-[#E2E8F0]" />
        <div className="h-[50%] bg-[#F1F5F9] border border-[#E2E8F0]" />
        <div className="mt-auto h-[1px] w-[60%] bg-[#E2E8F0] relative">
          <div className="absolute bottom-[2px] left-[10%] w-[40%] h-[12px] border-b-[2px] border-[#0F172A] rounded-[50%] italic opacity-30" />
        </div>
      </div>;
    case 'w2':
      return <div className="p-[8%] flex flex-col gap-[4%] h-full">
        <div className="h-[8%] bg-[#F1F5F9] border border-[#E2E8F0]" />
        <div className="flex gap-[4%] h-[40%]">
          <div className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0]" />
          <div className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0]" />
        </div>
      </div>;
    case 'table':
    case 'table-endmid':
      return <div className="p-[8%] flex flex-col gap-[4%] h-full">
        <div className="h-[4%] w-[25%] bg-[#E2E8F0]" />
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-[1px] w-full bg-[#E2E8F0]" />)}
        {v === 'table-endmid' && <div className="mt-auto h-[2%] w-[40%] mx-auto bg-[#E2E8F0]" />}
      </div>;
    case 'table-clipped-skew':
      return <div className="p-[8%] flex flex-col gap-[4%] h-full">
        <div className="h-[4%] w-[50%] bg-[#E2E8F0]" />
        <div className="h-[20%] bg-[#F1F5F9]" />
        {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="h-[1px] w-full bg-[#E2E8F0]" />)}
      </div>;
    case 'table-deposit':
      return <div className="p-[8%] flex flex-col gap-[4%] h-full">
        <div className="h-[4%] w-[30%] bg-[#E2E8F0]" />
        <div className="h-[1px] w-full bg-[#E2E8F0]" />
        <div className="h-[4%] w-full bg-[#F1F5F9]" />
        <div className="h-[1px] w-full bg-[#E2E8F0]" />
        <div className="h-[4%] w-full bg-[#FFFBEB] border-y border-[#FDE68A]" />
        <div className="h-[1px] w-full bg-[#E2E8F0]" />
        <div className="h-[4%] w-full bg-[#F1F5F9]" />
      </div>;
    case 'report-cover':
      return <div className="p-[12%] flex flex-col items-center gap-[4%] h-full">
        <div className="mt-[20%] h-[6%] w-[60%] bg-[#E2E8F0]" />
        <div className="h-[2%] w-[40%] bg-[#F1F5F9]" />
        <div className="mt-auto h-[20%] w-[80%] bg-[#F1F5F9] border border-[#E2E8F0]" />
      </div>;
    case 'legal-seal':
      return <div className="p-[10%] flex flex-col gap-[3%] h-full relative">
        {[...Array(15)].map((_,i) => <div key={i} className="h-[1.5%] bg-[#F1F5F9]" style={{ width: i%4===0 ? '80%' : '100%' }} />)}
        <div className="absolute bottom-[10%] right-[10%] w-[15%] aspect-square rounded-full border-[2px] border-dashed border-[#E2E8F0]" />
      </div>;
    case 'fax-cover':
      return <div className="p-[10%] flex flex-col gap-[8%] h-full">
        <div className="h-[6%] w-[30%] bg-[#E2E8F0]" />
        <div className="h-[1px] w-full bg-[#E2E8F0]" />
        <div className="flex flex-col gap-[4%]">
          <div className="h-[2%] w-[40%] bg-[#F1F5F9]" />
          <div className="h-[2%] w-[60%] bg-[#F1F5F9]" />
          <div className="h-[2%] w-[30%] bg-[#F1F5F9]" />
        </div>
        <div className="h-[1px] w-full bg-[#E2E8F0]" />
      </div>;
    case 'utility-bill':
      return <div className="p-[8%] flex flex-col gap-[6%] h-full">
        <div className="flex justify-between items-start">
          <div className="w-[20%] aspect-square bg-[#E2E8F0] rounded-full" />
          <div className="w-[30%] h-[10%] bg-[#F1F5F9] border border-[#E2E8F0]" />
        </div>
        <div className="h-[2%] w-[40%] bg-[#F1F5F9]" />
        <div className="grid grid-cols-2 gap-[4%] mt-[10%]">
           <div className="h-[30%] bg-[#F1F5F9]" />
           <div className="h-[30%] bg-[#F1F5F9]" />
        </div>
      </div>;
    default:
      return <div className="p-[8%] bg-[#F1F5F9] h-full" />;
  }
};

const FacsimileSheet = ({ visual, callouts }: { visual: PageVisual, callouts?: Callout[] }) => {
  const isSkew = visual === "table-clipped-skew";
  const containerClasses = `bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] relative w-full h-full overflow-hidden ${
    isSkew ? "rotate-[-1deg] [clip-path:polygon(0_0,100%_0,100%_94%,0_94%)]" : "rounded-[2px]"
  }`;

  return (
    <div className="w-full h-full p-6 flex justify-center items-center">
      <div className="relative h-full aspect-[8.5/11] max-w-full">
        <div className={containerClasses}>
          {renderVisual(visual)}
          {callouts?.map(c => {
            const s = sev[c.severity];
            return (
              <div key={c.id} className={`absolute border-[1.5px] border-dashed ${s.border}`}
                style={{ left: `${c.region.x}%`, top: `${c.region.y}%`, width: `${c.region.w}%`, height: `${c.region.h}%` }}>
                <div className={`absolute top-0 left-0 -translate-y-full -mt-1 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap bg-white border shadow-sm ${s.text} ${s.border}`}>
                  {c.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const ScoreChip = ({ label, val, isFraud = false, stringVal = "", getCol }: any) => {
  const displayVal = isFraud ? stringVal : (val === null ? "—" : val);
  const colorClass = getCol(val, isFraud, stringVal);
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[#F8FAFC] border border-[#E2E8F0]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
      <span className={`text-[12px] font-mono font-medium ${colorClass}`}>{displayVal}</span>
    </div>
  );
};

export function ReviewFilmstrip() {
  const [mode, setMode] = useState<"priority" | "all">("priority");
  const [resolvedPages, setResolvedPages] = useState<Set<number>>(new Set());

  const priorityStops = REVIEW_QUEUE.map(s => ({ ...s, isStop: true } as PageItem));
  const allPages = [
    ...priorityStops,
    ...CLEAN_RUN.map(s => ({ ...s, isStop: false } as PageItem))
  ].sort((a, b) => a.page - b.page);

  const currentList = mode === "priority" ? priorityStops : allPages;
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeIndex = Math.min(currentIndex, currentList.length - 1);
  const currentItem = currentList[activeIndex];
  const isStop = currentItem.isStop;
  const stopData = isStop ? (currentItem as ReviewStop) : null;
  const scores = (currentItem as any).scores || { quality: null, ocr: null, fraud: "—" };

  const handleModeChange = (newMode: "priority" | "all") => {
    setMode(newMode);
    setCurrentIndex(0);
  };

  const handleVerdict = () => {
    setResolvedPages(new Set([...resolvedPages, currentItem.page]));
    if (activeIndex < currentList.length - 1) {
      setTimeout(() => setCurrentIndex(activeIndex + 1), 200);
    }
  };

  const getSeverityScoreColor = (score: number | null, isFraud = false, fraudStr = "") => {
    if (isFraud) {
       if (fraudStr.includes("Under review")) return "text-[#64748B]";
       if (fraudStr.includes("Low")) return "text-[#0F172A]";
       return "text-[#D97706]";
    }
    if (score === null) return "text-[#94A3B8]";
    if (score < 60) return "text-[#B91C1C]";
    if (score < 90) return "text-[#B45309]";
    return "text-[#0F172A]";
  };

  const getTopBorder = (p: PageItem) => {
    if (!p.isStop) return "border-[#E2E8F0]";
    const s = p as ReviewStop;
    if (s.callouts.some(c => c.severity === "red")) return "border-[#DC2626]";
    if (s.band === "attend") return "border-[#D97706]";
    if (s.band === "hold") return "border-[#64748B]";
    return "border-[#E2E8F0]";
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#F3F5F7] overflow-hidden text-[#0F172A] selection:bg-[#BFDBFE]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>
      
      {/* Header */}
      <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-[14px] rounded-[2px]">H</div>
          <div className="text-[15px] font-semibold tracking-tight">Page Review</div>
          <div className="h-4 w-[1px] bg-[#E2E8F0] ml-2 mr-2" />
          <div className="font-mono text-[12px] text-[#334155]">{CASE.id} <span className="text-[#94A3B8] px-2">/</span> {CASE.applicant}</div>
        </div>
        <a href="#" className="text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">
          Back to Workfile &rarr;
        </a>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-[#F3F5F7] relative">
          
          {/* Top Strip */}
          <div className="h-14 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <div className="text-[13px] text-[#0F172A] font-medium leading-tight">
                  {currentItem.classifiedAs}
                </div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  CONF {currentItem.conf}%
                </div>
              </div>
              <div className="h-8 w-[1px] bg-[#E2E8F0]" />
              <div className="flex gap-2">
                <ScoreChip label="Q" val={scores.quality} getCol={getSeverityScoreColor} />
                <ScoreChip label="OCR" val={scores.ocr} getCol={getSeverityScoreColor} />
                <ScoreChip label="FRD" val={scores.fraud} isFraud stringVal={scores.fraud} getCol={getSeverityScoreColor} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="font-mono text-[11px] text-[#64748B]">
                {mode === "priority" ? `STOP ${activeIndex + 1} OF ${currentList.length}` : `PAGE ${activeIndex + 1} OF ${currentList.length}`} · P.{currentItem.page}
              </div>
              <div className="flex bg-[#F1F5F9] p-0.5 rounded-[4px] border border-[#E2E8F0]">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => handleModeChange(m.id as "priority" | "all")}
                    className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] rounded-[2px] transition-colors ${
                      mode === m.id ? "bg-white shadow-sm text-[#0F172A] border border-[#E2E8F0]" : "text-[#64748B] hover:text-[#0F172A] border border-transparent"
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Facsimile Area */}
          <div className="flex-1 min-h-0 relative">
             <FacsimileSheet visual={currentItem.visual} callouts={currentItem.callouts} />
          </div>

          {/* Filmstrip */}
          <div className="h-[120px] bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center px-4 gap-3 overflow-x-auto shrink-0 scrollbar-hide">
            {currentList.map((p, idx) => {
              const isActive = idx === activeIndex;
              const isResolved = resolvedPages.has(p.page);
              const topColor = getTopBorder(p);

              return (
                <button key={p.page} onClick={() => setCurrentIndex(idx)}
                  className={`relative w-[64px] h-[82px] shrink-0 bg-white shadow-sm border transition-all ${
                    isActive ? "border-[#1D4ED8] ring-1 ring-[#1D4ED8]" : "border-[#E2E8F0] hover:border-[#94A3B8]"
                  }`}>
                  <div className={`absolute top-0 left-0 right-0 border-t-[3px] ${topColor}`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-mono text-[11px] ${isActive ? "text-[#1D4ED8] font-medium" : "text-[#64748B]"}`}>
                      {p.page}
                    </span>
                  </div>
                  {isResolved && (
                    <div className="absolute bottom-1 right-1 bg-[#15803D] rounded-full p-[2px]">
                       <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Rail */}
        <div className="w-[320px] bg-white border-l border-[#E2E8F0] flex flex-col shrink-0 z-10 shadow-[-4px_0_12px_rgba(15,23,42,0.02)]">
          {isStop && stopData ? (
            <>
              <div className="p-5 border-b border-[#E2E8F0] flex flex-col gap-4">
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-4 rounded-[4px]">
                  <div className="flex gap-2 items-center mb-2 text-[#1E40AF]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">AI Question</span>
                  </div>
                  <div className="text-[13px] text-[#0F172A] leading-relaxed">
                    {stopData.question}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {stopData.actions.map(a => {
                    const isSuggested = a.label === stopData.suggested;
                    return (
                      <button key={a.label} onClick={handleVerdict}
                        className={`w-full text-[13px] font-medium h-9 rounded-[4px] border transition-colors flex items-center justify-center ${
                          isSuggested
                          ? "bg-[#1D4ED8] text-white border-[#1D4ED8] hover:bg-[#1E40AF]"
                          : "bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                        }`}>
                        {a.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8] mb-4">
                  Callouts ({stopData.callouts.length})
                </div>
                <div className="flex flex-col gap-5">
                  {stopData.callouts.map(c => {
                    const s = sev[c.severity];
                    return (
                      <div key={c.id} className="flex flex-col gap-1.5">
                        <div className="flex items-start gap-2">
                          <div className={`mt-[4px] shrink-0 w-2 h-2 rounded-[2px] ${s.bg} border ${s.border}`} />
                          <div className="text-[13px] font-medium text-[#0F172A] leading-snug">{c.label}</div>
                        </div>
                        {c.detail && (
                          <div className="text-[12px] text-[#64748B] pl-4 leading-relaxed">
                            {c.detail}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Check className="w-8 h-8 text-[#15803D] mb-3 opacity-20" />
                <div className="text-[14px] font-medium text-[#0F172A] mb-1">Clean Page</div>
                <div className="text-[13px] text-[#64748B]">No exceptions found.</div>
                <button onClick={handleVerdict} className="mt-6 bg-white border border-[#E2E8F0] text-[#0F172A] text-[13px] font-medium px-4 h-9 rounded-[4px] hover:bg-[#F8FAFC]">
                  Acknowledge
                </button>
              </div>
              {currentItem.callouts && currentItem.callouts.length > 0 && (
                <div className="p-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8] mb-4">Verifications</div>
                  {currentItem.callouts.map(c => (
                     <div key={c.id} className="flex items-start gap-2">
                       <Check className="w-3.5 h-3.5 text-[#15803D] mt-[2px] shrink-0 stroke-[3]" />
                       <div className="text-[13px] font-medium text-[#0F172A] leading-snug">{c.label}</div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center">
               <button 
                 onClick={() => setCurrentIndex(Math.max(0, activeIndex - 1))} 
                 disabled={activeIndex === 0} 
                 className="flex items-center gap-1 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 disabled:hover:text-[#64748B]">
                 <ChevronLeft className="w-4 h-4" /> Back
               </button>
               <button 
                 onClick={() => setCurrentIndex(Math.min(currentList.length - 1, activeIndex + 1))} 
                 disabled={activeIndex === currentList.length - 1} 
                 className="flex items-center gap-1 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 disabled:hover:text-[#64748B]">
                 Skip <ChevronRight className="w-4 h-4" />
               </button>
            </div>
            <div className="h-[1px] w-full bg-[#E2E8F0]" />
            <div className="flex items-center justify-between text-[#94A3B8]">
              <div className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">Accept</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em]">R Request</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em]">F Flag</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
