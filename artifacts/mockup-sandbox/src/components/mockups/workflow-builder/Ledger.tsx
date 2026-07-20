import React, { useState } from 'react';
import { 
  Check, 
  ChevronDown, 
  Clock, 
  FileText, 
  GripVertical, 
  Plus, 
  Settings2,
  Eye,
  Upload,
  Edit2,
  BrainCircuit,
  BellRing,
  MoreHorizontal,
  FileSearch,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';

export function Ledger() {
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
            <span className="text-[#737A73]">Templates</span>
            <span className="text-[#E3E1DB]">/</span>
            <span className="font-medium">Purchase Loan — CA Variant</span>
            <span className="ml-2 px-2 py-0.5 rounded-sm bg-[#EAE8E2] text-[#4A4F4A] text-xs font-medium tracking-wide">DRAFT</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#E3E1DB] bg-white cursor-pointer hover:bg-[#FDFDFB] transition-colors shadow-sm">
            <Eye className="w-4 h-4 text-[#737A73]" />
            <span className="text-sm font-medium">Preview as: <span className="text-[#2A4D3B]">Originator</span></span>
            <ChevronDown className="w-4 h-4 text-[#737A73] ml-1" />
          </div>
          <button className="text-sm font-medium text-[#737A73] hover:text-[#1A1D1A] px-3 py-1.5 transition-colors">
            Discard Changes
          </button>
          <button className="bg-[#2A4D3B] hover:bg-[#1E3A2B] text-[#F7F5F0] text-sm font-medium px-5 py-2 rounded-md shadow-sm transition-colors">
            Publish Template
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 flex items-start gap-8">
        
        {/* Left Column: Sections Outline */}
        <aside className="w-80 shrink-0">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-['Fraunces'] text-xl font-medium tracking-wide text-[#2A4D3B]">Workflow Sections</h2>
            <button className="text-[#737A73] hover:text-[#2A4D3B] transition-colors p-1">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {[
              { id: 'app', num: '01', title: 'Initial Application', docs: 3 },
              { id: 'id', num: '02', title: 'Identity Verification', docs: 2 },
              { id: 'income', num: '03', title: 'Income & Assets', docs: 4, active: true },
              { id: 'prop', num: '04', title: 'Property Valuation', docs: 1 },
              { id: 'title', num: '05', title: 'Title & Escrow', docs: 5 },
            ].map((section) => (
              <button 
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left group flex items-center justify-between p-3 rounded-md transition-all border ${
                  section.active 
                    ? 'bg-white border-[#2A4D3B] shadow-sm' 
                    : 'bg-transparent border-transparent hover:border-[#E3E1DB] hover:bg-[#FDFDFB]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className={`w-4 h-4 ${section.active ? 'text-[#A3B18A]' : 'text-transparent group-hover:text-[#D1CFC9]'}`} />
                  <span className={`font-['Space_Mono'] text-xs font-medium ${section.active ? 'text-[#2A4D3B]' : 'text-[#A3AA9F]'}`}>
                    {section.num}
                  </span>
                  <span className={`text-sm font-medium ${section.active ? 'text-[#1A1D1A]' : 'text-[#4A4F4A]'}`}>
                    {section.title}
                  </span>
                </div>
                <span className={`text-xs ${section.active ? 'text-[#737A73]' : 'text-[#A3AA9F]'}`}>
                  {section.docs} docs
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-md border border-[#E3E1DB] bg-[#FDFDFB]">
            <div className="flex items-start gap-3 text-sm">
              <Clock className="w-4 h-4 text-[#737A73] shrink-0 mt-0.5" />
              <div className="text-[#737A73] leading-relaxed">
                Last modified on <span className="text-[#1A1D1A]">Oct 12, 2023</span> by <span className="text-[#1A1D1A]">Eleanor R.</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Section Editor */}
        <div className="flex-1 max-w-3xl space-y-8">
          
          {/* Section Header */}
          <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[#E3E1DB]">
              <div className="flex items-baseline gap-4 mb-3">
                <span className="font-['Space_Mono'] text-lg text-[#A3AA9F]">03.</span>
                <input 
                  type="text" 
                  defaultValue="Income & Assets"
                  className="font-['Fraunces'] text-3xl font-medium text-[#1A1D1A] bg-transparent border-none outline-none focus:ring-0 p-0 w-full placeholder-[#A3AA9F]"
                />
              </div>
              <textarea 
                defaultValue="Gather and verify the applicant's financial capacity, including bank statements, tax returns, and current employment verification."
                className="w-full text-[#4A4F4A] bg-transparent border-none outline-none resize-none h-14 p-0 focus:ring-0 text-[15px] leading-relaxed"
              />
            </div>
            
            {/* AI Settings Bar */}
            <div className="bg-[#FAFAF9] px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-[#EAF0EC] border border-[#2A4D3B]/20 flex items-center justify-center">
                    <BrainCircuit className="w-3 h-3 text-[#2A4D3B]" />
                  </div>
                  <span className="text-sm font-medium text-[#4A4F4A] group-hover:text-[#1A1D1A] transition-colors">Auto-allocation</span>
                  <div className="w-8 h-4 rounded-full bg-[#2A4D3B] relative ml-1 shadow-inner">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                  </div>
                </div>
                <div className="w-px h-4 bg-[#E3E1DB]"></div>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-[#EAF0EC] border border-[#2A4D3B]/20 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#2A4D3B]" />
                  </div>
                  <span className="text-sm font-medium text-[#4A4F4A] group-hover:text-[#1A1D1A] transition-colors">Quality & Fraud Scan</span>
                  <div className="w-8 h-4 rounded-full bg-[#2A4D3B] relative ml-1 shadow-inner">
                    <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                  </div>
                </div>
              </div>
              <button className="text-xs font-medium text-[#737A73] hover:text-[#2A4D3B] flex items-center gap-1">
                <Settings2 className="w-3.5 h-3.5" />
                Configure Rules
              </button>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Fraunces'] text-lg font-medium text-[#2A4D3B]">Stakeholder Permissions</h3>
              <p className="text-sm text-[#737A73]">Define access rights for documents in this section.</p>
            </div>

            <div className="border border-[#E3E1DB] rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF9] border-b border-[#E3E1DB]">
                  <tr>
                    <th className="text-left font-medium text-[#4A4F4A] p-4 w-1/3">Role</th>
                    <th className="text-center font-medium text-[#4A4F4A] p-4">View</th>
                    <th className="text-center font-medium text-[#4A4F4A] p-4">Upload</th>
                    <th className="text-center font-medium text-[#4A4F4A] p-4">Edit/Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E1DB]">
                  {[
                    { role: 'Applicant', view: true, upload: true, edit: false },
                    { role: 'Originator', view: true, upload: true, edit: true },
                    { role: 'Underwriter', view: true, upload: false, edit: true },
                    { role: 'Manager', view: true, upload: true, edit: true },
                  ].map((row) => (
                    <tr key={row.role} className="hover:bg-[#FDFDFB] transition-colors">
                      <td className="p-4 font-medium text-[#1A1D1A]">{row.role}</td>
                      <td className="p-4 text-center">
                        <div className={`mx-auto w-5 h-5 rounded flex items-center justify-center ${row.view ? 'bg-[#EAF0EC] text-[#2A4D3B]' : 'bg-[#FAFAF9] text-[#D1CFC9]'}`}>
                          {row.view ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`mx-auto w-5 h-5 rounded flex items-center justify-center ${row.upload ? 'bg-[#EAF0EC] text-[#2A4D3B]' : 'bg-[#FAFAF9] text-[#D1CFC9]'}`}>
                          {row.upload ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`mx-auto w-5 h-5 rounded flex items-center justify-center ${row.edit ? 'bg-[#EAF0EC] text-[#2A4D3B]' : 'bg-[#FAFAF9] text-[#D1CFC9]'}`}>
                          {row.edit ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Requirements */}
          <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-['Fraunces'] text-lg font-medium text-[#2A4D3B]">Document Requirements</h3>
                <p className="text-sm text-[#737A73] mt-1">Specify required files and validation rules.</p>
              </div>
              <button className="flex items-center gap-2 text-sm font-medium text-[#2A4D3B] hover:bg-[#EAF0EC] px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-[#2A4D3B]/20">
                <Plus className="w-4 h-4" />
                Add Requirement
              </button>
            </div>

            <div className="space-y-6">
              
              {/* Requirement 1 */}
              <div className="group relative rounded-lg border border-[#E3E1DB] bg-[#FDFDFB] hover:border-[#C4C2BB] transition-colors shadow-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2A4D3B] rounded-l-lg"></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded border border-[#E3E1DB] shadow-sm">
                        <FileText className="w-5 h-5 text-[#4A4F4A]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            defaultValue="Bank Statements — Last 3 Months"
                            className="font-medium text-[#1A1D1A] bg-transparent border-none outline-none focus:ring-0 p-0 hover:bg-[#F0EEE6] px-1 -mx-1 rounded min-w-[280px]"
                          />
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#FDECE8] text-[#B85C38] border border-[#FAD6CC]">Required</span>
                        </div>
                        <div className="text-xs text-[#737A73] mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            Accepted: <span className="font-['Space_Mono'] bg-[#F0EEE6] px-1 py-0.5 rounded text-[#4A4F4A]">.PDF</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-[#A3AA9F] hover:text-[#1A1D1A] p-1">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Alarm Rules */}
                  <div className="ml-11 mt-4 pl-4 border-l-2 border-[#E3E1DB] space-y-3">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-3.5 h-3.5 text-[#B85C38]" />
                      <span className="text-sm font-medium text-[#1A1D1A]">Time-Sensitivity Rules</span>
                    </div>
                    
                    <div className="bg-white border border-[#E3E1DB] rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#4A4F4A]">Condition: <span className="font-medium text-[#1A1D1A]">Document Age &lt; 90 Days</span></span>
                        <button className="text-[#737A73] hover:text-[#1A1D1A]"><Edit2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex items-center gap-0.5 text-xs font-['Space_Mono'] mt-3">
                        <div className="flex-1 bg-[#F5F9F6] border border-[#D5E3D8] text-[#2A4D3B] p-2 rounded-l flex flex-col items-center justify-center">
                          <span className="text-[#8B9990] mb-0.5 uppercase text-[9px]">Valid</span>
                          <span>&lt; 30d</span>
                        </div>
                        <div className="flex-1 bg-[#FFF8ED] border border-[#FDE3B8] text-[#9A6A1D] p-2 flex flex-col items-center justify-center">
                          <span className="text-[#BCA37F] mb-0.5 uppercase text-[9px]">Warn</span>
                          <span>30-60d</span>
                        </div>
                        <div className="flex-1 bg-[#FDF0EC] border border-[#FAD6CC] text-[#B85C38] p-2 flex flex-col items-center justify-center">
                          <span className="text-[#D39B88] mb-0.5 uppercase text-[9px]">Escalate</span>
                          <span>60-90d</span>
                        </div>
                        <div className="flex-1 bg-[#FAFAF9] border border-[#E3E1DB] text-[#A3AA9F] p-2 rounded-r flex flex-col items-center justify-center line-through">
                          <span className="text-[#D1CFC9] mb-0.5 uppercase text-[9px]">Reject</span>
                          <span>&gt; 90d</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement 2 */}
              <div className="group relative rounded-lg border border-[#E3E1DB] bg-[#FDFDFB] hover:border-[#C4C2BB] transition-colors shadow-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2A4D3B] rounded-l-lg opacity-40"></div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded border border-[#E3E1DB] shadow-sm">
                        <FileText className="w-5 h-5 text-[#4A4F4A]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            defaultValue="W-2 Forms — Last 2 Years"
                            className="font-medium text-[#1A1D1A] bg-transparent border-none outline-none focus:ring-0 p-0 hover:bg-[#F0EEE6] px-1 -mx-1 rounded min-w-[250px]"
                          />
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#EAF0EC] text-[#2A4D3B] border border-[#D5E3D8]">Optional</span>
                        </div>
                        <div className="text-xs text-[#737A73] mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            Accepted: <span className="font-['Space_Mono'] bg-[#F0EEE6] px-1 py-0.5 rounded text-[#4A4F4A]">.PDF, .JPG</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-[#A3AA9F] hover:text-[#1A1D1A] p-1">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
