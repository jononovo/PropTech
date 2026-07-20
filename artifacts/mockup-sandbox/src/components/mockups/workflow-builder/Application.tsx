import React, { useState } from 'react';
import { 
  Check, 
  ChevronDown, 
  Clock, 
  FileText, 
  GripVertical, 
  Eye,
  Upload,
  BrainCircuit,
  BellRing,
  MoreHorizontal,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Lock,
  ArrowRight,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export function Application() {
  const [activeSection, setActiveSection] = useState('income');

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1D1A] font-['DM_Sans',_sans-serif] selection:bg-[#2A4D3B] selection:text-white flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b-2 border-b-[#E3E1DB] bg-[#F7F5F0]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#2A4D3B] text-[#F7F5F0] flex items-center justify-center font-['Fraunces'] font-bold italic text-lg">
              H
            </div>
            <span className="font-['Fraunces'] font-medium text-lg tracking-wide text-[#2A4D3B]">
              Homium
            </span>
          </div>
          <div className="h-6 w-px bg-[#E3E1DB]"></div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#737A73]">Applications</span>
            <span className="text-[#E3E1DB]">/</span>
            <span className="font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-[#737A73]" />
              Michael R. Henderson
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-sm bg-[#FFF8ED] border border-[#FDE3B8] text-[#9A6A1D] text-xs font-medium tracking-wide">IN REVIEW</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="text-xs font-medium text-[#737A73] mb-1">Overall Completeness</div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-[#EAE8E2] rounded-full overflow-hidden">
                <div className="w-[78%] h-full bg-[#2A4D3B] rounded-full"></div>
              </div>
              <span className="font-['Space_Mono'] text-sm font-bold text-[#2A4D3B]">78%</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#E3E1DB]"></div>
          <button className="bg-[#2A4D3B] hover:bg-[#1E3A2B] text-[#F7F5F0] text-sm font-medium px-5 py-2 rounded-md shadow-sm transition-colors flex items-center gap-2">
            Approve & Advance
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 flex items-start gap-8">
        
        {/* Left Column: Sections Outline */}
        <aside className="w-80 shrink-0">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-['Fraunces'] text-xl font-medium tracking-wide text-[#2A4D3B]">Loan Sections</h2>
            <span className="text-xs font-medium text-[#737A73] font-['Space_Mono']">CA-PUR-04</span>
          </div>

          <div className="space-y-2">
            {[
              { id: 'app', num: '01', title: 'Initial Application', status: 'done', docs: '3/3' },
              { id: 'id', num: '02', title: 'Identity Verification', status: 'done', docs: '2/2' },
              { id: 'income', num: '03', title: 'Income & Assets', status: 'active', docs: '2/4', alerts: 2 },
              { id: 'prop', num: '04', title: 'Property Valuation', status: 'pending', docs: '0/1' },
              { id: 'title', num: '05', title: 'Title & Escrow', status: 'pending', docs: '0/5' },
            ].map((section) => (
              <button 
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left group flex items-center justify-between p-3 rounded-md transition-all border ${
                  section.status === 'active' 
                    ? 'bg-white border-[#2A4D3B] shadow-sm' 
                    : 'bg-transparent border-transparent hover:border-[#E3E1DB] hover:bg-[#FDFDFB]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {section.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#A3B18A]" />
                  ) : (
                    <span className={`font-['Space_Mono'] text-xs font-medium w-4 text-center ${section.status === 'active' ? 'text-[#2A4D3B]' : 'text-[#A3AA9F]'}`}>
                      {section.num}
                    </span>
                  )}
                  <span className={`text-sm font-medium ${section.status === 'active' ? 'text-[#1A1D1A]' : 'text-[#4A4F4A]'}`}>
                    {section.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {section.alerts > 0 && (
                    <div className="w-4 h-4 rounded bg-[#FDECE8] text-[#B85C38] flex items-center justify-center text-[10px] font-bold">
                      {section.alerts}
                    </div>
                  )}
                  <span className={`text-xs font-['Space_Mono'] ${section.status === 'active' ? 'text-[#737A73]' : 'text-[#A3AA9F]'}`}>
                    {section.docs}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Column: Section Detail */}
        <div className="flex-1 max-w-3xl space-y-6">
          
          {/* Section Header */}
          <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm p-8">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="font-['Space_Mono'] text-lg text-[#A3AA9F]">03.</span>
              <h1 className="font-['Fraunces'] text-3xl font-medium text-[#1A1D1A]">Income & Assets</h1>
            </div>
            <p className="text-[#4A4F4A] text-[15px] leading-relaxed mb-6">
              Gather and verify the applicant's financial capacity, including bank statements, tax returns, and current employment verification.
            </p>
            
            {/* Recommended Action */}
            <div className="bg-[#F5F9F6] border border-[#D5E3D8] rounded-md p-4 flex items-start gap-4">
              <div className="p-2 bg-white rounded-full shadow-sm shrink-0">
                <BrainCircuit className="w-5 h-5 text-[#2A4D3B]" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[#2A4D3B] mb-1">AI Recommendation</h4>
                <p className="text-sm text-[#4A4F4A]">
                  Missing recent pay stubs. Send a reminder to Michael Henderson to fulfill this requirement before the 14-day deadline.
                </p>
              </div>
              <button className="bg-white border border-[#D5E3D8] hover:border-[#2A4D3B] text-[#2A4D3B] text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2 shadow-sm">
                <Mail className="w-4 h-4" />
                Draft Email
              </button>
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-4">
            
            {/* Doc 1: Flagged by AI */}
            <div className="rounded-lg border border-[#FAD6CC] bg-[#FDFDFB] shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-[#FDECE8] text-[#B85C38] rounded border border-[#FAD6CC] mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1A1D1A] text-[15px]">Bank Statements — Last 3 Months</h3>
                      <div className="flex items-center gap-2 text-xs mt-1.5">
                        <span className="px-2 py-0.5 rounded-sm bg-[#EAF0EC] text-[#2A4D3B] font-medium border border-[#D5E3D8] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Received
                        </span>
                        <span className="text-[#737A73]">Added Oct 10 by Applicant</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-[#2A4D3B] text-sm font-medium hover:underline flex items-center gap-1">
                    <Eye className="w-4 h-4" /> View File
                  </button>
                </div>

                {/* AI Quality Flag */}
                <div className="ml-14 pl-4 border-l-2 border-[#FAD6CC]">
                  <div className="bg-[#FFF8ED] border border-[#FDE3B8] rounded-md p-3 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-[#9A6A1D] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#9A6A1D]">Quality Scan Flag</span>
                        <span className="text-[#D39B88]">&bull;</span>
                        <span className="text-xs text-[#9A6A1D] font-['Space_Mono']">Confidence: 94%</span>
                      </div>
                      <p className="text-sm text-[#7A5317]">Irregular large deposit detected on Aug 14: <strong>$12,500.00</strong>. Source unverified.</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button className="text-xs font-medium bg-white border border-[#FDE3B8] text-[#9A6A1D] px-3 py-1.5 rounded hover:bg-[#FDF6E3] transition-colors">
                          Request LOE (Letter of Explanation)
                        </button>
                        <button className="text-xs font-medium text-[#A3AA9F] hover:text-[#737A73] transition-colors">
                          Dismiss Flag
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Doc 2: Missing & Expiring */}
            <div className="rounded-lg border border-[#E3E1DB] bg-white shadow-sm overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B85C38]"></div>
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-[#FAFAF9] text-[#A3AA9F] rounded border border-[#E3E1DB] border-dashed mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-[#1A1D1A] text-[15px]">Pay Stubs — Last 30 Days</h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#FDECE8] text-[#B85C38] border border-[#FAD6CC]">Required</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1.5">
                      <span className="px-2 py-0.5 rounded-sm bg-[#FAFAF9] text-[#737A73] font-medium border border-[#E3E1DB]">
                        Missing
                      </span>
                      <span className="flex items-center gap-1 text-[#B85C38] font-medium">
                        <BellRing className="w-3.5 h-3.5" />
                        Deadline in 14 days
                      </span>
                    </div>
                  </div>
                </div>
                <button className="text-[#2A4D3B] text-sm font-medium flex items-center gap-2 border border-[#E3E1DB] px-3 py-1.5 rounded-md hover:bg-[#FAFAF9] transition-colors">
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>

            {/* Doc 3: Received & Valid */}
            <div className="rounded-lg border border-[#E3E1DB] bg-white shadow-sm overflow-hidden">
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white text-[#4A4F4A] rounded border border-[#E3E1DB] shadow-sm mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A1D1A] text-[15px]">W-2 Forms — Last 2 Years</h3>
                    <div className="flex items-center gap-2 text-xs mt-1.5">
                      <span className="px-2 py-0.5 rounded-sm bg-[#EAF0EC] text-[#2A4D3B] font-medium border border-[#D5E3D8] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Received
                      </span>
                      <span className="flex items-center gap-1 text-[#737A73]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#A3B18A]" />
                        Scan: Clean
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-['Space_Mono'] text-[#A3AA9F]">Added Oct 08</span>
                  <button className="text-[#A3AA9F] hover:text-[#1A1D1A] p-1">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
