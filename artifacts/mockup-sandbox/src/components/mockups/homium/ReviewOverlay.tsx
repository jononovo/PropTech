import React, { useState } from 'react';
import { REVIEW_QUEUE, CLEAN_RUN, MODES, reviewStats, CASE } from './reviewData';
import type { PageVisual, ReviewStop } from './reviewData';

const PageFacsimile = ({ visual }: { visual: PageVisual }) => {
  switch (visual) {
    case "form":
    case "form-signed":
      return (
        <div className="absolute inset-0 bg-white p-8 flex flex-col gap-6">
          <div className="h-6 w-1/3 bg-[#E2E8F0] mb-4" />
          <div className="flex gap-4"><div className="h-4 w-1/2 bg-[#F1F5F9]" /><div className="h-4 w-1/2 bg-[#F1F5F9]" /></div>
          <div className="flex gap-4"><div className="h-4 w-full bg-[#F1F5F9]" /></div>
          <div className="flex gap-4"><div className="h-4 w-1/3 bg-[#F1F5F9]" /><div className="h-4 w-2/3 bg-[#F1F5F9]" /></div>
          <div className="flex gap-4"><div className="h-4 w-full bg-[#F1F5F9]" /></div>
          <div className="flex gap-4"><div className="h-4 w-1/2 bg-[#F1F5F9]" /><div className="h-4 w-1/2 bg-[#F1F5F9]" /></div>
          <div className="mt-auto pt-8 border-t border-[#E2E8F0] flex justify-between items-end">
            <div className="w-1/2 h-10 border-b border-[#0F172A] relative">
              {visual === "form-signed" && (
                <div className="absolute bottom-1 left-4 text-[24px] text-[#0F172A] opacity-80" style={{ fontFamily: 'cursive' }}>Michael R. Henderson</div>
              )}
            </div>
            <div className="w-1/4 h-10 border-b border-[#0F172A]" />
          </div>
        </div>
      );
    case "table-clipped-skew":
      return (
        <div className="absolute inset-0 overflow-hidden bg-white">
          <div className="absolute inset-0 origin-center rotate-[11deg] p-8 flex flex-col gap-4 scale-[1.15]">
            <div className="h-8 w-1/2 bg-[#E2E8F0] mb-8" />
            {Array.from({length: 25}).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-[#F1F5F9] pb-2">
                <div className="h-3 w-16 bg-[#E2E8F0]" />
                <div className="h-3 w-32 bg-[#F1F5F9]" />
                <div className="h-3 w-16 bg-[#E2E8F0] ml-auto" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[6%] bg-[#F3F5F7] border-t border-[#E2E8F0]" />
        </div>
      );
    case "table-deposit":
      return (
        <div className="absolute inset-0 bg-white p-8 flex flex-col gap-4">
          <div className="h-8 w-1/3 bg-[#E2E8F0] mb-8" />
          {Array.from({length: 22}).map((_, i) => (
            <div key={i} className={`flex gap-4 border-b border-[#F1F5F9] p-2 ${i === 12 ? 'bg-[#FFFBEB] border-[#FDE68A]' : ''}`}>
              <div className="h-3 w-16 bg-[#E2E8F0]" />
              <div className="h-3 w-48 bg-[#F1F5F9]" />
              <div className={`h-3 w-16 ml-auto ${i === 12 ? 'bg-[#D97706]' : 'bg-[#E2E8F0]'}`} />
            </div>
          ))}
        </div>
      );
    case "table-endmid":
      return (
        <div className="absolute inset-0 bg-white p-8 flex flex-col">
          <div className="h-8 w-1/3 bg-[#E2E8F0] mb-8" />
          <div className="flex flex-col gap-4">
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-[#F1F5F9] pb-2">
                <div className="h-3 w-16 bg-[#E2E8F0]" />
                <div className="h-3 w-40 bg-[#F1F5F9]" />
                <div className="h-3 w-16 bg-[#E2E8F0] ml-auto" />
              </div>
            ))}
          </div>
          <div className="mt-auto text-center text-[#94A3B8] text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: 'IBM Plex Mono' }}>
            Page 3 of 4
          </div>
        </div>
      );
    case "legal-seal":
      return (
        <div className="absolute inset-0 bg-white p-10 flex flex-col gap-3">
          <div className="h-6 w-1/2 bg-[#E2E8F0] mb-6 mx-auto" />
          {Array.from({length: 16}).map((_, i) => (
            <div key={i} className="h-2.5 bg-[#F1F5F9] w-full" />
          ))}
          <div className="mt-6 h-2.5 bg-[#F1F5F9] w-3/4" />
          <div className="mt-2 h-2.5 bg-[#F1F5F9] w-5/6" />
          <div className="mt-2 h-2.5 bg-[#F1F5F9] w-1/2" />
          
          <div className="absolute bottom-12 right-12 w-28 h-28 rounded-full border-[2px] border-[#E2E8F0] flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-[#F1F5F9] flex items-center justify-center">
               <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center">
                 <div className="w-8 h-8 border border-[#E2E8F0] rounded-full" />
               </div>
            </div>
          </div>
        </div>
      );
    case "fax-cover":
      return (
        <div className="absolute inset-0 bg-white p-12 flex flex-col gap-10">
          <div className="text-center font-bold text-[#0F172A] text-2xl tracking-[0.2em] uppercase border-b-4 border-[#0F172A] pb-4">
            Facsimile
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex gap-4 items-end"><div className="w-20 h-3 bg-[#94A3B8]" /><div className="flex-1 border-b border-[#E2E8F0]" /></div>
            <div className="flex gap-4 items-end"><div className="w-20 h-3 bg-[#94A3B8]" /><div className="flex-1 border-b border-[#E2E8F0]" /></div>
            <div className="flex gap-4 items-end"><div className="w-20 h-3 bg-[#94A3B8]" /><div className="flex-1 border-b border-[#E2E8F0]" /></div>
          </div>
          <div className="flex-1 border border-[#E2E8F0] mt-8 p-6 bg-[#F8FAFC]">
            <div className="w-1/3 h-4 bg-[#E2E8F0] mb-6" />
            <div className="w-full h-3 bg-[#F1F5F9] mb-4" />
            <div className="w-full h-3 bg-[#F1F5F9] mb-4" />
            <div className="w-3/4 h-3 bg-[#F1F5F9] mb-4" />
          </div>
        </div>
      );
    case "utility-bill":
      return (
        <div className="absolute inset-0 bg-white p-10 flex flex-col gap-8">
          <div className="flex justify-between items-start">
            <div className="w-32 h-12 bg-[#E2E8F0]" />
            <div className="w-48 border-2 border-[#0F172A] p-4 flex flex-col gap-3 bg-[#F8FAFC]">
              <div className="h-3 w-20 bg-[#94A3B8]" />
              <div className="h-8 w-32 bg-[#0F172A]" />
              <div className="h-2 w-24 bg-[#94A3B8]" />
            </div>
          </div>
          <div className="w-1/3 h-24 border border-[#E2E8F0] p-4 mb-4">
             <div className="h-3 w-full bg-[#F1F5F9] mb-2" />
             <div className="h-3 w-3/4 bg-[#F1F5F9] mb-2" />
             <div className="h-3 w-1/2 bg-[#F1F5F9]" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-4 w-1/4 bg-[#E2E8F0] mb-2" />
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="h-3 w-full bg-[#F1F5F9]" />
            ))}
          </div>
        </div>
      );
    case "w2":
      return (
        <div className="absolute inset-0 bg-white p-8 flex flex-col gap-4 border border-[#E2E8F0]">
          <div className="text-xl font-bold border-b-4 border-[#0F172A] pb-2 flex justify-between text-[#0F172A]">
            <span>W-2 Wage and Tax Statement</span>
            <span>2024</span>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="border border-[#0F172A] p-3"><div className="h-3 w-16 bg-[#E2E8F0]" /></div>
            <div className="border border-[#0F172A] p-3"><div className="h-3 w-16 bg-[#E2E8F0]" /></div>
            <div className="border border-[#0F172A] p-3 row-span-2"><div className="h-3 w-16 bg-[#E2E8F0]" /></div>
            <div className="border border-[#0F172A] p-3"><div className="h-3 w-16 bg-[#E2E8F0]" /></div>
            <div className="border border-[#0F172A] p-3"><div className="h-3 w-16 bg-[#E2E8F0]" /></div>
            <div className="border border-[#0F172A] p-3 col-span-2"><div className="h-3 w-32 bg-[#E2E8F0]" /></div>
          </div>
        </div>
      );
    case "report-cover":
      return (
        <div className="absolute inset-0 bg-white p-12 flex flex-col items-center justify-center gap-8 border-8 border-double border-[#E2E8F0]">
          <div className="w-20 h-20 bg-[#E2E8F0] rounded-full mb-8" />
          <div className="h-6 w-3/4 bg-[#0F172A]" />
          <div className="h-4 w-1/2 bg-[#64748B]" />
          <div className="h-4 w-1/3 bg-[#94A3B8]" />
        </div>
      );
    default:
      return (
        <div className="absolute inset-0 bg-white p-8">
          <div className="h-8 w-1/3 bg-[#E2E8F0] mb-8" />
          {Array.from({length: 20}).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-[#F1F5F9] pb-2 mb-4">
              <div className="h-3 w-16 bg-[#E2E8F0]" />
              <div className="h-3 w-40 bg-[#F1F5F9]" />
            </div>
          ))}
        </div>
      );
  }
}

