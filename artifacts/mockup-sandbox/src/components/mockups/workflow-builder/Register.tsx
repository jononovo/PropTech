import React from 'react';
import { 
  Search, SlidersHorizontal, Download, ChevronRight, ChevronDown,
  CheckCircle2, AlertCircle, Clock, Check, MoreHorizontal,
  ArrowRight, FileText, MoveRight, HelpCircle, Expand, Bell, Plus, Users, User, Info
} from 'lucide-react';
import './Register.css';

export function Register() {
  return (
    <div className="register-theme min-h-screen flex flex-col h-screen overflow-hidden text-[13px]">
      {/* 1. Compact Top Bar */}
      <header className="flex-none px-4 py-3 flex items-center justify-between border-b border-[var(--border-strong)] bg-[var(--bg-ground)] z-20">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-[var(--brand-green)] flex items-center justify-center rounded-[2px] shadow-sm">
            <span className="font-serif italic text-white text-lg leading-none mt-[2px]">H</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-lg font-medium text-[var(--ink-primary)]">Maria Delgado-Reyes</h1>
            <span className="text-[var(--ink-secondary)] text-sm">— Purchase Loan, CA Variant</span>
            <span className="ml-2 px-2 py-0.5 rounded bg-[var(--brand-green-light)] text-[var(--brand-green)] text-[11px] font-medium tracking-wide uppercase">In Review</span>
          </div>
          
          <div className="h-4 w-[1px] bg-[var(--border-strong)] mx-2"></div>
          
          <div className="flex items-center gap-4 text-[12px] text-[var(--ink-secondary)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-green)]" />
              <span className="font-mono text-[var(--ink-primary)]">31/38</span> docs
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--warn-amber)]" />
              Next deadline <span className="font-mono text-[var(--ink-primary)]">6d</span>
            </span>
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--alert-clay)]" />
              <span className="font-mono text-[var(--ink-primary)]">3</span> flags
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input 
              type="text" 
              placeholder="Find any document, person, or action..." 
              className="w-64 h-8 pl-8 pr-3 bg-white border border-[var(--border-hairline)] rounded-[3px] text-[12px] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--brand-green)] transition-colors shadow-sm"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5">
              <kbd className="font-mono text-[9px] px-1 py-0.5 bg-[var(--bg-ground)] border border-[var(--border-hairline)] rounded text-[var(--ink-muted)]">/</kbd>
            </div>
          </div>
          <button className="h-8 w-8 flex items-center justify-center border border-[var(--border-hairline)] bg-white rounded-[3px] text-[var(--ink-secondary)] hover:bg-[var(--bg-zebra)] shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button className="h-8 px-4 bg-[var(--brand-green)] hover:bg-[#1E382B] text-white text-[12px] font-medium rounded-[3px] shadow-sm transition-colors flex items-center gap-2">
            Request 4 missing
          </button>
        </div>
      </header>

      {/* 2. Summary Strip */}
      <div className="flex-none px-4 py-2 flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-ground)] text-[11px] font-medium tracking-wide uppercase text-[var(--ink-secondary)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--success-green)]"></div><span className="font-mono text-[var(--ink-primary)]">31</span> REC</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--border-strong)]"></div><span className="font-mono text-[var(--ink-primary)]">4</span> MIS</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--alert-clay)]"></div><span className="font-mono text-[var(--ink-primary)]">3</span> FLG</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--warn-amber)]"></div><span className="font-mono text-[var(--ink-primary)]">2</span> EXP</div>
          </div>
          <div className="w-[1px] h-3 bg-[var(--border-strong)]"></div>
          <div className="flex items-center gap-2 w-32">
            <div className="flex-1 h-1 bg-[var(--border-strong)] rounded-full overflow-hidden flex">
              <div className="bg-[var(--success-green)] h-full" style={{width: '81%'}}></div>
              <div className="bg-[var(--alert-clay)] h-full" style={{width: '8%'}}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[var(--ink-muted)]">ALARM BELLS</span>
          <div className="flex gap-2">
            <div className="px-2 py-0.5 rounded border border-[var(--warn-amber)] bg-[var(--warn-amber-light)] text-[var(--warn-amber)] flex items-center gap-1">
              <span className="font-mono">7d</span> Bank Stmts
            </div>
            <div className="px-2 py-0.5 rounded border border-[var(--alert-clay)] bg-[var(--alert-clay-light)] text-[var(--alert-clay)] flex items-center gap-1">
              <span className="font-mono">30d</span> Gov ID
            </div>
            <div className="px-2 py-0.5 rounded border border-[var(--success-green)] bg-[var(--success-green-light)] text-[var(--success-green)] flex items-center gap-1 opacity-70">
              <span className="font-mono">90d</span> Appraisal
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Sheet */}
      <main className="flex-1 overflow-auto bg-[var(--bg-ground)] relative">
        <table className="sheet-table">
          <colgroup>
            <col style={{width: '24%'}} />
            <col style={{width: '14%'}} />
            <col style={{width: '10%'}} />
            <col style={{width: '5%'}} />
            <col style={{width: '7%'}} />
            <col style={{width: '7%'}} />
            <col style={{width: '8%'}} />
            <col style={{width: '25%'}} />
          </colgroup>
          <thead>
            <tr>
              <th className="sheet-th group cursor-pointer">
                <div className="flex items-center gap-1">Requirement <ChevronDown className="w-3 h-3 text-[var(--ink-primary)]" /></div>
              </th>
              <th className="sheet-th">Owner</th>
              <th className="sheet-th">Status</th>
              <th className="sheet-th">Pgs</th>
              <th className="sheet-th">Quality</th>
              <th className="sheet-th">Fraud</th>
              <th className="sheet-th">Fresh</th>
              <th className="sheet-th">Next Action</th>
            </tr>
          </thead>
          <tbody>
            
            {/* SECTION 01: Collapsed */}
            <tr className="sheet-row is-section">
              <td colSpan={8} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[var(--ink-muted)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>01 Initial Application</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)] flex items-center gap-3">
                    <span><span className="font-mono text-[var(--ink-primary)]">8/8</span> received</span>
                    <span>·</span>
                    <span><span className="font-mono text-[var(--success-green)]">0</span> flagged</span>
                    <span>·</span>
                    <span>earliest deadline <span className="font-mono text-[var(--ink-primary)]">May 21</span></span>
                  </div>
                </div>
              </td>
            </tr>

            {/* SECTION 02: Open */}
            <tr className="sheet-row is-section">
              <td colSpan={8} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[var(--ink-primary)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>02 Identity Verification</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="sheet-row">
              <td className="sheet-td">
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--ink-primary)]">Government ID</span>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">PDF, JPG, PNG • Applicant</span>
                </div>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-2 group cursor-default relative">
                  <div className="w-5 h-5 rounded bg-[#E4E1DA] text-[10px] font-medium flex items-center justify-center text-[var(--ink-secondary)] shadow-[0_0_0_2px_var(--bg-surface)]">MD</div>
                  <span className="text-[12px] truncate font-medium underline decoration-[var(--border-strong)] underline-offset-2">Applicant</span>
                  {/* Micro-legend Popover (Statically Visible for Demo) */}
                  <div className="absolute left-0 top-full mt-1 flex items-center gap-1.5 px-2 py-1 bg-[var(--ink-primary)] text-white text-[10px] rounded shadow-sm whitespace-nowrap z-50">
                    <span className="flex items-center gap-1 opacity-80"><Users className="w-3 h-3"/> View</span>
                    <span className="opacity-40">|</span>
                    <span className="flex items-center gap-1"><UploadIcon /> Upload</span>
                  </div>
                </div>
              </td>
              <td className="sheet-td">
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--warn-amber-light)] text-[var(--warn-amber)] text-[10px] font-medium uppercase border border-[var(--warn-amber)]">Expiring</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-secondary)]">2</td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">98</span>
              </td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">99</span>
              </td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--alert-clay-light)] text-[var(--alert-clay)] px-1.5 py-0.5 rounded border border-[var(--alert-clay-muted)]">12d</span>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <button className="text-[var(--brand-green)] hover:underline">Remind</button>
                  <button className="text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:underline">View</button>
                </div>
              </td>
            </tr>
            <tr className="sheet-row">
              <td className="sheet-td">
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--ink-primary)]">SSN Card</span>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">PDF, JPG • Applicant</span>
                </div>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#E4E1DA] text-[10px] font-medium flex items-center justify-center text-[var(--ink-secondary)]">MD</div>
                  <span className="text-[12px] truncate">Applicant</span>
                </div>
              </td>
              <td className="sheet-td">
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--success-green-light)] text-[var(--success-green)] text-[10px] font-medium uppercase border border-[var(--success-green)] opacity-80">Received</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-secondary)]">1</td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">100</span>
              </td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">99</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-muted)]">—</td>
              <td className="sheet-td">
                <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--ink-muted)]">
                  Approved
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={8} className="py-1.5 px-6 border-b border-[var(--border-hairline)] bg-[var(--bg-ground)]">
                <button className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3 h-3" /> Add requirement...
                </button>
              </td>
            </tr>

            {/* SECTION 03: Income & Assets */}
            <tr className="sheet-row is-section">
              <td colSpan={8} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[var(--ink-primary)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>03 Income & Assets</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="sheet-row">
              <td className="sheet-td">
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--ink-primary)]">W-2s (2024 + 2025)</span>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">PDF • Originator</span>
                </div>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#D3E0D8] text-[10px] font-medium flex items-center justify-center text-[var(--brand-green)]">SJ</div>
                  <span className="text-[12px] truncate">S. Jenkins</span>
                </div>
              </td>
              <td className="sheet-td">
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--success-green-light)] text-[var(--success-green)] text-[10px] font-medium uppercase border border-[var(--success-green)] opacity-80">Received</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-secondary)]">2</td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">95</span>
              </td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">98</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-muted)]">—</td>
              <td className="sheet-td">
                <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--ink-muted)]">
                  Approved
                </div>
              </td>
            </tr>
            
            {/* AI Suggestion Micro-Row */}
            <tr className="sheet-row is-suggestion text-[11px]">
              <td colSpan={8} className="py-2 px-6 border-b border-[var(--border-hairline)] relative">
                <div className="absolute left-[3px] top-1/2 -translate-y-1/2 text-[#93A5CE]"><Expand className="w-3 h-3" /></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#E8EDF5] text-[#4A649C] font-medium uppercase text-[9px] tracking-wider border border-[#C6D4EA]">AI Suggests</span>
                    <span className="text-[#4A649C]">Page <span className="font-mono">214</span> belongs to <span className="font-medium">W-2 2024</span> (currently orphaned)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-white border border-[var(--border-strong)] rounded text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] shadow-sm">View Page</button>
                    <button className="px-2 py-1 bg-[#4A649C] text-white rounded shadow-sm hover:bg-[#3B5180] flex items-center gap-1"><Check className="w-3 h-3"/> Confirm / Move</button>
                  </div>
                </div>
              </td>
            </tr>

            {/* EXPANDED ROW: Bank Statement Flagged */}
            <tr className="is-expanded border-b border-[var(--border-hairline)]">
              <td colSpan={8} className="p-0">
                <div className="flex flex-col">
                  {/* Standard Row Content in Expanded State */}
                  <div className="flex items-center px-3 py-2 bg-[var(--bg-surface)] hover:bg-[#FAFAFA] cursor-pointer">
                    <div className="w-[24%] px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--ink-primary)]">Bank Stmts — Wells Fargo</span>
                        <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">PDF • Applicant • Nov</span>
                      </div>
                    </div>
                    <div className="w-[14%] px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#E4E1DA] text-[10px] font-medium flex items-center justify-center text-[var(--ink-secondary)]">MD</div>
                        <span className="text-[12px] truncate">Applicant</span>
                      </div>
                    </div>
                    <div className="w-[10%] px-3">
                      <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--alert-clay-light)] text-[var(--alert-clay)] text-[10px] font-medium uppercase border border-[var(--alert-clay)]">Flagged</span>
                    </div>
                    <div className="w-[5%] px-3 font-mono text-[11px] text-[var(--ink-secondary)]">4</div>
                    <div className="w-[7%] px-3">
                      <span className="font-mono text-[11px] bg-[var(--alert-clay-light)] text-[var(--alert-clay)] px-1.5 py-0.5 rounded border border-[var(--alert-clay-light)]">61</span>
                    </div>
                    <div className="w-[7%] px-3">
                      <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">99</span>
                    </div>
                    <div className="w-[8%] px-3 relative group">
                      <span className="font-mono text-[11px] bg-[var(--warn-amber-light)] text-[var(--warn-amber)] px-1.5 py-0.5 rounded border border-[var(--warn-amber)] cursor-help border-dashed relative z-10">26d</span>
                      
                      {/* Hover Popover visibly rendered (static) */}
                      <div className="absolute top-1/2 left-10 -translate-y-1/2 ml-2 block z-50">
                        <div className="popover-card bg-white border border-[var(--border-strong)] rounded-[4px] p-2.5 w-60 relative before:absolute before:content-[''] before:w-2 before:h-2 before:bg-white before:border-l before:border-b before:border-[var(--border-strong)] before:rotate-45 before:-left-[5px] before:top-1/2 before:-translate-y-1/2">
                          <div className="text-[10px] font-medium text-[var(--ink-secondary)] mb-2 uppercase tracking-wide border-b border-[var(--border-hairline)] pb-1">Freshness Policy</div>
                          <div className="text-[11px] text-[var(--ink-primary)] mb-2">Bank statements must be <span className="font-mono font-medium text-[var(--warn-amber)]">&lt; 90 days</span> old</div>
                          <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center gap-2 text-[var(--ink-secondary)]">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ink-muted)]"></div>
                              <span>Warn at <span className="font-mono">30d</span></span>
                              {/* Current indicator */}
                              <span className="ml-auto text-[var(--warn-amber)] font-medium flex items-center gap-1"><ArrowRight className="w-3 h-3"/> 26d</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--ink-secondary)]">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--alert-clay)]"></div>
                              <span>Escalate at <span className="font-mono">7d</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--ink-secondary)] mt-1 pt-1 border-t border-[var(--border-hairline)]">
                              <Clock className="w-3 h-3"/> <span>Inadmissible <span className="font-mono font-medium">Mar 14, 2026</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-[25%] px-3">
                      <div className="flex items-center gap-3 text-[11px] font-medium">
                        <button className="text-[var(--brand-green)] hover:underline flex items-center gap-1">Resolve <ChevronDown className="w-3 h-3 rotate-180"/></button>
                      </div>
                    </div>
                  </div>

                  {/* Deep Dive Panel */}
                  <div className="pl-[24%] pr-4 py-4 bg-[var(--bg-surface)] flex gap-6 shadow-[inset_0_3px_6px_rgba(0,0,0,0.02)]">
                    {/* Left: Thumbnails */}
                    <div className="flex gap-2 w-1/3">
                      <div className="relative w-16 h-20 bg-white border border-[var(--border-strong)] rounded shadow-sm flex flex-col justify-between p-1 hover:border-[var(--brand-green)] cursor-pointer transition-colors">
                        <div className="space-y-1 opacity-20">
                          <div className="h-0.5 bg-black w-3/4"></div><div className="h-0.5 bg-black w-full"></div><div className="h-0.5 bg-black w-5/6"></div>
                          <div className="h-0.5 bg-black w-full mt-2"></div><div className="h-0.5 bg-black w-full"></div>
                        </div>
                        <span className="text-[8px] font-mono text-[var(--ink-muted)] text-right">1</span>
                      </div>
                      <div className="relative w-16 h-20 bg-white border-2 border-[var(--alert-clay)] rounded shadow-sm flex flex-col justify-between p-1 cursor-pointer transform -rotate-2 origin-bottom-left">
                        <div className="absolute -top-1.5 -right-1.5 bg-[var(--alert-clay)] text-white rounded-full p-0.5 shadow-sm">
                          <AlertCircle className="w-3 h-3" />
                        </div>
                        <div className="space-y-1 opacity-20 transform rotate-2">
                          <div className="h-0.5 bg-black w-3/4"></div><div className="h-0.5 bg-black w-full"></div><div className="h-0.5 bg-black w-1/2"></div>
                        </div>
                        <span className="text-[8px] font-mono text-[var(--alert-clay)] font-bold text-right transform rotate-2">2</span>
                      </div>
                      <div className="relative w-16 h-20 bg-white border border-[var(--border-strong)] rounded shadow-sm flex flex-col justify-between p-1 cursor-pointer">
                        <div className="space-y-1 opacity-20">
                          <div className="h-0.5 bg-black w-full"></div><div className="h-0.5 bg-black w-5/6"></div><div className="h-0.5 bg-black w-full"></div>
                        </div>
                        <span className="text-[8px] font-mono text-[var(--ink-muted)] text-right">3</span>
                      </div>
                      <div className="relative w-16 h-20 bg-[#F4F2EC] border border-[var(--border-hairline)] rounded flex items-center justify-center text-[var(--ink-muted)] cursor-pointer hover:bg-[#EAE7E0]">
                        <span className="text-[10px] font-medium">+1</span>
                      </div>
                    </div>

                    {/* Middle: AI Notes */}
                    <div className="w-1/3 flex flex-col gap-2 border-l border-[var(--border-hairline)] pl-5">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-primary)]">
                        <span className="bg-[#E4E1DA] px-1 rounded text-[10px] uppercase font-mono tracking-wider">AI Note</span>
                        Quality Issue Detected
                      </div>
                      <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
                        Page 2 scanned at an angle; account number partially cut off. OCR confidence <span className="font-mono bg-[var(--alert-clay-light)] text-[var(--alert-clay)] px-1 rounded">61%</span>. Remaining pages legible.
                      </p>
                      <button className="text-[10px] text-[var(--brand-green)] font-medium hover:underline self-start flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3"/> View OCR extraction
                      </button>
                    </div>

                    {/* Right: Action Stack */}
                    <div className="w-1/3 flex flex-col gap-2 border-l border-[var(--border-hairline)] pl-5 justify-between">
                      <div className="flex flex-col gap-1.5">
                        <button className="w-full py-1.5 px-3 bg-[var(--bg-ground)] border border-[var(--border-strong)] text-[var(--ink-primary)] hover:border-[var(--brand-green)] rounded-[3px] shadow-sm text-[11px] font-medium text-left flex items-center justify-between transition-colors">
                          Request re-scan from MD <ArrowRight className="w-3 h-3 text-[var(--ink-muted)]"/>
                        </button>
                        <div className="flex gap-1.5">
                          <button className="flex-1 py-1.5 px-3 bg-white border border-[var(--border-strong)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] rounded-[3px] shadow-sm text-[11px] font-medium text-center transition-colors">
                            Mark acceptable
                          </button>
                          <button className="py-1.5 px-2 bg-white border border-[var(--border-strong)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] rounded-[3px] shadow-sm flex items-center justify-center transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                      <div className="text-[9px] text-[var(--ink-muted)] flex items-center gap-1 uppercase tracking-wider font-medium">
                        <AlertCircle className="w-2.5 h-2.5"/> Flagged by scan · Feb 12, 09:41
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr className="sheet-row">
              <td className="sheet-td">
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--ink-primary)]">Pay Stubs (30 days)</span>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">PDF • Applicant</span>
                </div>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#E4E1DA] text-[10px] font-medium flex items-center justify-center text-[var(--ink-secondary)]">MD</div>
                  <span className="text-[12px] truncate">Applicant</span>
                </div>
              </td>
              <td className="sheet-td">
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--bg-ground)] text-[var(--ink-secondary)] text-[10px] font-medium uppercase border border-[var(--border-strong)] border-dashed">Missing</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-muted)]">—</td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-muted)]">—</td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-muted)]">—</td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-muted)]">—</td>
              <td className="sheet-td">
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <button className="px-2 py-1 bg-[var(--brand-green-light)] text-[var(--brand-green)] hover:bg-[#D5E2DB] rounded-[2px] transition-colors">Request</button>
                </div>
              </td>
            </tr>

            {/* SECTION 04: Property Valuation */}
            <tr className="sheet-row is-section">
              <td colSpan={8} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-[var(--ink-primary)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>04 Property Valuation</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="sheet-row">
              <td className="sheet-td">
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--ink-primary)]">Appraisal Report</span>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">PDF • Underwriter</span>
                </div>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#EFE3DB] text-[10px] font-medium flex items-center justify-center text-[var(--alert-clay)]">TR</div>
                  <span className="text-[12px] truncate">T. Rivas</span>
                </div>
              </td>
              <td className="sheet-td">
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--success-green-light)] text-[var(--success-green)] text-[10px] font-medium uppercase border border-[var(--success-green)] opacity-80">Received</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-secondary)]">34</td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">99</span>
              </td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">100</span>
              </td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded border border-[var(--success-green)] opacity-70">82d</span>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--ink-muted)]">
                  Approved
                </div>
              </td>
            </tr>
            <tr className="sheet-row">
              <td className="sheet-td">
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--ink-primary)]">Purchase Agreement</span>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">PDF • Originator</span>
                </div>
              </td>
              <td className="sheet-td">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#D3E0D8] text-[10px] font-medium flex items-center justify-center text-[var(--brand-green)]">SJ</div>
                  <span className="text-[12px] truncate">S. Jenkins</span>
                </div>
              </td>
              <td className="sheet-td">
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--alert-clay-light)] text-[var(--alert-clay)] text-[10px] font-medium uppercase border border-[var(--alert-clay)]">Flagged</span>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-secondary)]">14</td>
              <td className="sheet-td">
                <span className="font-mono text-[11px] bg-[var(--success-green-light)] text-[var(--success-green)] px-1.5 py-0.5 rounded">100</span>
              </td>
              <td className="sheet-td relative">
                <span className="font-mono text-[11px] bg-[var(--alert-clay-light)] text-[var(--alert-clay)] px-1.5 py-0.5 rounded font-bold border border-[var(--alert-clay-muted)]">34</span>
                <div className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-[var(--alert-clay)] border border-[var(--bg-ground)]"></div>
              </td>
              <td className="sheet-td font-mono text-[11px] text-[var(--ink-muted)]">—</td>
              <td className="sheet-td">
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <button className="text-[var(--brand-green)] hover:underline">Review</button>
                </div>
              </td>
            </tr>

            {/* SECTION 05: Collapsed */}
            <tr className="sheet-row is-section">
              <td colSpan={8} className="py-2.5 px-4 cursor-pointer hover:bg-[#F2F0EA] transition-colors mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[var(--ink-muted)]" />
                    <span className="font-serif font-medium text-[var(--ink-primary)] text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>05 Title & Escrow</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)] flex items-center gap-3">
                    <span><span className="font-mono text-[var(--ink-primary)]">0/4</span> received</span>
                  </div>
                </div>
              </td>
            </tr>

            {/* Empty filler row to show the grid pattern going down */}
            {Array.from({length: 4}).map((_, i) => (
              <tr key={i} className="sheet-row h-[36px] border-b border-[var(--border-hairline)]">
                <td colSpan={8}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* 4. Footer Status Bar */}
      <footer className="flex-none px-4 py-1.5 bg-[var(--bg-ground)] border-t border-[var(--border-strong)] flex items-center justify-between text-[11px] text-[var(--ink-secondary)]">
        <div className="flex items-center gap-4">
          <span className="font-medium text-[var(--ink-primary)]">38 requirements</span>
          <span>·</span>
          <span><span className="font-mono">312</span> pages analyzed</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> last sync 2 min ago</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-secondary)]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--ink-primary)]">Filters:</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--alert-clay-light)] border border-[var(--alert-clay-muted)] text-[var(--alert-clay)] rounded-[3px] font-medium">
              Flagged (3) <span className="text-[var(--alert-clay)] hover:text-red-800 cursor-pointer text-xs leading-none ml-1">×</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[var(--border-strong)] text-[var(--ink-secondary)] rounded-[3px] font-medium cursor-pointer hover:bg-[var(--bg-zebra)]">
              Missing (4)
            </div>
          </div>
          <div className="w-[1px] h-3 bg-[var(--border-strong)] mx-2"></div>
          <span className="flex items-center gap-1">Press <kbd className="font-mono px-1 py-0.5 bg-white border border-[var(--border-hairline)] rounded text-[9px] mx-0.5">/</kbd> to search</span>
          <span className="flex items-center gap-1">Press <kbd className="font-mono px-1 py-0.5 bg-white border border-[var(--border-hairline)] rounded text-[9px] mx-0.5">Enter</kbd> to expand</span>
        </div>
      </footer>
    </div>
  );
}

// Quick component for the upload icon since it wasn't imported directly
function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
  );
}
