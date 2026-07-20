import React from 'react';
import { 
  Settings, Zap, Shield, Clock, Eye, Plus, Save, ChevronDown,
  Check, MoreHorizontal, Activity, Users, Layers
} from 'lucide-react';
import './blueprint.css';

const SECTIONS = [
  {
    id: "SEC-010",
    name: "Initial Application & Disclosures",
    ai: { autoAllocate: true, fraudScan: false },
    permissions: [
      { role: "Applicant", view: true, upload: true, edit: false },
      { role: "Originator", view: true, upload: true, edit: true },
      { role: "Underwriter", view: true, upload: false, edit: false },
      { role: "Manager", view: true, upload: false, edit: true },
    ],
    documents: [
      {
        id: "DOC-1003",
        name: "Uniform Residential Loan Application (1003)",
        required: true,
        formats: ["PDF", "XML"],
        rules: []
      },
      {
        id: "DOC-W2",
        name: "W-2 Statements (Last 2 Years)",
        required: true,
        formats: ["PDF", "JPG"],
        rules: [
          { type: "age", label: "Must be current tax year", warning: "Flag if > 1 year old" }
        ]
      }
    ]
  },
  {
    id: "SEC-020",
    name: "Asset & Income Verification",
    ai: { autoAllocate: true, fraudScan: true },
    permissions: [
      { role: "Applicant", view: true, upload: true, edit: false },
      { role: "Originator", view: true, upload: true, edit: false },
      { role: "Underwriter", view: true, upload: false, edit: false },
      { role: "Manager", view: true, upload: false, edit: true },
    ],
    documents: [
      {
        id: "DOC-STMT",
        name: "Bank Statements (Last 3 Months)",
        required: true,
        formats: ["PDF"],
        rules: [
          { type: "stale", label: "Age < 90 days", warning: "Escalate 30d / 7d" }
        ]
      },
      {
        id: "DOC-GIFT",
        name: "Gift Letter (If Applicable)",
        required: false,
        formats: ["PDF"],
        rules: []
      }
    ]
  },
  {
    id: "SEC-030",
    name: "Collateral Valuation",
    ai: { autoAllocate: false, fraudScan: true },
    permissions: [
      { role: "Applicant", view: false, upload: false, edit: false },
      { role: "Originator", view: true, upload: false, edit: false },
      { role: "Underwriter", view: true, upload: false, edit: true },
      { role: "Manager", view: true, upload: false, edit: true },
    ],
    documents: [
      {
        id: "DOC-APPRAISAL",
        name: "Uniform Residential Appraisal Report (1004)",
        required: true,
        formats: ["PDF", "XML"],
        rules: [
          { type: "stale", label: "Age < 120 days", warning: "Requires recertification if older" }
        ]
      }
    ]
  },
  {
    id: "SEC-040",
    name: "Closing Preparation",
    ai: { autoAllocate: true, fraudScan: true },
    permissions: [
      { role: "Applicant", view: true, upload: false, edit: false },
      { role: "Originator", view: true, upload: false, edit: false },
      { role: "Underwriter", view: true, upload: false, edit: false },
      { role: "Manager", view: true, upload: true, edit: true },
    ],
    documents: [
      {
        id: "DOC-CD",
        name: "Closing Disclosure (CD)",
        required: true,
        formats: ["PDF"],
        rules: [
          { type: "stale", label: "3-Day Rule", warning: "Must issue > 3 days prior to closing" }
        ]
      },
      {
        id: "DOC-TITLE",
        name: "Final Title Commitment",
        required: true,
        formats: ["PDF", "XML"],
        rules: []
      }
    ]
  }
];

function PermBox({ type, active }: { type: string, active: boolean }) {
  return (
    <div 
      className={`w-[18px] h-[18px] flex items-center justify-center text-[10px] font-['Space_Mono'] rounded-sm transition-colors ${
        active 
          ? 'border border-sky-500/40 bg-sky-500/10 text-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.15)]' 
          : 'border border-slate-700/50 bg-slate-800/30 text-slate-600'
      }`}
      title={active ? `Has ${type} permission` : `No ${type} permission`}
    >
      {type}
    </div>
  )
}

