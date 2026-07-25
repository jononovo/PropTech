import React, { useState } from 'react';
import { 
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertCircle,
  XCircle,
  X
} from 'lucide-react';

export function FilmstripFinal() {
  const [mode, setMode] = useState<'document' | 'page'>('document');

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-50 text-slate-800 font-sans text-[13px] selection:bg-blue-100">
      {/* Real ReviewPage Chrome: Header */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center px-3 md:px-4 gap-3 shrink-0">
        <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-slate-900 transition-colors min-h-[40px]">
          <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Intake</span>
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="font-semibold text-[14px] tracking-tight text-slate-900">Page Review</div>
        <div className="font-mono text-[11px] text-slate-500 truncate hidden sm:block">
          APP-8924 <span className="text-slate-400 px-1">/</span> M. Torres
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[11px] text-slate-500 hidden md:block">
            3 open · 9 pages
          </span>
          <button className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors px-2">
            Open the report →
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          
          {/* Sub-bar */}
          <div className="bg-white border-b border-slate-200 px-3 md:px-5 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-slate-900 leading-tight truncate">
                  {mode === 'document' ? 'Bank statement' : 'Bank statement'}
                </div>
                <div className="font-mono text-[10.5px] text-slate-500 whitespace-nowrap">
                  {mode === 'document' 
                    ? 'CONF 98% · pp. 6–8 · Variant: Chase ····4821' 
                    : 'CONF 98% · pp. 6–8'}
                </div>
              </div>
              
              {mode === 'page' && (
                <>
                  <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                  <div className="hidden sm:flex gap-1.5">
                    <ScoreChip label="Q" value={64} />
                    <ScoreChip label="FMT" value={95} />
                    <ScoreChip label="FRD" value={null} invert />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              <span className="font-mono text-[10.5px] text-slate-500 whitespace-nowrap">
                {mode === 'document' ? 'GROUP 5 OF 6' : 'STOP 2 OF 3 · P.7'}
              </span>
              
              {/* Added Page/Document Segmented Control next to Priority/All Pages */}
              <div className="flex bg-slate-50 p-0.5 rounded-[4px] border border-slate-200">
                <ModeButton active={mode === 'page'} onClick={() => setMode('page')}>Page</ModeButton>
                <ModeButton active={mode === 'document'} onClick={() => setMode('document')}>Document</ModeButton>
              </div>
              
              <div className="w-px h-5 bg-slate-200 mx-1" />
              
              {/* Original Real Toggle disabled for mockup */}
              <div className="flex bg-slate-50 p-0.5 rounded-[4px] border border-slate-200 opacity-50 pointer-events-none">
                <ModeButton active={true} onClick={() => {}}>Priority</ModeButton>
                <ModeButton active={false} onClick={() => {}}>All pages</ModeButton>
              </div>
            </div>
          </div>

          {/* Viewer Area */}
          <div className="flex-1 min-h-[32vh] md:min-h-0 relative overflow-hidden bg-slate-100">
            {mode === 'document' ? (
              <div className="absolute inset-0 overflow-auto p-6 md:p-8 flex items-start justify-start gap-8">
                {/* Page 6 */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[450px] h-[585px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] rounded-[2px] flex flex-col relative border border-slate-200">
                    <div className="p-8 flex flex-col h-full opacity-80">
                      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
                        <div>
                          <div className="text-lg font-serif text-slate-900 font-bold tracking-tight">CHASE</div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">JPMorgan Chase Bank, N.A.</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-800">Statement of Account</div>
                          <div className="text-[10px] text-slate-600 font-mono mt-1">Feb 01–28, 2026</div>
                        </div>
                      </div>
                      <div className="flex justify-between mb-6">
                        <div className="text-[10px] text-slate-700 leading-relaxed font-mono">
                          M. TORRES<br />
                          1428 ELM STREET<br />
                          SPRINGWOOD, OH 43081
                        </div>
                        <div className="text-[10px] text-slate-700 font-mono text-right">
                          Account Number: <span className="font-semibold">••••4821</span><br />
                          Page 1 of 3
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="text-[10px] font-semibold border-b border-slate-300 pb-1">SUMMARY</div>
                        <div className="space-y-2 font-mono text-[9px]">
                          <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                            <span className="flex-1">BEGINNING BALANCE</span>
                            <span className="w-24 text-right">$5,474.69</span>
                          </div>
                          <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                            <span className="flex-1">DEPOSITS AND ADDITIONS</span>
                            <span className="w-24 text-right text-green-700">+$2,450.00</span>
                          </div>
                          <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                            <span className="flex-1">ATM & DEBIT CARD WITHDRAWALS</span>
                            <span className="w-24 text-right">-$845.21</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 7 (Flagged Example) */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[450px] h-[585px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-amber-300 ring-1 ring-amber-300 rounded-[2px] flex flex-col relative">
                    <div className="absolute top-2 right-2 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-amber-200 shadow-sm">
                      <Flag className="w-3 h-3" /> FLAGGED
                    </div>
                    <div className="p-8 flex flex-col h-full opacity-80">
                      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
                        <div>
                          <div className="text-lg font-serif text-slate-900 font-bold tracking-tight">CHASE</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-600 font-mono mt-1">Feb 01–28, 2026</div>
                        </div>
                      </div>
                      <div className="my-10 bg-slate-50 p-4 border border-slate-200">
                        <div className="text-[10px] font-mono text-slate-400 blur-[1px] leading-relaxed">
                          12/02 TRANSACTION ACH #4492 - INVALID SCAN<br/>
                          12/03 TRANSFER TO EXTERNAL ACCT XXXX-221<br/>
                          12/05 DIRECT DEPOSIT PAYROLL INC<br/>
                          [ILLEGIBLE SCAN SECTION CONTINUES]
                        </div>
                      </div>
                      <div className="mt-auto text-[10px] text-slate-700 font-mono text-right">
                        Page 2 of 3
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 8 */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[450px] h-[585px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] rounded-[2px] flex flex-col relative border border-slate-200">
                    <div className="p-8 flex flex-col h-full opacity-80">
                      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
                        <div>
                          <div className="text-lg font-serif text-slate-900 font-bold tracking-tight">CHASE</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-600 font-mono mt-1">Feb 01–28, 2026</div>
                        </div>
                      </div>
                      <div className="flex-1"></div>
                      <div className="mt-auto pt-6 border-t border-slate-200">
                        <div className="text-[8px] text-slate-400 text-center uppercase tracking-widest">
                          End of Statement
                        </div>
                      </div>
                      <div className="mt-4 text-[10px] text-slate-700 font-mono text-right">
                        Page 3 of 3
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="w-[600px] h-[780px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] border border-amber-300 ring-1 ring-amber-300 rounded-[2px] flex flex-col relative shrink-0">
                  <div className="absolute top-3 right-3 bg-amber-50 text-amber-700 text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 border border-amber-200 shadow-sm">
                    <Flag className="w-4 h-4" /> FLAGGED
                  </div>
                  <div className="p-10 flex flex-col h-full opacity-80">
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                      <div>
                        <div className="text-2xl font-serif text-slate-900 font-bold tracking-tight">CHASE</div>
                      </div>
                      <div className="text-right mt-2">
                        <div className="text-xs text-slate-600 font-mono mt-1">Feb 01–28, 2026</div>
                      </div>
                    </div>
                    <div className="my-12 bg-slate-50 p-6 border border-slate-200">
                      <div className="text-xs font-mono text-slate-400 blur-[1.5px] leading-relaxed">
                        12/02 TRANSACTION ACH #4492 - INVALID SCAN<br/>
                        12/03 TRANSFER TO EXTERNAL ACCT XXXX-221<br/>
                        12/05 DIRECT DEPOSIT PAYROLL INC<br/>
                        [ILLEGIBLE SCAN SECTION CONTINUES]
                      </div>
                    </div>
                    <div className="mt-auto text-xs text-slate-700 font-mono text-right">
                      Page 2 of 3
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filmstrip (Bottom section) */}
          <div className="h-[140px] md:h-[150px] bg-slate-50 border-t border-slate-200 flex items-end gap-3 px-4 pb-3 pt-8 overflow-x-auto shrink-0 relative custom-scrollbar">
            
            {/* Group 1: URLA - Grayed/Approved */}
            <div className="flex gap-1.5 p-1.5 rounded-[4px] relative border transition-all mt-4 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 bg-slate-200/50 border-slate-300">
              <div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">
                <div className="text-[10.5px] font-bold text-slate-600 truncate min-w-0">URLA Form 1003</div>
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3] shrink-0" />
              </div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={1} status="good" /></div>
            </div>

            {/* Group 2: Bank Statement Jan - Grayed/Approved */}
            <div className="flex gap-1.5 p-1.5 rounded-[4px] relative border transition-all mt-4 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 bg-slate-200/50 border-slate-300">
              <div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">
                <div className="text-[10.5px] font-bold text-slate-600 truncate min-w-0">Bank statement · Jan</div>
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3] shrink-0" />
              </div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={2} status="good" /></div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={3} status="good" /></div>
            </div>

            {/* Group 3: ID Front */}
            <div className="flex gap-1.5 p-1.5 rounded-[4px] relative border transition-all mt-4 bg-purple-50/50 border-purple-200">
              <div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">
                <div className="text-[10.5px] font-bold text-purple-700 truncate min-w-0">Driver's license (front)</div>
              </div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={4} status="undecided" /></div>
            </div>

            {/* Group 4: ID Back */}
            <div className="flex gap-1.5 p-1.5 rounded-[4px] relative border transition-all mt-4 bg-purple-50/50 border-purple-200">
              <div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">
                <div className="text-[10.5px] font-bold text-purple-700 truncate min-w-0">Driver's license (back)</div>
              </div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={5} status="undecided" /></div>
            </div>

            {/* Group 5: Bank Statement Feb (ACTIVE) */}
            <div className={`flex gap-1.5 p-1.5 rounded-[4px] relative border transition-all mt-4 ${mode === 'document' ? 'bg-blue-50/50 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]' : 'bg-slate-100/50 border-slate-300'}`}>
              <div 
                className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 cursor-pointer overflow-hidden"
                onClick={() => setMode('document')}
              >
                <div className={`text-[10.5px] font-bold truncate min-w-0 ${mode === 'document' ? 'text-blue-700' : 'text-slate-600'}`}>Bank statement · Feb</div>
              </div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={6} status="undecided" /></div>
              {/* THIS THUMBNAIL SHOWS THE HOVER CLUSTER */}
              <div onClick={() => setMode('page')}><Thumbnail pageNum={7} status="flagged" isActive={mode === 'page'} showHoverCluster={true} /></div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={8} status="undecided" /></div>
            </div>

            {/* Group 6: Pay Stub (Approved with flag) */}
            <div className="flex gap-1.5 p-1.5 rounded-[4px] relative border transition-all mt-4 bg-slate-200/50 border-slate-300 opacity-80 hover:opacity-100">
              <div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">
                <div className="text-[10.5px] font-bold text-slate-600 truncate shrink min-w-0">Pay stub</div>
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-medium px-1.5 py-[1px] rounded flex items-center gap-1 shrink truncate min-w-0" title="low score — accepted with flag">
                  <Flag className="w-2.5 h-2.5 text-amber-600 fill-amber-100 shrink-0" />
                  <span className="truncate">accepted with flag</span>
                </div>
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3] shrink-0" />
              </div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={9} status="flagged" /></div>
            </div>

            {/* End padding */}
            <div className="w-4 shrink-0"></div>
          </div>
        </div>

        {/* Right Rail */}
        <aside className="w-full md:w-[320px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col min-h-0 max-h-[46vh] md:max-h-none z-20">
          <div className="flex-1 overflow-y-auto">
            {mode === 'document' ? (
              <div className="p-4 md:p-5 flex flex-col gap-4">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">document · approve</div>
                  <div className="font-semibold text-[14px] text-slate-900 leading-snug">Bank statement</div>
                  <div className="font-mono text-[10.5px] text-slate-500 mt-0.5">
                    Requirement: Bank statements · pp. 6–8
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <Check className="w-4 h-4" /> Approve document
                  </button>
                  <button className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <AlertCircle className="w-4 h-4" /> Approve & request new version
                  </button>
                  <button className="bg-white hover:bg-red-50 text-red-600 border border-slate-300 rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <XCircle className="w-4 h-4" /> Reject document
                  </button>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">page decisions (3)</div>
                  <div className="flex flex-col gap-3.5">
                    {/* Page 6 */}
                    <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setMode('page')}>
                      <div className="flex items-start gap-2">
                        <span className="mt-[4px] shrink-0 w-2 h-2 rounded-[2px] border bg-slate-100 border-slate-300" />
                        <span className="text-[12.5px] font-medium text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">Page 6</span>
                        <span className="ml-auto text-[10.5px] text-slate-500 italic">Inherited good</span>
                      </div>
                    </div>
                    {/* Page 7 */}
                    <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setMode('page')}>
                      <div className="flex items-start gap-2">
                        <span className="mt-[4px] shrink-0 w-2 h-2 rounded-[2px] border bg-amber-50 border-amber-500" />
                        <span className="text-[12.5px] font-medium text-amber-700 leading-snug group-hover:text-blue-600 transition-colors">Page 7</span>
                        <span className="ml-auto text-[10px] text-amber-700 bg-white border border-amber-200 px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1"><Flag className="w-2.5 h-2.5"/> Flagged</span>
                      </div>
                      <div className="text-[11.5px] text-slate-500 pl-4 leading-relaxed">Illegible scan detected. Low confidence score (64%).</div>
                    </div>
                    {/* Page 8 */}
                    <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setMode('page')}>
                      <div className="flex items-start gap-2">
                        <span className="mt-[4px] shrink-0 w-2 h-2 rounded-[2px] border bg-slate-100 border-slate-300" />
                        <span className="text-[12.5px] font-medium text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">Page 8</span>
                        <span className="ml-auto text-[10.5px] text-slate-500 italic">Inherited good</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-5 flex flex-col gap-4">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">exception · attend</div>
                  <div className="font-semibold text-[14px] text-slate-900 leading-snug">Bank statement</div>
                  <div className="font-mono text-[10.5px] text-slate-500 mt-0.5">
                    Requirement: Bank statements · pp. 6–8
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="bg-white hover:bg-green-50 text-green-700 border border-slate-300 rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <Check className="w-4 h-4" /> Mark as Good
                  </button>
                  <button className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <Flag className="w-4 h-4" /> Accept with Flag
                  </button>
                  <button className="bg-white hover:bg-red-50 text-red-600 border border-slate-300 rounded-[4px] px-3 py-2 text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                    <XCircle className="w-4 h-4" /> Mark as Bad
                  </button>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">callouts (1)</div>
                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <span className="mt-[4px] shrink-0 w-2 h-2 rounded-[2px] border bg-amber-50 border-amber-500" />
                        <span className="text-[12.5px] font-medium text-slate-900 leading-snug">Illegible scan detected</span>
                      </div>
                      <div className="text-[11.5px] text-slate-500 pl-4 leading-relaxed">Transactions on 12/02 and later appear blurred and cannot be reliably extracted.</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">ocr confidence</span>
                    <span className="font-mono text-[11px] text-amber-600 font-medium">64%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer matches ReviewPage exactly */}
          <div className="border-t border-slate-200 bg-slate-50 p-3 md:p-4 flex flex-col gap-2.5 shrink-0">
            <div className="flex justify-between items-center">
              <button className="flex items-center gap-1 text-[12.5px] font-medium text-slate-500 hover:text-slate-900 min-h-[40px] px-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button className="flex items-center gap-1 text-[12.5px] font-medium text-slate-500 hover:text-slate-900 min-h-[40px] px-1">
                Skip <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:flex items-center justify-between font-mono font-medium text-[9px] uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-200">
              <span>↵ accept</span>
              <span>← → navigate</span>
              <span>esc close</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── pieces ──────────────────────────────────────────────────────────────────

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 md:px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-[2px] transition-colors ${
        active
          ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
          : 'text-slate-500 hover:text-slate-900 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function ScoreChip({ label, value, invert = false }: { label: string; value: number | null; invert?: boolean }) {
  if (value === null) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-slate-50 border border-slate-200">
        <span className="font-bold uppercase tracking-wider text-[9px] text-slate-500">{label}</span>
        <span className="font-mono text-[11.5px] font-medium text-slate-400">—</span>
      </div>
    );
  }
  const color = invert
    ? value >= 30 ? 'text-red-600' : value >= 15 ? 'text-amber-600' : 'text-slate-900'
    : value < 60 ? 'text-red-600' : value < 90 ? 'text-amber-600' : 'text-slate-900';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-slate-50 border border-slate-200">
      <span className="font-bold uppercase tracking-wider text-[9px] text-slate-500">{label}</span>
      <span className={`font-mono text-[11.5px] font-medium ${color}`}>{value}</span>
    </div>
  );
}

