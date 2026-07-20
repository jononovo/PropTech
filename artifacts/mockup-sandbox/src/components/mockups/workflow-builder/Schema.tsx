import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Search, SlidersHorizontal, Settings, HelpCircle,
  Eye, Upload, PenLine, GripVertical, MoreHorizontal, Plus, Copy, Trash2, 
  Bot, ShieldCheck, Zap
} from 'lucide-react';
import './Schema.css';

export function Schema() {
  return (
    <div className="builder-theme min-h-screen flex flex-col h-screen overflow-hidden text-[13px]">
      {/* 1. Compact Top Bar (Template Mode) */}
      <header className="flex-none px-4 py-3 flex items-center justify-between border-b border-[var(--border-strong)] bg-[var(--bg-ground)] z-20">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-[var(--brand-green)] flex items-center justify-center rounded-[2px] shadow-sm">
            <span className="font-serif italic text-white text-lg leading-none mt-[2px]">H</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-lg font-medium text-[var(--ink-primary)]">Purchase Loan</h1>
            <span className="text-[var(--ink-secondary)] text-sm">— CA Variant</span>
            <span className="ml-2 px-2 py-0.5 rounded bg-[var(--warn-amber-light)] text-[var(--warn-amber)] text-[10px] font-bold tracking-widest uppercase">Template &middot; Draft</span>
          </div>
          
          <div className="h-4 w-[1px] bg-[var(--border-strong)] mx-2"></div>
          
          <div className="flex items-center gap-4 text-[12px] text-[var(--ink-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[var(--ink-primary)]">5</span> sections
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[var(--ink-primary)]">38</span> requirements
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[var(--ink-primary)]">12</span> rules
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Control */}
          <div className="flex bg-[#EBE9E3] p-0.5 rounded-[4px] border border-[var(--border-hairline)] shadow-inner">
            <button className="px-3 py-1 bg-white text-[var(--ink-primary)] font-medium text-[11px] rounded-[3px] shadow-sm">Define</button>
            <button className="px-3 py-1 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] text-[11px] font-medium rounded-[3px] transition-colors">Preview: Form</button>
            <button className="px-3 py-1 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] text-[11px] font-medium rounded-[3px] transition-colors">Preview: Register</button>
          </div>
          
          <div className="flex items-center gap-2 border-l border-[var(--border-strong)] pl-3">
            <span className="text-[11px] text-[var(--ink-muted)]">as</span>
            <button className="flex items-center gap-1 px-2 py-1 bg-white border border-[var(--border-hairline)] rounded-[3px] text-[11px] font-medium text-[var(--ink-primary)] shadow-sm">
              Originator <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]" />
            </button>
          </div>
          
          <button className="ml-2 h-8 px-4 bg-[var(--brand-green)] hover:bg-[#1E382B] text-white text-[12px] font-medium rounded-[3px] shadow-sm transition-colors flex items-center gap-2">
            Publish Template
          </button>
        </div>
      </header>

      {/* 2. The Sheet (Schema Mode) */}
      <main className="flex-1 overflow-auto bg-[var(--bg-ground)] relative">
        <table className="builder-table">
          <colgroup>
            <col style={{width: '28%'}} />
            <col style={{width: '12%'}} />
            <col style={{width: '18%'}} />
            <col style={{width: '24%'}} />
            <col style={{width: '12%'}} />
            <col style={{width: '6%'}} />
          </colgroup>
          <thead>
            <tr>
              <th className="builder-th">Requirement</th>
              <th className="builder-th">Produced By</th>
              <th className="builder-th">Access</th>
              <th className="builder-th">Freshness Rule</th>
              <th className="builder-th">AI</th>
              <th className="builder-th text-right px-4"></th>
            </tr>
          </thead>
          <tbody>
            
            {/* SECTION 01: Collapsed */}
            <tr className="builder-row is-section">
              <td colSpan={6} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors border-y border-[var(--border-strong)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[var(--ink-muted)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>01 Initial Application</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)] flex items-center gap-3">
                    <span><span className="font-mono text-[var(--ink-primary)]">8</span> requirements</span>
                    <span>·</span>
                    <span><span className="font-mono text-[var(--ink-primary)]">0</span> rules</span>
                    <span>·</span>
                    <span>Applicant-heavy</span>
                  </div>
                </div>
              </td>
            </tr>

            {/* Add Section Affordance */}
            <tr>
              <td colSpan={6} className="p-0">
                <div className="h-2 relative group flex items-center justify-center cursor-pointer">
                  <div className="absolute inset-0 bg-[var(--brand-green)] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="w-full h-px bg-[var(--brand-green)] opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  <div className="absolute bg-[var(--brand-green)] text-white text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 transform translate-y-[-0.5px]">
                    <Plus className="w-3 h-3" /> Add Section
                  </div>
                </div>
              </td>
            </tr>

            {/* SECTION 02: Open */}
            <tr className="builder-row is-section">
              <td colSpan={6} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[var(--ink-primary)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>02 Identity Verification</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)] flex items-center gap-3">
                    <span><span className="font-mono text-[var(--ink-primary)]">2</span> requirements</span>
                    <span>·</span>
                    <span><span className="font-mono text-[var(--ink-primary)]">1</span> rule</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="builder-row">
              <td className="builder-td">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink-primary)] border-b border-dashed border-[var(--ink-muted)] cursor-text">Government ID</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--warn-amber-light)] text-[var(--warn-amber)] font-medium">Req</span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-muted)] tracking-wider mt-0.5">.PDF, .JPG, .PNG</span>
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-4 h-4 rounded-full bg-[#E4E1DA] text-[8px] font-bold flex items-center justify-center text-[var(--ink-secondary)]">A</div>
                  <span className="text-[11px] font-medium">Applicant</span>
                </div>
              </td>
              <td className="builder-td relative">
                {/* Compact Access Cluster */}
                <div className="flex items-center gap-3 relative group">
                  <AccessCluster role="A" view upload edit active />
                  <AccessCluster role="O" view upload edit={false} />
                  <AccessCluster role="U" view upload={false} edit={false} />
                  <AccessCluster role="M" view upload={false} edit />
                  
                  {/* Statically rendered popover for demo */}
                  <div className="absolute left-0 top-full mt-2 w-56 popover-card bg-white border border-[var(--border-strong)] rounded shadow-lg z-50 p-2 text-[11px] hidden group-hover:block">
                    <div className="text-[10px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide border-b border-[var(--border-hairline)] pb-1 mb-1.5">Permissions</div>
                    <div className="space-y-1">
                      <PermissionRow role="Applicant" view upload edit />
                      <PermissionRow role="Originator" view upload />
                      <PermissionRow role="Underwriter" view />
                      <PermissionRow role="Manager" view edit />
                    </div>
                  </div>
                </div>
              </td>
              <td className="builder-td">
                <div className="font-mono text-[11px] px-2 py-1 rounded bg-[var(--bg-ground)] border border-[var(--border-hairline)] text-[var(--ink-secondary)] inline-flex items-center cursor-text">
                  ≤ 30d <span className="mx-1 text-[var(--border-strong)]">·</span> warn 7 <span className="mx-1 text-[var(--border-strong)]">·</span> esc 2
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-2">
                  <AIToggle icon={<Bot size={12}/>} active label="Alloc" />
                  <AIToggle icon={<ShieldCheck size={12}/>} active label="Scan" />
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center justify-end gap-2 text-[var(--ink-muted)]">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab hover:text-[var(--ink-primary)]" />
                  <MoreHorizontal className="w-3.5 h-3.5 cursor-pointer hover:text-[var(--ink-primary)]" />
                </div>
              </td>
            </tr>
            <tr className="builder-row">
              <td className="builder-td">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink-primary)] border-b border-dashed border-[var(--ink-muted)] cursor-text">SSN Card</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--brand-sage-light)] text-[var(--brand-sage)] font-medium">Opt</span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-muted)] tracking-wider mt-0.5">.PDF, .JPG</span>
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-4 h-4 rounded-full bg-[#E4E1DA] text-[8px] font-bold flex items-center justify-center text-[var(--ink-secondary)]">A</div>
                  <span className="text-[11px] font-medium">Applicant</span>
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-3 group relative cursor-pointer">
                  <AccessCluster role="A" view upload edit active />
                  <AccessCluster role="O" view upload edit={false} />
                  <AccessCluster role="U" view upload={false} edit={false} />
                  <AccessCluster role="M" view upload={false} edit />
                </div>
              </td>
              <td className="builder-td">
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">—</span>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-2">
                  <AIToggle icon={<Bot size={12}/>} active label="Alloc" />
                  <AIToggle icon={<ShieldCheck size={12}/>} active={false} label="Scan" />
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center justify-end gap-2 text-[var(--ink-muted)]">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab hover:text-[var(--ink-primary)]" />
                  <MoreHorizontal className="w-3.5 h-3.5 cursor-pointer hover:text-[var(--ink-primary)]" />
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={6} className="py-1.5 px-6 border-b border-[var(--border-hairline)] bg-transparent">
                <button className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] flex items-center gap-1.5 transition-colors opacity-70 hover:opacity-100">
                  <Plus className="w-3 h-3" /> Add requirement...
                </button>
              </td>
            </tr>

            {/* SECTION 03: Income & Assets */}
            <tr className="builder-row is-section">
              <td colSpan={6} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[var(--ink-primary)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>03 Income & Assets</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="builder-row">
              <td className="builder-td">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink-primary)] border-b border-dashed border-[var(--ink-muted)] cursor-text">W-2s (2024 + 2025)</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--warn-amber-light)] text-[var(--warn-amber)] font-medium">Req</span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-muted)] tracking-wider mt-0.5">.PDF</span>
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-4 h-4 rounded-full bg-[#D3E0D8] text-[8px] font-bold flex items-center justify-center text-[var(--brand-green)]">O</div>
                  <span className="text-[11px] font-medium">Originator</span>
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-3">
                  <AccessCluster role="A" view upload={false} edit={false} />
                  <AccessCluster role="O" view upload edit active />
                  <AccessCluster role="U" view upload={false} edit={false} />
                  <AccessCluster role="M" view upload={false} edit />
                </div>
              </td>
              <td className="builder-td">
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">—</span>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-2">
                  <AIToggle icon={<Bot size={12}/>} active label="Alloc" />
                  <AIToggle icon={<ShieldCheck size={12}/>} active label="Scan" />
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center justify-end gap-2 text-[var(--ink-muted)]">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab hover:text-[var(--ink-primary)]" />
                  <MoreHorizontal className="w-3.5 h-3.5 cursor-pointer hover:text-[var(--ink-primary)]" />
                </div>
              </td>
            </tr>

            {/* EXPANDED ROW: Bank Statements */}
            <tr className="builder-row is-expanded border-b-0 border-[var(--brand-green)] border-x-2">
              <td colSpan={6} className="p-0">
                <div className="flex flex-col bg-white">
                  {/* Standard Row Content in Expanded State */}
                  <div className="flex items-center bg-[var(--bg-hover)] border-b border-[var(--border-hairline)] relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--brand-green)]"></div>
                    <div className="w-[28%] px-3 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <input type="text" className="font-medium text-[var(--ink-primary)] bg-white border border-[var(--border-strong)] rounded px-1.5 py-0.5 focus:outline-none focus:border-[var(--brand-green)] w-full text-[13px]" defaultValue="Bank Statements — Last 3 Months" />
                        </div>
                      </div>
                    </div>
                    <div className="w-[12%] px-3 py-2">
                      <div className="flex items-center gap-1.5 cursor-pointer">
                        <div className="w-4 h-4 rounded-full bg-[#E4E1DA] text-[8px] font-bold flex items-center justify-center text-[var(--ink-secondary)]">A</div>
                        <span className="text-[11px] font-medium flex items-center gap-1">Applicant <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]"/></span>
                      </div>
                    </div>
                    <div className="w-[18%] px-3 py-2">
                      <div className="flex items-center gap-3">
                        <AccessCluster role="A" view upload edit active />
                        <AccessCluster role="O" view upload edit={false} />
                        <AccessCluster role="U" view upload={false} edit={false} />
                        <AccessCluster role="M" view upload={false} edit />
                      </div>
                    </div>
                    <div className="w-[24%] px-3 py-2">
                      <div className="font-mono text-[11px] px-2 py-1 rounded bg-white border border-[var(--brand-green)] text-[var(--ink-primary)] inline-flex items-center shadow-[0_0_0_1px_rgba(42,77,59,0.1)]">
                        ≤ 90d <span className="mx-1 text-[var(--border-strong)]">·</span> warn 30 <span className="mx-1 text-[var(--border-strong)]">·</span> esc 7
                      </div>
                    </div>
                    <div className="w-[12%] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <AIToggle icon={<Bot size={12}/>} active label="Alloc" />
                        <AIToggle icon={<ShieldCheck size={12}/>} active label="Scan" />
                      </div>
                    </div>
                    <div className="w-[6%] px-4 py-2 flex justify-end">
                      <button className="bg-white border border-[var(--border-strong)] rounded-[3px] p-1 shadow-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--brand-green)]">
                        <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Panel */}
                  <div className="flex gap-6 p-5 border-b border-[var(--border-strong)] bg-white ml-0.5">
                    {/* Left Col: Rule & Acceptance */}
                    <div className="w-[60%] flex flex-col gap-6">
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-[var(--ink-secondary)] uppercase tracking-widest">Freshness Rule</label>
                        <div className="p-3 bg-[var(--bg-ground)] border border-[var(--border-hairline)] rounded flex flex-col gap-2">
                          <p className="text-[12px] text-[var(--ink-primary)] leading-relaxed flex flex-wrap items-center gap-1.5">
                            Must be newer than 
                            <input type="text" className="font-mono text-[11px] w-8 text-center bg-white border border-[var(--border-strong)] rounded py-0.5 focus:border-[var(--brand-green)] focus:outline-none" defaultValue="90" />
                            days — warn at 
                            <input type="text" className="font-mono text-[11px] w-9 text-center bg-white border border-[var(--border-strong)] rounded py-0.5 focus:border-[var(--brand-green)] focus:outline-none" defaultValue="30d" />
                            , escalate at 
                            <input type="text" className="font-mono text-[11px] w-8 text-center bg-white border border-[var(--border-strong)] rounded py-0.5 focus:border-[var(--brand-green)] focus:outline-none" defaultValue="7d" />
                            , then inadmissible.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold text-[var(--ink-secondary)] uppercase tracking-widest">Acceptance Notes</label>
                          <span className="text-[10px] text-[var(--ink-muted)]">Visible to Applicant</span>
                        </div>
                        <textarea 
                          className="w-full text-[12px] text-[var(--ink-primary)] p-2.5 bg-white border border-[var(--border-strong)] rounded resize-none focus:outline-none focus:border-[var(--brand-green)] h-20"
                          defaultValue="All pages, all accounts named on the application; statements must show account number and holder name."
                        />
                      </div>

                    </div>

                    {/* Right Col: Permissions & Formats */}
                    <div className="w-[40%] flex flex-col gap-6 pl-6 border-l border-[var(--border-hairline)]">
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold text-[var(--ink-secondary)] uppercase tracking-widest">Access Matrix</label>
                          <HelpCircle className="w-3 h-3 text-[var(--ink-muted)]" />
                        </div>
                        <div className="border border-[var(--border-hairline)] rounded overflow-hidden">
                          <table className="w-full text-[11px] text-left">
                            <thead className="bg-[var(--bg-ground)] border-b border-[var(--border-hairline)]">
                              <tr>
                                <th className="py-1 px-2 font-medium text-[var(--ink-secondary)] w-1/2">Role</th>
                                <th className="py-1 px-1 font-medium text-center" title="View"><Eye className="w-3 h-3 mx-auto text-[var(--ink-muted)]"/></th>
                                <th className="py-1 px-1 font-medium text-center" title="Upload"><Upload className="w-3 h-3 mx-auto text-[var(--ink-muted)]"/></th>
                                <th className="py-1 px-1 font-medium text-center" title="Edit"><PenLine className="w-3 h-3 mx-auto text-[var(--ink-muted)]"/></th>
                              </tr>
                            </thead>
                            <tbody>
                              <PermissionMatrixRow role="Applicant" view upload edit active />
                              <PermissionMatrixRow role="Originator" view upload edit={false} />
                              <PermissionMatrixRow role="Underwriter" view upload={false} edit={false} />
                              <PermissionMatrixRow role="Manager" view upload={false} edit />
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-[var(--ink-secondary)] uppercase tracking-widest">Accepted Formats</label>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-ground)] border border-[var(--border-strong)] rounded text-[10px] font-mono font-medium">.PDF <button className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]">×</button></span>
                          <span className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-ground)] border border-[var(--border-strong)] rounded text-[10px] font-mono font-medium">.JPG <button className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)]">×</button></span>
                          <button className="px-2 py-1 bg-white border border-[var(--border-hairline)] border-dashed rounded text-[10px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:border-[var(--ink-primary)] transition-colors">+ Add</button>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 flex justify-end gap-3 border-t border-[var(--border-hairline)]">
                        <button className="text-[11px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-ground)] transition-colors">
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        <button className="text-[11px] font-medium text-[var(--alert-clay)] hover:text-white flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--alert-clay)] transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </td>
            </tr>

            {/* Ghost Row */}
            <tr>
              <td colSpan={6} className="py-1.5 px-6 border-b border-[var(--border-hairline)] bg-transparent">
                <button className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] flex items-center gap-1.5 transition-colors opacity-70 hover:opacity-100">
                  <Plus className="w-3 h-3" /> Add requirement...
                </button>
              </td>
            </tr>

            {/* SECTION 04: Property Valuation (Open) */}
            <tr className="builder-row is-section">
              <td colSpan={6} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[var(--ink-primary)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>04 Property Valuation</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)] flex items-center gap-3">
                    <span><span className="font-mono text-[var(--ink-primary)]">1</span> requirement</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="builder-row">
              <td className="builder-td">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink-primary)] border-b border-dashed border-[var(--ink-muted)] cursor-text">Appraisal Report</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--warn-amber-light)] text-[var(--warn-amber)] font-medium">Req</span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-muted)] tracking-wider mt-0.5">.PDF</span>
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-4 h-4 rounded-full bg-[#E2E1EA] text-[8px] font-bold flex items-center justify-center text-[#4A4384]">U</div>
                  <span className="text-[11px] font-medium">Underwriter</span>
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-3">
                  <AccessCluster role="A" view upload={false} edit={false} active={false} />
                  <AccessCluster role="O" view upload edit={false} />
                  <AccessCluster role="U" view upload edit active />
                  <AccessCluster role="M" view upload={false} edit />
                </div>
              </td>
              <td className="builder-td">
                <div className="font-mono text-[11px] px-2 py-1 rounded bg-[var(--bg-ground)] border border-[var(--border-hairline)] text-[var(--ink-secondary)] inline-flex items-center cursor-text">
                  ≤ 120d <span className="mx-1 text-[var(--border-strong)]">·</span> warn 45 <span className="mx-1 text-[var(--border-strong)]">·</span> esc 14
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center gap-2">
                  <AIToggle icon={<Bot size={12}/>} active={false} label="Alloc" />
                  <AIToggle icon={<ShieldCheck size={12}/>} active label="Scan" />
                </div>
              </td>
              <td className="builder-td">
                <div className="flex items-center justify-end gap-2 text-[var(--ink-muted)]">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab hover:text-[var(--ink-primary)]" />
                  <MoreHorizontal className="w-3.5 h-3.5 cursor-pointer hover:text-[var(--ink-primary)]" />
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={6} className="py-1.5 px-6 border-b border-[var(--border-hairline)] bg-transparent">
                <button className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] flex items-center gap-1.5 transition-colors opacity-70 hover:opacity-100">
                  <Plus className="w-3 h-3" /> Add requirement...
                </button>
              </td>
            </tr>

            {/* SECTION 05: Collapsed */}

          </tbody>
        </table>
      </main>

      {/* 3. Footer Status Bar */}
      <footer className="flex-none h-8 px-4 flex items-center justify-between border-t border-[var(--border-strong)] bg-[var(--bg-ground)] text-[11px] text-[var(--ink-secondary)] z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-sage)]"></div> 38 requirements</span>
          <span>·</span>
          <span>5 sections</span>
          <span>·</span>
          <span>last edited by Eleanor R.</span>
          <span>·</span>
          <span className="font-mono">2 min ago</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">Press <kbd className="font-mono px-1 py-0.5 rounded bg-white border border-[var(--border-strong)] text-[9px] shadow-sm">/</kbd> to search</span>
          <span className="flex items-center gap-1.5">Enter <kbd className="font-mono px-1 py-0.5 rounded bg-white border border-[var(--border-strong)] text-[9px] shadow-sm">↵</kbd> to expand</span>
        </div>
      </footer>
    </div>
  );
}

