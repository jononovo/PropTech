import React from 'react';
import { 
  FileText, 
  UploadCloud,
  BellRing,
  MoreHorizontal,
  AlertCircle,
  Calendar,
  Lock,
  FolderOpen,
  Send,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  User,
  Clock,
  ArrowRight
} from 'lucide-react';

export function Portal() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1D1A] font-['DM_Sans',_sans-serif] selection:bg-[#2A4D3B] selection:text-white flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b-2 border-b-[#E3E1DB] bg-[#F7F5F0]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[#2A4D3B] text-[#2A4D3B] flex items-center justify-center font-['Fraunces'] font-bold italic text-lg bg-white">
              H
            </div>
            <span className="font-['Fraunces'] font-medium text-lg tracking-wide text-[#2A4D3B]">
              Homium <span className="font-['DM_Sans'] text-sm font-normal text-[#737A73] ml-2">Originator Portal</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EAE8E2] border border-[#D5E3D8] flex items-center justify-center text-[#2A4D3B]">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Sarah Jenkins</span>
          </div>
        </div>
      </header>

      {/* Sub-header Context */}
      <div className="bg-white border-b border-[#E3E1DB] px-6 py-6">
        <div className="max-w-[1200px] mx-auto flex items-end justify-between">
          <div>
            <div className="text-sm text-[#737A73] mb-1 flex items-center gap-2">
              <span>Application</span>
              <span>/</span>
              <span className="font-medium text-[#1A1D1A]">Purchase Loan — CA Variant</span>
            </div>
            <h1 className="font-['Fraunces'] text-3xl font-medium text-[#1A1D1A]">Michael R. Henderson</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#737A73] uppercase tracking-wider font-bold mb-1">Your Tasks</span>
              <span className="font-['Space_Mono'] text-xl font-medium text-[#B85C38]">2 Pending</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 flex items-start gap-8">
        
        {/* Left Column: Messages/Requests */}
        <aside className="w-80 shrink-0 space-y-6">
          <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E3E1DB] bg-[#FAFAF9] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2A4D3B]" />
              <h3 className="font-medium text-[#2A4D3B] text-sm">Requests from Homium</h3>
            </div>
            <div className="divide-y divide-[#E3E1DB]">
              <div className="p-4 bg-[#FFF8ED]">
                <p className="text-sm text-[#1A1D1A] mb-2">
                  "Hi Sarah, the Initial Disclosures document is missing a signature on page 4. Please have Michael sign and re-upload."
                </p>
                <div className="flex items-center justify-between text-xs text-[#737A73]">
                  <span>Eleanor R. &bull; Today, 9:14 AM</span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <p className="text-sm text-[#1A1D1A] mb-2">
                  "Please upload the final Appraisal Report once it comes back. We need it to proceed to underwriting."
                </p>
                <div className="flex items-center justify-between text-xs text-[#737A73]">
                  <span>System &bull; Oct 10</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Required Documents */}
        <div className="flex-1 max-w-3xl space-y-8">
          
          <div>
            <h2 className="font-['Fraunces'] text-xl font-medium text-[#1A1D1A] mb-4">Required from You</h2>
            
            <div className="space-y-4">
              
              {/* Task 1: Missing Signature */}
              <div className="rounded-lg border-2 border-[#FDE3B8] bg-white shadow-sm overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#9A6A1D]"></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-[#FFF8ED] text-[#9A6A1D] rounded border border-[#FDE3B8] mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-[#1A1D1A] text-[15px]">Initial Disclosures</h3>
                          <span className="px-2 py-0.5 rounded-sm bg-[#FFF8ED] text-[#9A6A1D] font-medium border border-[#FDE3B8] text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </span>
                        </div>
                        <p className="text-sm text-[#7A5317] mt-1.5">
                          Signature missing on page 4. Please re-upload.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-2 border-dashed border-[#FDE3B8] bg-[#FFF8ED]/50 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-[#FFF8ED] transition-colors cursor-pointer">
                    <UploadCloud className="w-6 h-6 text-[#9A6A1D] mb-3" />
                    <span className="text-sm font-medium text-[#9A6A1D] mb-1">Click to upload corrected file</span>
                    <span className="text-xs text-[#7A5317]">PDF format accepted</span>
                  </div>
                </div>
              </div>

              {/* Task 2: Missing Appraisal */}
              <div className="rounded-lg border-2 border-[#FAD6CC] bg-white shadow-sm overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B85C38]"></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-[#FDECE8] text-[#B85C38] rounded border border-[#FAD6CC] mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-[#1A1D1A] text-[15px]">Appraisal Report</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-1.5">
                          <span className="px-2 py-0.5 rounded-sm bg-[#FDECE8] text-[#B85C38] font-medium border border-[#FAD6CC]">
                            Missing
                          </span>
                          <span className="flex items-center gap-1 text-[#B85C38] font-medium">
                            <BellRing className="w-3.5 h-3.5" />
                            Due in 7 days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-2 border-dashed border-[#E3E1DB] bg-[#FAFAF9] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-[#C4C2BB] transition-colors cursor-pointer">
                    <UploadCloud className="w-6 h-6 text-[#737A73] mb-3" />
                    <span className="text-sm font-medium text-[#1A1D1A] mb-1">Click to upload Appraisal</span>
                    <span className="text-xs text-[#737A73]">PDF, max 50MB</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-8">
            <h2 className="font-['Fraunces'] text-xl font-medium text-[#1A1D1A] mb-4">Completed Documents</h2>
            
            <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm divide-y divide-[#E3E1DB]">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#4A4F4A]" />
                  <span className="text-sm font-medium text-[#1A1D1A]">Loan Application (Form 1003)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[#A3AA9F] font-['Space_Mono']">Oct 10</span>
                  <span className="px-2 py-0.5 rounded-sm bg-[#EAF0EC] text-[#2A4D3B] font-medium border border-[#D5E3D8] flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Accepted
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#4A4F4A]" />
                  <span className="text-sm font-medium text-[#1A1D1A]">Purchase Agreement</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[#A3AA9F] font-['Space_Mono']">Oct 09</span>
                  <span className="px-2 py-0.5 rounded-sm bg-[#EAF0EC] text-[#2A4D3B] font-medium border border-[#D5E3D8] flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Accepted
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
