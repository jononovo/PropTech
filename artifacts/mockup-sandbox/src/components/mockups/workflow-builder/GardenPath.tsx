import React, { useState } from 'react';
import {
  Eye, 
  Upload, 
  PenLine, 
  Plus, 
  MoreHorizontal, 
  Clock, 
  FileText,
  Users, 
  FolderOpen, 
  Sparkles
} from 'lucide-react';

const STEPS = [
  { id: 'app', num: '01', title: 'Initial Application', purpose: 'Gather basic borrower details and property intent.', docs: 3, avatars: ['A', 'O'], ai: false },
  { id: 'id', num: '02', title: 'Identity Verification', purpose: 'Confirm legal identity and citizenship status.', docs: 2, avatars: ['A', 'M'], ai: true },
  { id: 'income', num: '03', title: 'Income & Assets', purpose: 'Verify financial capacity through bank and tax records.', docs: 4, avatars: ['A', 'O', 'U', 'M'], ai: true },
  { id: 'prop', num: '04', title: 'Property Valuation', purpose: 'Assess the target property value and condition.', docs: 1, avatars: ['O', 'U'], ai: false },
  { id: 'title', num: '05', title: 'Title & Escrow', purpose: 'Clear title and prepare closing documents.', docs: 5, avatars: ['U', 'M'], ai: false },
];

function RoleRow({ role, initial, bg, fg, view, upload, edit }: any) {
  return (
    <div className="flex items-center justify-between p-2.5 -ml-2.5 rounded-2xl hover:bg-[#F8F7F2] transition-colors group border border-transparent hover:border-[#EAE7DF]">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full ${bg} ${fg} flex items-center justify-center font-bold text-sm shadow-sm border border-black/5`}>
          {initial}
        </div>
        <span className="font-medium text-[#263A2B]">{role}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ToggleChip active={view} icon={Eye} label="View" activeColors="bg-[#E6ECE8] text-[#263A2B] border-[#D0DBD4]" />
        <ToggleChip active={upload} icon={Upload} label="Upload" activeColors="bg-[#E6ECE8] text-[#263A2B] border-[#D0DBD4]" />
        <ToggleChip active={edit} icon={PenLine} label="Edit" activeColors="bg-[#F0E6E3] text-[#A45D47] border-[#E6D1CB]" />
      </div>
    </div>
  )
}

function ToggleChip({ active, icon: Icon, label, activeColors }: any) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
      active 
        ? activeColors 
        : 'bg-white text-[#A8A398] border-[#EAE7DF] opacity-60 hover:opacity-100 hover:bg-[#F8F7F2]'
    }`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
  )
}