function Thumbnail({
  pageNum,
  status,
  isActive = false,
  showHoverCluster = false
}: {
  pageNum: number;
  status: 'good' | 'bad' | 'undecided' | 'flagged';
  isActive?: boolean;
  showHoverCluster?: boolean;
}) {
  return (
    <button
      className={`relative w-[52px] h-[68px] md:w-[62px] md:h-[82px] shrink-0 bg-white border overflow-hidden transition-all group/thumb ${
        isActive
          ? 'border-blue-600 ring-1 ring-blue-600 z-10'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Top status band like Ops Desk */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] z-10 ${status === 'flagged' ? 'bg-amber-500' : status === 'bad' ? 'bg-red-500' : 'bg-transparent'}`} />
      
      {/* Fake document lines inside to give it texture */}
      <div className="absolute inset-[3px] bg-slate-50 flex flex-col p-1.5 gap-1 opacity-50">
        <div className="w-1/2 h-1 bg-slate-300 rounded-[1px]" />
        <div className="w-full h-0.5 bg-slate-200 rounded-[1px] mt-1" />
        <div className="w-3/4 h-0.5 bg-slate-200 rounded-[1px]" />
        <div className="w-full h-0.5 bg-slate-200 rounded-[1px]" />
        <div className="w-5/6 h-0.5 bg-slate-200 rounded-[1px]" />
      </div>

      <span
        className={`absolute bottom-0.5 left-0.5 px-1 rounded-[2px] font-mono text-[9px] leading-[14px] z-20 ${
          isActive ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-500 border border-slate-200'
        }`}
      >
        {pageNum}
      </span>
      
      {/* Native green check */}
      {status === 'good' && (
        <span className="absolute bottom-0.5 right-0.5 bg-green-600 rounded-full p-[2px] z-20">
          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
        </span>
      )}

      {status === 'flagged' && (
        <span className="absolute top-1.5 right-1 bg-amber-500 rounded-full p-[2px] z-20 shadow-sm border border-white">
          <Flag className="w-2.5 h-2.5 text-white stroke-[3] fill-white" />
        </span>
      )}

      {/* Hover Control Cluster - Rendered INSIDE thumbnail bounds, overlaying the bottom half */}
      {showHoverCluster && (
        <div className="absolute bottom-0 left-0 right-0 h-[32px] bg-slate-900/90 flex items-center justify-center gap-1.5 z-30 opacity-100 backdrop-blur-[2px] shadow-[0_-2px_8px_rgba(0,0,0,0.15)]">
          <div className="text-slate-300 hover:text-green-400 transition-colors p-0.5" title="Good">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="w-[1px] h-3 bg-slate-600" />
          <div className="text-slate-300 hover:text-red-400 transition-colors p-0.5" title="Bad">
            <X className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="w-[1px] h-3 bg-slate-600" />
          <div className="text-slate-300 hover:text-amber-400 transition-colors p-0.5" title="Accept with flag">
            <Flag className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
      )}
      
      {/* Cross out overlay if bad */}
      {status === 'bad' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 pointer-events-none">
          <div className="w-[150%] h-[2px] bg-red-600 rotate-45"></div>
        </div>
      )}
    </button>
  );
}