const ScoreChip = ({ label, value }: { label: string, value: number | string | null }) => {
  if (value === null) return null;
  let valColor = '#0F172A';
  if (typeof value === 'number') {
    if (value < 60) valColor = '#DC2626';
    else if (value < 90) valColor = '#D97706';
  }
  return (
    <div className="flex flex-none items-center gap-1.5 px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded whitespace-nowrap">
      <span className="text-[10px] font-semibold text-[#64748B] tracking-[0.08em] uppercase">{label}</span>
      <span className="text-[12px]" style={{ fontFamily: 'IBM Plex Mono', color: valColor }}>{value}</span>
    </div>
  );
}

export function ReviewOverlay() {
  // URL contract: default = in-review (priority) · ?start=1 = scope chooser · ?mode=all supported
  const params = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState<'priority' | 'all' | null>(
    params.get('start') === '1' ? null : ((params.get('mode') as 'priority' | 'all') || 'priority')
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [concernIndex, setConcernIndex] = useState(0);

  // Clean pages carry no scores/actions — give them safe defaults for "Every page" mode.
  const CLEAN_AS_STOPS = CLEAN_RUN.map(c => ({
    docPages: '', scores: { quality: null, ocr: null, fraud: '—' }, band: 'clean',
    callouts: [], actions: [{ label: 'Accept', tone: 'blue' }], suggested: 'Accept', ...c,
  })) as unknown as ReviewStop[];
  const ALL_STOPS = [...REVIEW_QUEUE, ...CLEAN_AS_STOPS].sort((a, b) => a.page - b.page);
  const stops = mode === 'priority' ? REVIEW_QUEUE : ALL_STOPS;
  const currentStop = stops[currentIndex];

  if (!mode) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#F3F5F7] font-['Inter']">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');`}</style>
        <div className="flex flex-col items-center justify-center h-screen px-4">
          <div className="bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.04)] rounded-[6px] w-full max-w-[480px] p-8">
            <h2 className="text-[20px] font-semibold text-[#0F172A] mb-6">How do you want to review?</h2>
            <div className="flex flex-col gap-3">
              {MODES.map(m => (
                <button 
                  key={m.id}
                  onClick={() => { setMode(m.id); setCurrentIndex(0); setConcernIndex(0); }}
                  className="flex flex-col items-start p-4 border border-[#E2E8F0] rounded-[6px] hover:border-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors text-left"
                >
                  <span className="text-[15px] font-semibold text-[#0F172A]">{m.label}</span>
                  <span className="text-[13px] text-[#64748B] mt-1" style={{ fontFamily: 'IBM Plex Mono' }}>
                    {typeof m.detail === 'function' ? m.detail() : m.detail}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-8 pt-4 border-t border-[#F1F5F9] text-center">
              <span className="text-[12px] text-[#94A3B8]" style={{ fontFamily: 'IBM Plex Mono' }}>
                {reviewStats().autoCleared} pages auto-cleared in automated review
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStop) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#F3F5F7] flex items-center justify-center font-['Inter']">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');`}</style>
        <div className="text-[#64748B] text-lg font-medium">Review Complete</div>
      </div>
    );
  }

  const handleAction = () => {
    if (currentStop.callouts && concernIndex < currentStop.callouts.length - 1) {
      setConcernIndex(c => c + 1);
    } else {
      if (currentIndex < stops.length - 1) {
        setCurrentIndex(c => c + 1);
        setConcernIndex(0);
      } else {
        setMode(null);
      }
    }
  };

  const hasCallouts = currentStop.callouts && currentStop.callouts.length > 0;
  const activeCallout = hasCallouts ? currentStop.callouts[concernIndex] : null;

  const defaultActions = [{ label: "Accept", tone: "blue" as const }];
  const actions = currentStop.actions || defaultActions;

  const SEVERITY_COLORS = {
    red: '#DC2626',
    amber: '#D97706',
    slate: '#64748B',
    ok: '#15803D'
  };

  return (
    <div className="h-[100dvh] w-full bg-[#F3F5F7] font-['Inter'] flex flex-col relative overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      
      {/* Slim Header */}
      <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-[#1D4ED8] rounded-[4px] flex items-center justify-center text-white font-bold text-sm tracking-tighter">H</div>
          <div className="h-4 w-px bg-[#E2E8F0]" />
          <span className="text-[14px] font-semibold text-[#0F172A]">Page Review</span>
          <div className="h-4 w-px bg-[#E2E8F0]" />
          <span className="text-[13px] text-[#64748B]" style={{ fontFamily: 'IBM Plex Mono' }}>
            {CASE.id} · {CASE.applicant}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#334155] font-semibold tracking-[0.04em] uppercase bg-[#F1F5F9] px-2 py-1 rounded-[4px]">
            {mode === 'priority' ? 'Priority only' : 'Every page'}
          </span>
          <div className="h-4 w-px bg-[#E2E8F0]" />
          <button className="text-[13px] font-medium text-[#64748B] hover:text-[#0F172A]">
            Back to Workfile &rarr;
          </button>
        </div>
      </header>

      {/* Floating Top Strip */}
      <div className="absolute top-[68px] left-1/2 -translate-x-1/2 bg-white border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.04)] rounded-[6px] flex items-center h-[40px] px-2 z-40">
        <div className="flex items-center gap-1.5 px-3">
          {stops.map((s, i) => {
            let color = '#E2E8F0';
            if (s.band === 'attend') color = '#D97706';
            else if (s.band === 'hold') color = '#64748B';
            if (s.callouts?.some(c => c.severity === 'red')) color = '#DC2626';
            if (!s.callouts || s.callouts.length === 0) color = '#94A3B8';
            
            return (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ${i === currentIndex ? 'ring-2 ring-offset-2' : ''}`} 
                style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties}
              />
            );
          })}
        </div>
        
        <div className="h-5 w-px bg-[#E2E8F0] mx-1" />
        
        <div className="flex items-center gap-2 px-3">
          <span className="text-[13px] text-[#0F172A] font-semibold">{currentStop.classifiedAs}</span>
          <span className="text-[12px] text-[#64748B]" style={{ fontFamily: 'IBM Plex Mono' }}>{currentStop.conf}%</span>
        </div>

        {currentStop.scores && (
          <>
            <div className="h-5 w-px bg-[#E2E8F0] mx-1" />
            <div className="flex items-center gap-1.5 px-3">
              <ScoreChip label="Quality" value={currentStop.scores.quality} />
              <ScoreChip label="OCR" value={currentStop.scores.ocr} />
              <ScoreChip label="Fraud" value={currentStop.scores.fraud} />
            </div>
          </>
        )}
      </div>

      {/* Main Review Area */}
      <main className="flex-1 flex items-center justify-center p-8 relative pt-16">
        <div className="relative h-[86%] max-h-[780px] aspect-[8.5/11] mx-auto rounded-[4px] overflow-hidden shadow-sm border border-[#E2E8F0] bg-white">
          <PageFacsimile visual={currentStop.visual} />

          {/* Slate Veil & Active Cutout */}
          {hasCallouts && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {currentStop.callouts!.map((c, i) => {
                const isActive = i === concernIndex;
                const cColor = SEVERITY_COLORS[c.severity] || SEVERITY_COLORS.slate;
                return (
                  <div 
                    key={c.id}
                    className="absolute"
                    style={{
                      top: `${c.region.y}%`,
                      left: `${c.region.x}%`,
                      width: `${c.region.w}%`,
                      height: `${c.region.h}%`,
                      border: `1.5px dashed ${isActive ? cColor : 'transparent'}`,
                      boxShadow: isActive ? '0 0 0 9999px rgba(15,23,42,0.35)' : 'none',
                      zIndex: isActive ? 30 : 10
                    }}
                  >
                    {isActive && (
                      <div 
                        className="absolute -top-[1.5px] left-[-1.5px] -translate-y-full bg-white border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap"
                        style={{ borderColor: cColor, color: cColor }}
                      >
                        {c.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Docked bottom-right conversation card */}
      <div className="absolute bottom-6 right-6 w-[380px] bg-white border border-[#E2E8F0] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-5 z-50 flex flex-col gap-4">
        {activeCallout?.detail && (
          <p className="text-[14px] text-[#0F172A] leading-[1.6]">
            {activeCallout.detail}
          </p>
        )}
        
        {currentStop.question && (
          <p className="text-[14px] text-[#0F172A] font-semibold leading-[1.6]">
            {currentStop.question}
          </p>
        )}
        
        {!activeCallout?.detail && !currentStop.question && (
          <p className="text-[14px] text-[#64748B] italic">No concerns detected.</p>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {actions.map((action, i) => {
            const isSuggested = action.label === currentStop.suggested;
            let btnClass = 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F8FAFC]';
            if (isSuggested) {
              btnClass = 'bg-[#1D4ED8] text-white border-[#1D4ED8] hover:bg-[#1E40AF]';
            } else if (action.tone === 'blue') {
              btnClass = 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] hover:bg-[#DBEAFE]';
            }
            
            let hint = '';
            if (i === 0) hint = 'Enter';
            else if (i === 1) hint = 'R';
            else if (i === 2) hint = 'F';

            return (
              <button 
                key={action.label}
                onClick={handleAction}
                className={`w-full px-3 py-2.5 rounded-[4px] text-[13px] font-semibold transition-colors border ${btnClass} flex items-center justify-between group`}
              >
                <div className="flex items-center">
                  {action.label}
                  {isSuggested && (
                    <span className="ml-2 opacity-80 font-normal text-[11px]">(Suggested)</span>
                  )}
                </div>
                {hint && (
                  <span className={`text-[10px] font-mono border rounded-[2px] px-1.5 py-0.5 opacity-60 group-hover:opacity-100 ${isSuggested ? 'border-blue-400' : 'border-[#E2E8F0]'}`}>
                    {hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {(currentStop.callouts?.length || 0) > 1 && (
          <div className="flex items-center justify-between mt-2 pt-4 border-t border-[#F1F5F9]">
            <span className="text-[12px] text-[#64748B]" style={{ fontFamily: 'IBM Plex Mono' }}>
              Concern {concernIndex + 1} of {currentStop.callouts!.length}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setConcernIndex(c => Math.max(0, c - 1))} 
                disabled={concernIndex === 0} 
                className="w-7 h-7 flex items-center justify-center text-[#64748B] disabled:opacity-30 hover:bg-[#F1F5F9] rounded-[4px] border border-transparent hover:border-[#E2E8F0]"
              >
                &larr;
              </button>
              <button 
                onClick={() => setConcernIndex(c => Math.min(currentStop.callouts!.length - 1, c + 1))} 
                disabled={concernIndex === currentStop.callouts!.length - 1} 
                className="w-7 h-7 flex items-center justify-center text-[#64748B] disabled:opacity-30 hover:bg-[#F1F5F9] rounded-[4px] border border-transparent hover:border-[#E2E8F0]"
              >
                &rarr;
              </button>
            </div>
          </div>
        )}

        <button className="text-left text-[12px] text-[#94A3B8] hover:text-[#64748B] mt-2 transition-colors inline-block w-max font-medium">
          Why am I seeing this?
        </button>
      </div>
    </div>
  );
}