function DocumentTile({ title, req, accepts, valid, escalation }: any) {
  return (
    <div className="bg-white border border-[#EAE7DF] p-5 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-[#D0DBD4] transition-all group/doc cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <span className="font-['Fraunces'] font-medium text-[17px] text-[#263A2B]">{title}</span>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${
              req === 'Required' 
                ? 'bg-[#F9EBE7] text-[#A45D47] border-[#F1D5CE]' 
                : 'bg-[#F4F1EA] text-[#737C6D] border-[#EAE7DF]'
            }`}>
              {req}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#737C6D]">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Accepts:</span>
            {accepts.map((ext: string) => (
              <span key={ext} className="font-['Space_Mono'] text-[11px] bg-[#F8F7F2] px-1.5 py-0.5 rounded text-[#5C6556] border border-[#EAE7DF]">{ext}</span>
            ))}
          </div>
        </div>
        
        <button className="p-1.5 text-[#A8A398] hover:text-[#263A2B] hover:bg-[#F8F7F2] rounded-full transition-colors opacity-0 group-hover/doc:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {valid && (
        <div className="flex items-center gap-4 pt-4 border-t border-[#F8F7F2]">
          <div className="flex items-center gap-1.5 bg-[#FDF7F5] px-3 py-1.5 rounded-full text-xs font-medium text-[#A45D47] border border-[#F3E3DF]">
            <Clock className="w-3.5 h-3.5" /> Valid for {valid}
          </div>
          
          {escalation && (
            <div className="flex items-center gap-2 group/esc relative">
              <span className="text-xs text-[#7A8E72] font-medium mr-1 group-hover/esc:text-[#263A2B] transition-colors">Escalation path</span>
              <div className="flex gap-1">
                <div className="w-6 h-6 rounded-full bg-[#E6ECE8] text-[#263A2B] flex items-center justify-center text-[10px] font-bold font-['Space_Mono'] border border-[#D0DBD4]">90</div>
                <div className="w-6 h-6 rounded-full bg-[#FDF3E3] text-[#B88748] flex items-center justify-center text-[10px] font-bold font-['Space_Mono'] border border-[#F3E0C2]">30</div>
                <div className="w-6 h-6 rounded-full bg-[#F9EBE7] text-[#A45D47] flex items-center justify-center text-[10px] font-bold font-['Space_Mono'] border border-[#F1D5CE]">7</div>
              </div>
              
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 p-3 bg-white border border-[#EAE7DF] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] opacity-0 group-hover/esc:opacity-100 pointer-events-none transition-all z-20 flex flex-col gap-2 translate-y-2 group-hover/esc:translate-y-0">
                <div className="text-[10px] font-bold text-[#7A8E72] uppercase tracking-wider mb-1">Escalation Rules</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-['Space_Mono'] text-[#737C6D]">90 Days</span>
                  <span className="text-[#263A2B] font-medium bg-[#E6ECE8] px-2 py-0.5 rounded border border-[#D0DBD4]">Valid</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-['Space_Mono'] text-[#737C6D]">30 Days</span>
                  <span className="text-[#B88748] font-medium bg-[#FDF3E3] px-2 py-0.5 rounded border border-[#F3E0C2]">Warn Manager</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-['Space_Mono'] text-[#737C6D]">7 Days</span>
                  <span className="text-[#A45D47] font-medium bg-[#F9EBE7] px-2 py-0.5 rounded border border-[#F1D5CE]">Alert Applicant</span>
                </div>
                
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-[#EAE7DF] rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExpandedCard({ step }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EAE7DF] mb-2">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-['Space_Mono'] text-sm text-[#7A8E72] tracking-widest uppercase">Stop {step.num}</span>
            {step.ai && (
              <>
                <div className="h-4 w-px bg-[#EAE7DF]"></div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#5C6556] bg-[#F8F7F2] px-2.5 py-1 rounded-md border border-[#EAE7DF]">
                  <Sparkles className="w-3.5 h-3.5 text-[#7A8E72]" /> AI Assisted
                </div>
              </>
            )}
          </div>
          <h2 className="font-['Fraunces'] text-[32px] leading-tight font-medium text-[#263A2B] mb-3">{step.title}</h2>
          <p className="text-[#5C6556] leading-relaxed max-w-xl text-[15px]">
            {step.purpose}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-5">
          <h3 className="text-xs font-bold tracking-widest uppercase text-[#7A8E72] mb-5 flex items-center gap-2">
            <Users className="w-4 h-4" /> Who works here
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { role: 'Applicant', initial: 'A', bg: 'bg-[#E6ECE8]', fg: 'text-[#263A2B]', view: true, upload: true, edit: false },
              { role: 'Originator', initial: 'O', bg: 'bg-[#F0E6E3]', fg: 'text-[#A45D47]', view: true, upload: true, edit: true },
              { role: 'Underwriter', initial: 'U', bg: 'bg-[#E5E5EB]', fg: 'text-[#42457A]', view: true, upload: false, edit: true },
              { role: 'Manager', initial: 'M', bg: 'bg-[#EBE9E2]', fg: 'text-[#7A7261]', view: true, upload: true, edit: true },
            ].map((r, idx) => (
              <RoleRow key={idx} {...r} />
            ))}
          </div>
        </div>

        <div className="col-span-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#7A8E72] flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> What must be handed over
            </h3>
            <button className="text-sm font-medium text-[#263A2B] flex items-center gap-1.5 hover:text-[#1A261C] bg-[#F8F7F2] px-4 py-2 rounded-full border border-[#EAE7DF] hover:border-[#D0DBD4] transition-all">
              <Plus className="w-4 h-4" /> Add document
            </button>
          </div>
          
          <div className="flex flex-col gap-4 mb-8">
            <DocumentTile 
              title="Bank Statements — Last 3 Months"
              req="Required"
              accepts={['.PDF']}
              valid="90 days"
              escalation={true}
            />
            <DocumentTile 
              title="W-2 Forms — Last 2 Years"
              req="Optional"
              accepts={['.PDF', '.JPG']}
              valid={null}
              escalation={false}
            />
          </div>

          <h3 className="text-xs font-bold tracking-widest uppercase text-[#7A8E72] mb-5 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Ambient AI
          </h3>
          <div className="bg-[#F8F7F2] rounded-2xl p-6 flex flex-col gap-6 border border-[#EAE7DF]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[#263A2B] text-[15px] mb-1">Auto-allocation</h4>
                <p className="text-[13px] text-[#737C6D] max-w-[280px]">Automatically route documents to specific roles based on content.</p>
              </div>
              <div className="w-11 h-6 bg-[#7A8E72] rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm transition-transform"></div>
              </div>
            </div>
            <div className="h-px bg-[#EAE7DF] -mx-6"></div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[#263A2B] text-[15px] mb-1">Quality & Fraud Scan</h4>
                <p className="text-[13px] text-[#737C6D] max-w-[280px]">Scan incoming files for tampering and clarity issues before review.</p>
              </div>
              <div className="w-11 h-6 bg-[#7A8E72] rounded-full relative cursor-pointer shadow-inner shrink-0 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm transition-transform"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UnexpandedCard({ step, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="bg-white/60 hover:bg-white rounded-[1.5rem] p-6 border border-transparent hover:border-[#EAE7DF] transition-all cursor-pointer group shadow-sm hover:shadow-md backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-['Space_Mono'] text-[#7A8E72] text-[15px] group-hover:text-[#263A2B] transition-colors font-medium">{step.num}</span>
          <div>
            <h3 className="font-['Fraunces'] text-[22px] font-medium text-[#5C6556] group-hover:text-[#263A2B] transition-colors mb-0.5">{step.title}</h3>
            <p className="text-[14px] text-[#7A8E72]">{step.purpose}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex -space-x-2">
            {step.avatars.map((a: string, i: number) => {
               let bg = 'bg-white', fg = 'text-[#737C6D]';
               if (a === 'A') { bg = 'bg-[#E6ECE8]'; fg = 'text-[#263A2B]'; }
               if (a === 'O') { bg = 'bg-[#F0E6E3]'; fg = 'text-[#A45D47]'; }
               if (a === 'U') { bg = 'bg-[#E5E5EB]'; fg = 'text-[#42457A]'; }
               if (a === 'M') { bg = 'bg-[#EBE9E2]'; fg = 'text-[#7A7261]'; }
               return (
                 <div key={i} className={`w-8 h-8 rounded-full ${bg} ${fg} border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold relative z-[1] hover:z-10 transition-transform hover:scale-110`}>
                   {a}
                 </div>
               )
            })}
          </div>
          
          <div className="h-6 w-px bg-[#EAE7DF]"></div>
          
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#7A8E72] bg-[#F8F7F2] px-3 py-1.5 rounded-full border border-[#EAE7DF] group-hover:bg-white group-hover:text-[#263A2B] group-hover:border-[#D0DBD4] transition-colors">
            <FolderOpen className="w-3.5 h-3.5" /> {step.docs}
          </div>
          
          {step.ai && (
            <div className="w-8 h-8 rounded-full bg-[#F8F7F2] flex items-center justify-center border border-[#EAE7DF] group-hover:bg-[#E6ECE8] group-hover:border-[#D0DBD4] group-hover:text-[#263A2B] transition-colors text-[#7A8E72]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function GardenPath() {
  const [activeStepId, setActiveStepId] = useState('income');

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#263A2B] font-['DM_Sans',_sans-serif] selection:bg-[#7A8E72] selection:text-white pb-32 flex flex-col">
      <header className="sticky top-0 z-50 bg-[#F8F7F2]/90 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-[#EAE7DF]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#263A2B] text-[#F8F7F2] flex items-center justify-center font-['Fraunces'] font-bold italic text-lg shadow-sm">
              H
            </div>
            <span className="font-['Fraunces'] font-medium text-xl tracking-wide text-[#263A2B]">
              Homium
            </span>
          </div>
          <div className="h-6 w-px bg-[#D0DBD4]"></div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-[#263A2B] text-[15px]">Purchase Loan — CA Variant</span>
            <span className="px-2 py-0.5 rounded bg-[#E6ECE8] text-[#5C6556] text-[10px] font-bold tracking-widest uppercase border border-[#D0DBD4]">Draft</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EAE7DF] shadow-sm cursor-pointer hover:border-[#D0DBD4] transition-colors">
            <Eye className="w-4 h-4 text-[#7A8E72]" />
            <span className="text-sm font-medium text-[#5C6556]">Preview as: <span className="text-[#263A2B]">Originator</span></span>
          </div>
          <button className="bg-[#263A2B] hover:bg-[#1A261C] text-white text-sm font-medium px-6 py-2 rounded-full shadow-sm transition-colors">
            Publish Template
          </button>
        </div>
      </header>

      <main className="relative max-w-[1100px] w-full mx-auto px-8 pt-12">
        <div className="mb-14">
          <h1 className="font-['Fraunces'] text-[42px] leading-tight font-medium text-[#263A2B] mb-3">Workflow Pathway</h1>
          <p className="text-[#737C6D] text-[17px] max-w-2xl leading-relaxed">
            Compose the loan application journey. Define what happens at each stop, who is responsible, and how documents are validated.
          </p>
        </div>
        
        <div className="relative">
          {/* Main vertical path line */}
          <div className="absolute left-[31px] top-8 bottom-8 w-px border-l-2 border-dashed border-[#D0DBD4] z-0"></div>
          
          <div className="space-y-1 relative z-10">
            {STEPS.map((step, index) => {
              const isExpanded = step.id === activeStepId;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-stretch gap-6 relative group">
                    <div className={`w-16 flex-shrink-0 flex justify-center ${isExpanded ? 'pt-[48px]' : 'pt-[28px]'}`}>
                      {isExpanded ? (
                        <div className="w-6 h-6 rounded-full border-2 border-[#7A8E72] bg-[#F8F7F2] flex items-center justify-center z-10 shadow-sm relative">
                          <div className="w-2.5 h-2.5 bg-[#263A2B] rounded-full"></div>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[#D4D0C5] bg-[#F8F7F2] z-10 group-hover:border-[#7A8E72] group-hover:scale-125 transition-all relative" />
                      )}
                    </div>
                    <div className="flex-grow py-2">
                      {isExpanded ? (
                        <ExpandedCard step={step} />
                      ) : (
                        <UnexpandedCard step={step} onClick={() => setActiveStepId(step.id)} />
                      )}
                    </div>
                  </div>
                  
                  {index < STEPS.length - 1 && (
                    <div className="flex items-center gap-6 relative h-10 my-1 group cursor-pointer">
                      <div className="w-16 flex-shrink-0 flex justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#F4F1EA] border-2 border-[#EAE7DF] flex items-center justify-center text-[#A8A398] group-hover:text-[#263A2B] group-hover:border-[#7A8E72] group-hover:bg-white shadow-sm transition-all z-10 relative">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex-grow flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-px bg-gradient-to-r from-[#7A8E72] to-transparent w-24 mr-4"></div>
                        <span className="text-[11px] font-bold tracking-widest uppercase text-[#7A8E72]">Add Stop</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
