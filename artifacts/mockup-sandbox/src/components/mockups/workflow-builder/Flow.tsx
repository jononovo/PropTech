import React from 'react';
import { 
  Grid, 
  ChevronDown, 
  Check, 
  MessageSquare, 
  Reply, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  X, 
  BellRing, 
  FileText, 
  Clock, 
  UploadCloud, 
  ArrowRight
} from 'lucide-react';
import './Flow.css';

export function Flow() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1D1A] font-['DM_Sans',_sans-serif] selection:bg-[#2A4D3B] selection:text-white pb-32 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#F7F5F0]/90 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-[#E3E1DB]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded border border-[#2A4D3B] text-[#2A4D3B] flex items-center justify-center font-['Fraunces'] font-bold italic text-base bg-white shadow-sm">
              H
            </div>
            <span className="font-['Fraunces'] font-medium text-lg tracking-wide text-[#2A4D3B]">
              Homium
            </span>
          </div>
          <div className="h-5 w-px bg-[#E3E1DB]"></div>
          <div className="flex items-center gap-3 text-[14px]">
            <span className="font-['Fraunces'] font-medium text-[#1A1D1A]">Michael R. Henderson</span>
            <span className="text-[#737A73]">— Purchase Loan, CA Variant</span>
            <span className="px-2 py-0.5 rounded bg-[#FFF8ED] text-[#9A6A1D] text-[10px] font-bold tracking-widest uppercase border border-[#FDE3B8] ml-1">In Review</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-[13px] font-medium text-[#737A73] hover:text-[#1A1D1A] transition-colors flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5" /> Open Register view
          </button>
          <div className="w-px h-5 bg-[#E3E1DB]"></div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#737A73]">Working as:</span>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-[#EAE8E2] px-2 py-1 -ml-1 rounded-md transition-colors">
              <span className="font-medium text-[#1A1D1A]">S. Jenkins</span>
              <span className="text-[#737A73] mr-1">— Originator</span>
              <div className="w-6 h-6 rounded-full bg-[#F5F9F6] border border-[#D5E3D8] text-[#2A4D3B] flex items-center justify-center text-[10px] font-bold">
                SJ
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#737A73]" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-[1140px] w-full mx-auto px-8 pt-12 flex items-start gap-16 pb-24">
        
        {/* Left Rail */}
        <div className="w-[280px] shrink-0">
          <div className="text-[11px] font-medium text-[#737A73] mb-8 tracking-wide uppercase">
            <span className="font-bold text-[#1A1D1A] font-['Space_Mono']">7 of 15</span> items · on track
          </div>
          
          <div className="relative ml-2 space-y-10">
            {/* The Line Background */}
            <div className="absolute top-2 bottom-2 left-[11px] w-[2px] bg-[#E3E1DB] z-0"></div>
            {/* The Line Progress (covers steps 1-2) */}
            <div className="absolute top-2 left-[11px] w-[2px] bg-[#2A4D3B] z-0 h-[132px]"></div>
            
            {/* Step 01 */}
            <div className="relative z-10 flex items-start gap-5 cursor-pointer group">
              <div className="w-6 h-6 rounded-full bg-[#EAF0EC] border-2 border-[#EAF0EC] flex items-center justify-center shadow-[0_0_0_4px_#F7F5F0] shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#2A4D3B] stroke-[3]" />
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="font-['Space_Mono'] text-[11px] text-[#737A73] mb-1 font-bold">01</div>
                  <div className="text-[14px] font-medium text-[#4A4F4A] group-hover:text-[#1A1D1A] transition-colors">Initial Application</div>
                </div>
                <div className="font-['Space_Mono'] text-[11px] text-[#A3AA9F]">3 of 3</div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="relative z-10 flex items-start gap-5 cursor-pointer group">
              <div className="w-6 h-6 rounded-full bg-[#EAF0EC] border-2 border-[#EAF0EC] flex items-center justify-center shadow-[0_0_0_4px_#F7F5F0] shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#2A4D3B] stroke-[3]" />
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="font-['Space_Mono'] text-[11px] text-[#737A73] mb-1 font-bold">02</div>
                  <div className="text-[14px] font-medium text-[#4A4F4A] group-hover:text-[#1A1D1A] transition-colors">Identity Verification</div>
                </div>
                <div className="font-['Space_Mono'] text-[11px] text-[#A3AA9F]">2 of 2</div>
              </div>
            </div>

            {/* Step 03 (Current) */}
            <div className="relative z-10 flex items-start gap-5 cursor-pointer group">
              <div className="relative shrink-0 mt-0.5">
                <div className="w-6 h-6 rounded-full bg-[#F7F5F0] border-2 border-[#2A4D3B] flex items-center justify-center shadow-[0_0_0_4px_#F7F5F0]">
                  <div className="w-2 h-2 rounded-full bg-[#2A4D3B]"></div>
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#B85C38] border-2 border-[#F7F5F0]"></div>
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="font-['Space_Mono'] text-[11px] text-[#2A4D3B] mb-1 font-bold">03</div>
                  <div className="text-[14px] font-bold text-[#1A1D1A]">Income & Assets</div>
                </div>
                <div className="font-['Space_Mono'] text-[11px] text-[#2A4D3B] font-bold">2 of 4</div>
              </div>
            </div>

            {/* Step 04 */}
            <div className="relative z-10 flex items-start gap-5 cursor-pointer group">
              <div className="w-6 h-6 rounded-full bg-[#F7F5F0] border-2 border-[#E3E1DB] flex items-center justify-center shadow-[0_0_0_4px_#F7F5F0] shrink-0 mt-0.5 group-hover:border-[#D5E3D8] transition-colors"></div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="font-['Space_Mono'] text-[11px] text-[#A3AA9F] mb-1 font-bold">04</div>
                  <div className="text-[14px] font-medium text-[#A3AA9F] group-hover:text-[#4A4F4A] transition-colors">Property Valuation</div>
                </div>
                <div className="font-['Space_Mono'] text-[11px] text-[#A3AA9F]">0 of 1</div>
              </div>
            </div>

            {/* Step 05 */}
            <div className="relative z-10 flex items-start gap-5 cursor-pointer group">
              <div className="w-6 h-6 rounded-full bg-[#F7F5F0] border-2 border-[#E3E1DB] flex items-center justify-center shadow-[0_0_0_4px_#F7F5F0] shrink-0 mt-0.5 group-hover:border-[#D5E3D8] transition-colors"></div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <div className="font-['Space_Mono'] text-[11px] text-[#A3AA9F] mb-1 font-bold">05</div>
                  <div className="text-[14px] font-medium text-[#A3AA9F] group-hover:text-[#4A4F4A] transition-colors">Title & Escrow</div>
                </div>
                <div className="font-['Space_Mono'] text-[11px] text-[#A3AA9F]">0 of 5</div>
              </div>
            </div>
          </div>

          {/* Requests from Homium */}
          <div className="mt-14 bg-white border border-[#E3E1DB] rounded-xl shadow-soft p-5 relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2A4D3B] rounded-l-xl"></div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-[#2A4D3B]" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#1A1D1A]">Requests from Homium</h3>
            </div>
            <p className="text-[13px] text-[#4A4F4A] leading-relaxed mb-4">
              "Hi Sarah — the Initial Disclosures doc is missing a signature on page 4. Please have Michael sign and re-upload."
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#737A73]">Eleanor R. · 9:14 AM</span>
              <button className="text-[11px] font-medium text-[#2A4D3B] flex items-center gap-1.5 hover:bg-[#EAF0EC] px-2 py-1 rounded transition-colors -mr-2">
                <Reply className="w-3 h-3" /> Reply
              </button>
            </div>
          </div>
        </div>

        {/* Main Flow Column */}
        <div className="w-[780px] shrink-0">
          <div className="mb-10">
            <div className="font-['Space_Mono'] text-[11px] font-bold text-[#737A73] tracking-widest uppercase mb-4">Step 3 of 5</div>
            <div className="flex items-end justify-between mb-4">
              <h1 className="font-['Fraunces'] text-[36px] font-medium text-[#1A1D1A] leading-none">Income & Assets</h1>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[15px] text-[#4A4F4A] max-w-lg">Gather and verify the applicant's financial capacity through bank and tax records.</p>
              <div className="flex items-center gap-2 text-[12px] text-[#4A4F4A] bg-[#EAF0EC] px-3 py-1.5 rounded-full border border-[#D5E3D8]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2A4D3B]" />
                Only Homium's underwriting team sees these documents.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Done Card */}
            <div className="bg-white border border-[#E3E1DB] rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#D5E3D8] transition-colors group">
               <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-[#EAF0EC] text-[#2A4D3B] flex items-center justify-center shrink-0 border border-[#D5E3D8]">
                   <Check className="w-4 h-4" />
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="font-medium text-[#1A1D1A] text-[15px]">W-2 Forms</span>
                   <span className="text-[#737A73] text-[15px]">— Last 2 Years</span>
                   <span className="text-[#D5E3D8] px-1">·</span>
                   <span className="font-['Space_Mono'] text-xs text-[#737A73]">received Oct 8</span>
                   <span className="text-[#D5E3D8] px-1">·</span>
                   <span className="text-[13px] text-[#2A4D3B] flex items-center gap-1 font-medium"><Sparkles className="w-3.5 h-3.5"/> scan clean</span>
                 </div>
               </div>
               <ChevronDown className="w-4 h-4 text-[#A3AA9F] group-hover:text-[#1A1D1A] transition-colors" />
            </div>

            {/* Attention Card */}
            <div className="bg-white border border-[#FAD6CC] rounded-xl shadow-[0_4px_12px_rgba(184,92,56,0.08)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#B85C38]"></div>
              <div className="p-6 pl-8">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-[#FDECE8] text-[#B85C38] flex items-center justify-center border border-[#FAD6CC] shrink-0">
                       <AlertCircle className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="font-medium text-[#1A1D1A] text-[17px] flex items-center gap-2 mb-1.5">
                         Bank Statements <span className="text-[#737A73] font-normal">— Last 3 Months</span>
                       </h3>
                       <div className="flex items-center gap-2">
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#FDECE8] text-[#B85C38] border border-[#FAD6CC]">Attention Needed</span>
                         <span className="text-[#D5E3D8] px-1">·</span>
                         <span className="text-[12px] text-[#737A73] font-['Space_Mono']">received Oct 12</span>
                       </div>
                     </div>
                  </div>
                </div>

                <div className="bg-[#FFF8ED] border border-[#FDE3B8] rounded-xl p-5 mb-5 ml-14">
                   <p className="text-[14px] text-[#9A6A1D] mb-5">
                     The Wells Fargo statement's page 2 was scanned at an angle — the account number is cut off.
                   </p>
                   <div className="flex gap-6">
                     {/* Thumbnails */}
                     <div className="flex items-center gap-3">
                       <div className="flex -space-x-3">
                         <div className="w-12 h-[68px] bg-white border border-[#FDE3B8] rounded shadow-sm flex flex-col p-1.5 gap-1 opacity-60">
                           <div className="h-1 w-full bg-[#FFF8ED] rounded"></div>
                           <div className="h-1 w-3/4 bg-[#FFF8ED] rounded"></div>
                         </div>
                         <div className="w-12 h-[68px] bg-white border-2 border-[#B85C38] rounded shadow-md relative z-10 flex flex-col p-1.5 gap-1 transform -rotate-3">
                           {/* Soft clay corner mark */}
                           <div className="absolute top-[-2px] right-[-2px] w-0 h-0 border-t-[14px] border-l-[14px] border-t-[#B85C38] border-l-transparent"></div>
                           <div className="absolute top-0 right-0 w-[14px] h-[14px] bg-[#FDECE8] border-b border-l border-[#B85C38] rounded-bl shadow-sm"></div>
                           
                           <div className="h-1 w-full bg-[#E3E1DB] rounded mt-2"></div>
                           <div className="h-1 w-3/4 bg-[#E3E1DB] rounded"></div>
                           <div className="mt-auto h-4 w-full border-t border-dashed border-[#B85C38] relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-full h-full bg-[#FDECE8] opacity-50 transform translate-y-1 rotate-6"></div>
                           </div>
                         </div>
                         <div className="w-12 h-[68px] bg-white border border-[#FDE3B8] rounded shadow-sm flex flex-col p-1.5 gap-1 opacity-60">
                           <div className="h-1 w-full bg-[#FFF8ED] rounded"></div>
                           <div className="h-1 w-5/6 bg-[#FFF8ED] rounded"></div>
                         </div>
                       </div>
                     </div>
                     <div className="flex flex-col justify-center gap-3 border-l border-[#FDE3B8] pl-6">
                       <button className="bg-[#B85C38] hover:bg-[#9D4D2E] text-white text-[13px] font-medium px-4 py-2 rounded-lg shadow-sm transition-colors w-fit">
                         Upload a clearer copy
                       </button>
                       <button className="text-[#9A6A1D] hover:text-[#7A5317] text-[13px] font-medium flex items-center gap-1.5 transition-colors w-fit">
                         <MessageSquare className="w-3.5 h-3.5" /> Ask Homium to re-check
                       </button>
                     </div>
                   </div>
                </div>

                <div className="flex items-center gap-2 text-[13px] text-[#737A73] ml-14">
                  <BellRing className="w-3.5 h-3.5 text-[#B85C38]" />
                  Statements must be from the last 90 days — the October one becomes too old on <span className="font-['Space_Mono'] font-medium text-[#1A1D1A]">Mar 14</span>.
                </div>
              </div>
            </div>

            {/* Missing Card */}
            <div className="bg-white border border-[#E3E1DB] rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E3E1DB]"></div>
              <div className="p-6 pl-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FAFAF9] text-[#737A73] flex items-center justify-center border border-[#E3E1DB] border-dashed shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                       <h3 className="font-medium text-[#1A1D1A] text-[17px] flex items-center gap-2 mb-1.5">
                         Pay Stubs <span className="text-[#737A73] font-normal">— Last 30 Days</span>
                         <span className="px-1.5 py-0.5 rounded bg-[#FAFAF9] border border-[#E3E1DB] text-[10px] font-bold tracking-wider uppercase text-[#737A73] ml-2">Required</span>
                       </h3>
                       <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#B85C38]">
                         <Clock className="w-3 h-3" /> Due in 14 days
                       </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dashed border-[#D5E3D8] bg-[#F5F9F6]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#F5F9F6] transition-colors cursor-pointer group ml-14">
                   <div className="w-12 h-12 rounded-full bg-[#EAF0EC] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <UploadCloud className="w-5 h-5 text-[#2A4D3B]" />
                   </div>
                   <div className="text-[15px] font-medium text-[#1A1D1A] mb-1.5">
                     Drag Michael's recent pay stubs here, or <span className="text-[#2A4D3B] underline decoration-[#A3B18A] underline-offset-4">browse</span>
                   </div>
                   <div className="text-[13px] text-[#737A73] mb-6">PDF or photo is fine</div>
                   
                   <div className="flex items-center gap-3 text-[12px] text-[#A3AA9F]">
                     <span className="w-12 h-px bg-[#E3E1DB]"></span>
                     or import from
                     <button className="font-medium text-[#737A73] hover:text-[#1A1D1A] transition-colors">Google Drive</button>
                     ·
                     <button className="font-medium text-[#737A73] hover:text-[#1A1D1A] transition-colors">Dropbox</button>
                     <span className="w-12 h-px bg-[#E3E1DB]"></span>
                   </div>
                </div>
                
                {/* AI Whisper */}
                <div className="mt-4 ml-14 flex items-center justify-between bg-gradient-to-r from-[#F5F9F6] to-[#FDFDFB] rounded-lg p-3 border border-[#EAF0EC]">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#2A4D3B]" />
                    <p className="text-[13px] text-[#4A4F4A]">
                      We spotted what looks like a pay stub on <span className="font-['Space_Mono'] font-medium text-[#2A4D3B]">page 214</span> of an earlier upload — use it here?
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-[#737A73] text-[12px] font-medium hover:text-[#1A1D1A] hover:bg-[#FAFAF9] rounded transition-colors border border-transparent hover:border-[#E3E1DB]">No thanks</button>
                    <button className="px-3 py-1.5 bg-[#EAF0EC] hover:bg-[#D5E3D8] border border-[#D5E3D8] hover:border-[#A3AA9F] text-[#2A4D3B] text-[12px] font-medium rounded shadow-sm transition-colors">Use it</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Rhythm */}
          <div className="mt-12 pt-8 border-t border-[#E3E1DB] flex items-center justify-between">
            <div className="text-[13px] text-[#737A73] flex items-center gap-2 font-medium">
              <div className="w-2 h-2 rounded-full bg-[#B85C38]"></div>
              2 items left in this section
            </div>
            <button className="bg-[#2A4D3B] hover:bg-[#1A1D1A] text-white text-[15px] font-medium px-6 py-3.5 rounded-xl shadow-sm transition-colors flex items-center gap-2 group">
              Save & continue to 04 Property Valuation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
