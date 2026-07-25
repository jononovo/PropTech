import React from 'react';
import { 
  Check, 
  X, 
  Link as LinkIcon, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle2, 
  Flag
} from 'lucide-react';

export function FilmstripFastLane() {
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
          <div className="h-10 flex items-center justify-center gap-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center gap-2 text-[#64748B] text-xs font-mono">
              <button className="hover:text-[#0F172A] px-1">&larr; Prev</button>
              <span className="text-[#0F172A] font-medium">PAGE 3 OF 9</span>
              <button className="hover:text-[#0F172A] px-1">Next &rarr;</button>
            </div>
            <div className="text-[#E2E8F0]">|</div>
            <div className="flex items-center gap-2 text-xs">
              <button className="px-2 py-1 rounded hover:bg-[#E2E8F0] text-[#64748B]">Zoom: 85%</button>
              <button className="px-2 py-1 rounded hover:bg-[#E2E8F0] text-[#64748B]">Fit Width</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start relative">
            <div className="relative flex gap-6">
              {/* The Document Page */}
              <div className="w-[600px] h-[780px] bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] rounded-sm flex flex-col relative">
                {/* Fake Document Content */}
                <div className="p-10 flex flex-col h-full opacity-80">
                  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                    <div>
                      <div className="text-xl font-serif text-slate-900 font-bold tracking-tight">CHASE</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">JPMorgan Chase Bank, N.A.</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-800">Statement of Account</div>
                      <div className="text-xs text-slate-600 font-mono mt-1">Jan 01–31, 2026</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-8">
                    <div className="text-xs text-slate-700 leading-relaxed font-mono">
                      M. TORRES<br />
                      1428 ELM STREET<br />
                      SPRINGWOOD, OH 43081
                    </div>
                    <div className="text-xs text-slate-700 font-mono text-right">
                      Account Number: <span className="font-semibold">••••4821</span><br />
                      Page 2 of 2
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-xs font-semibold border-b border-slate-300 pb-1">TRANSACTION HISTORY</div>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                        <span className="w-16">01/15</span>
                        <span className="flex-1">ACH ELECTRONIC CREDIT - PAYROLL</span>
                        <span className="w-24 text-right text-green-700">+$2,450.00</span>
                        <span className="w-24 text-right">$5,821.40</span>
                      </div>
                      <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                        <span className="w-16">01/18</span>
                        <span className="flex-1">ZELLE TRANSFER TO S. CONNOR</span>
                        <span className="w-24 text-right">-$150.00</span>
                        <span className="w-24 text-right">$5,671.40</span>
                      </div>
                      <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                        <span className="w-16">01/22</span>
                        <span className="flex-1">TARGET STORE #4419</span>
                        <span className="w-24 text-right">-$84.21</span>
                        <span className="w-24 text-right">$5,587.19</span>
                      </div>
                      <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                        <span className="w-16">01/28</span>
                        <span className="flex-1">WHOLE FOODS MARKET</span>
                        <span className="w-24 text-right">-$112.50</span>
                        <span className="w-24 text-right">$5,474.69</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-200">
                    <div className="text-[9px] text-slate-400 text-center uppercase tracking-widest">
                      End of Statement
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Metadata Rail) */}
        <div className="w-80 bg-[#FFFFFF] border-l border-[#E2E8F0] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#0F766E] text-[11px] font-bold uppercase tracking-wider bg-[#F0FDFA] px-1.5 py-0.5 rounded border border-[#CCFBF1]">Current Group</span>
              <span className="text-[#64748B] font-mono text-[10px]">PAGES 2–3</span>
            </div>
            <h2 className="text-base font-semibold text-[#0F172A] leading-tight mt-2">Bank statement</h2>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide mb-1.5">Requirement</div>
              <div className="text-[#334155] font-medium flex items-center justify-between">
                Bank statements
                <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide mb-1.5">Variant</div>
              <div className="w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded px-3 py-2 text-[#0F172A] font-mono text-xs flex justify-between items-center shadow-sm">
                Chase ····4821
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0] w-full" />

            <div className="space-y-3">
              <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide">Extracted Data</div>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                <div>
                  <div className="text-[10px] text-[#94A3B8]">Institution</div>
                  <div className="text-[#334155] font-medium">JPMorgan Chase</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#94A3B8]">Account Holder</div>
                  <div className="text-[#334155] font-medium">M. Torres</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-[#94A3B8]">Statement Period</div>
                  <div className="text-[#334155] font-mono text-xs">Jan 01 – Jan 31, 2026</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0] w-full" />

            <div>
              <div className="text-[11px] text-[#64748B] font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
                Analyzer Signals
              </div>
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded p-3 flex gap-2 text-[#B45309]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold block mb-0.5">Missing Page 1?</span>
                  The document appears to start on page 2. Expected summary page is missing.
                </div>
              </div>
            </div>
            
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3 text-xs text-[#334155]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[#64748B]">Confidence Score</span>
                <span className="font-mono font-medium text-[#15803D]">98%</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-[#15803D] h-full w-[98%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filmstrip (Bottom section) */}
      <div className="h-[280px] shrink-0 bg-[#FFFFFF] border-t border-[#E2E8F0] flex flex-col relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {/* Filmstrip Header/Scroll context */}
        <div className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center px-4 justify-between shrink-0">
          <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Document Groups</div>
          <div className="text-xs text-[#94A3B8] font-mono">1–9 OF 9 PAGES</div>
        </div>

        {/* Scrollable Thumbnails Area */}
        <div className="flex-1 overflow-x-auto overflow-y-visible p-4 flex items-end gap-3 custom-scrollbar bg-[#F8FAFC] relative">
          
          {/* Group 1: URLA (Approved) */}
          <div className="flex flex-col h-full rounded-md relative group shrink-0">
            <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-md overflow-hidden opacity-70 transition-opacity hover:opacity-100">
              <div className="px-2 py-1.5 border-b border-slate-200 bg-white/40 flex items-center justify-between min-h-[36px] w-[140px]">
                <div className="text-[11px] font-bold text-slate-600 truncate">URLA Form 1003</div>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-1" />
              </div>
              <div className="p-2 flex gap-2 h-full items-end grayscale-[0.5]">
                <Thumbnail pageNum={1} status="good" />
              </div>
            </div>
          </div>

          {/* Group 2: Bank Statement Jan (Approved) */}
          <div className="flex flex-col h-full rounded-md relative group shrink-0">
            <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-md overflow-hidden opacity-70 transition-opacity hover:opacity-100">
              <div className="px-2 py-1.5 border-b border-slate-200 bg-white/40 flex items-center justify-between min-h-[36px]">
                <div className="flex flex-col">
                  <div className="text-[11px] font-bold text-slate-600 truncate max-w-[180px]">Bank statement · Chase ····4821</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wide">Jan</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-2" />
              </div>
              <div className="p-2 flex gap-2 h-full items-end grayscale-[0.5]">
                <Thumbnail pageNum={2} status="good" />
                <Thumbnail pageNum={3} status="good" />
              </div>
            </div>
          </div>

          {/* Group 3: ID Front (Hover active) */}
          <div className="flex flex-col h-full bg-[#FAF5FF] border border-[#E9D5FF] rounded-md relative group shrink-0">
            <div className="px-2 py-1.5 border-b border-[#E9D5FF] bg-white/40 flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-bold text-[#7E22CE] truncate max-w-[120px]">Driver's license (front)</div>
              <div className="text-[9px] text-[#7E22CE] opacity-80 uppercase tracking-wide">M. Torres</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={4} status="undecided" isImage={true} showHoverCluster={true} />
            </div>
          </div>

          {/* Merge Affordance */}
          <div className="flex flex-col h-full justify-center px-1 shrink-0">
            <button className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] shadow-sm flex items-center justify-center text-[#64748B] hover:text-[#1D4ED8] hover:border-[#1D4ED8] hover:bg-[#EFF6FF] transition-all group z-10 relative">
              <LinkIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Merge documents
              </div>
            </button>
          </div>

          {/* Group 4: ID Back */}
          <div className="flex flex-col h-full bg-[#FAF5FF] border border-[#E9D5FF] rounded-md relative group shrink-0">
            <div className="px-2 py-1.5 border-b border-[#E9D5FF] bg-white/40 flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-bold text-[#7E22CE] truncate max-w-[120px]">Driver's license (back)</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={5} status="undecided" isImage={true} />
            </div>
          </div>

          {/* Group 5: Bank Statement Feb (Active inline confirm) */}
          <div className="flex flex-col h-full bg-[#F0FDFA] border-2 border-[#1D4ED8] shadow-[0_0_0_1px_rgba(29,78,216,0.2)] rounded-md relative group shrink-0">
            
            {/* Inline confirm attached to the chip */}
            <div className="absolute bottom-full left-0 mb-[9px] w-[340px] bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 p-3 z-30 transform origin-bottom-left transition-all">
              <div className="text-[13px] font-medium text-slate-900 mb-3 leading-tight">
                Approve Bank statement · Chase ····4821 · Feb (pp 6–8)?
              </div>
              <div className="flex items-center justify-between mt-1">
                <button className="text-[11px] text-[#1D4ED8] hover:text-blue-800 font-medium transition-colors flex items-center">
                  review page-by-page &rarr;
                </button>
                <button className="bg-[#1D4ED8] hover:bg-blue-800 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5">
                  Approve document
                </button>
              </div>
              {/* Pointing down to the title chip */}
              <div className="absolute -bottom-[5px] left-8 w-2.5 h-2.5 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
            </div>

            <div className="px-2 py-1.5 border-b border-[#CCFBF1] bg-white/40 flex flex-col justify-center min-h-[36px] relative z-20 cursor-pointer hover:bg-white/60 transition-colors">
              <div className="text-[11px] font-bold text-[#0F766E] truncate max-w-[180px]">Bank statement · Chase ····4821</div>
              <div className="text-[9px] text-[#0F766E] opacity-80 uppercase tracking-wide">Feb</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={6} status="undecided" />
              <Thumbnail pageNum={7} status="undecided" isActive={true} />
              <Thumbnail pageNum={8} status="undecided" />
            </div>
          </div>

          {/* Group 6: Pay Stub (Approved with flag) */}
          <div className="flex flex-col h-full rounded-md relative group shrink-0">
            <div className="absolute -top-3 -right-2 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 z-20 whitespace-nowrap">
              <Flag className="w-3 h-3 text-[#D97706] fill-[#FEF3C7]" />
              low score — accepted with flag
            </div>

            <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-md overflow-hidden opacity-70 transition-opacity hover:opacity-100">
              <div className="px-2 py-1.5 border-b border-slate-200 bg-white/40 flex items-center justify-between min-h-[36px]">
                <div className="flex flex-col">
                  <div className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">Pay stub · Acme Corp</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wide">Feb</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 ml-2" />
              </div>
              <div className="p-2 flex gap-2 h-full items-end grayscale-[0.5]">
                <Thumbnail pageNum={9} status="flagged" />
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
