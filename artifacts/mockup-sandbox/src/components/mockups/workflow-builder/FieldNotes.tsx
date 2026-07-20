import React from 'react';
import {
  ChevronDown,
  Eye,
  Upload,
  Edit3,
  FileText,
  Brain,
  ShieldAlert,
  Bell,
  CheckCircle2,
  FileImage,
  Circle,
  FileBox,
  FileDown
} from 'lucide-react';

export function FieldNotes() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] font-['DM_Sans'] text-stone-800 antialiased selection:bg-[#0B3B24]/20 pb-32">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-stone-200/60 bg-[#F9F8F6]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[#0A2E1F] text-white font-['Fraunces'] text-lg font-medium shadow-sm">
            H
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-['Fraunces'] text-xl tracking-wide text-stone-800">
              Purchase Loan — CA Variant
            </h1>
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-600">
              Draft
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-white/60 px-3 py-1.5 text-sm text-stone-600 shadow-sm transition-colors hover:bg-white cursor-pointer">
            <Eye className="h-4 w-4 text-stone-400" />
            <span>Preview as:</span>
            <span className="font-medium text-stone-800">Originator</span>
            <ChevronDown className="h-3 w-3 text-stone-400 ml-1" />
          </div>
          <button className="rounded-md bg-[#0A2E1F] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#154731]">
            Publish Template
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1100px] gap-8 px-6 pt-16 xl:gap-20 xl:px-0">
        {/* Left Utility Rail (TOC) */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-32 space-y-1">
            <div className="mb-6 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              Document Outline
            </div>
            {[
              { id: '01', title: 'Initial Application' },
              { id: '02', title: 'Identity Verification' },
              { id: '03', title: 'Income & Assets', active: true },
              { id: '04', title: 'Property Valuation' },
              { id: '05', title: 'Title & Escrow' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`group flex items-baseline gap-2 rounded-lg px-3 py-2 transition-colors ${
                  item.active
                    ? 'bg-[#0A2E1F]/5 text-[#0A2E1F]'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                }`}
              >
                <span className={`font-['Fraunces'] text-xs ${item.active ? 'text-[#0A2E1F]' : 'text-stone-400 group-hover:text-stone-500'}`}>
                  {item.id}
                </span>
                <span className="text-sm font-medium">{item.title}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Document Flow */}
        <main className="flex-1 max-w-[720px] relative">
          
          {/* Document Header */}
          <div className="mb-20 border-b-[3px] border-stone-800 pb-8">
            <h1 className="font-['Fraunces'] text-5xl text-stone-900 tracking-tight mb-6">
              Purchase Loan Template
            </h1>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-400 uppercase tracking-wider text-xs">Variant</span>
                <span className="font-medium text-stone-800">California Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-400 uppercase tracking-wider text-xs">ID</span>
                <span className="font-medium text-stone-800 font-mono text-xs mt-0.5">TMPL-CA-PUR-092</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-400 uppercase tracking-wider text-xs">Last Edited</span>
                <span className="font-medium text-stone-800">Just now</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Collapsed Section 01 */}
            <div className="group flex cursor-pointer items-baseline gap-4 border-b border-stone-200/60 pb-5 transition-colors hover:border-stone-300">
              <span className="font-['Fraunces'] text-2xl text-stone-300 transition-colors group-hover:text-stone-400">01</span>
              <h2 className="font-['Fraunces'] text-2xl text-stone-800 transition-colors group-hover:text-black">Initial Application</h2>
              <div className="ml-auto flex items-center gap-3 text-sm text-stone-400 font-medium">
                <span>3 documents</span>
                <Circle className="h-1 w-1 fill-current" />
                <span>2 rules</span>
              </div>
            </div>

            {/* Collapsed Section 02 */}
            <div className="group flex cursor-pointer items-baseline gap-4 border-b border-stone-200/60 pb-5 pt-4 transition-colors hover:border-stone-300">
              <span className="font-['Fraunces'] text-2xl text-stone-300 transition-colors group-hover:text-stone-400">02</span>
              <h2 className="font-['Fraunces'] text-2xl text-stone-800 transition-colors group-hover:text-black">Identity Verification</h2>
              <div className="ml-auto flex items-center gap-3 text-sm text-stone-400 font-medium">
                <span>2 documents</span>
                <Circle className="h-1 w-1 fill-current" />
                <span className="text-[#0A2E1F]/70 flex items-center gap-1"><Brain className="h-3 w-3" /> AI Active</span>
              </div>
            </div>

            {/* OPEN SECTION 03 */}
            <div className="py-12 relative" id="03">
              
              {/* Section Header */}
              <div className="relative mb-6 flex items-baseline gap-4">
                <span className="font-['Fraunces'] text-3xl text-stone-300">03</span>
                <h2 className="font-['Fraunces'] text-4xl text-[#0A2E1F] tracking-tight">Income & Assets</h2>

                {/* Desktop AI Margin Note */}
                <div className="absolute right-0 top-3 hidden xl:block translate-x-[calc(100%+3rem)] w-48">
                  <div className="relative rounded-xl border border-[#0A2E1F]/10 bg-white/40 p-4 shadow-sm backdrop-blur-sm before:absolute before:-left-4 before:top-5 before:h-px before:w-4 before:bg-[#0A2E1F]/20">
                    <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0A2E1F]/60">
                      <Brain className="h-3.5 w-3.5" />
                      Automation
                    </div>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-start gap-2.5 group">
                        <div className="relative mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full bg-[#0A2E1F] transition-colors">
                          <span className="translate-x-3 inline-block h-3 w-3 transform rounded-full bg-white transition-transform" />
                        </div>
                        <span className="text-xs font-medium text-stone-600 group-hover:text-stone-900 leading-tight">Auto-allocate documents</span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-2.5 group">
                        <div className="relative mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full bg-[#0A2E1F] transition-colors">
                          <span className="translate-x-3 inline-block h-3 w-3 transform rounded-full bg-white transition-transform" />
                        </div>
                        <span className="text-xs font-medium text-stone-600 group-hover:text-stone-900 leading-tight">Quality & fraud scan</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indented Content Area */}
              <div className="ml-10 md:ml-12">
                
                {/* Permissions Sentence & Expanded Popover Hint */}
                <div className="relative mb-12 z-20">
                  <button className="group flex items-center gap-2.5 rounded-full border border-stone-200/80 bg-white px-3 py-1.5 shadow-sm transition-all hover:border-stone-300 hover:shadow">
                    <div className="flex -space-x-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 border border-white text-[9px] font-bold text-emerald-800 z-30">AP</div>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 border border-white text-[9px] font-bold text-blue-800 z-20">OR</div>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 border border-white text-[9px] font-bold text-purple-800 z-10">UN</div>
                    </div>
                    <span className="text-sm font-medium text-stone-600 group-hover:text-stone-900">
                      Applicant uploads · Originator edits · Underwriter reviews
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-600" />
                  </button>

                  {/* The Simulated Open Popover (Static for mockup) */}
                  <div className="absolute left-0 top-full mt-3 w-80 rounded-xl border border-stone-200/80 bg-white p-5 shadow-xl">
                    <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Access Matrix</h4>
                    <div className="space-y-4">
                      {[
                        { role: 'Applicant', abbr: 'AP', color: 'bg-emerald-100 text-emerald-800', rights: ['view', 'upload'] },
                        { role: 'Originator', abbr: 'OR', color: 'bg-blue-100 text-blue-800', rights: ['view', 'upload', 'edit'] },
                        { role: 'Underwriter', abbr: 'UN', color: 'bg-purple-100 text-purple-800', rights: ['view'] },
                        { role: 'Manager', abbr: 'MA', color: 'bg-amber-100 text-amber-800', rights: ['view', 'edit'] },
                      ].map(r => (
                        <div key={r.role} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full border border-white shadow-sm text-[9px] font-bold ${r.color}`}>
                              {r.abbr}
                            </div>
                            <span className="text-sm font-medium text-stone-700">{r.role}</span>
                          </div>
                          <div className="flex gap-1.5">
                            {['view', 'upload', 'edit'].map(right => {
                              const hasRight = r.rights.includes(right);
                              return (
                                <button key={right} className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                  hasRight ? 'bg-[#0A2E1F] text-white shadow-inner' : 'bg-stone-50 text-stone-300 hover:bg-stone-100'
                                }`} title={right}>
                                  {right === 'view' ? <Eye className="h-3.5 w-3.5" /> : 
                                   right === 'upload' ? <Upload className="h-3.5 w-3.5" /> : 
                                   <Edit3 className="h-3.5 w-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Margin for mobile AI Settings (hidden on xl) */}
                <div className="xl:hidden mb-10 rounded-xl border border-[#0A2E1F]/10 bg-white/60 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0A2E1F]/60">
                    <Brain className="h-3.5 w-3.5" />
                    Automation
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <div className="relative flex h-4 w-7 items-center rounded-full bg-[#0A2E1F]">
                        <span className="translate-x-3 inline-block h-3 w-3 transform rounded-full bg-white" />
                      </div>
                      <span className="text-sm font-medium text-stone-700">Auto-allocate</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <div className="relative flex h-4 w-7 items-center rounded-full bg-[#0A2E1F]">
                        <span className="translate-x-3 inline-block h-3 w-3 transform rounded-full bg-white" />
                      </div>
                      <span className="text-sm font-medium text-stone-700">Quality scan</span>
                    </label>
                  </div>
                </div>

                {/* Requirements Document List */}
                <div className="relative mt-24">
                  {/* Subtle connecting line down the left */}
                  <div className="absolute -left-6 top-2 bottom-0 w-px bg-stone-200/80"></div>
                  
                  <div className="space-y-8">
                    
                    {/* Doc Item 1 */}
                    <div className="relative group">
                      {/* Node indicator */}
                      <div className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full border-2 border-stone-300 bg-[#F9F8F6] group-hover:border-[#0A2E1F] transition-colors"></div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="font-['Fraunces'] text-xl text-stone-900 group-hover:text-[#0A2E1F] transition-colors">Bank Statements</h3>
                            <span className="rounded bg-[#0A2E1F]/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0A2E1F]">Required</span>
                          </div>
                          <p className="text-sm text-stone-500 mb-3 leading-relaxed max-w-lg">
                            2 most recent consecutive months. Must show full account number and name.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 shadow-sm">
                              <FileText className="h-3 w-3" /> .pdf
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 shadow-sm">
                              <FileImage className="h-3 w-3" /> .png
                            </span>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-stone-400 hover:text-[#0A2E1F] rounded-md hover:bg-[#0A2E1F]/5">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Associated Alarm Rule */}
                      <div className="mt-5 ml-4 flex items-start gap-3 rounded-lg border border-amber-200/60 bg-[#FDF9F0]/80 p-3.5 shadow-sm">
                        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div className="text-sm leading-relaxed text-amber-900">
                          Must be newer than <span className="inline-flex cursor-text items-center rounded border border-amber-200 bg-white px-1.5 py-px font-semibold text-amber-950 shadow-sm transition-colors hover:border-amber-300">90 days</span> — remind at <span className="inline-flex cursor-text items-center rounded border border-amber-200 bg-white px-1.5 py-px font-semibold text-amber-950 shadow-sm transition-colors hover:border-amber-300">30d</span>, escalate at <span className="inline-flex cursor-text items-center rounded border border-amber-200 bg-white px-1.5 py-px font-semibold text-amber-950 shadow-sm transition-colors hover:border-amber-300">7d</span>.
                        </div>
                      </div>
                    </div>

                    {/* Doc Item 2 */}
                    <div className="relative group pt-4">
                      <div className="absolute -left-[1.6rem] top-5 h-2 w-2 rounded-full border-2 border-stone-300 bg-[#F9F8F6] group-hover:border-[#0A2E1F] transition-colors"></div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="font-['Fraunces'] text-xl text-stone-900 group-hover:text-[#0A2E1F] transition-colors">W-2 Forms</h3>
                            <span className="rounded bg-[#0A2E1F]/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0A2E1F]">Required</span>
                          </div>
                          <p className="text-sm text-stone-500 mb-3 max-w-lg">
                            Past 2 years for all current employers.
                          </p>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 shadow-sm">
                              <FileText className="h-3 w-3" /> .pdf
                            </span>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-stone-400 hover:text-[#0A2E1F] rounded-md hover:bg-[#0A2E1F]/5">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Doc Item 3 */}
                    <div className="relative group pt-4">
                      <div className="absolute -left-[1.6rem] top-5 h-2 w-2 rounded-full border-2 border-stone-300 bg-[#F9F8F6] group-hover:border-stone-500 transition-colors"></div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 opacity-70 hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="font-['Fraunces'] text-xl text-stone-800">Gift Letter</h3>
                            <span className="rounded bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">Optional</span>
                          </div>
                          <p className="text-sm text-stone-500 mb-3 max-w-lg">
                            Signed letter from donor if applicable.
                          </p>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 shadow-sm">
                              <FileText className="h-3 w-3" /> .pdf
                            </span>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-stone-400 hover:text-[#0A2E1F] rounded-md hover:bg-[#0A2E1F]/5">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Add new requirement button */}
                    <div className="relative pt-6">
                      <div className="absolute -left-[1.6rem] top-9 h-2 w-2 rounded-full border-2 border-stone-200 bg-[#F9F8F6]"></div>
                      <button className="flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-[#0A2E1F] transition-colors group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-stone-300 bg-stone-50 group-hover:border-[#0A2E1F]/30 group-hover:bg-[#0A2E1F]/5">
                          <span className="text-lg leading-none mb-0.5">+</span>
                        </div>
                        Add requirement
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Collapsed Section 04 */}
            <div className="group flex cursor-pointer items-baseline gap-4 border-b border-stone-200/60 pb-5 pt-4 transition-colors hover:border-stone-300">
              <span className="font-['Fraunces'] text-2xl text-stone-300 transition-colors group-hover:text-stone-400">04</span>
              <h2 className="font-['Fraunces'] text-2xl text-stone-800 transition-colors group-hover:text-black">Property Valuation</h2>
              <div className="ml-auto flex items-center gap-3 text-sm text-stone-400 font-medium">
                <span>1 document</span>
              </div>
            </div>

            {/* Collapsed Section 05 */}
            <div className="group flex cursor-pointer items-baseline gap-4 border-b border-stone-200/60 pb-5 pt-4 transition-colors hover:border-stone-300">
              <span className="font-['Fraunces'] text-2xl text-stone-300 transition-colors group-hover:text-stone-400">05</span>
              <h2 className="font-['Fraunces'] text-2xl text-stone-800 transition-colors group-hover:text-black">Title & Escrow</h2>
              <div className="ml-auto flex items-center gap-3 text-sm text-stone-400 font-medium">
                <span>4 documents</span>
                <Circle className="h-1 w-1 fill-current" />
                <span>1 rule</span>
              </div>
            </div>

            {/* Add new section button */}
            <div className="pt-8">
               <button className="flex items-center gap-3 text-stone-400 hover:text-[#0A2E1F] transition-colors group">
                  <span className="font-['Fraunces'] text-2xl opacity-50 group-hover:opacity-100">+</span>
                  <span className="font-['Fraunces'] text-xl">Add Section</span>
               </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
