import React from 'react';
import {
  Check,
  X,
  AlertTriangle,
  FileText,
  ChevronDown,
  Link2,
  Clock,
  User,
  Building,
  Search,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';

export function DocumentDocket() {
  return (
    <div className="flex h-screen w-full bg-[#F3F5F7] text-[#334155] font-sans antialiased overflow-hidden">
      <LeftRail />
      <CenterView />
      <RightRail />
    </div>
  );
}

const LeftRail = () => {
  return (
    <div className="w-[320px] shrink-0 bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-[#E2E8F0] bg-[#FFFFFF] shadow-sm z-10">
        <span className="font-semibold text-[#0F172A]">Docket</span>
        <span className="ml-auto text-[#64748B] text-[11px] font-mono bg-[#F3F5F7] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
          9 pages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Loan Application */}
        <RequirementGroup title="Loan Application">
          <DocketItem
            title="URLA Form 1003"
            pages="p. 1"
            status="approved"
            colorHex="#6366F1"
            isLast={true}
          />
        </RequirementGroup>

        {/* Bank statements */}
        <RequirementGroup title="Bank statements" subtitle="Chase ····4821">
          <DocketItem
            title="Bank statement — Jan 2026"
            pages="pp. 2–3"
            status="incomplete"
            colorHex="#10B981"
            isLast={false}
          />
          <DocketItem
            title="Bank statement — Feb 2026"
            pages="pp. 6–8"
            status="in-review"
            active={true}
            colorHex="#10B981"
            isLast={true}
          />
        </RequirementGroup>

        {/* Government ID */}
        <RequirementGroup title="Government ID" subtitle="M. Torres">
          <div className="relative bg-[#FFFFFF]">
            {/* Merge bracket */}
            <div className="absolute left-[15px] top-[24px] bottom-[24px] w-[12px] border-l border-y border-[#CBD5E1] rounded-l-sm z-0" />
            <div
              className="absolute left-[8px] top-1/2 -mt-2.5 bg-[#FFFFFF] border border-[#CBD5E1] rounded-sm shadow-sm text-[#64748B] z-10 flex items-center justify-center w-5 h-5 cursor-pointer hover:text-[#0F172A] hover:border-[#94A3B8]"
              title="Merge into one document"
            >
              <Link2 size={12} />
            </div>

            <DocketItem
              title="Driver's license (front)"
              pages="p. 4"
              status="pending"
              colorHex="#F59E0B"
              isLast={false}
              mergeIndent
            />
            <DocketItem
              title="Driver's license (back)"
              pages="p. 5"
              status="pending"
              colorHex="#F59E0B"
              isLast={true}
              mergeIndent
            />
          </div>
        </RequirementGroup>

        {/* Income */}
        <RequirementGroup title="Income">
          <DocketItem
            title="Pay stub — Acme Corp"
            pages="p. 9"
            status="pending"
            colorHex="#8B5CF6"
            isLast={true}
          />
        </RequirementGroup>
      </div>
    </div>
  );
};

const RequirementGroup = ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <div className="px-4 mb-2 flex items-baseline justify-between">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B]">{title}</div>
      {subtitle && (
        <div className="text-[10px] text-[#0F172A] font-mono bg-[#E2E8F0] px-1.5 py-0.5 rounded">
          {subtitle}
        </div>
      )}
    </div>
    <div className="border-y border-[#E2E8F0] flex flex-col">
      {children}
    </div>
  </div>
);

const DocketItem = ({
  title,
  pages,
  status,
  active,
  colorHex,
  isLast,
  mergeIndent
}: {
  title: string;
  pages: string;
  status: string;
  active?: boolean;
  colorHex: string;
  isLast: boolean;
  mergeIndent?: boolean;
}) => (
  <div
    className={`
      relative px-4 py-3 flex flex-col gap-1.5 cursor-pointer transition-colors
      ${active ? 'bg-[#EFF6FF] shadow-[inset_2px_0_0_0_#1D4ED8]' : 'bg-[#FFFFFF] hover:bg-[#F8FAFC]'}
      ${!isLast ? 'border-b border-[#E2E8F0]' : ''}
    `}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#1D4ED8]" />}

    <div className={`flex items-start justify-between ${mergeIndent ? 'pl-6' : ''}`}>
      <div className="flex items-center gap-2 font-medium text-[#0F172A] truncate pr-2">
        <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ backgroundColor: colorHex }} />
        <span className="truncate text-[12px]">{title}</span>
      </div>
      <StatusIcon status={status} />
    </div>

    <div className={`flex justify-between items-center text-[11px] text-[#64748B] ${mergeIndent ? 'pl-6' : ''}`}>
      <span className="font-mono">{pages}</span>
      {status === 'approved' && <span className="text-[#15803D]">Approved</span>}
      {status === 'incomplete' && <span className="text-[#B45309]">Incomplete</span>}
      {status === 'in-review' && <span className="text-[#1D4ED8] font-medium">In Review</span>}
      {status === 'pending' && <span className="text-[#94A3B8]">Pending</span>}
    </div>
  </div>
);

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'approved') return <CheckCircle2 size={14} className="text-[#15803D] shrink-0" />;
  if (status === 'incomplete') return <AlertTriangle size={14} className="text-[#B45309] shrink-0" />;
  if (status === 'in-review') return <div className="w-2 h-2 rounded-full bg-[#1D4ED8] ring-4 ring-[#EFF6FF] shrink-0 mr-1" />;
  if (status === 'rejected') return <X size={14} className="text-[#B91C1C] shrink-0" />;
  return <div className="w-3 h-3 rounded-full border-2 border-[#CBD5E1] shrink-0" />; // pending
};

