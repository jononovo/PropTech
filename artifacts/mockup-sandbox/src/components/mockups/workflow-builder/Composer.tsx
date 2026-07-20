import React from 'react';
import { 
  GripVertical, Bell, UploadCloud, CheckCircle2, 
  Smartphone, Monitor, Table, ChevronDown, 
  Shield, FileText, Brain, Plus 
} from 'lucide-react';
import './Composer.css';

export function Composer() {
  return (
    <div className="flex flex-col h-[100dvh] bg-[#F7F5F0] text-[#1A1D1A] font-['Plus_Jakarta_Sans'] overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPane />
        <RightPane />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-[#E2E0D8] bg-[#F7F5F0] z-10 shadow-sm relative">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded bg-[#2A4D3B] text-[#F7F5F0] flex items-center justify-center font-['Fraunces'] font-bold text-xl leading-none">
          H
        </div>
        <h1 className="font-semibold text-lg flex items-center gap-3">
          Purchase Loan — CA Variant
          <span className="text-[10px] font-['Space_Mono'] tracking-wider uppercase px-2 py-1 rounded bg-[#E2E0D8] text-[#1A1D1A]/70">
            Draft
          </span>
        </h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#A0AFA6] animate-pulse"></div>
          <span className="text-xs font-['Space_Mono'] text-[#1A1D1A]/50">Saved just now</span>
        </div>
        <button className="bg-[#2A4D3B] hover:bg-[#1f3a2c] text-[#F7F5F0] px-5 py-2.5 rounded shadow-sm text-sm font-medium transition-colors">
          Publish Template
        </button>
      </div>
    </header>
  );
}

function LeftPane() {
  return (
    <div className="flex-1 w-[55%] overflow-y-auto p-12 lg:p-16 relative">
      <div className="max-w-3xl mx-auto space-y-2">
        <CollapsedSection num="01" title="Initial Application" desc="Basic borrower details and property intent." />
        <CollapsedSection num="02" title="Identity Verification" desc="Government ID and SSN collection." />
        
        <ActiveSection />
        
        <CollapsedSection num="04" title="Property Valuation" desc="Appraisal scheduling and reports." />
        <CollapsedSection num="05" title="Title & Escrow" desc="Vesting, preliminary title, and closing docs." />
        
        <button className="w-full mt-8 py-6 border-2 border-dashed border-[#E2E0D8] rounded-xl text-[#1A1D1A]/50 hover:text-[#1A1D1A] hover:border-[#1A1D1A]/30 hover:bg-white/30 transition-all flex flex-col items-center justify-center gap-2">
          <Plus className="w-6 h-6" />
          <span className="font-medium">Add section</span>
        </button>
      </div>
    </div>
  );
}

function RightPane() {
  return (
    <div className="w-[45%] bg-[#EFEDE7] border-l border-[#E2E0D8] flex flex-col relative overflow-y-auto shadow-inner">
      <div className="p-6 flex flex-col gap-8 items-center min-h-full py-12">
         <PreviewControls />
         <PhonePreview />
         <MiniRegister />
      </div>
    </div>
  );
}

function ActiveSection() {
  return (
    <div className="my-10 relative group">
      {/* Focus ring/marker */}
      <div className="absolute -left-8 top-0 bottom-0 w-1 bg-[#2A4D3B] rounded-full shadow-[0_0_8px_rgba(42,77,59,0.4)]" />
      <div className="absolute -inset-6 border border-[#2A4D3B]/10 bg-white/40 rounded-2xl -z-10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)]" />
      
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-4 items-baseline">
          <span className="font-['Fraunces'] text-3xl font-light text-[#2A4D3B]">03</span>
          <div>
            <h2 className="text-2xl font-semibold text-[#1A1D1A] tracking-tight">Income & Assets</h2>
            <p className="text-[#1A1D1A]/60 mt-1">Verify borrower's financial capacity and liquid reserves.</p>
          </div>
        </div>
        
        {/* AI margin annotation */}
        <div className="flex flex-col gap-2 p-3 bg-white border border-[#E2E0D8] rounded-lg shadow-sm text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[#1A1D1A]/70"><Brain className="w-3.5 h-3.5" /> Sorts incoming files</span>
            <div className="w-6 h-3.5 bg-[#2A4D3B] rounded-full relative cursor-pointer"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"/></div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[#1A1D1A]/70"><Shield className="w-3.5 h-3.5" /> Quality & fraud scan</span>
            <div className="w-6 h-3.5 bg-[#2A4D3B] rounded-full relative cursor-pointer"><div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full"/></div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#1A1D1A]/70 bg-white/60 p-2.5 rounded-lg border border-[#E2E0D8]/50 w-fit">
        <div className="flex -space-x-1.5 mr-2">
          <div className="w-6 h-6 rounded-full bg-[#F7F5F0] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#1A1D1A]/80 z-40">A</div>
          <div className="w-6 h-6 rounded-full bg-[#E2E0D8] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#1A1D1A]/80 z-30">O</div>
          <div className="w-6 h-6 rounded-full bg-[#2A4D3B] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white z-20">U</div>
          <div className="w-6 h-6 rounded-full bg-[#E2E0D8] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#1A1D1A]/80 z-10">M</div>
        </div>
        <span className="font-medium text-[#1A1D1A]">Applicant</span> uploads · <span className="font-medium text-[#1A1D1A]">Originator</span> uploads & edits · <span className="font-medium text-[#1A1D1A]">Underwriter</span> reviews · <span className="font-medium text-[#1A1D1A]">Manager</span> approves
      </div>

      <div className="space-y-3">
        <RequirementItem 
          name="Bank Statements — 3 Months"
          format=".PDF"
          req="Required"
          rule={{ base: "Must be newer than", token1: "90 days", warn: "30d", escalate: "7d" }}
        />
        <RequirementItem 
          name="Recent Pay Stubs"
          format=".PDF .JPG"
          req="Required"
          rule={{ base: "Must be newer than", token1: "30 days", warn: "14d", escalate: "3d" }}
        />
        <RequirementItem 
          name="W-2 Forms (Last 2 Years)"
          format=".PDF"
          req="Required"
        />
        
        <button className="mt-4 flex items-center gap-2 text-sm font-medium text-[#2A4D3B] hover:text-[#1f3a2c] py-2 px-4 hover:bg-[#2A4D3B]/5 rounded-md transition-colors ml-6">
          <Plus className="w-4 h-4" /> Add requirement
        </button>
      </div>
    </div>
  );
}

interface RuleType {
  base: string;
  token1: string;
  warn: string;
  escalate: string;
}

function RequirementItem({ name, format, req, rule }: { name: string, format: string, req: string, rule?: RuleType }) {
  return (
    <div className="group flex items-start gap-3 p-4 bg-white border border-[#E2E0D8] rounded-xl shadow-sm hover:border-[#2A4D3B]/30 hover:shadow-md transition-all cursor-default">
      <GripVertical className="w-5 h-5 text-[#1A1D1A]/20 mt-0.5 cursor-grab group-hover:text-[#1A1D1A]/40 transition-colors" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-medium text-[#1A1D1A]">{name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1D1A]/50 bg-[#E2E0D8]/50 px-1.5 py-0.5 rounded">{format}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B85C38] bg-[#B85C38]/10 px-1.5 py-0.5 rounded">{req}</span>
          </div>
        </div>
        
        {rule && (
          <div className="flex items-center gap-2 text-sm text-[#1A1D1A]/80 border-t border-[#E2E0D8]/50 pt-3">
            <Bell className="w-4 h-4 text-[#B85C38]" />
            <span className="leading-none text-[13px]">
              {rule.base}{' '}
              <span className="inline-block px-1.5 py-0.5 bg-[#EFEDE7] rounded text-xs font-['Space_Mono'] border border-[#E2E0D8] hover:border-[#2A4D3B] cursor-text transition-colors">{rule.token1}</span>
              {' '}— warn at{' '}
              <span className="inline-block px-1.5 py-0.5 bg-[#EFEDE7] rounded text-xs font-['Space_Mono'] border border-[#E2E0D8] hover:border-[#2A4D3B] cursor-text transition-colors">{rule.warn}</span>
              {', '}escalate at{' '}
              <span className="inline-block px-1.5 py-0.5 bg-[#EFEDE7] rounded text-xs font-['Space_Mono'] border border-[#E2E0D8] hover:border-[#2A4D3B] cursor-text transition-colors">{rule.escalate}</span>
              .
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function CollapsedSection({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex items-baseline gap-4 py-4 border-b border-[#E2E0D8]/60 hover:bg-[#1A1D1A]/[0.03] cursor-pointer rounded -mx-4 px-4 transition-colors">
      <span className="font-['Fraunces'] text-2xl font-light text-[#1A1D1A]/40">{num}</span>
      <div className="flex-1 flex justify-between items-center">
        <span className="text-lg font-medium text-[#1A1D1A]/80">{title}</span>
        <span className="text-sm text-[#1A1D1A]/50 max-w-[300px] truncate">{desc}</span>
      </div>
    </div>
  )
}

function PreviewControls() {
  return (
    <div className="w-full max-w-[500px] flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-[#E2E0D8] shadow-sm">
      <div className="flex p-1 bg-[#F7F5F0] rounded-lg border border-[#E2E0D8]/50">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#E2E0D8] text-sm font-medium text-[#1A1D1A]">
          <Smartphone className="w-4 h-4" /> Mobile form
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#1A1D1A]/60 hover:text-[#1A1D1A] transition-colors">
          <Monitor className="w-4 h-4" /> Desktop form
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#1A1D1A]/60 hover:text-[#1A1D1A] transition-colors">
          <Table className="w-4 h-4" /> Register
        </button>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-[#1A1D1A]/70 cursor-pointer hover:text-[#1A1D1A] transition-colors">
        <span>Previewing as: <strong className="text-[#1A1D1A] font-medium">Applicant</strong></span>
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  )
}

function PhonePreview() {
  return (
    <div className="relative mt-8">
      {/* Visual link cue to left pane */}
      <div className="mb-4 flex items-center justify-center gap-3 text-[10px] font-['Space_Mono'] uppercase tracking-wider text-[#2A4D3B] opacity-80">
        <div className="w-10 h-[1px] bg-[#2A4D3B]/40" />
        <span>Previewing: 03 Income & Assets</span>
        <div className="w-10 h-[1px] bg-[#2A4D3B]/40" />
      </div>

      <div className="w-[320px] h-[640px] bg-white rounded-[2.5rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] border-[8px] border-[#1A1D1A] overflow-hidden flex flex-col relative shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1A1D1A] rounded-b-xl z-20"></div>
        
        <div className="flex-1 bg-[#F7F5F0] overflow-y-auto px-5 pt-12 pb-6 flex flex-col hide-scrollbar relative">
          
          <div className="flex gap-1.5 mb-8">
            <div className="h-1 flex-1 bg-[#2A4D3B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#2A4D3B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#2A4D3B] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#E2E0D8] rounded-full"></div>
            <div className="h-1 flex-1 bg-[#E2E0D8] rounded-full"></div>
          </div>
          
          <span className="text-xs font-semibold tracking-wider uppercase text-[#1A1D1A]/50 mb-2">Step 3 of 5</span>
          <h3 className="font-['Fraunces'] text-[28px] text-[#1A1D1A] mb-3 leading-tight">Income &<br/>Assets</h3>
          <p className="text-[13px] text-[#1A1D1A]/60 mb-8 leading-relaxed">Only your Underwriter sees these documents. They are secured with bank-level encryption.</p>

          <div className="space-y-4 mb-8">
            {/* Soft card 1: Uploaded */}
            <div className="bg-white rounded-xl p-4 border border-[#2A4D3B]/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#2A4D3B]"></div>
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-medium text-sm text-[#1A1D1A]">Bank Statements</span>
                <CheckCircle2 className="w-4 h-4 text-[#2A4D3B]" />
              </div>
              <div className="text-xs text-[#1A1D1A]/50 mb-3">Last 3 months</div>
              
              <div className="flex items-center gap-2 p-2 bg-[#F7F5F0] rounded border border-[#E2E0D8]">
                <FileText className="w-4 h-4 text-[#2A4D3B]" />
                <span className="text-xs text-[#1A1D1A] truncate flex-1 font-['Space_Mono']">Chase_Checking_Oct.pdf</span>
              </div>
              
              <div className="mt-3 flex items-start gap-2 text-[10px] text-[#B85C38] bg-[#B85C38]/10 p-2.5 rounded-lg border border-[#B85C38]/20">
                <Bell className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="leading-snug">Bank statements must be from the last 90 days. We'll remind you if they get too old.</span>
              </div>
            </div>

            {/* Soft card 2: Empty */}
            <div className="bg-white/50 rounded-xl p-4 border border-dashed border-[#1A1D1A]/20 hover:border-[#2A4D3B]/40 hover:bg-white transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-medium text-sm text-[#1A1D1A] group-hover:text-[#2A4D3B] transition-colors">Recent Pay Stubs</span>
                <span className="text-[10px] font-bold uppercase text-[#B85C38] bg-[#B85C38]/10 px-1.5 py-0.5 rounded">Required</span>
              </div>
              <div className="text-xs text-[#1A1D1A]/50 mb-3">Last 30 days</div>
              
              <button className="w-full py-3 flex flex-col items-center justify-center gap-2 bg-white rounded border border-[#E2E0D8] text-[#1A1D1A]/60 group-hover:text-[#2A4D3B] group-hover:border-[#2A4D3B]/40 transition-colors shadow-sm">
                <UploadCloud className="w-5 h-5" />
                <span className="text-xs font-medium">Add file</span>
              </button>
            </div>
            
            {/* Soft card 3: Empty */}
            <div className="bg-white/50 rounded-xl p-4 border border-dashed border-[#1A1D1A]/20 hover:border-[#2A4D3B]/40 hover:bg-white transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-medium text-sm text-[#1A1D1A] group-hover:text-[#2A4D3B] transition-colors">W-2 Forms</span>
              </div>
              <div className="text-xs text-[#1A1D1A]/50 mb-3">Last 2 years</div>
              
              <button className="w-full py-3 flex flex-col items-center justify-center gap-2 bg-white rounded border border-[#E2E0D8] text-[#1A1D1A]/60 group-hover:text-[#2A4D3B] group-hover:border-[#2A4D3B]/40 transition-colors shadow-sm">
                <UploadCloud className="w-5 h-5" />
                <span className="text-xs font-medium">Add file</span>
              </button>
            </div>
          </div>

        </div>
        
        <div className="bg-white p-4 border-t border-[#E2E0D8] shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          <button className="w-full py-3.5 bg-[#2A4D3B] hover:bg-[#1f3a2c] transition-colors text-white rounded-lg text-sm font-medium shadow-md">
            Save and Continue
          </button>
        </div>
      </div>
    </div>
  )
}

function MiniRegister() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-[360px] opacity-70 hover:opacity-100 transition-opacity">
      <p className="text-[10px] font-bold text-[#1A1D1A]/40 tracking-widest uppercase">One definition · every view</p>
      
      <div className="w-full bg-white border border-[#E2E0D8] rounded-md shadow-sm overflow-hidden text-[9px] font-['Space_Mono']">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-[#E2E0D8] bg-[#F7F5F0] text-[#1A1D1A]/60 font-bold">
          <div className="col-span-5">REQUIREMENT</div>
          <div className="col-span-2">REQ</div>
          <div className="col-span-2">ROLE</div>
          <div className="col-span-3">RULE</div>
        </div>
        <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-[#E2E0D8]/50">
          <div className="col-span-5 truncate text-[#1A1D1A]">Bank Statements</div>
          <div className="col-span-2 text-[#B85C38]">Y</div>
          <div className="col-span-2">App</div>
          <div className="col-span-3 truncate text-[#B85C38]">90d/30d/7d</div>
        </div>
        <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-[#E2E0D8]/50">
          <div className="col-span-5 truncate text-[#1A1D1A]">Pay Stubs</div>
          <div className="col-span-2 text-[#B85C38]">Y</div>
          <div className="col-span-2">App</div>
          <div className="col-span-3 truncate text-[#B85C38]">30d/14d/3d</div>
        </div>
        <div className="grid grid-cols-12 gap-2 px-3 py-2">
          <div className="col-span-5 truncate text-[#1A1D1A]">W-2 Forms</div>
          <div className="col-span-2 text-[#B85C38]">Y</div>
          <div className="col-span-2">App</div>
          <div className="col-span-3 text-[#1A1D1A]/30">—</div>
        </div>
      </div>
    </div>
  )
}
