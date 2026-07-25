import React from 'react';
import { 
  Check, X, ChevronDown, AlertTriangle, Sparkles, Link
} from 'lucide-react';

export function GalleryRow() {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#F3F5F7] text-[#334155] font-sans text-[13px] overflow-hidden">
      {/* Top Rail */}
      <div className="h-16 border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 flex items-center gap-3 overflow-x-auto shrink-0 shadow-sm z-10">
        <div className="text-[11px] font-mono font-bold tracking-widest text-[#94A3B8] mr-2 shrink-0 uppercase">
          Document Groups
        </div>
        
        {/* Grp 1: URLA */}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-sm shrink-0 hover:bg-[#F3E8FF] transition-colors cursor-pointer shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#15803D] ring-2 ring-[#FAF5FF]" title="Approved" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#6B21A8] text-[12px]">URLA Form 1003</span>
            <span className="font-mono text-[#7E22CE] text-[11px] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E9D5FF]">p.1</span>
          </div>
        </div>

        {/* Grp 2: Bank Statement Jan */}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#ECFEFF] border border-[#CFFAFE] rounded-sm shrink-0 hover:bg-[#CFFAFE] transition-colors cursor-pointer shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#B45309] ring-2 ring-[#ECFEFF]" title="Incomplete" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0E7490] text-[12px]">Bank statement — Jan</span>
            <span className="font-mono text-[#0E7490] text-[11px] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#CFFAFE]">pp.2–3</span>
          </div>
        </div>

        {/* Grp 3 & 4: DL Front/Back Linked */}
        <div className="flex items-center gap-1 px-1.5 py-1.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-sm shrink-0 shadow-sm">
          <div className="flex items-center gap-2 px-2 py-1 bg-[#FFFFFF] border border-[#99F6E4] rounded-sm cursor-pointer hover:bg-[#F0FDFA] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="w-2 h-2 rounded-full bg-[#94A3B8]" title="Undecided" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#0F766E] text-[12px]">DL (front)</span>
              <span className="font-mono text-[#0D9488] text-[11px]">p.4</span>
            </div>
          </div>
          <div className="text-[#0D9488] px-0.5">
            <Link size={12} />
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-[#FFFFFF] border border-[#99F6E4] rounded-sm cursor-pointer hover:bg-[#F0FDFA] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="w-2 h-2 rounded-full bg-[#94A3B8]" title="Undecided" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#0F766E] text-[12px]">DL (back)</span>
              <span className="font-mono text-[#0D9488] text-[11px]">p.5</span>
            </div>
          </div>
          <button className="ml-1 px-2.5 py-1 bg-[#0F766E] text-[#FFFFFF] text-[11px] font-semibold rounded-sm hover:bg-[#115E59] transition-colors shadow-sm">Merge</button>
        </div>

        {/* Grp 5: Bank Statement Feb (Selected) */}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#EFF6FF] border border-[#1D4ED8] rounded-sm shrink-0 shadow-[0_0_0_1px_#1D4ED8] cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-[#94A3B8] ring-2 ring-[#EFF6FF]" title="Mid-decision" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D4ED8] text-[12px]">Bank statement — Feb</span>
            <span className="font-mono text-[#1D4ED8] text-[11px] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#BFDBFE]">pp.6–8</span>
          </div>
        </div>

        {/* Grp 6: Pay stub */}
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-sm shrink-0 hover:bg-[#FEF3C7] transition-colors cursor-pointer shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#B91C1C] ring-2 ring-[#FFFBEB]" title="Rejected" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#B45309] text-[12px]">Pay stub</span>
            <span className="font-mono text-[#B45309] text-[11px] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#FDE68A]">p.9</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex items-start gap-6 pb-8">
        
        {/* Page 6 */}
        <BankDoc 
          pageNum={6} 
          isGood={true} 
          isBad={false} 
          notes="Extracted dates: Feb 01–28, 2026. Account ends in 4821. Consistent formatting."
        />
        
        {/* Page 7 */}
        <BankDoc 
          pageNum={7} 
          isGood={true} 
          isBad={false} 
          notes="Transaction history continued. No anomalies detected."
        />
        
        {/* Page 8 */}
        <BankDoc 
          pageNum={8} 
          isGood={false} 
          isBad={true} 
          notes="Warning: Page fragment detected. Missing footer and summary blocks."
        />

        {/* Roll-up Card */}
        <div className="w-[340px] shrink-0 bg-[#FFFFFF] border border-[#E2E8F0] shadow-md flex flex-col h-fit self-center -mt-12 rounded-sm relative z-10">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 border-t-2 border-dashed border-[#CBD5E1]" />
          
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="font-semibold text-[#0F172A] mb-1">Finalize Document</div>
            <div className="text-[12px] text-[#64748B]">Review pages and assign to a requirement variant.</div>
          </div>

          <div className="p-5 flex flex-col gap-5">
            <div>
              <div className="text-[10px] font-mono font-bold text-[#94A3B8] mb-1.5 tracking-wider">REQUIREMENT</div>
              <div className="flex items-center gap-2 text-[13px]">
                <div className="w-2 h-2 rounded-sm bg-[#1D4ED8]" />
                <span className="font-medium text-[#0F172A]">Bank statements</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono font-bold text-[#94A3B8] mb-1.5 tracking-wider">VARIANT</div>
              <button className="w-full h-9 px-3 border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#F8FAFC] transition-colors flex items-center justify-between text-[#334155] rounded-sm text-[12px] shadow-sm">
                <span className="font-mono font-medium text-[#0F172A]">Chase ····4821</span>
                <ChevronDown size={14} className="text-[#64748B]" />
              </button>
            </div>

            <div className="bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-sm shadow-sm">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={14} className="text-[#B91C1C] mt-0.5 shrink-0" />
                <div className="text-[#B91C1C] text-[12px] leading-relaxed">
                  <span className="font-bold">1 of 3 pages rejected.</span>
                  <br />Page 8 was marked as 'Not good'.
                </div>
              </div>
            </div>
            
            <div className="text-[12px] text-[#334155] leading-relaxed border-t border-[#E2E8F0] pt-4 mt-1">
              Add this statement <span className="font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-1 py-0.5 rounded text-[#64748B]">(pp. 6–8)</span> to <span className="font-mono font-bold text-[#0F172A]">Chase ····4821</span> of <span className="font-semibold text-[#0F172A]">Bank statements</span>?
            </div>
          </div>

          <div className="p-4 border-t border-[#E2E8F0] flex flex-col gap-2.5 bg-[#F8FAFC]">
            <button className="w-full h-9 bg-[#1D4ED8] text-[#FFFFFF] rounded-sm text-[12px] font-semibold hover:bg-blue-800 transition-colors opacity-40 cursor-not-allowed shadow-sm flex justify-center items-center">
              Approve Document
            </button>
            <button className="w-full py-2.5 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] rounded-sm text-[12px] hover:bg-[#FEF3C7] transition-colors text-left px-3.5 shadow-sm group relative overflow-hidden">
              <div className="font-semibold">Approve anyway & mark <span className="font-mono font-bold bg-[#FDE68A] text-[#92400E] px-1 py-0.5 rounded-sm ml-1 text-[10px]">INCOMPLETE</span></div>
              <div className="text-[11px] font-normal mt-1 text-[#92400E] opacity-90">New version will be requested automatically</div>
              <div className="absolute top-0 right-0 h-full w-1 bg-[#F59E0B]"></div>
            </button>
            <button className="w-full h-9 bg-[#FFFFFF] text-[#B91C1C] border border-[#E2E8F0] rounded-sm text-[12px] font-medium hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-colors shadow-sm mt-1">
              Reject Document
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Filmstrip */}
      <div className="h-[88px] bg-[#FFFFFF] border-t border-[#E2E8F0] p-3 flex gap-2 justify-center items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)] z-10 relative">
        <div className="absolute left-6 text-[11px] font-mono text-[#94A3B8] font-bold tracking-widest uppercase">Overview</div>
        
        <FilmstripPage p={1} border="border-[#E9D5FF]" bg="bg-[#FAF5FF]" status="#15803D" />
        <div className="w-px h-8 bg-[#E2E8F0] mx-1" />
        <FilmstripPage p={2} border="border-[#CFFAFE]" bg="bg-[#ECFEFF]" status="#B45309" />
        <FilmstripPage p={3} border="border-[#CFFAFE]" bg="bg-[#ECFEFF]" status="#B45309" />
        <div className="w-px h-8 bg-[#E2E8F0] mx-1" />
        <FilmstripPage p={4} border="border-[#CCFBF1]" bg="bg-[#F0FDFA]" status="#94A3B8" />
        <FilmstripPage p={5} border="border-[#CCFBF1]" bg="bg-[#F0FDFA]" status="#94A3B8" />
        <div className="w-px h-8 bg-[#E2E8F0] mx-1" />
        
        {/* Highlighted group */}
        <div className="flex gap-2 p-1.5 -m-1.5 bg-[#EFF6FF] border border-[#1D4ED8] rounded-sm shadow-sm relative">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#1D4ED8] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#BFDBFE] whitespace-nowrap shadow-sm">
            CURRENT
          </div>
          <FilmstripPage p={6} border="border-[#BFDBFE]" bg="bg-[#FFFFFF]" status="#15803D" active />
          <FilmstripPage p={7} border="border-[#BFDBFE]" bg="bg-[#FFFFFF]" status="#15803D" active />
          <FilmstripPage p={8} border="border-[#BFDBFE]" bg="bg-[#FFFFFF]" status="#B91C1C" active />
        </div>
        
        <div className="w-px h-8 bg-[#E2E8F0] mx-1" />
        <FilmstripPage p={9} border="border-[#FDE68A]" bg="bg-[#FFFBEB]" status="#B91C1C" />
      </div>
    </div>
  );
}

function BankDoc({ pageNum, isGood, isBad, notes }: { pageNum: number, isGood: boolean, isBad: boolean, notes: string }) {
  return (
    <div className="flex flex-col gap-3 shrink-0 w-[540px] h-full max-h-full">
      <div className="flex-1 bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm relative flex flex-col min-h-0 rounded-sm">
        {/* Fake Doc Header */}
        <div className="border-b border-[#E2E8F0] px-6 py-5 bg-[#FFFFFF]">
           <div className="flex justify-between items-start mb-6">
              <div>
                <div className="font-bold text-[#0F172A] text-xl tracking-tight">CHASE</div>
                <div className="text-[#64748B] text-[10px] uppercase tracking-widest mt-1 font-semibold">JPMorgan Chase Bank, N.A.</div>
              </div>
              <div className="text-right">
                <div className="text-[#0F172A] font-semibold text-sm">Statement of Account</div>
                <div className="font-mono text-[#64748B] text-xs mt-1">Feb 01–28, 2026</div>
                <div className="font-mono text-[#0F172A] text-xs mt-1 font-medium">Acct: ····4821</div>
              </div>
           </div>
           <div className="flex justify-between border-t border-[#E2E8F0] pt-5 mt-5">
              <div>
                <div className="text-[10px] text-[#94A3B8] font-mono font-semibold tracking-wider mb-1">BEGINNING BALANCE</div>
                <div className="font-mono text-[#0F172A]">$14,285.44</div>
              </div>
              <div>
                <div className="text-[10px] text-[#94A3B8] font-mono font-semibold tracking-wider mb-1">DEPOSITS</div>
                <div className="font-mono text-[#0F172A]">$5,200.00</div>
              </div>
              <div>
                <div className="text-[10px] text-[#94A3B8] font-mono font-semibold tracking-wider mb-1">WITHDRAWALS</div>
                <div className="font-mono text-[#0F172A]">-$3,412.10</div>
              </div>
              <div>
                <div className="text-[10px] text-[#1D4ED8] font-mono font-semibold tracking-wider mb-1">ENDING BALANCE</div>
                <div className="font-mono text-[#0F172A] font-bold">$16,073.34</div>
              </div>
           </div>
        </div>

        {/* Fake Doc Body */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col gap-8 bg-[#FFFFFF] relative">
           {/* Section 1 */}
           <div>
             <div className="w-1/4 h-2.5 bg-[#94A3B8] rounded-sm mb-4" />
             <div className="space-y-2.5">
               <div className="w-full h-1.5 bg-[#E2E8F0] rounded-sm" />
               <div className="w-full h-1.5 bg-[#E2E8F0] rounded-sm" />
               <div className="w-5/6 h-1.5 bg-[#E2E8F0] rounded-sm" />
             </div>
           </div>
           {/* Table */}
           <div className="border border-[#E2E8F0] rounded-sm">
             <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 flex justify-between">
                <div className="w-16 h-1.5 bg-[#94A3B8] rounded-sm mt-1" />
                <div className="w-48 h-1.5 bg-[#94A3B8] rounded-sm mt-1" />
                <div className="w-16 h-1.5 bg-[#94A3B8] rounded-sm mt-1" />
             </div>
             {Array.from({ length: pageNum === 8 ? 3 : 7 }).map((_, i) => (
               <div key={i} className="border-b border-[#E2E8F0] last:border-0 px-4 py-3.5 flex justify-between items-center">
                  <div className="w-12 h-1.5 bg-[#CBD5E1] rounded-sm" />
                  <div className="w-40 h-1.5 bg-[#F3F5F7] rounded-sm" />
                  <div className="w-12 h-1.5 bg-[#CBD5E1] rounded-sm" />
               </div>
             ))}
           </div>
           
           {/* Visual defect on page 8 */}
           {pageNum === 8 && (
             <div className="absolute bottom-12 left-0 w-full border-t border-dashed border-[#FECACA] flex items-center justify-center bg-gradient-to-t from-[#FEF2F2] to-transparent pt-12 pb-6">
               <div className="bg-[#FFFFFF] text-[#B91C1C] text-[10px] font-mono font-bold px-3 py-1.5 rounded border border-[#FECACA] shadow-sm tracking-wider">
                 [ FRAGMENT / MISSING FOOTER ]
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Controls */}
      <div className={`bg-[#FFFFFF] border ${isGood ? 'border-[#BBF7D0]' : isBad ? 'border-[#FECACA]' : 'border-[#E2E8F0]'} p-3.5 rounded-sm shadow-sm flex flex-col gap-3.5 transition-colors`}>
        <div className="flex items-start justify-between gap-4">
          <div className="font-mono text-[13px] text-[#0F172A] font-semibold bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-sm shadow-sm">Page {pageNum}</div>
          <div className="text-[11px] text-[#64748B] flex items-start gap-1.5 leading-relaxed bg-[#F8FAFC] p-2 rounded-sm border border-[#E2E8F0] flex-1">
            <Sparkles size={12} className="text-[#1D4ED8] shrink-0 mt-0.5" />
            <span className="font-mono">{notes}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <button className={`flex-1 h-9 flex items-center justify-center gap-2 border rounded-sm text-[12px] font-semibold transition-colors shadow-sm ${
            isGood 
              ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]' 
              : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#64748B] hover:bg-[#F8FAFC]'
          }`}>
            <Check size={16} /> Good
          </button>
          <button className={`flex-1 h-9 flex items-center justify-center gap-2 border rounded-sm text-[12px] font-semibold transition-colors shadow-sm ${
            isBad 
              ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' 
              : 'border-[#E2E8F0] bg-[#FFFFFF] text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#B91C1C] hover:border-[#FECACA]'
          }`}>
            <X size={16} /> Not good
          </button>
        </div>
      </div>
    </div>
  )
}

function FilmstripPage({ p, border, bg, status, active = false }: { p: number, border: string, bg: string, status: string, active?: boolean }) {
  return (
    <div className={`relative w-[52px] h-[64px] ${bg} border ${border} rounded-sm flex flex-col justify-end p-1.5 cursor-pointer transition-transform hover:-translate-y-1 ${active ? 'shadow-sm' : ''}`}>
      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status }} />
      <div className="text-[10px] font-mono font-semibold text-center text-[#64748B] opacity-70">p.{p}</div>
    </div>
  );
}
