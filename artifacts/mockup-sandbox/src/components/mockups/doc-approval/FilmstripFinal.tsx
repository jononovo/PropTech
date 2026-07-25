import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Link as LinkIcon, 
  ChevronDown, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Flag
} from 'lucide-react';

export function FilmstripFinal() {
  const [mode, setMode] = useState<'document' | 'page'>('document');

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-[#F3F5F7] text-[#334155] font-sans text-[13px] overflow-hidden selection:bg-[#BFDBFE]">
      {/* Top Bar */}
      <header className="h-12 shrink-0 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="font-medium text-[#0F172A]">Torres_LoanApp_Packet_Merged.pdf</div>
          <div className="text-[#94A3B8]">|</div>
          <div className="text-[#64748B] font-mono text-xs">9 PAGES • RECVD 10:42 AM</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-[#CBD5E1] rounded text-[#334155] font-medium hover:bg-[#F8FAFC] transition-colors">
            Exit Review
          </button>
          <button className="px-3 py-1.5 bg-[#1D4ED8] text-white rounded font-medium shadow-sm hover:bg-blue-800 transition-colors">
            Finalize Packet
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Viewer */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F3F5F7]">
          {/* Viewer Toolbar */}
          <div className="h-10 flex items-center justify-between px-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center gap-4">
              <div className="text-[#0F172A] font-medium text-xs font-mono">
                {mode === 'document' ? 'GROUP PAGES 6–8' : 'PAGE 7 OF 9'}
              </div>
              
              <div className="bg-[#E2E8F0] p-0.5 rounded-md flex items-center">
                <button 
                  onClick={() => setMode('page')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${mode === 'page' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#334155]'}`}
                >
                  Page
                </button>
                <button 
                  onClick={() => setMode('document')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${mode === 'document' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#334155]'}`}
                >
                  Document
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <button className="px-2 py-1 rounded hover:bg-[#E2E8F0] text-[#64748B]">Zoom: {mode === 'document' ? '65%' : '85%'}</button>
              <button className="px-2 py-1 rounded hover:bg-[#E2E8F0] text-[#64748B]">Fit Width</button>
            </div>
          </div>
          
          {mode === 'document' ? (
            <div className="flex-1 overflow-x-auto overflow-y-auto p-8 flex items-start justify-start gap-8 custom-scrollbar">
              {/* Page 6 */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-[450px] h-[585px] bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] rounded-sm flex flex-col relative">
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
                <div className="w-[450px] h-[585px] bg-[#FFFFFF] shadow-sm border border-[#FDE68A] ring-1 ring-[#FDE68A] rounded-sm flex flex-col relative">
                  <div className="absolute top-2 right-2 bg-[#FFFBEB] text-[#B45309] text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-[#FDE68A] shadow-sm">
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
                    <div className="my-10 bg-slate-100 p-4 border border-slate-200">
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
                <div className="w-[450px] h-[585px] bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] rounded-sm flex flex-col relative">
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
            <div className="flex-1 overflow-auto p-8 flex justify-center items-start relative bg-[#F3F5F7] custom-scrollbar">
              <div className="w-[600px] h-[780px] bg-[#FFFFFF] shadow-sm border border-[#FDE68A] ring-1 ring-[#FDE68A] rounded-sm flex flex-col relative shrink-0">
                <div className="absolute top-3 right-3 bg-[#FFFBEB] text-[#B45309] text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 border border-[#FDE68A] shadow-sm">
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
                  <div className="my-12 bg-slate-100 p-6 border border-slate-200">
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

        {/* Right Sidebar (Metadata Rail - THE ONLY CONFIRM SURFACE) */}
        <div className="w-[340px] bg-[#FFFFFF] border-l border-[#E2E8F0] flex flex-col shrink-0 overflow-hidden relative shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
          <div className="flex-1 overflow-y-auto">
            {mode === 'document' ? (
              <>
                <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#0F766E] text-[11px] font-bold uppercase tracking-wider bg-[#F0FDFA] px-1.5 py-0.5 rounded border border-[#CCFBF1]">Current Group</span>
                    <span className="text-[#64748B] font-mono text-[10px]">PAGES 6–8</span>
                  </div>
                  <h2 className="text-base font-semibold text-[#0F172A] leading-tight mt-2">Bank statement</h2>
                </div>
                
                <div className="p-5 space-y-6">
                  {/* Page-Decision Summary */}
                  <div className="space-y-3">
                    <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide flex items-center justify-between">
                      Page Summary
                      <span className="text-[10px] bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#64748B]">3 pages</span>
                    </div>
                    
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md overflow-hidden flex flex-col divide-y divide-[#E2E8F0]">
                      <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#F1F5F9]" onClick={() => setMode('page')}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className="text-xs font-mono text-[#334155]">Page 6</span>
                        </div>
                        <span className="text-[10px] text-[#64748B] italic">Accepted</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 bg-[#FFFBEB] cursor-pointer hover:bg-[#FEF3C7]" onClick={() => setMode('page')}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#B45309]" />
                          <span className="text-xs font-mono text-[#92400E] font-medium">Page 7</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#B45309] font-medium bg-white px-1.5 py-0.5 rounded border border-[#FDE68A] shadow-sm">
                          <Flag className="w-3 h-3" /> Flagged
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#F1F5F9]" onClick={() => setMode('page')}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className="text-xs font-mono text-[#334155]">Page 8</span>
                        </div>
                        <span className="text-[10px] text-[#64748B] italic">Accepted</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-[#E2E8F0] w-full" />

                  <div>
                    <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide mb-1.5">Requirement</div>
                    <div className="text-[#334155] font-medium flex items-center justify-between">
                      Bank statements
                      <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide mb-1.5">Variant</div>
                    <div className="w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded px-3 py-2 text-[#0F172A] font-mono text-xs flex justify-between items-center shadow-sm hover:border-[#94A3B8] cursor-pointer">
                      Chase ····4821
                      <ChevronDown className="w-4 h-4 text-[#64748B]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide">Extracted Data</div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-md">
                      <div>
                        <div className="text-[10px] text-[#94A3B8]">Institution</div>
                        <div className="text-[#334155] font-medium text-xs">JPMorgan Chase</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#94A3B8]">Account Holder</div>
                        <div className="text-[#334155] font-medium text-xs">M. Torres</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] text-[#94A3B8]">Statement Period</div>
                        <div className="text-[#334155] font-mono text-xs bg-white px-2 py-1 rounded border border-[#E2E8F0] mt-1 inline-block">Feb 01 – Feb 28, 2026</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#B45309] text-[11px] font-bold uppercase tracking-wider bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FDE68A]">Current Page</span>
                    <span className="text-[#64748B] font-mono text-[10px]">PAGE 7</span>
                  </div>
                  <h2 className="text-base font-semibold text-[#0F172A] leading-tight mt-2">Bank statement</h2>
                  <div className="text-xs text-[#64748B] mt-1">Page 2 of 3 in group</div>
                </div>
                
                <div className="p-5 space-y-6">
                  <div>
                    <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      Analyzer Signals
                    </div>
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded p-3 flex gap-2 text-[#B45309]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <span className="font-semibold block mb-0.5">Illegible scan detected</span>
                        Transactions on 12/02 and later appear blurred and cannot be reliably extracted.
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3 text-xs text-[#334155]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[#64748B]">OCR Confidence</span>
                      <span className="font-mono font-medium text-[#B45309]">64%</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#B45309] h-full w-[64%]" />
                    </div>
                  </div>
                  
                  <div className="h-px bg-[#E2E8F0] w-full" />
                  
                  <div className="space-y-3">
                    <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide">Extracted Data (Page 7)</div>
                    <div className="text-xs text-[#64748B] italic">Limited data extracted due to scan quality.</div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Action Stack (Bottom of Rail) */}
          <div className="p-5 border-t border-[#E2E8F0] bg-white space-y-2 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {mode === 'document' ? (
              <>
                <button className="w-full bg-[#1D4ED8] hover:bg-blue-800 text-white py-2.5 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  Approve document
                </button>
                <button className="w-full bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] py-2.5 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <AlertCircle className="w-4 h-4" />
                  Approve & request new version
                </button>
                <button className="w-full bg-[#FFFFFF] hover:bg-[#FEF2F2] hover:border-[#FECACA] text-[#B91C1C] border border-[#E2E8F0] py-2 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <XCircle className="w-4 h-4" />
                  Reject document
                </button>
              </>
            ) : (
              <>
                <button className="w-full bg-[#FFFFFF] hover:bg-[#F0FDF4] hover:border-[#BBF7D0] text-[#15803D] border border-[#E2E8F0] py-2.5 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Good
                </button>
                <button className="w-full bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] py-2.5 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
                  <Flag className="w-4 h-4" />
                  Accept with Flag
                </button>
                <button className="w-full bg-[#FFFFFF] hover:bg-[#FEF2F2] hover:border-[#FECACA] text-[#B91C1C] border border-[#E2E8F0] py-2 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <XCircle className="w-4 h-4" />
                  Mark as Bad
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filmstrip (Bottom section) */}
      <div className="h-[250px] shrink-0 bg-[#FFFFFF] border-t border-[#E2E8F0] flex flex-col relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {/* Filmstrip Header/Scroll context */}
        <div className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center px-4 justify-between shrink-0">
          <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Document Groups</div>
          <div className="text-xs text-[#94A3B8] font-mono">1–9 OF 9 PAGES</div>
        </div>

        {/* Scrollable Thumbnails Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex items-end gap-3 custom-scrollbar bg-[#F8FAFC] relative">
          
          {/* Group 1: URLA (Approved) */}
          <div className="flex flex-col h-full rounded-md relative group shrink-0">
            <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-md overflow-hidden opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              <div 
                className="px-2 py-1.5 border-b border-slate-200 bg-white/40 flex items-center justify-between min-h-[36px] w-[140px] cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setMode('document')}
              >
                <div className="text-[11px] font-bold text-slate-600 truncate">URLA Form 1003</div>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-1" />
              </div>
              <div className="p-2 flex gap-2 h-full items-end">
                <div onClick={() => setMode('page')}><Thumbnail pageNum={1} status="good" /></div>
              </div>
            </div>
          </div>

          {/* Group 2: Bank Statement Jan (Approved) */}
          <div className="flex flex-col h-full rounded-md relative group shrink-0">
            <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-md overflow-hidden opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              <div 
                className="px-2 py-1.5 border-b border-slate-200 bg-white/40 flex items-center justify-between min-h-[36px] cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setMode('document')}
              >
                <div className="flex flex-col">
                  <div className="text-[11px] font-bold text-slate-600 truncate max-w-[180px]">Bank statement · Chase ····4821</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wide">Jan</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-2" />
              </div>
              <div className="p-2 flex gap-2 h-full items-end">
                <div onClick={() => setMode('page')}><Thumbnail pageNum={2} status="good" /></div>
                <div onClick={() => setMode('page')}><Thumbnail pageNum={3} status="good" /></div>
              </div>
            </div>
          </div>

          {/* Group 3: ID Front (Hover active cluster example) */}
          <div className="flex flex-col h-full bg-[#FAF5FF] border border-[#E9D5FF] rounded-md relative group shrink-0">
            <div 
              className="px-2 py-1.5 border-b border-[#E9D5FF] bg-white/40 flex flex-col justify-center min-h-[36px] cursor-pointer hover:bg-white/60 transition-colors"
              onClick={() => setMode('document')}
            >
              <div className="text-[11px] font-bold text-[#7E22CE] truncate max-w-[120px]">Driver's license (front)</div>
              <div className="text-[9px] text-[#7E22CE] opacity-80 uppercase tracking-wide">M. Torres</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <div onClick={() => setMode('page')}>
                <Thumbnail pageNum={4} status="undecided" isImage={true} showHoverCluster={true} />
              </div>
            </div>
          </div>

          {/* Merge Affordance */}
          <div className="flex flex-col h-full justify-center px-1 shrink-0">
            <button className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] shadow-sm flex items-center justify-center text-[#64748B] hover:text-[#1D4ED8] hover:border-[#1D4ED8] hover:bg-[#EFF6FF] transition-all group z-10 relative">
              <LinkIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Group 4: ID Back */}
          <div className="flex flex-col h-full bg-[#FAF5FF] border border-[#E9D5FF] rounded-md relative group shrink-0">
            <div 
              className="px-2 py-1.5 border-b border-[#E9D5FF] bg-white/40 flex flex-col justify-center min-h-[36px] cursor-pointer hover:bg-white/60 transition-colors"
              onClick={() => setMode('document')}
            >
              <div className="text-[11px] font-bold text-[#7E22CE] truncate max-w-[120px]">Driver's license (back)</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <div onClick={() => setMode('page')}>
                <Thumbnail pageNum={5} status="undecided" isImage={true} />
              </div>
            </div>
          </div>

          {/* Group 5: Bank Statement Feb (ACTIVE depending on mode) */}
          <div className={`flex flex-col h-full bg-[#F0FDFA] rounded-md relative group shrink-0 transition-all ${mode === 'document' ? 'border-2 border-[#1D4ED8] shadow-[0_0_0_1px_rgba(29,78,216,0.2)]' : 'border border-[#CCFBF1]'}`}>
            {mode === 'document' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1D4ED8] border-b-0" />
            )}
            
            <div 
              className={`px-2 py-1.5 border-b border-[#CCFBF1] bg-white/40 flex flex-col justify-center min-h-[36px] cursor-pointer hover:bg-white/60 transition-colors ${mode === 'document' ? 'opacity-100' : 'opacity-80'}`}
              onClick={() => setMode('document')}
            >
              <div className="text-[11px] font-bold text-[#0F766E] truncate max-w-[180px]">Bank statement · Chase ····4821</div>
              <div className="text-[9px] text-[#0F766E] opacity-80 uppercase tracking-wide">Feb</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <div onClick={() => setMode('page')}><Thumbnail pageNum={6} status="good" isActive={false} /></div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={7} status="flagged" isActive={mode === 'page'} /></div>
              <div onClick={() => setMode('page')}><Thumbnail pageNum={8} status="good" isActive={false} /></div>
            </div>
          </div>

          {/* Group 6: Pay Stub (Approved with flag) */}
          <div className="flex flex-col h-full rounded-md relative group shrink-0">
            <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-md overflow-hidden opacity-80 transition-all hover:opacity-100">
              <div 
                className="px-2 py-1.5 border-b border-slate-200 bg-white/40 flex flex-col justify-center min-h-[44px] cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setMode('document')}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex flex-col">
                    <div className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">Pay stub · Acme Corp</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide">Feb</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-2" />
                </div>
                <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                  <Flag className="w-2.5 h-2.5 text-[#D97706] fill-[#FEF3C7]" />
                  low score — accepted with flag
                </div>
              </div>
              <div className="p-2 flex gap-2 h-full items-end grayscale-[0.3]">
                <div onClick={() => setMode('page')}><Thumbnail pageNum={9} status="flagged" /></div>
              </div>
            </div>
          </div>

          {/* End padding for scroll */}
          <div className="w-8 shrink-0"></div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for Thumbnails
function Thumbnail({ 
  pageNum, 
  status, 
  isActive = false,
  isImage = false,
  showHoverCluster = false
}: { 
  pageNum: number; 
  status: 'good' | 'bad' | 'undecided' | 'flagged'; 
  isActive?: boolean;
  isImage?: boolean;
  showHoverCluster?: boolean;
}) {
  return (
    <div className={`relative flex flex-col items-center gap-1 shrink-0 group/thumb cursor-pointer`}>
      <div className={`
        w-[88px] h-[114px] bg-[#FFFFFF] rounded-sm relative overflow-visible flex flex-col transition-all
        ${isActive ? 'shadow-[0_0_0_2px_#1D4ED8] ring-2 ring-[#BFDBFE] z-10' : 'border border-[#CBD5E1] shadow-sm hover:border-[#94A3B8]'}
        ${status === 'bad' ? 'opacity-75' : ''}
      `}>
        {/* Fake Thumbnail Content */}
        <div className={`p-1.5 opacity-40 flex flex-col h-full pointer-events-none overflow-hidden ${showHoverCluster ? 'blur-[1px] opacity-20' : ''}`}>
          {isImage ? (
            <div className="flex-1 bg-slate-200 rounded-[2px] flex items-center justify-center border border-slate-300">
               <div className="w-8 h-8 rounded-full bg-slate-300 mr-2"></div>
               <div className="space-y-1 w-8">
                 <div className="h-1 bg-slate-300 rounded w-full"></div>
                 <div className="h-1 bg-slate-300 rounded w-3/4"></div>
               </div>
            </div>
          ) : (
            <>
              <div className="h-1.5 w-1/3 bg-slate-800 rounded-[1px] mb-2"></div>
              <div className="space-y-1 mb-3">
                <div className="h-0.5 w-full bg-slate-400 rounded-[1px]"></div>
                <div className="h-0.5 w-5/6 bg-slate-400 rounded-[1px]"></div>
                <div className="h-0.5 w-4/6 bg-slate-400 rounded-[1px]"></div>
              </div>
              <div className="space-y-1.5">
                <div className="h-1 w-full bg-slate-200 rounded-[1px]"></div>
                <div className="h-1 w-full bg-slate-200 rounded-[1px]"></div>
                <div className="h-1 w-full bg-slate-200 rounded-[1px]"></div>
              </div>
            </>
          )}
        </div>
        
        {/* Hover Controls (The Tiny Cluster) */}
        {showHoverCluster && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full border border-slate-200 p-0.5 z-30">
            <button className="p-1 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-full transition-colors" title="Good">
              <Check className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-200 mx-px"></div>
            <button className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors" title="Bad">
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-200 mx-px"></div>
            <button className="p-1 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-full transition-colors" title="Accept with flag">
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Status Overlays */}
        {status === 'good' && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-[#15803D] rounded-full border border-white flex items-center justify-center shadow-sm z-10">
            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
          </div>
        )}
        {status === 'flagged' && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-[#D97706] rounded-full border border-white flex items-center justify-center shadow-sm z-10">
            <Flag className="w-2.5 h-2.5 text-white stroke-[3] fill-white" />
          </div>
        )}
        {status === 'bad' && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-[#B91C1C] rounded-full border border-white flex items-center justify-center shadow-sm z-10">
            <X className="w-2.5 h-2.5 text-white stroke-[3]" />
          </div>
        )}
        
        {/* Cross out bad pages */}
        {status === 'bad' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute w-[150%] h-px bg-[#B91C1C] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-50"></div>
          </div>
        )}
      </div>
      <div className="font-mono text-[10px] text-[#64748B]">p{pageNum}</div>
    </div>
  );
}
