import React, { useState } from 'react';
import { CASE } from './data';
import { REVIEW_QUEUE, CLEAN_RUN, MODES, reviewStats, ReviewStop, CleanPage, CalloutSeverity } from './reviewData';

// Combine queues for easier state management
type StopItem = (ReviewStop | CleanPage) & { _type: 'review' | 'clean' };

export function ReviewQueue() {
  const [scope, setScope] = useState<'priority' | 'all'>('priority');
  const [selectedPage, setSelectedPage] = useState<number>(REVIEW_QUEUE[0].page);
  const [resolvedStatus, setResolvedStatus] = useState<Record<number, boolean>>({});

  const stats = reviewStats();

  const needsYou = REVIEW_QUEUE.filter(s => s.band === 'attend').map(s => ({ ...s, _type: 'review' as const }));
  const deepReview = REVIEW_QUEUE.filter(s => s.band === 'hold').map(s => ({ ...s, _type: 'review' as const }));
  const clearedAll = CLEAN_RUN.map(s => ({ ...s, _type: 'clean' as const }));
  const clearedSample = clearedAll.slice(0, 3);

  const visibleItems = scope === 'priority' 
    ? [...needsYou, ...deepReview, ...clearedSample] 
    : [...needsYou, ...deepReview, ...clearedAll];

  const selectedItem = visibleItems.find(i => i.page === selectedPage) || visibleItems[0];

  const handleVerdict = (page: number) => {
    setResolvedStatus(prev => ({ ...prev, [page]: true }));
    const currentIndex = visibleItems.findIndex(i => i.page === page);
    if (currentIndex < visibleItems.length - 1) {
      setSelectedPage(visibleItems[currentIndex + 1].page);
    }
  };

  const getSeverityColors = (sev: CalloutSeverity) => {
    switch(sev) {
      case 'red': return 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]';
      case 'amber': return 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]';
      case 'slate': return 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]';
      case 'ok': return 'border-[#bbf7d0] bg-[#F0FDF4] text-[#15803D]';
      default: return 'border-[#E2E8F0] bg-white text-[#334155]';
    }
  };

  const renderQueueItem = (item: StopItem) => {
    const isSelected = item.page === selectedPage;
    const isResolved = resolvedStatus[item.page];
    
    // Find the highest severity callout for the tag
    let maxSev: CalloutSeverity = 'ok';
    let tagLabel = '';
    
    if (item._type === 'review') {
      const revItem = item as ReviewStop;
      const severities = revItem.callouts?.map(c => c.severity) || [];
      if (severities.includes('red')) { maxSev = 'red'; tagLabel = 'DEFECT'; }
      else if (severities.includes('amber')) { maxSev = 'amber'; tagLabel = 'ATTENTION'; }
      else if (severities.includes('slate')) { maxSev = 'slate'; tagLabel = 'HOLD'; }
    } else {
      maxSev = 'ok'; tagLabel = '';
    }

    return (
      <div 
        key={item.page}
        onClick={() => setSelectedPage(item.page)}
        className={`group cursor-pointer px-3 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors relative flex gap-3 ${
          isSelected ? 'bg-[#F8FAFC]' : 'bg-white'
        }`}
      >
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1D4ED8]" />
        )}
        
        <div className={`w-8 pt-0.5 font-mono text-sm text-right flex-shrink-0 ${isResolved ? 'line-through text-[#94A3B8]' : item._type === 'clean' ? 'text-[#94A3B8]' : 'text-[#0F172A]'}`}>
          {item.page}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className={`text-sm font-semibold truncate ${isResolved ? 'line-through text-[#94A3B8]' : item._type === 'clean' ? 'text-[#94A3B8]' : 'text-[#0F172A]'}`}>
              {item.classifiedAs}
            </div>
            {tagLabel && (
              <div className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-[4px] border ${getSeverityColors(maxSev)} flex-shrink-0`}>
                {tagLabel}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`text-xs truncate ${isResolved ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              {item._type === 'review' ? (item as ReviewStop).doc : 'Automatically cleared'}
            </div>
            <div className="flex items-center gap-1.5 w-16 justify-end">
              <span className="text-[10px] font-mono text-[#94A3B8]">{item.conf}%</span>
              <div className="h-0.5 w-6 bg-[#E2E8F0] rounded overflow-hidden">
                <div 
                  className={`h-full ${item._type === 'clean' || item.conf >= 90 ? 'bg-[#15803D]' : item.conf >= 80 ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`} 
                  style={{ width: `${item.conf}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getScoreColor = (type: string, val: number | string | null) => {
    if (val === null || val === '—') return 'text-[#94A3B8]';
    if (typeof val === 'string') {
      if (val.includes('Low')) return 'text-[#0F172A]';
      return 'text-[#D97706]';
    }
    if (val < 60) return 'text-[#DC2626]';
    if (val <= 89) return 'text-[#D97706]';
    return 'text-[#0F172A]';
  };

  const renderFacsimile = (item: StopItem) => {
    return (
      <div className="w-full max-w-[420px] mx-auto aspect-[8.5/11] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.06)] relative flex flex-col p-6 overflow-hidden">
        {/* Base Page Layouts */}
        {item.visual === 'table' && (
          <div className="flex flex-col gap-3 opacity-30 mt-8">
            <div className="h-4 w-1/3 bg-[#94A3B8] mb-4"></div>
            {[...Array(12)].map((_, i) => <div key={i} className="h-3 w-full border-b border-[#94A3B8]"></div>)}
          </div>
        )}
        
        {item.visual === 'table-clipped-skew' && (
          <div className="absolute inset-[-10%] origin-bottom-left -rotate-2 flex flex-col p-[10%] opacity-40">
            <div className="h-4 w-1/3 bg-[#94A3B8] mb-6"></div>
            <div className="flex justify-between border-b-2 border-[#94A3B8] pb-2 mb-4">
              <div className="h-3 w-16 bg-[#94A3B8]"></div>
              <div className="h-3 w-24 bg-[#94A3B8]"></div>
            </div>
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-[#94A3B8]">
                <div className="h-2 w-32 bg-[#94A3B8]"></div>
                <div className="h-2 w-16 bg-[#94A3B8]"></div>
              </div>
            ))}
            <div className="absolute bottom-[6%] left-0 right-0 border-b-2 border-dashed border-[#DC2626] opacity-100 z-10 shadow-[0_4px_0_white]"></div>
          </div>
        )}

        {item.visual === 'table-deposit' && (
          <div className="flex flex-col opacity-40 mt-8">
            <div className="h-4 w-1/4 bg-[#94A3B8] mb-6"></div>
            <div className="flex justify-between border-b-2 border-[#94A3B8] pb-2 mb-2">
              <div className="h-3 w-20 bg-[#94A3B8]"></div>
              <div className="h-3 w-24 bg-[#94A3B8]"></div>
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`flex justify-between py-2 border-b border-[#94A3B8] ${i === 3 ? 'bg-[#FFFBEB] opacity-100 px-2 -mx-2' : ''}`}>
                <div className={`h-2 w-40 ${i === 3 ? 'bg-[#D97706]' : 'bg-[#94A3B8]'}`}></div>
                <div className={`h-2 w-16 ${i === 3 ? 'bg-[#D97706]' : 'bg-[#94A3B8]'}`}></div>
              </div>
            ))}
          </div>
        )}

        {item.visual === 'form-signed' && (
          <div className="flex flex-col gap-4 opacity-40 h-full">
            <div className="h-6 w-1/2 bg-[#94A3B8] mx-auto mb-4"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-1/3 border border-[#94A3B8] rounded-sm"></div>
                <div className="h-8 w-2/3 border border-[#94A3B8] rounded-sm"></div>
              </div>
            ))}
            <div className="mt-auto pt-8 border-t border-[#94A3B8] flex justify-between items-end">
              <div className="w-1/2">
                <div className="h-2 w-16 bg-[#94A3B8] mb-1"></div>
                <div className="border-b border-[#94A3B8] h-10 w-full relative">
                  <svg className="absolute bottom-1 left-2 w-32 h-8 text-[#0F172A] opacity-100" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10,20 C20,10 30,30 40,15 C50,0 60,25 70,10 C80,-5 90,20 95,15" />
                  </svg>
                </div>
              </div>
              <div className="w-1/3">
                <div className="h-2 w-12 bg-[#94A3B8] mb-1"></div>
                <div className="border-b border-[#94A3B8] h-10 w-full flex items-end pb-1"><div className="h-3 w-20 bg-[#94A3B8]"></div></div>
              </div>
            </div>
          </div>
        )}

        {item.visual === 'legal-seal' && (
          <div className="flex flex-col gap-2 opacity-40 h-full relative">
            <div className="h-6 w-3/4 bg-[#94A3B8] mb-6 mx-auto"></div>
            {[...Array(18)].map((_, i) => (
              <div key={i} className={`h-2 bg-[#94A3B8] ${i % 4 === 0 ? 'w-[90%]' : i % 5 === 0 ? 'w-[80%]' : 'w-full'}`}></div>
            ))}
            <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full border-4 border-[#94A3B8] flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-dashed border-[#94A3B8]"></div>
            </div>
          </div>
        )}

        {item.visual === 'fax-cover' && (
          <div className="flex flex-col opacity-40 h-full">
            <div className="text-[32px] font-bold text-[#0F172A] border-b-4 border-[#0F172A] pb-4 mb-8 uppercase tracking-widest">Facsimile</div>
            <div className="grid grid-cols-[100px_1fr] gap-y-6 text-[#0F172A] font-bold text-xl">
              <div>TO:</div><div className="border-b border-[#0F172A]"></div>
              <div>FROM:</div><div className="border-b border-[#0F172A]"></div>
              <div>DATE:</div><div className="border-b border-[#0F172A]"></div>
              <div>PAGES:</div><div className="border-b border-[#0F172A]"></div>
            </div>
          </div>
        )}

        {item.visual === 'utility-bill' && (
          <div className="flex flex-col opacity-40 h-full">
            <div className="flex justify-between items-start mb-12">
              <div className="w-16 h-16 bg-[#0F172A] rounded"></div>
              <div className="text-right">
                <div className="h-4 w-32 bg-[#94A3B8] mb-2 ml-auto"></div>
                <div className="h-3 w-24 bg-[#94A3B8] mb-1 ml-auto"></div>
                <div className="h-3 w-20 bg-[#94A3B8] ml-auto"></div>
              </div>
            </div>
            <div className="border-4 border-[#0F172A] p-4 w-2/3 ml-auto text-right mb-12">
              <div className="h-3 w-32 bg-[#0F172A] mb-4 ml-auto"></div>
              <div className="h-8 w-40 bg-[#0F172A] ml-auto"></div>
            </div>
            <div className="flex flex-col gap-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-2 w-full bg-[#94A3B8]"></div>)}
            </div>
          </div>
        )}

        {/* Fallbacks */}
        {['form', 'w2', 'report-cover', 'table-endmid'].includes(item.visual) && (
          <div className="flex flex-col gap-3 opacity-30 mt-4">
             <div className="h-6 w-2/3 bg-[#94A3B8] mb-6"></div>
             {[...Array(8)].map((_, i) => <div key={i} className="h-2 w-full bg-[#94A3B8]"></div>)}
             <div className="h-32 w-full border-2 border-[#94A3B8] mt-4"></div>
          </div>
        )}

        {/* Callout Regions */}
        {item.callouts?.map((callout) => (
          <div 
            key={callout.id}
            className={`absolute border-[1.5px] border-dashed ${callout.severity === 'red' ? 'border-[#DC2626] bg-[#FEF2F2]/30' : callout.severity === 'amber' ? 'border-[#D97706] bg-[#FFFBEB]/30' : callout.severity === 'slate' ? 'border-[#64748B] bg-[#F8FAFC]/30' : 'border-[#15803D] bg-[#F0FDF4]/30'}`}
            style={{
              left: `${callout.region.x}%`,
              top: `${callout.region.y}%`,
              width: `${callout.region.w}%`,
              height: `${callout.region.h}%`
            }}
          >
            <div className={`absolute -top-5 left-[-1.5px] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${callout.severity === 'red' ? 'bg-[#DC2626] text-white' : callout.severity === 'amber' ? 'bg-[#D97706] text-white' : callout.severity === 'slate' ? 'bg-[#64748B] text-white' : 'bg-[#15803D] text-white'}`}>
              {callout.label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        /* Custom scrollbar for dense data tables */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>

      <div className="h-screen w-full bg-[#F3F5F7] flex flex-col font-sans text-[#0F172A] overflow-hidden">
        {/* Slim Header */}
        <header className="h-[48px] bg-white border-b border-[#E2E8F0] flex items-center px-4 flex-shrink-0 relative z-10">
          <div className="w-6 h-6 bg-[#1D4ED8] text-white rounded-[4px] flex items-center justify-center font-bold text-sm leading-none mr-3">H</div>
          <h1 className="font-semibold text-[15px] mr-4">Page Review</h1>
          
          <div className="w-[1px] h-4 bg-[#E2E8F0] mr-4" />
          
          <div className="font-mono text-sm text-[#334155] mr-6">
            <span className="font-medium text-[#0F172A]">{CASE.id}</span>
            <span className="mx-2 text-[#94A3B8]">·</span>
            {CASE.applicant}
          </div>

          <div className="flex bg-[#F1F5F9] p-0.5 rounded-[6px] mr-6">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setScope(m.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors ${scope === m.id ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B] hover:text-[#334155]'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="font-mono text-xs text-[#64748B] mr-auto">
            {Object.keys(resolvedStatus).length} / {scope === 'priority' ? stats.stops : stats.total} resolved
          </div>

          <button className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">
            Back to Workfile &rarr;
          </button>
        </header>

        {/* Main Content Workspace */}
        <div className="flex flex-1 overflow-hidden">
          {/* Queue Left Column */}
          <div className="w-[380px] bg-white border-r border-[#E2E8F0] flex flex-col flex-shrink-0 z-0">
            <div className="px-3 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="font-mono text-[10px] tracking-wider text-[#64748B] font-semibold">
                {stats.stops} STOPS · {stats.stopPages} PAGES · {stats.autoCleared} AUTO-CLEARED
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-8">
              {needsYou.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-[#B45309] uppercase mt-2">
                    Needs You
                  </div>
                  {needsYou.map(renderQueueItem)}
                </div>
              )}
              
              {deepReview.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                    Held in Deep Review
                  </div>
                  {deepReview.map(renderQueueItem)}
                </div>
              )}

              {clearedAll.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 flex justify-between items-center group">
                    <div className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">
                      Cleared Sample
                    </div>
                    <button className="text-[10px] font-semibold text-[#1D4ED8] uppercase tracking-wider">
                      Clear all &ge;95%
                    </button>
                  </div>
                  {(scope === 'priority' ? clearedSample : clearedAll).map(renderQueueItem)}
                </div>
              )}
            </div>
          </div>

          {/* Inspector Right Column */}
          <div className="flex-1 flex flex-col overflow-y-auto relative">
            {selectedItem && (
              <div className="max-w-[760px] mx-auto w-full px-8 py-8">
                
                {/* Score Strip */}
                <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="text-[22px] font-semibold text-[#0F172A] leading-none">Page {selectedItem.page}</h2>
                      {selectedItem.spanPages && (
                        <span className="font-mono text-sm text-[#64748B] px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0]">+{selectedItem.spanPages - 1} pages</span>
                      )}
                    </div>
                    <div className="text-sm text-[#334155] font-medium">
                      {(selectedItem as ReviewStop).docPages ? `Package pp. ${(selectedItem as ReviewStop).docPages}` : ''}
                      {(selectedItem as ReviewStop).pageOfDoc ? ` · ${(selectedItem as ReviewStop).pageOfDoc}` : ''}
                    </div>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="text-right">
                      <div className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mb-1">Classification</div>
                      <div className="font-mono text-[15px] text-[#0F172A]">{selectedItem.classifiedAs} <span className="text-[#94A3B8]">·</span> {selectedItem.conf}%</div>
                    </div>
                    
                    {selectedItem._type === 'review' && (
                      <div className="flex flex-none gap-px bg-[#E2E8F0] border border-[#E2E8F0] rounded-[6px] overflow-hidden">
                        <div className="bg-white px-3 py-1.5 flex flex-col items-center">
                          <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">Quality</span>
                          <span className={`font-mono text-[15px] font-medium ${getScoreColor('q', (selectedItem as ReviewStop).scores.quality)}`}>
                            {(selectedItem as ReviewStop).scores.quality ?? '—'}
                          </span>
                        </div>
                        <div className="bg-white px-3 py-1.5 flex flex-col items-center">
                          <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">OCR</span>
                          <span className={`font-mono text-[15px] font-medium ${getScoreColor('q', (selectedItem as ReviewStop).scores.ocr)}`}>
                            {(selectedItem as ReviewStop).scores.ocr ?? '—'}
                          </span>
                        </div>
                        <div className="bg-white px-3 py-1.5 flex flex-col items-center">
                          <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">Fraud</span>
                          <span className={`font-mono text-[15px] font-medium ${getScoreColor('f', (selectedItem as ReviewStop).scores.fraud)}`}>
                            {(selectedItem as ReviewStop).scores.fraud}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-10 items-start">
                  
                  {/* Facsimile */}
                  <div className="w-[380px] flex-shrink-0">
                    {renderFacsimile(selectedItem)}
                  </div>

                  {/* Inspector Panel */}
                  <div className="flex-1 flex flex-col">
                    {selectedItem._type === 'review' ? (
                      <>
                        {/* Callouts */}
                        <div className="mb-6 flex flex-col gap-3">
                          {(selectedItem as ReviewStop).callouts?.map((c) => (
                            <div key={c.id} className="flex gap-3 items-start border border-[#E2E8F0] bg-white rounded-[6px] p-3 shadow-sm">
                              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${c.severity === 'red' ? 'bg-[#DC2626]' : c.severity === 'amber' ? 'bg-[#D97706]' : c.severity === 'slate' ? 'bg-[#64748B]' : 'bg-[#15803D]'}`} />
                              <div>
                                <div className="text-sm font-semibold text-[#0F172A] leading-tight mb-1">{c.label}</div>
                                {c.detail && <div className="text-sm text-[#334155] leading-relaxed">{c.detail}</div>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Note */}
                        {(selectedItem as ReviewStop).note && (
                          <div className="text-sm text-[#64748B] italic border-l-2 border-[#E2E8F0] pl-3 py-1 mb-8">
                            {(selectedItem as ReviewStop).note}
                          </div>
                        )}

                        {/* Action Area */}
                        {(selectedItem as ReviewStop).question && (
                          <div className="mt-auto bg-white border border-[#E2E8F0] rounded-[6px] p-5 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                            <div className="text-[15px] font-medium text-[#0F172A] leading-relaxed mb-5">
                              {(selectedItem as ReviewStop).question}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {(selectedItem as ReviewStop).actions.map((act, i) => {
                                const isSuggested = (selectedItem as ReviewStop).suggested === act.label;
                                let btnClass = "w-full text-left px-4 py-2.5 rounded-[4px] text-sm font-medium transition-colors flex items-center justify-between border ";
                                
                                if (act.tone === 'blue') {
                                  btnClass += "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-[#1D4ED8]";
                                } else if (act.tone === 'red') {
                                  btnClass += "bg-white hover:bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
                                } else {
                                  btnClass += "bg-white hover:bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]";
                                }

                                return (
                                  <button 
                                    key={i} 
                                    className={btnClass}
                                    onClick={() => handleVerdict(selectedItem.page)}
                                  >
                                    <span>{act.label}</span>
                                    {isSuggested && (
                                      <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${act.tone === 'blue' ? 'bg-white/20' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                                        Suggested
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <div className="mt-5 flex gap-4 text-[10px] font-mono font-medium tracking-wider text-[#94A3B8] uppercase justify-center">
                              <span>Enter accept</span>
                              <span>R request</span>
                              <span>F flag</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#E2E8F0] rounded-[6px] p-8 bg-white">
                        <div className="text-center">
                          <div className="w-10 h-10 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-[#15803D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-[#0F172A] font-semibold mb-1">Page cleared automatically</h3>
                          <p className="text-sm text-[#64748B]">Confidence score is above threshold. No manual review needed.</p>
                          <button 
                            className="mt-6 px-4 py-2 bg-white border border-[#E2E8F0] text-sm font-medium text-[#334155] rounded hover:bg-[#F1F5F9] transition-colors"
                            onClick={() => handleVerdict(selectedItem.page)}
                          >
                            Acknowledge & Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