function FormatBadge({ format }: { format: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-['Space_Mono'] border border-sky-800/50 text-sky-400 bg-sky-900/10">
      {format}
    </span>
  )
}

function RuleBadge({ rule }: { rule: any }) {
  const isWarning = rule.warning.toLowerCase().includes('escalate') || rule.warning.toLowerCase().includes('flag');
  
  return (
    <div className={`flex items-start gap-2 text-xs border ${isWarning ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'} px-2 py-1.5 rounded w-max`}>
      <Clock className={`w-3.5 h-3.5 mt-0.5 ${isWarning ? 'text-amber-400' : 'text-sky-400'}`} />
      <div className="flex flex-col gap-0.5">
        <span className={`${isWarning ? 'text-amber-200/90' : 'text-sky-200/90'} font-['Space_Mono'] text-[11px]`}>{rule.label}</span>
        <span className={`${isWarning ? 'text-amber-500/70' : 'text-sky-500/70'} text-[9px] uppercase tracking-wider`}>{rule.warning}</span>
      </div>
    </div>
  )
}

function SectionBlock({ section, index }: { section: any, index: number }) {
  const padIndex = index.toString().padStart(2, '0');
  
  return (
    <div className="border border-sky-900/40 bg-slate-900/60 backdrop-blur-md rounded-xl overflow-hidden shadow-xl shadow-black/50">
      {/* Header */}
      <div className="border-b border-sky-900/40 bg-slate-800/60 p-4 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-900/20 to-transparent pointer-events-none" />
        
        <div>
          <h3 className="text-lg font-medium text-slate-100 flex items-center gap-3">
            <span className="font-['Space_Mono'] text-sky-500/70 text-sm border border-sky-900/50 bg-sky-900/20 px-2 py-0.5 rounded">
              SEC-{padIndex}
            </span>
            {section.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-4 z-10">
           {/* AI Badges */}
           <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-['Space_Mono'] border ${
                section.ai.autoAllocate 
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' 
                  : 'border-slate-700/50 bg-slate-800/30 text-slate-500'
              }`}>
                <Zap className="w-3 h-3" /> AUTO-ALLOCATE
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-['Space_Mono'] border ${
                section.ai.fraudScan 
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-300' 
                  : 'border-slate-700/50 bg-slate-800/30 text-slate-500'
              }`}>
                <Shield className="w-3 h-3" /> QUALITY SCAN
              </div>
           </div>
           
           <div className="w-px h-6 bg-sky-900/50" />
           
           <button className="text-slate-400 hover:text-sky-400 transition-colors p-1">
             <Settings className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      {/* Permissions Matrix Ribbon */}
      <div className="px-4 py-2 border-b border-sky-900/20 bg-slate-800/30 flex gap-6 items-center overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 text-[10px] font-['Space_Mono'] text-slate-400 shrink-0">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>ACCESS MATRIX:</span>
        </div>
        <div className="flex gap-5">
          {section.permissions.map((p: any) => (
            <div className="flex items-center gap-2" key={p.role}>
              <span className="text-[10px] font-['Space_Mono'] text-slate-500 w-8">{p.role.substring(0,3).toUpperCase()}</span>
              <div className="flex gap-0.5">
                <PermBox type="V" active={p.view} />
                <PermBox type="U" active={p.upload} />
                <PermBox type="E" active={p.edit} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Requirements Table */}
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-500 font-['Space_Mono'] text-[10px] uppercase tracking-wider border-b border-sky-900/20">
            <tr>
              <th className="px-4 py-3 text-left font-normal w-1/3">Requirement ID & Name</th>
              <th className="px-4 py-3 text-left font-normal">Accepted Formats</th>
              <th className="px-4 py-3 text-left font-normal">SLA & Rules</th>
              <th className="px-4 py-3 text-right font-normal">Status</th>
              <th className="px-4 py-3 text-right font-normal w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-900/10">
            {section.documents.map((doc: any) => (
               <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-xs text-sky-500/60 font-['Space_Mono']">{doc.id}</span>
                       <span className="text-slate-200 font-medium text-sm">{doc.name}</span>
                     </div>
                  </td>
                  <td className="px-4 py-3">
                     <div className="flex flex-wrap gap-1.5">
                       {doc.formats.map((f: string) => (
                         <FormatBadge key={f} format={f} />
                       ))}
                     </div>
                  </td>
                  <td className="px-4 py-3">
                     <div className="flex flex-col gap-1.5">
                       {doc.rules.length > 0 ? doc.rules.map((r: any, i: number) => (
                          <RuleBadge key={i} rule={r} />
                       )) : (
                          <span className="text-slate-600 font-['Space_Mono'] text-xs">Standard SLA applies</span>
                       )}
                     </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                     {doc.required ? (
                       <span className="inline-flex items-center gap-1 text-[10px] font-['Space_Mono'] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                         REQUIRED
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 text-[10px] font-['Space_Mono'] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                         OPTIONAL
                       </span>
                     )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-slate-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Add Action */}
      <button className="w-full flex items-center justify-center gap-2 py-2.5 border-t border-sky-900/20 bg-sky-900/5 hover:bg-sky-900/10 text-sky-500/70 hover:text-sky-400 transition-colors text-xs font-['Space_Mono']">
        <Plus className="w-3.5 h-3.5" /> ADD REQUIREMENT
      </button>
    </div>
  )
}

export function Blueprint() {
  return (
    <div className="min-h-screen bg-[#060B14] text-slate-300 font-['Space_Grotesk'] flex flex-col relative overflow-hidden">
      {/* Background Grids */}
      <div className="absolute inset-0 blueprint-bg pointer-events-none" />
      <div className="absolute inset-0 blueprint-grid-large pointer-events-none" />
      
      {/* Decorative Grid Coordinates */}
      <div className="absolute top-[120px] left-[120px] text-[10px] text-sky-900/40 font-['Space_Mono'] pointer-events-none">
        + X:120 Y:120
      </div>
      <div className="absolute bottom-[120px] right-[120px] text-[10px] text-sky-900/40 font-['Space_Mono'] pointer-events-none">
        + X:880 Y:1024
      </div>

      {/* App Header */}
      <header className="h-16 border-b border-sky-900/40 bg-[#060B14]/80 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 bg-sky-500/10 border border-sky-500/30 rounded text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-['Space_Mono'] text-sky-500/70 tracking-widest leading-none mb-1">HOMIUM COMPLIANCE ARCHITECTURE</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Drafts /</span>
              <h1 className="text-sm font-medium text-slate-100">Purchase Loan — CA variant</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Role Preview Dropdown */}
          <div className="relative group/preview">
            <div className="flex items-center gap-2 border border-sky-900/60 bg-slate-900/40 rounded px-3 py-1.5 cursor-pointer hover:border-sky-500/50 hover:bg-slate-800/60 transition-all">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-300">Preview as:</span>
              <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
                Admin <ChevronDown className="w-3 h-3" />
              </span>
            </div>
            
            <div className="absolute top-full right-0 mt-1 w-40 bg-slate-900 border border-sky-900/60 rounded shadow-xl shadow-black opacity-0 pointer-events-none group-hover/preview:opacity-100 group-hover/preview:pointer-events-auto transition-all transform translate-y-1 group-hover/preview:translate-y-0 z-50">
              <div className="flex flex-col py-1">
                {['Administrator', 'Originator', 'Underwriter', 'Applicant'].map(role => (
                  <button key={role} className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-sky-900/30 hover:text-sky-300 transition-colors flex items-center justify-between">
                    {role}
                    {role === 'Administrator' && <Check className="w-3 h-3 text-sky-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-sky-900/50" />

          <button className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            Discard Draft
          </button>
          <button className="px-4 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded shadow-[0_0_15px_rgba(2,132,199,0.3)] border border-sky-400/50 transition-all flex items-center gap-2">
            <Save className="w-3.5 h-3.5" /> Commit to Sandbox
          </button>
        </div>
      </header>
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden z-10 relative">
        {/* Sidebar */}
        <aside className="w-64 border-r border-sky-900/40 bg-[#060B14]/60 backdrop-blur-xl flex flex-col z-20 shrink-0">
          <div className="p-5 border-b border-sky-900/40">
            <h2 className="text-[10px] font-['Space_Mono'] text-sky-500/70 mb-4 tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              TEMPLATE STRUCTURE
            </h2>
            <div className="flex flex-col gap-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-sky-900/30">
              {SECTIONS.map((sec, i) => (
                 <div key={sec.id} className="flex items-start gap-3 relative z-10 group cursor-pointer">
                   <div className="w-3.5 h-3.5 mt-0.5 rounded-full bg-[#060B14] border border-sky-500/50 flex items-center justify-center shrink-0">
                     <div className="w-1.5 h-1.5 rounded-full bg-sky-400 group-hover:scale-150 transition-transform" />
                   </div>
                   <div className="flex flex-col gap-0.5">
                     <span className="text-[10px] font-['Space_Mono'] text-slate-500 leading-none">SEC-{(i+1).toString().padStart(2,'0')}</span>
                     <span className="text-sm text-slate-300 group-hover:text-sky-300 transition-colors leading-tight">{sec.name}</span>
                   </div>
                 </div>
              ))}
            </div>
          </div>
          
          <div className="p-5 border-b border-sky-900/40">
            <h2 className="text-[10px] font-['Space_Mono'] text-sky-500/70 mb-4 tracking-widest flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              GLOBAL CONFIG
            </h2>
            <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between group cursor-pointer">
                 <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Strict Compliance</span>
                 <div className="w-8 h-4 rounded-full bg-sky-500/20 border border-sky-500/50 p-[1px] flex items-center justify-end transition-colors">
                   <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                 </div>
               </div>
               <div className="flex items-center justify-between group cursor-pointer">
                 <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">External Sharing</span>
                 <div className="w-8 h-4 rounded-full bg-slate-800 border border-slate-700 p-[1px] flex items-center justify-start transition-colors">
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                 </div>
               </div>
               <div className="flex items-center justify-between group cursor-pointer">
                 <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Audit Logging</span>
                 <div className="w-8 h-4 rounded-full bg-sky-500/20 border border-sky-500/50 p-[1px] flex items-center justify-end transition-colors">
                   <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                 </div>
               </div>
            </div>
          </div>
          
          <div className="p-5 mt-auto">
            <div className="rounded border border-sky-900/40 bg-sky-900/10 p-3 flex items-start gap-3">
              <Activity className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-200 font-medium">System Status</span>
                <span className="text-[10px] text-slate-400 leading-relaxed">All compliance microservices are active. No active incidents.</span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Builder Canvas */}
        <main className="flex-1 overflow-y-auto p-10 pb-32 custom-scrollbar relative">
          <div className="max-w-4xl mx-auto flex flex-col relative z-10">
            {/* Start Node */}
            <div className="mx-auto border border-sky-500/30 bg-sky-900/20 rounded-full px-4 py-1.5 text-xs font-['Space_Mono'] text-sky-400 mb-2 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
              WORKFLOW_START
            </div>
            
            {SECTIONS.map((sec, idx) => (
              <React.Fragment key={sec.id}>
                <div className="w-px h-10 bg-sky-900/50 mx-auto relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-sky-500/50 rounded-full bg-[#060B14]" />
                </div>
                <SectionBlock section={sec} index={idx + 1} />
              </React.Fragment>
            ))}
            
            <div className="w-px h-10 bg-sky-900/50 mx-auto" />
            <button className="mx-auto flex items-center gap-2 border border-dashed border-sky-700/50 bg-sky-900/10 hover:bg-sky-900/20 text-sky-400 px-6 py-3 rounded-lg transition-colors font-['Space_Mono'] text-sm">
              <Plus className="w-4 h-4" /> ADD NEW SECTION
            </button>
            
            <div className="w-px h-10 bg-sky-900/50 mx-auto" />
            <div className="mx-auto border border-slate-700 bg-slate-800/50 rounded-full px-4 py-1.5 text-xs font-['Space_Mono'] text-slate-400">
              WORKFLOW_END
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
