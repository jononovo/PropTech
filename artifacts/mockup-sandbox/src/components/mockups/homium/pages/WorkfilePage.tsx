import React, { useState } from "react";
import type { Go } from "../Backbone";
import { CASE, SECTIONS, liveClocks, stoppedClocks, band, daysTo, fmt, daysToClose, Req } from "../data";
import { Check, Lock, Bell, Clock, Hourglass, AlertCircle, Sparkles, UploadCloud, FileText, ChevronRight, X } from "lucide-react";

export default function WorkfilePage({ go }: { go: Go }) {
  const [toast, setToast] = useState<string | null>(null);

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

  return (
    <div className="h-full overflow-y-auto bg-[#F7F5F0] text-[#1A1D1A] font-sans selection:bg-[#2A4D3B]/20 flex justify-center pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1D1A] text-white px-4 py-2 rounded shadow-lg text-sm font-medium z-50 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="w-full max-w-[1100px] flex px-8 mt-12 gap-16">
        {/* Left Rail */}
        <aside className="w-[290px] shrink-0 flex flex-col pt-2">
          <div className="mb-6 font-['Space_Mono'] text-[11px] uppercase tracking-widest text-[#1A1D1A]/60">
            15 of 20 filed clean · 2 need you
          </div>

          <div className="relative flex flex-col gap-6 ml-2">
            <div className="absolute left-[7px] top-[14px] bottom-4 w-[1px] bg-[#1A1D1A]/10"></div>
            
            <RailNode num="01" name="Initial Application" count="3/3" state="done" />
            <RailNode num="02" name="Identity Verification" count="2/2" state="done" />
            <RailNode num="03" name="Income & Assets" count="2/5" state="current" dot="clay" />
            <RailNode num="04" name="Property Valuation" count="3/4" state="waiting" dot="amber" />
            <RailNode num="05" name="Title & Escrow" count="1/3" state="review" dot="slate" />
            <RailNode num="06" name="Credit & Compliance" count="2/3" state="clock" dot="amber" />
          </div>

          <div className="mt-12 bg-[#FDFCFA] border border-[#1A1D1A]/10 rounded shadow-sm p-4">
            <div className="font-['Space_Mono'] text-[10px] uppercase tracking-widest text-[#1A1D1A]/60 mb-3">
              Waiting on others
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Hourglass className="w-3.5 h-3.5 text-[#B8862B] mt-[3px] shrink-0" />
                <div className="text-[13px] leading-tight">
                  <span className="font-medium">Insurance binder</span>
                  <span className="text-[#1A1D1A]/60"> — originator · requested Jul 22</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Hourglass className="w-3.5 h-3.5 text-[#B8862B] mt-[3px] shrink-0" />
                <div className="text-[13px] leading-tight">
                  <span className="font-medium">Preliminary CD</span>
                  <span className="text-[#1A1D1A]/60"> — escrow · due Aug 31</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Column */}
        <main className="flex-1 flex flex-col pb-20">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <div className="font-['Space_Mono'] text-[11px] uppercase tracking-widest text-[#1A1D1A]/60 mb-2">
                Section 03 of 06
              </div>
              <h1 className="font-['Fraunces'] text-[32px] font-medium tracking-tight text-[#1A1D1A] mb-1">
                Income & Assets
              </h1>
              <p className="text-[15px] text-[#1A1D1A]/60">
                Only Homium's underwriting team sees these documents.
              </p>
            </div>
            <button 
              onClick={() => go("register")}
              className="text-[13px] text-[#1A1D1A]/60 hover:text-[#1A1D1A] transition-colors pb-1"
            >
              see this section in the Register →
            </button>
          </header>

          <div className="flex flex-col gap-4">
            {/* W-2 Forms - ACCEPTED */}
            <div className="bg-[#FDFCFA] rounded border border-[#1A1D1A]/10 px-4 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(26,29,26,0.02)]">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#2A4D3B]/10 flex items-center justify-center shrink-0">
                  <Lock className="w-3 h-3 text-[#2A4D3B]" />
                </div>
                <div className="text-[14px] font-medium text-[#1A1D1A]/80">{w2.name}</div>
              </div>
              <div className="font-['Space_Mono'] text-[12px] text-[#1A1D1A]/50">
                accepted Jul 20 — clock stopped
              </div>
            </div>

            {/* Pay Stubs - CLEAN ON CLOCK */}
            <div className="bg-[#FDFCFA] rounded border border-[#1A1D1A]/10 px-4 py-3 shadow-[0_1px_2px_rgba(26,29,26,0.02)] flex flex-col gap-1.5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1A1D1A]/5 flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3 text-[#1A1D1A]/60" />
                  </div>
                  <div className="text-[14px] font-medium">{payStubs.name}</div>
                  <div className="text-[13px] text-[#1A1D1A]/50 bg-[#1A1D1A]/5 px-2 py-0.5 rounded-sm">clean</div>
                </div>
                <button 
                  onClick={() => go("timeline")}
                  className="flex items-center gap-1.5 bg-[#B8862B]/10 text-[#B8862B] px-2.5 py-1 rounded hover:bg-[#B8862B]/20 transition-colors"
                >
                  <Bell className="w-3 h-3" />
                  <span className="font-['Space_Mono'] text-[11px]">goes stale Aug 7 · 15 days</span>
                </button>
              </div>
              <div className="text-[13px] text-[#1A1D1A]/50 pl-8">
                {payStubs.expiry?.rule}. {payStubs.desc}
              </div>
            </div>

            {/* Bank Statements - FLAGGED */}
            <div className="bg-[#FDFCFA] rounded border border-[#B85C38]/40 shadow-[0_4px_12px_rgba(184,92,56,0.08)] relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#B85C38]"></div>
              
              <div className="p-5 pl-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#B85C38]/10 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-[#B85C38]" />
                    </div>
                    <div className="text-[15px] font-medium text-[#1A1D1A]">{bankStatements.name}</div>
                    <div className="text-[12px] font-medium text-[#B85C38] bg-[#B85C38]/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">Flagged</div>
                  </div>
                </div>

                <div className="pl-8 flex flex-col gap-4">
                  <p className="text-[14px] text-[#1A1D1A]/80 leading-relaxed max-w-[500px]">
                    {bankStatements.flag?.note}
                  </p>

                  {/* Thumbnails */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="w-12 h-16 bg-white border border-[#1A1D1A]/10 rounded shadow-sm relative">
                      <div className="absolute top-2 left-2 right-2 h-1 bg-[#1A1D1A]/10 rounded-full"></div>
                      <div className="absolute top-4 left-2 w-4 h-1 bg-[#1A1D1A]/10 rounded-full"></div>
                    </div>
                    <div className="w-12 h-16 bg-white border-2 border-[#B85C38] rounded shadow-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#B85C38]/5"></div>
                      <div className="absolute top-2 left-2 right-2 h-1 bg-[#1A1D1A]/10 rounded-full"></div>
                      <div className="absolute top-1/2 -left-2 right-0 h-[1px] bg-[#B85C38] rotate-[-25deg] shadow-[0_0_2px_#B85C38]"></div>
                    </div>
                    <div className="w-12 h-16 bg-white border border-[#1A1D1A]/10 rounded shadow-sm relative">
                      <div className="absolute top-2 left-2 right-2 h-1 bg-[#1A1D1A]/10 rounded-full"></div>
                      <div className="absolute top-4 left-2 w-6 h-1 bg-[#1A1D1A]/10 rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => showToast("Scan request sent to applicant")}
                      className="bg-[#1A1D1A] text-white text-[13px] font-medium px-4 py-2 rounded shadow-sm hover:bg-[#2A4D3B] transition-colors"
                    >
                      Request re-scan
                    </button>
                    <button 
                      onClick={() => showToast("Exception cleared — accepted as-is")}
                      className="text-[13px] font-medium text-[#1A1D1A]/60 px-4 py-2 hover:text-[#1A1D1A] transition-colors"
                    >
                      Accept as-is
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#1A1D1A]/[0.02] border-t border-[#1A1D1A]/5 px-6 py-3 pl-14">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#B85C38]/80" />
                  <span className="text-[13px] text-[#1A1D1A]/70">
                    {bankStatements.expiry?.rule} — {bankStatements.expiry?.note?.split("—")[0].trim()}
                  </span>
                </div>
              </div>
            </div>

            {/* AI WHISPER */}
            <div className="flex items-center gap-3 py-2 pl-4">
              <Sparkles className="w-4 h-4 text-[#2A4D3B]" />
              <div className="text-[13px] text-[#1A1D1A]/70">
                The $9,500 deposit on Jun 14 matches a transfer from R. Henderson Sr. — draft a gift-letter request?
              </div>
              <div className="flex items-center gap-2 ml-auto pr-2">
                <button 
                  onClick={() => showToast("Request drafted — review before it sends")}
                  className="whitespace-nowrap text-[13px] font-medium text-[#2A4D3B] bg-[#2A4D3B]/10 px-3 py-1.5 rounded hover:bg-[#2A4D3B]/20 transition-colors"
                >
                  Draft it
                </button>
                <button className="whitespace-nowrap text-[13px] text-[#1A1D1A]/40 hover:text-[#1A1D1A]/60 px-2 py-1.5 transition-colors">
                  No thanks
                </button>
              </div>
            </div>

            {/* Gift Letter - MISSING */}
            <div className="bg-[#FDFCFA] rounded border border-[#1A1D1A]/10 px-5 py-4 shadow-[0_1px_2px_rgba(26,29,26,0.02)] flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1A1D1A]/5 flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3 text-[#1A1D1A]/40" />
                  </div>
                  <div className="text-[15px] font-medium text-[#1A1D1A]">{giftLetter.name}</div>
                  <div className="text-[12px] font-medium text-[#1A1D1A]/50 bg-[#1A1D1A]/5 px-2 py-0.5 rounded-sm uppercase tracking-wider">Missing</div>
                </div>
                <div className="font-['Space_Mono'] text-[11px] uppercase tracking-widest text-[#B85C38]/80 bg-[#B85C38]/5 px-2 py-1 rounded">
                  blocks underwriting until filed
                </div>
              </div>

              <div className="pl-8 flex flex-col gap-4">
                <p className="text-[14px] text-[#1A1D1A]/70 max-w-[600px]">
                  {giftLetter.flag?.note}
                </p>

                <div className="border border-dashed border-[#1A1D1A]/20 rounded-lg bg-[#1A1D1A]/[0.01] p-6 flex flex-col items-center justify-center text-center transition-colors hover:bg-[#1A1D1A]/[0.02]">
                  <UploadCloud className="w-6 h-6 text-[#1A1D1A]/30 mb-2" />
                  <div className="text-[14px] text-[#1A1D1A]/70 font-medium mb-1">
                    Drag the signed gift letter here, or browse
                  </div>
                  <div className="text-[13px] text-[#1A1D1A]/50">
                    PDF or photo is fine
                  </div>
                </div>

                <div>
                  <button 
                    onClick={() => showToast("Request sent to applicant")}
                    className="text-[13px] font-medium text-[#1A1D1A]/60 bg-[#1A1D1A]/5 px-4 py-2 rounded hover:bg-[#1A1D1A]/10 hover:text-[#1A1D1A] transition-colors"
                  >
                    Request from applicant
                  </button>
                </div>
              </div>
            </div>

            {/* Tax Returns - CLEAN */}
            <div className="bg-[#FDFCFA] rounded border border-[#1A1D1A]/10 px-4 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(26,29,26,0.02)]">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#9CAF88]/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#2A4D3B]" />
                </div>
                <div className="text-[14px] font-medium text-[#1A1D1A]/80">{taxReturns.name}</div>
              </div>
              <div className="font-['Space_Mono'] text-[12px] text-[#1A1D1A]/50 flex items-center gap-2">
                filed · awaiting review
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-[#1A1D1A]/10 pt-6">
            <div className="font-['Space_Mono'] text-[12px] text-[#1A1D1A]/50">
              2 items left in this section
            </div>
            <button 
              onClick={() => showToast("Next: Property Valuation — 1 item waiting")}
              className="bg-[#2A4D3B] text-white text-[14px] font-medium px-6 py-2.5 rounded shadow-sm hover:bg-[#1A1D1A] transition-colors flex items-center gap-2"
            >
              Save & continue to 04 Property Valuation <ChevronRight className="w-4 h-4" />
            </button>
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
  dot?: "clay" | "amber" | "slate";
}) {
  return (
    <div className="flex items-start gap-4 relative z-10 group cursor-default">
      <div className={`
        w-[15px] h-[15px] rounded-full mt-[3px] flex items-center justify-center shrink-0 border bg-[#F7F5F0] transition-colors
        ${state === "done" ? "border-[#2A4D3B] bg-[#2A4D3B]" : ""}
        ${state === "current" ? "border-[#1A1D1A] border-2" : ""}
        ${state !== "done" && state !== "current" ? "border-[#1A1D1A]/20 group-hover:border-[#1A1D1A]/40" : ""}
      `}>
        {state === "done" && <Check className="w-2.5 h-2.5 text-[#F7F5F0]" strokeWidth={3} />}
        {state === "current" && <div className="w-1.5 h-1.5 rounded-full bg-[#1A1D1A]" />}
      </div>
      
      <div className={`flex flex-col ${state === "current" ? "" : "opacity-70 group-hover:opacity-100"} transition-opacity`}>
        <div className="flex items-center gap-2">
          <span className={`font-['Space_Mono'] text-[11px] ${state === "current" ? "text-[#1A1D1A]" : "text-[#1A1D1A]/60"}`}>
            {num}
          </span>
          <span className={`text-[13px] ${state === "current" ? "font-medium text-[#1A1D1A]" : "text-[#1A1D1A]"}`}>
            {name}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-['Space_Mono'] text-[10px] text-[#1A1D1A]/50">
            {count}
          </span>
          {dot === "clay" && <div className="w-1.5 h-1.5 rounded-full bg-[#B85C38]" />}
          {dot === "amber" && <div className="w-1.5 h-1.5 rounded-full bg-[#B8862B]" />}
          {dot === "slate" && <div className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />}
        </div>
      </div>
    </div>
  );
}