const CenterView = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F3F5F7] h-full">
      <div className="h-12 flex items-center px-4 border-b border-[#E2E8F0] bg-[#FFFFFF] shrink-0 justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-[#64748B]" />
          <h2 className="font-medium text-[#0F172A] text-[13px]">Bank statement — Feb 2026</h2>
          <div className="h-4 w-px bg-[#E2E8F0]" />
          <span className="text-[#64748B] text-[12px] font-mono">pp. 6–8</span>
        </div>
        <div className="flex gap-2">
          <button className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded border border-transparent hover:border-[#E2E8F0] transition-colors">
            <Search size={14} />
          </button>
          <button className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded border border-transparent hover:border-[#E2E8F0] transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12 flex flex-col items-center">
        <FakePage pageNum={6} decision="reject" date="Feb 01–28, 2026" account="Chase ····4821" />
        <FakePage pageNum={7} decision="reject" date="Feb 01–28, 2026" account="Chase ····4821" />
        <FakePage pageNum={8} decision="approve" date="Feb 01–28, 2026" account="Chase ····4821" />
      </div>
    </div>
  );
};

const FakePage = ({
  pageNum,
  decision,
  date,
  account
}: {
  pageNum: number;
  decision: string;
  date: string;
  account: string;
}) => {
  return (
    <div
      className={`
        w-[640px] h-[820px] bg-[#FFFFFF] shadow-sm flex flex-col relative shrink-0 transition-colors
        ${decision === 'reject' ? 'border-2 border-[#FECACA]' : decision === 'approve' ? 'border-2 border-[#BBF7D0]' : 'border border-[#E2E8F0]'}
      `}
    >
      {/* Header */}
      <div className="px-10 pt-10 pb-6 border-b border-[#F8FAFC] flex justify-between items-start">
        <div>
          <div className="text-2xl font-bold text-[#0F172A] tracking-tighter">CHASE</div>
          <div className="text-[11px] text-[#94A3B8] mt-1 font-mono uppercase tracking-widest">
            JPMorgan Chase Bank
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-semibold text-[#334155] uppercase tracking-wider">
            Statement of Account
          </div>
          <div className="text-[12px] text-[#64748B] font-mono mt-1">{date}</div>
          <div className="text-[12px] text-[#0F172A] font-mono mt-1">{account}</div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-10 space-y-8 flex-1 opacity-60">
        <div className="space-y-3">
          <div className="h-2.5 bg-[#F3F5F7] w-1/3 rounded" />
          <div className="h-2.5 bg-[#F3F5F7] w-1/4 rounded" />
        </div>

        {/* Table fake */}
        <div className="border border-[#F8FAFC] rounded">
          <div className="bg-[#F8FAFC] p-4 flex justify-between border-b border-[#F3F5F7]">
            <div className="h-2 bg-[#CBD5E1] w-24 rounded" />
            <div className="h-2 bg-[#CBD5E1] w-16 rounded" />
          </div>
          <div className="p-4 space-y-5">
            <div className="flex justify-between items-center">
              <div className="h-2 bg-[#E2E8F0] w-32 rounded" />
              <div className="h-2 bg-[#E2E8F0] w-12 rounded" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-2 bg-[#E2E8F0] w-48 rounded" />
              <div className="h-2 bg-[#E2E8F0] w-16 rounded" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-2 bg-[#E2E8F0] w-20 rounded" />
              <div className="h-2 bg-[#E2E8F0] w-14 rounded" />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <div className="h-2 bg-[#F8FAFC] w-full rounded" />
          <div className="h-2 bg-[#F8FAFC] w-full rounded" />
          <div className="h-2 bg-[#F8FAFC] w-5/6 rounded" />
        </div>
      </div>

      {/* Page inline decision controls */}
      <div
        className={`
          absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center p-1.5 rounded-full border shadow-lg backdrop-blur-md
          ${decision === 'approve' ? 'bg-[#F0FDF4]/90 border-[#BBF7D0]' : decision === 'reject' ? 'bg-[#FEF2F2]/90 border-[#FECACA]' : 'bg-[#FFFFFF]/90 border-[#E2E8F0]'}
        `}
      >
        <button
          className={`
            flex items-center justify-center w-10 h-10 rounded-full transition-colors
            ${decision === 'approve' ? 'bg-[#15803D] text-[#FFFFFF]' : 'text-[#64748B] hover:bg-[#F3F5F7] hover:text-[#0F172A]'}
          `}
          title="Approve page"
        >
          <Check size={20} />
        </button>
        <div className="w-px h-6 bg-[#CBD5E1] mx-2" />
        <span className="px-3 text-[13px] font-mono font-medium text-[#0F172A]">p. {pageNum}</span>
        <div className="w-px h-6 bg-[#CBD5E1] mx-2" />
        <button
          className={`
            flex items-center justify-center w-10 h-10 rounded-full transition-colors
            ${decision === 'reject' ? 'bg-[#B91C1C] text-[#FFFFFF]' : 'text-[#64748B] hover:bg-[#F3F5F7] hover:text-[#0F172A]'}
          `}
          title="Reject page"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

const RightRail = () => {
  return (
    <div className="w-[340px] shrink-0 bg-[#FFFFFF] border-l border-[#E2E8F0] flex flex-col h-full shadow-[-4px_0_12px_rgba(0,0,0,0.02)] z-20">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <span className="font-semibold text-[#0F172A]">Roll-up Action</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 border-b border-[#E2E8F0]">
          <div className="text-[11px] font-mono text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded inline-flex mb-4">
            Document Group
          </div>
          <h3 className="text-[15px] font-semibold text-[#0F172A] leading-snug mb-5">
            Add this statement (pp. 6–8) to <span className="font-mono bg-[#F3F5F7] px-1 rounded border border-[#E2E8F0]">Chase ····4821</span> of Bank statements?
          </h3>

          <div className="space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-4 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] flex items-center gap-2"><FileText size={14} /> Type</span>
              <span className="text-[#0F172A] font-medium">Bank statement</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] flex items-center gap-2"><Building size={14} /> Institution</span>
              <span className="text-[#0F172A] font-medium">JPMorgan Chase</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] flex items-center gap-2"><Clock size={14} /> Period</span>
              <span className="text-[#0F172A] font-mono">Feb 2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] flex items-center gap-2"><User size={14} /> Name</span>
              <span className="text-[#0F172A] font-medium">M. Torres</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          <label className="block text-[12px] font-semibold text-[#334155] mb-2">Variant Assignment</label>
          <button className="w-full flex items-center justify-between bg-[#FFFFFF] border border-[#CBD5E1] rounded px-3 py-2.5 text-[13px] hover:border-[#94A3B8] shadow-sm mb-6 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="font-mono text-[#0F172A]">Chase ····4821</span>
            </div>
            <ChevronDown size={14} className="text-[#64748B]" />
          </button>

          <div className="mb-6">
            <h4 className="text-[12px] font-semibold text-[#334155] mb-2">Page Decisions (3)</h4>
            <div className="flex gap-0.5 mb-2 h-2">
              <div className="flex-1 bg-[#FECACA] rounded-l-[1px]" title="p. 6 - Rejected" />
              <div className="flex-1 bg-[#FECACA]" title="p. 7 - Rejected" />
              <div className="flex-1 bg-[#BBF7D0] rounded-r-[1px]" title="p. 8 - Approved" />
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <AlertTriangle size={14} className="text-[#B45309]" />
              <span className="text-[#B45309] font-medium">2 of 3 pages rejected</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] rounded font-semibold text-[13px] flex items-center justify-center gap-2 cursor-not-allowed">
              <Check size={16} />
              Approve full document
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]"></div></div>
              <div className="relative flex justify-center">
                <span className="bg-[#FFFFFF] px-2 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Exception Required
                </span>
              </div>
            </div>

            <button className="w-full py-2.5 px-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded font-semibold text-[13px] hover:bg-[#FEF3C7] flex flex-col items-center justify-center gap-0.5 transition-colors shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>Approve anyway & mark INCOMPLETE</span>
              </div>
              <span className="text-[11px] opacity-80 font-normal">Triggers new version request</span>
            </button>

            <button className="w-full py-2.5 px-3 bg-[#FFFFFF] border border-[#FECACA] text-[#B91C1C] rounded font-semibold text-[13px] hover:bg-[#FEF2F2] transition-colors shadow-sm">
              Reject document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