// Subcomponents for cleanliness

function AccessCluster({ role, view, upload, edit, active }: { role: string, view?: boolean, upload?: boolean, edit?: boolean, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${active ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition-opacity`}>
      <span className="text-[9px] font-bold text-[var(--ink-primary)] leading-none">{role}</span>
      <div className="flex gap-0.5">
        <div className={`w-[3px] h-[3px] rounded-full ${view ? 'bg-[var(--brand-sage)]' : 'bg-transparent border border-[var(--border-strong)] opacity-30'}`} title="View"></div>
        <div className={`w-[3px] h-[3px] rounded-full ${upload ? 'bg-[var(--brand-sage)]' : 'bg-transparent border border-[var(--border-strong)] opacity-30'}`} title="Upload"></div>
        <div className={`w-[3px] h-[3px] rounded-full ${edit ? 'bg-[var(--brand-sage)]' : 'bg-transparent border border-[var(--border-strong)] opacity-30'}`} title="Edit"></div>
      </div>
    </div>
  );
}

function PermissionRow({ role, view, upload, edit }: { role: string, view?: boolean, upload?: boolean, edit?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[var(--border-hairline)] last:border-0">
      <span className="font-medium text-[var(--ink-primary)]">{role}</span>
      <div className="flex items-center gap-2 text-[var(--ink-muted)]">
        {view ? <Eye className="w-3 h-3 text-[var(--brand-sage)]" /> : <div className="w-3 h-3"></div>}
        {upload ? <Upload className="w-3 h-3 text-[var(--brand-sage)]" /> : <div className="w-3 h-3"></div>}
        {edit ? <PenLine className="w-3 h-3 text-[var(--brand-sage)]" /> : <div className="w-3 h-3"></div>}
      </div>
    </div>
  );
}

function PermissionMatrixRow({ role, view, upload, edit, active }: { role: string, view?: boolean, upload?: boolean, edit?: boolean, active?: boolean }) {
  return (
    <tr className={`border-b border-[var(--border-hairline)] last:border-0 ${active ? 'bg-[var(--brand-sage-light)] bg-opacity-30' : 'bg-white'}`}>
      <td className="py-1.5 px-2 font-medium text-[var(--ink-primary)]">{role}</td>
      <td className="py-1.5 px-1 text-center">
        <input type="checkbox" checked={view} className="accent-[var(--brand-green)] w-3 h-3" readOnly />
      </td>
      <td className="py-1.5 px-1 text-center">
        <input type="checkbox" checked={upload} className="accent-[var(--brand-green)] w-3 h-3" readOnly />
      </td>
      <td className="py-1.5 px-1 text-center">
        <input type="checkbox" checked={edit} className="accent-[var(--brand-green)] w-3 h-3" readOnly />
      </td>
    </tr>
  );
}

function AIToggle({ icon, active, label }: { icon: React.ReactNode, active: boolean, label: string }) {
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${active ? 'bg-[#E8EDF5] text-[#4A649C] border border-[#C6D4EA]' : 'bg-[var(--bg-ground)] text-[var(--ink-muted)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)]'}`} title={label}>
      {icon}
    </div>
  );
}
