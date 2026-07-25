import React from 'react';
import { 
  Check, 
  X, 
  Link as LinkIcon, 
  ChevronDown, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Flag,
  MoreHorizontal
} from 'lucide-react';

export function SpreadAndRail() {
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
            <div className="text-[#0F172A] font-medium text-xs font-mono">GROUP PAGES 6–8</div>
            <div className="flex items-center gap-2 text-xs">
              <button className="px-2 py-1 rounded hover:bg-[#E2E8F0] text-[#64748B]">Zoom: 65%</button>
              <button className="px-2 py-1 rounded hover:bg-[#E2E8F0] text-[#64748B]">Fit Width</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto p-8 flex items-start justify-start gap-8 custom-scrollbar">
            
            {/* Page 6 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-[450px] h-[585px] bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] rounded-sm flex flex-col relative">
                {/* Fake Document Content */}
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
              
              {/* Decision Strip */}
              <div className="mt-4 flex bg-white border border-[#CBD5E1] rounded-full p-1 shadow-sm">
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0]">
                  <Check className="w-4 h-4" /> Good
                </button>
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#64748B] hover:text-[#B45309] hover:bg-[#FFFBEB] transition-colors">
                  <Flag className="w-4 h-4" /> Flag
                </button>
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors">
                  <X className="w-4 h-4" /> Bad
                </button>
              </div>
            </div>

            {/* Page 7 (Flagged Example) */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-[450px] h-[585px] bg-[#FFFFFF] shadow-sm border border-[#FDE68A] ring-1 ring-[#FDE68A] rounded-sm flex flex-col relative">
                {/* Visual Flag indicator on the page itself */}
                <div className="absolute top-2 right-2 bg-[#FFFBEB] text-[#B45309] text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-[#FDE68A] shadow-sm">
                  <Flag className="w-3 h-3" /> FLAGGED
                </div>
                
                {/* Fake Document Content */}
                <div className="p-8 flex flex-col h-full opacity-80">
                  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
                    <div>
                      <div className="text-lg font-serif text-slate-900 font-bold tracking-tight">CHASE</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-600 font-mono mt-1">Feb 01–28, 2026</div>
                    </div>
                  </div>
                  
                  {/* Blurry / poorly scanned section to justify a flag */}
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
              
              {/* Decision Strip - Flag Active */}
              <div className="mt-4 flex bg-white border border-[#CBD5E1] rounded-full p-1 shadow-sm">
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#64748B] hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors">
                  <Check className="w-4 h-4" /> Good
                </button>
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A]">
                  <Flag className="w-4 h-4" /> Flagged
                </button>
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors">
                  <X className="w-4 h-4" /> Bad
                </button>
              </div>
            </div>

            {/* Page 8 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-[450px] h-[585px] bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] rounded-sm flex flex-col relative">
                {/* Fake Document Content */}
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
              
              {/* Decision Strip */}
              <div className="mt-4 flex bg-white border border-[#CBD5E1] rounded-full p-1 shadow-sm">
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0]">
                  <Check className="w-4 h-4" /> Good
                </button>
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#64748B] hover:text-[#B45309] hover:bg-[#FFFBEB] transition-colors">
                  <Flag className="w-4 h-4" /> Flag
                </button>
                <button className="px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors">
                  <X className="w-4 h-4" /> Bad
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar (Metadata Rail - THE ONLY CONFIRM SURFACE) */}
        <div className="w-[340px] bg-[#FFFFFF] border-l border-[#E2E8F0] flex flex-col shrink-0 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto">
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
                  
                  {/* Page 6 Row */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="text-xs font-mono text-[#334155]">Page 6</span>
                    </div>
                    <span className="text-[10px] text-[#64748B] italic">Accepted (inherited)</span>
                  </div>
                  
                  {/* Page 7 Row - Flagged */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#FFFBEB]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#B45309]" />
                      <span className="text-xs font-mono text-[#92400E] font-medium">Page 7</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#B45309] font-medium bg-white px-1.5 py-0.5 rounded border border-[#FDE68A] shadow-sm">
                      <Flag className="w-3 h-3" /> Flagged
                    </div>
                  </div>
                  
                  {/* Page 8 Row */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="text-xs font-mono text-[#334155]">Page 8</span>
                    </div>
                    <span className="text-[10px] text-[#64748B] italic">Accepted (inherited)</span>
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
          </div>
          
          {/* Action Stack (Bottom of Rail) */}
          <div className="p-5 border-t border-[#E2E8F0] bg-white space-y-2 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
          </div>
        </div>
      </div>

      {/* Filmstrip (Bottom section) */}
      <div className="h-[220px] shrink-0 bg-[#FFFFFF] border-t border-[#E2E8F0] flex flex-col relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        
        {/* Filmstrip Header/Scroll context */}
        <div className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center px-4 justify-between shrink-0">
          <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Document Groups</div>
          <div className="text-xs text-[#94A3B8] font-mono">1–9 OF 9 PAGES</div>
        </div>

        {/* Scrollable Thumbnails Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex items-end gap-3 custom-scrollbar bg-[#F8FAFC] relative">
          
          {/* Group 1: URLA - Grayed/Approved */}
          <div className="flex flex-col h-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md relative group shrink-0 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
            {/* Status dot absolute */}
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#15803D] border-2 border-white z-10 flex items-center justify-center">
              <Check className="w-2 h-2 text-white stroke-[3]" />
            </div>
            
            <div className="px-2 py-1.5 border-b border-[#E2E8F0] bg-white/40 flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-medium text-[#64748B] truncate max-w-[120px]">URLA Form 1003</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={1} status="good" />
            </div>
          </div>

          {/* Group 2: Bank Statement Jan - Grayed/Approved */}
          <div className="flex flex-col h-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md relative group shrink-0 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
            {/* Status dot absolute */}
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#15803D] border-2 border-white z-10 flex items-center justify-center">
              <Check className="w-2 h-2 text-white stroke-[3]" />
            </div>
            
            <div className="px-2 py-1.5 border-b border-[#E2E8F0] bg-white/40 flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-medium text-[#64748B] truncate max-w-[180px]">Bank statement · Chase ····4821</div>
              <div className="text-[9px] text-[#64748B] opacity-80 uppercase tracking-wide">Jan</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={2} status="good" />
              <Thumbnail pageNum={3} status="good" />
            </div>
          </div>

          {/* Group 3: ID Front */}
          <div className="flex flex-col h-full bg-[#FAF5FF] border border-[#E9D5FF] rounded-md relative group shrink-0">
            <div className="px-2 py-1.5 border-b border-[#E9D5FF] bg-white/40 flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-bold text-[#7E22CE] truncate max-w-[120px]">Driver's license (front)</div>
              <div className="text-[9px] text-[#7E22CE] opacity-80 uppercase tracking-wide">M. Torres</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={4} status="undecided" isImage={true} />
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
            <div className="px-2 py-1.5 border-b border-[#E9D5FF] bg-white/40 flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-bold text-[#7E22CE] truncate max-w-[120px]">Driver's license (back)</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={5} status="undecided" isImage={true} />
            </div>
          </div>

          {/* Group 5: Bank Statement Feb (ACTIVE) */}
          <div className="flex flex-col h-full bg-[#F0FDFA] border-2 border-[#1D4ED8] shadow-[0_0_0_1px_rgba(29,78,216,0.2)] rounded-md relative group shrink-0">
            {/* Active Indicator Arrow */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1D4ED8]" />
            
            <div className="px-2 py-1.5 border-b border-[#CCFBF1] bg-white/40 flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-bold text-[#0F766E] truncate max-w-[180px]">Bank statement · Chase ····4821</div>
              <div className="text-[9px] text-[#0F766E] opacity-80 uppercase tracking-wide">Feb</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              {/* Inherited good state, flag, inherited good */}
              <Thumbnail pageNum={6} status="good" isActive={true} />
              <Thumbnail pageNum={7} status="flag" isActive={true} />
              <Thumbnail pageNum={8} status="good" isActive={true} />
            </div>
          </div>

          {/* Group 6: Pay Stub */}
          <div className="flex flex-col h-full bg-[#FFFFFF] border border-[#CBD5E1] rounded-md relative group shrink-0">
            <div className="px-2 py-1.5 border-b border-[#CBD5E1] bg-[#F8FAFC] flex flex-col justify-center min-h-[36px]">
              <div className="text-[11px] font-medium text-[#334155] truncate max-w-[150px]">Pay stub · Acme Corp</div>
              <div className="text-[9px] text-[#64748B] uppercase tracking-wide">Feb</div>
            </div>
            <div className="p-2 flex gap-2 h-full items-end">
              <Thumbnail pageNum={9} status="undecided" /> 
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
  isImage = false
}: { 
  pageNum: number; 
  status: 'good' | 'bad' | 'flag' | 'undecided'; 
  isActive?: boolean;
  isImage?: boolean;
}) {
  return (
    <div className={`relative flex flex-col items-center gap-1 shrink-0 group/thumb cursor-pointer`}>
      <div className={`
        w-[76px] h-[98px] bg-[#FFFFFF] rounded-sm relative overflow-hidden flex flex-col transition-all
        ${isActive ? 'shadow-[0_0_0_2px_#1D4ED8] ring-2 ring-[#BFDBFE] z-10' : 'border border-[#CBD5E1] shadow-sm hover:border-[#94A3B8]'}
        ${status === 'bad' ? 'opacity-75' : ''}
      `}>
        {/* Fake Thumbnail Content */}
        <div className="p-1.5 opacity-40 flex flex-col h-full pointer-events-none">
          {isImage ? (
            <div className="flex-1 bg-slate-200 rounded-[2px] flex items-center justify-center border border-slate-300">
               <div className="w-6 h-6 rounded-full bg-slate-300 mr-1.5"></div>
               <div className="space-y-1 w-6">
                 <div className="h-1 bg-slate-300 rounded w-full"></div>
                 <div className="h-1 bg-slate-300 rounded w-3/4"></div>
               </div>
            </div>
          ) : (
            <>
              <div className="h-1 w-1/3 bg-slate-800 rounded-[1px] mb-1.5"></div>
              <div className="space-y-[3px] mb-2">
                <div className="h-[2px] w-full bg-slate-400 rounded-[1px]"></div>
                <div className="h-[2px] w-5/6 bg-slate-400 rounded-[1px]"></div>
                <div className="h-[2px] w-4/6 bg-slate-400 rounded-[1px]"></div>
              </div>
              <div className="space-y-1">
                <div className="h-[3px] w-full bg-slate-200 rounded-[1px]"></div>
                <div className="h-[3px] w-full bg-slate-200 rounded-[1px]"></div>
                <div className="h-[3px] w-full bg-slate-200 rounded-[1px]"></div>
              </div>
            </>
          )}
        </div>
        
        {/* Status Overlay */}
        {status === 'good' && (
          <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#15803D] rounded-full border border-white flex items-center justify-center shadow-sm">
            <Check className="w-2 h-2 text-white stroke-[3]" />
          </div>
        )}
        {status === 'bad' && (
          <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#B91C1C] rounded-full border border-white flex items-center justify-center shadow-sm">
            <X className="w-2 h-2 text-white stroke-[3]" />
          </div>
        )}
        {status === 'flag' && (
          <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#B45309] rounded-full border border-white flex items-center justify-center shadow-sm">
            <Flag className="w-2 h-2 text-white stroke-[3]" />
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
