import React, { useState } from "react";
import type { Go } from "../Backbone";
import { CASE, SECTIONS, liveClocks, stoppedClocks, band, daysTo, fmt, daysToClose, Req, stats, allReqs } from "../data";
import { Check, Lock, Bell, Clock, Hourglass, AlertCircle, Sparkles, UploadCloud, FileText, ChevronRight, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function WorkfilePage({ go }: { go: Go }) {
  const [toast, setToast] = useState<string | null>(null);

  const [isRailCollapsed, setIsRailCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("rail") === "collapsed";
    }
    return false;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const s3 = SECTIONS.find(s => s.id === "s3")!;
  const w2 = s3.reqs.find(r => r.id === "c1")!;
  const payStubs = s3.reqs.find(r => r.id === "c2")!;
  const bankStatements = s3.reqs.find(r => r.id === "c3")!;
  const giftLetter = s3.reqs.find(r => r.id === "c4")!;
  const taxReturns = s3.reqs.find(r => r.id === "c5")!;
  
  const currentStats = stats();

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-[#F3F5F7] text-[#0F172A] font-sans selection:bg-[#EFF6FF] flex justify-center pb-8 md:pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-4 py-2 rounded shadow-lg text-sm font-medium z-50 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="w-full max-w-[1100px] flex flex-col md:flex-row px-4 md:px-8 mt-4 md:mt-12 gap-6 md:gap-12 transition-all duration-200">
        {/* Left Rail */}
        <aside className={`shrink-0 flex flex-col pt-2 transition-[width] duration-200 ease-in-out ${isRailCollapsed ? "w-full md:w-[52px]" : "w-full md:w-[280px]"}`}>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center mb-6 h-[26px]">
            {!isRailCollapsed && (
              <div className="font-semibold text-[10px] uppercase tracking-[0.06em] text-[#64748B] flex-1 truncate pr-2">
                {currentStats.quiet} OF 20 FILED CLEAN · {currentStats.attention} NEED YOU
              </div>
            )}
            <button 
              onClick={() => setIsRailCollapsed(!isRailCollapsed)}
              className={`w-[26px] h-[26px] shrink-0 rounded-[4px] flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors ${isRailCollapsed ? 'mx-auto' : ''}`}
              title={isRailCollapsed ? "Expand rail" : "Collapse rail"}
            >
              {isRailCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </div>

          {/* Mobile Header Whisper */}
          <div className="md:hidden mb-3 font-semibold text-[10px] uppercase tracking-[0.06em] text-[#64748B]">
            {currentStats.quiet} OF 20 FILED CLEAN · {currentStats.attention} NEED YOU
          </div>

          {/* Mobile Rail (Horizontal Scroll) */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-2 -mx-4 px-4 snap-x" style={{ scrollbarWidth: 'none' }}>
            <MobileRailNode num="01" name="Initial App" count="3/3" state="done" />
            <MobileRailNode num="02" name="ID Verif" count="2/2" state="done" />
            <MobileRailNode num="03" name="Income & Assets" count="2/5" state="current" dot="blocker" />
            <MobileRailNode num="04" name="Valuation" count="3/4" state="waiting" dot="warning" />
            <MobileRailNode num="05" name="Title & Escrow" count="1/3" state="review" dot="neutral" />
            <MobileRailNode num="06" name="Credit" count="2/3" state="clock" dot="warning" />
          </div>

          {/* Desktop Rail (Expanded) */}
          {!isRailCollapsed && (
            <div className="hidden md:flex relative flex-col gap-5 ml-2 animate-in fade-in duration-200">
              <div className="absolute left-[7px] top-[14px] bottom-4 w-[1px] bg-[#E2E8F0]"></div>
              <RailNode num="01" name="Initial Application" count="3/3" state="done" />
              <RailNode num="02" name="Identity Verification" count="2/2" state="done" />
              <RailNode num="03" name="Income & Assets" count="2/5" state="current" dot="blocker" />
              <RailNode num="04" name="Property Valuation" count="3/4" state="waiting" dot="warning" />
              <RailNode num="05" name="Title & Escrow" count="1/3" state="review" dot="neutral" />
              <RailNode num="06" name="Credit & Compliance" count="2/3" state="clock" dot="warning" />
            </div>
          )}

          {/* Desktop Rail (Collapsed) */}
          {isRailCollapsed && (
            <div className="hidden md:flex flex-col items-center gap-1 w-full animate-in fade-in duration-200">
              <CollapsedRailNode num="01" name="Initial Application" count="3/3" state="done" />
              <CollapsedRailNode num="02" name="Identity Verification" count="2/2" state="done" />
              <CollapsedRailNode num="03" name="Income & Assets" count="2/5" state="current" dot="blocker" />
              <CollapsedRailNode num="04" name="Property Valuation" count="3/4" state="waiting" dot="warning" />
              <CollapsedRailNode num="05" name="Title & Escrow" count="1/3" state="review" dot="neutral" />
              <CollapsedRailNode num="06" name="Credit & Compliance" count="2/3" state="clock" dot="warning" />
            </div>
          )}

          {/* Desktop Waiting Card (Expanded) */}
          {!isRailCollapsed && (
            <div className="hidden md:block mt-10 bg-white border border-[#E2E8F0] rounded p-3 animate-in fade-in duration-200">
              <div className="font-semibold text-[10px] uppercase tracking-[0.06em] text-[#64748B] mb-2.5">
                Waiting on others
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <Hourglass className="w-3.5 h-3.5 text-[#D97706] mt-[2px] shrink-0" />
                  <div className="text-[13px] leading-tight text-[#334155]">
                    <span className="font-medium text-[#0F172A]">Insurance binder</span>
                    <span> — originator · requested <span className="font-['IBM_Plex_Mono'] text-[#0F172A]">Jul 22</span></span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Hourglass className="w-3.5 h-3.5 text-[#D97706] mt-[2px] shrink-0" />
                  <div className="text-[13px] leading-tight text-[#334155]">
                    <span className="font-medium text-[#0F172A]">Preliminary CD</span>
                    <span> — escrow · due <span className="font-['IBM_Plex_Mono'] text-[#0F172A]">Aug 31</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Waiting Card (Collapsed) */}
          {isRailCollapsed && (
            <div className="hidden md:flex mt-10 flex-col items-center animate-in fade-in duration-200">
              <button 
                className="w-[40px] h-[40px] rounded-[4px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] flex flex-col items-center justify-center transition-colors"
                title="Waiting on others:&#10;• Insurance binder&#10;• Preliminary CD"
              >
                <Hourglass className="w-3.5 h-3.5 text-[#D97706] mb-[2px]" />
                <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#64748B] leading-none">2</span>
              </button>
            </div>
          )}
        </aside>

        {/* Main Column */}
        <main className="flex-1 w-full max-w-[880px] flex flex-col transition-all duration-200">
          <header className="mb-4 md:mb-6 flex flex-col md:flex-row justify-start md:justify-between items-start md:items-end gap-3 md:gap-0">
            <div>
              <div className="font-semibold text-[10px] uppercase tracking-[0.08em] text-[#64748B] mb-1.5">
                Section 03 of 06
              </div>
              <h1 className="font-semibold text-[20px] md:text-[22px] tracking-[-0.01em] text-[#0F172A] mb-1">
                Income & Assets
              </h1>
              <p className="text-[13px] md:text-[14px] text-[#334155]">
                Only Homium's underwriting team sees these documents.
              </p>
            </div>
            <button 
              onClick={() => go("register")}
              className="text-[13px] font-medium text-[#1D4ED8] hover:text-[#1E40AF] transition-colors md:pb-0.5"
            >
              see this section in the Register →
            </button>
          </header>

          <div className="flex flex-col gap-3">
            {/* W-2 Forms - ACCEPTED */}
            <div className="bg-white rounded border border-[#E2E8F0] p-3 md:px-4 md:py-2.5 flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between gap-2 md:gap-0 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                  <Lock className="w-3 h-3 text-[#15803D]" />
                </div>
                <div className="text-[13px] font-medium text-[#0F172A]">{w2.name}</div>
              </div>
              <div className="font-['IBM_Plex_Mono'] text-[11px] md:text-[12px] text-[#15803D] md:ml-0 ml-8">
                accepted Jul 20 — clock stopped
              </div>
            </div>

            {/* Pay Stubs - CLEAN ON CLOCK */}
            <div className="bg-white rounded border border-[#E2E8F0] p-3 md:px-4 md:py-3 flex flex-col gap-2 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3 text-[#475569]" />
                  </div>
                  <div className="text-[13px] font-medium text-[#0F172A]">{payStubs.name}</div>
                  <div className="font-semibold text-[9.5px] uppercase tracking-[0.06em] text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded-[3px]">
                    clean
                  </div>
                </div>
                <button 
                  onClick={() => go("timeline")}
                  className="flex items-center justify-center gap-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] px-2 py-1.5 md:py-0.5 rounded-[3px] hover:bg-[#FEF3C7] transition-colors w-full md:w-auto mt-1 md:mt-0 ml-0 md:ml-auto"
                >
                  <Bell className="w-3 h-3" />
                  <span className="font-['IBM_Plex_Mono'] text-[11px] font-medium">goes stale Aug 7 · 15 days</span>
                </button>
              </div>
              <div className="text-[13px] text-[#334155] pl-0 md:pl-8 mt-1 md:mt-0">
                {payStubs.expiry?.rule}. {payStubs.desc}
              </div>
            </div>

            {/* Bank Statements - FLAGGED */}
            <div className="bg-white rounded border border-[#FECACA] relative flex flex-col">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-[#DC2626] rounded-l"></div>
              
              <div className="p-3 pl-4 md:p-4 md:pl-5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
                    </div>
                    <div className="text-[13px] md:text-[14px] font-semibold text-[#0F172A]">{bankStatements.name}</div>
                    <div className="font-semibold text-[9.5px] uppercase tracking-[0.06em] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded-[3px]">
                      Flagged
                    </div>
                  </div>
                </div>

                <div className="pl-0 md:pl-8 flex flex-col gap-3.5 mt-2 md:mt-0">
                  <p className="text-[13px] text-[#0F172A] leading-relaxed max-w-[500px]">
                    {bankStatements.flag?.note}
                  </p>

                  {/* Thumbnails */}
                  <div className="flex items-center gap-2.5 my-0.5">
                    <div className="w-11 h-14 bg-white border border-[#E2E8F0] rounded-[3px] relative">
                      <div className="absolute top-2 left-2 right-2 h-[2px] bg-[#E2E8F0] rounded-full"></div>
                      <div className="absolute top-4 left-2 w-4 h-[2px] bg-[#E2E8F0] rounded-full"></div>
                    </div>
                    <div className="w-11 h-14 bg-white border-2 border-[#DC2626] rounded-[3px] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#FEF2F2]/50"></div>
                      <div className="absolute top-1.5 left-1.5 right-1.5 h-[2px] bg-[#FECACA] rounded-full"></div>
                      <div className="absolute top-1/2 -left-2 right-0 h-[1.5px] bg-[#DC2626] rotate-[-25deg]"></div>
                    </div>
                    <div className="w-11 h-14 bg-white border border-[#E2E8F0] rounded-[3px] relative">
                      <div className="absolute top-2 left-2 right-2 h-[2px] bg-[#E2E8F0] rounded-full"></div>
                      <div className="absolute top-4 left-2 w-5 h-[2px] bg-[#E2E8F0] rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-1 w-full md:w-auto">
                    <button 
                      onClick={() => showToast("Scan request sent to applicant")}
                      className="bg-[#1D4ED8] text-white text-[12px] font-semibold px-3 py-2.5 md:py-1.5 rounded hover:bg-[#1E40AF] transition-colors w-full md:w-auto text-center"
                    >
                      Request re-scan
                    </button>
                    <button 
                      onClick={() => showToast("Exception cleared — accepted as-is")}
                      className="bg-white border border-[#CBD5E1] text-[#0F172A] text-[12px] font-medium px-3 py-2.5 md:py-1.5 rounded hover:bg-[#F8FAFC] transition-colors w-full md:w-auto text-center"
                    >
                      Accept as-is
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#F8FAFC] border-t border-[#F1F5F9] px-4 md:px-5 py-2 pl-4 md:pl-[52px]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                  <span className="text-[11px] md:text-[12px] text-[#334155]">
                    {bankStatements.expiry?.rule} — {bankStatements.expiry?.note?.split("—")[0].trim()}
                  </span>
                </div>
              </div>
            </div>

            {/* AI WHISPER */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-2.5 py-3 md:py-2.5 px-3 md:px-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded mt-1 mb-1">
              <div className="flex items-start gap-2.5 w-full md:w-auto">
                <Sparkles className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5 md:mt-0" />
                <div className="text-[12px] md:text-[13px] text-[#1E40AF] leading-snug">
                  The $9,500 deposit on Jun 14 matches a transfer from R. Henderson Sr. — draft a gift-letter request?
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto justify-end">
                <button className="whitespace-nowrap text-[12px] font-medium text-[#475569] hover:text-[#0F172A] px-2 py-2 md:py-1 transition-colors">
                  No thanks
                </button>
                <button 
                  onClick={() => showToast("Request drafted — review before it sends")}
                  className="whitespace-nowrap text-[12px] font-semibold text-white bg-[#1D4ED8] px-3 py-2 md:px-2.5 md:py-1 rounded hover:bg-[#1E40AF] transition-colors"
                >
                  Draft it
                </button>
              </div>
            </div>

            {/* Gift Letter - MISSING */}
            <div className="bg-white rounded border border-[#E2E8F0] p-3 md:px-4 md:py-4 flex flex-col gap-3 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-2 md:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3 text-[#94A3B8]" />
                  </div>
                  <div className="text-[13px] md:text-[14px] font-semibold text-[#0F172A]">{giftLetter.name}</div>
                  <div className="font-semibold text-[9.5px] uppercase tracking-[0.06em] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded-[3px]">
                    Missing
                  </div>
                </div>
                <div className="font-semibold text-[9.5px] uppercase tracking-[0.06em] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded-[3px] ml-0 md:ml-auto w-fit">
                  blocks underwriting until filed
                </div>
              </div>

              <div className="pl-0 md:pl-8 flex flex-col gap-3 mt-1 md:mt-0">
                <p className="text-[13px] text-[#334155] max-w-[600px]">
                  {giftLetter.flag?.note}
                </p>

                <div className="border border-dashed border-[#CBD5E1] rounded bg-[#F8FAFC] p-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-[#F1F5F9] hover:border-[#94A3B8] w-full">
                  <UploadCloud className="w-5 h-5 text-[#64748B] mb-1.5" />
                  <div className="text-[12px] md:text-[13px] text-[#0F172A] font-medium">
                    Drag the signed gift letter here, or browse
                  </div>
                  <div className="text-[11px] md:text-[12px] text-[#64748B]">
                    PDF or photo is fine
                  </div>
                </div>

                <div>
                  <button 
                    onClick={() => showToast("Request sent to applicant")}
                    className="bg-white border border-[#CBD5E1] text-[#0F172A] text-[12px] font-medium px-3 py-2.5 md:py-1.5 rounded hover:bg-[#F8FAFC] transition-colors w-full md:w-auto text-center"
                  >
                    Request from applicant
                  </button>
                </div>
              </div>
            </div>

            {/* Tax Returns - CLEAN */}
            <div className="bg-white rounded border border-[#E2E8F0] p-3 md:px-4 md:py-2.5 flex flex-col md:flex-row items-start md:items-center justify-start md:justify-between gap-2 md:gap-0 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#475569]" />
                </div>
                <div className="text-[13px] font-medium text-[#0F172A]">{taxReturns.name}</div>
              </div>
              <div className="font-['IBM_Plex_Mono'] text-[11px] md:text-[12px] text-[#64748B] flex items-center gap-2 ml-8 md:ml-0">
                filed · awaiting review
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-[#E2E8F0] pt-4 gap-4 md:gap-0">
            <div className="font-['IBM_Plex_Mono'] text-[11px] md:text-[12px] text-[#64748B] w-full md:w-auto text-center md:text-left">
              2 items left in this section
            </div>
            <button 
              onClick={() => showToast("Next: Property Valuation — 1 item waiting")}
              className="bg-[#1D4ED8] text-white text-[13px] font-semibold px-4 py-3 md:py-2 rounded hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-1.5 w-full md:w-auto"
            >
              Save & continue to 04 Property Valuation <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Waiting Card */}
          <div className="block md:hidden mt-8 bg-white border border-[#E2E8F0] rounded p-4 mb-4">
            <div className="font-semibold text-[10px] uppercase tracking-[0.06em] text-[#64748B] mb-3">
              Waiting on others
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <Hourglass className="w-4 h-4 text-[#D97706] mt-[1px] shrink-0" />
                <div className="text-[13px] leading-tight text-[#334155]">
                  <span className="font-medium text-[#0F172A]">Insurance binder</span>
                  <span> — originator · requested <span className="font-['IBM_Plex_Mono'] text-[#0F172A]">Jul 22</span></span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Hourglass className="w-4 h-4 text-[#D97706] mt-[1px] shrink-0" />
                <div className="text-[13px] leading-tight text-[#334155]">
                  <span className="font-medium text-[#0F172A]">Preliminary CD</span>
                  <span> — escrow · due <span className="font-['IBM_Plex_Mono'] text-[#0F172A]">Aug 31</span></span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function RailNode({ 
  num, 
  name, 
  count, 
  state, 
  dot 
}: { 
  num: string; 
  name: string; 
  count: string; 
  state: "done" | "current" | "waiting" | "review" | "clock"; 
  dot?: "blocker" | "warning" | "neutral";
}) {
  return (
    <div className="flex items-start gap-3.5 relative z-10 group cursor-default">
      <div className={`
        w-[15px] h-[15px] rounded-full mt-[1.5px] flex items-center justify-center shrink-0 border bg-[#F3F5F7] transition-colors
        ${state === "done" ? "border-[#0F172A] bg-[#0F172A]" : ""}
        ${state === "current" ? "border-[#1D4ED8] border-2" : ""}
        ${state !== "done" && state !== "current" ? "border-[#CBD5E1] group-hover:border-[#94A3B8]" : ""}
      `}>
        {state === "done" && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        {state === "current" && <div className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />}
      </div>
      
      <div className={`flex flex-col ${state === "current" ? "" : "opacity-80 group-hover:opacity-100"} transition-opacity`}>
        <div className="flex items-center gap-2">
          <span className={`font-['IBM_Plex_Mono'] text-[11px] ${state === "current" ? "text-[#1D4ED8] font-medium" : "text-[#64748B]"}`}>
            {num}
          </span>
          <span className={`text-[13px] ${state === "current" ? "font-semibold text-[#0F172A]" : "text-[#334155] font-medium"}`}>
            {name}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-['IBM_Plex_Mono'] text-[10.5px] text-[#64748B]">
            {count}
          </span>
          {dot === "blocker" && <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />}
          {dot === "warning" && <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
          {dot === "neutral" && <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />}
        </div>
      </div>
    </div>
  );
}

function CollapsedRailNode({ 
  num, 
  name, 
  count, 
  state, 
  dot 
}: { 
  num: string; 
  name: string; 
  count: string; 
  state: "done" | "current" | "waiting" | "review" | "clock"; 
  dot?: "blocker" | "warning" | "neutral";
}) {
  const active = state === "current";
  return (
    <button
      title={`${name} (${count})`}
      className={`relative w-[40px] h-[40px] flex flex-col items-center justify-center rounded-[3px] transition-colors
        ${active ? "bg-[#EFF6FF] shadow-[inset_2px_0_0_0_#1D4ED8]" : "hover:bg-[#F8FAFC] border border-transparent"}
      `}
    >
      <span className={`font-['IBM_Plex_Mono'] text-[10.5px] ${active ? "text-[#1D4ED8] font-medium" : "text-[#64748B]"}`}>
        {num}
      </span>
      {dot === "blocker" && <div className="absolute top-[6px] right-[6px] w-[5px] h-[5px] rounded-[1px] bg-[#DC2626]" />}
      {dot === "warning" && <div className="absolute top-[6px] right-[6px] w-[5px] h-[5px] rounded-[1px] bg-[#D97706]" />}
      {dot === "neutral" && <div className="absolute top-[6px] right-[6px] w-[5px] h-[5px] rounded-[1px] bg-[#94A3B8]" />}
    </button>
  );
}

function MobileRailNode({ 
  num, 
  name, 
  count, 
  state, 
  dot 
}: { 
  num: string; 
  name: string; 
  count: string; 
  state: "done" | "current" | "waiting" | "review" | "clock"; 
  dot?: "blocker" | "warning" | "neutral";
}) {
  const active = state === "current";
  
  return (
    <button className={`
      flex items-center gap-2 shrink-0 px-2.5 py-2 rounded-[4px] border snap-start transition-colors
      ${active ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white"}
    `}>
      <span className={`font-['IBM_Plex_Mono'] text-[11px] ${active ? "text-[#1D4ED8] font-medium" : "text-[#64748B]"}`}>
        {num}
      </span>
      <span className={`text-[12px] whitespace-nowrap ${active ? "font-semibold text-[#0F172A]" : "text-[#334155] font-medium"}`}>
        {name}
      </span>
      <div className="w-[1px] h-3 bg-[#CBD5E1] mx-0.5"></div>
      <span className="font-['IBM_Plex_Mono'] text-[10.5px] text-[#64748B]">
        {count}
      </span>
      {dot === "blocker" && <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />}
      {dot === "warning" && <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
      {dot === "neutral" && <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />}
    </button>
  );
}
