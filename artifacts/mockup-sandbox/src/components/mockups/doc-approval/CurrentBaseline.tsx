import React from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export function CurrentBaseline() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ops-baseline flex flex-col overflow-hidden text-[#0F172A]">
        {/* Header */}
        <header className="h-12 bg-white border-b border-[var(--ops-border)] flex items-center px-3 md:px-4 gap-3 shrink-0">
          <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] transition-colors min-h-[40px]">
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Intake</span>
          </button>
          <div className="h-4 w-px bg-[var(--ops-border)]" />
          <div className="font-semibold text-[14px] tracking-tight">Page Review</div>
          <div className="ops-mono text-[11px] text-[var(--ops-muted)] truncate hidden sm:block">
            APP-2849 <span className="text-[var(--ops-faint)] px-1">/</span> M. Torres
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="ops-mono text-[11px] text-[var(--ops-muted)] hidden md:block">
              3 open · 9 pages
            </span>
            <button className="text-[12.5px] font-medium text-[var(--ops-ink)] bg-transparent border border-transparent hover:border-[var(--ops-border)] hover:bg-[var(--ops-inset)] px-3 py-1.5 rounded-[4px] transition-colors">
              Open the report →
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left Column */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Sub-bar */}
            <div className="bg-white border-b border-[var(--ops-border)] px-3 md:px-5 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--ops-ink)] leading-tight truncate">
                    URLA — Form 1003
                  </div>
                  <div className="ops-mono text-[10.5px] text-[var(--ops-muted)] whitespace-nowrap">
                    CONF 90% · pp. 1–3
                  </div>
                </div>
                <div className="h-7 w-px bg-[var(--ops-border)] hidden sm:block" />
                <div className="hidden sm:flex gap-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[var(--ops-inset)] border border-[var(--ops-border)]">
                    <span className="micro-label">Q</span>
                    <span className="ops-mono text-[11.5px] font-medium text-[var(--ops-ink)]">97</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[var(--ops-inset)] border border-[var(--ops-border)]">
                    <span className="micro-label">FMT</span>
                    <span className="ops-mono text-[11.5px] font-medium text-[var(--ops-critical-text)]">45</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[var(--ops-inset)] border border-[var(--ops-border)]">
                    <span className="micro-label">FRD</span>
                    <span className="ops-mono text-[11.5px] font-medium text-[var(--ops-faint)]">—</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 shrink-0">
                <span className="ops-mono text-[10.5px] text-[var(--ops-muted)] whitespace-nowrap">
                  STOP 1 OF 6 · P.1
                </span>
                <div className="flex bg-[var(--ops-inset)] p-0.5 rounded-[4px] border border-[var(--ops-border)]">
                  <button className="px-2.5 md:px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-[2px] transition-colors bg-white shadow-sm text-[var(--ops-ink)] border border-[var(--ops-border)]">
                    PRIORITY
                  </button>
                  <button className="px-2.5 md:px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded-[2px] transition-colors text-[var(--ops-muted)] border border-transparent">
                    ALL PAGES
                  </button>
                </div>
              </div>
            </div>

            {/* Center Viewer */}
            <div className="flex-1 relative overflow-hidden bg-[#F3F5F7]">
              <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
                <div className="w-full max-w-[600px] aspect-[8.5/11] bg-white rounded-[2px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] max-h-full flex flex-col p-6 sm:p-10 border border-[var(--ops-border)] relative overflow-hidden">
                  <div className="text-center font-serif text-[16px] sm:text-lg font-bold border-b-2 border-black pb-2 mb-4 uppercase tracking-widest leading-snug">
                    Uniform Residential Loan Application
                  </div>
                  
                  <div className="text-[9px] sm:text-[10px] text-gray-500 mb-6 text-center leading-relaxed">
                    Verify and complete the information on this application. If you are applying for this loan with others, each additional Borrower must provide information as directed by your Lender.
                  </div>

                  <div className="border border-black flex flex-col h-full text-[9px] sm:text-[11px] flex-1 overflow-hidden">
                    <div className="bg-gray-200 font-bold p-1.5 border-b border-black">
                      Section 1: Borrower Information. This section asks about your personal information and your income from employment and other sources...
                    </div>
                    
                    <div className="flex border-b border-black min-h-[140px]">
                      <div className="w-1/2 border-r border-black p-2 flex flex-col gap-2">
                        <div>
                          <div className="font-semibold mb-1">1a. Personal Information</div>
                          <div className="flex gap-2">
                            <div className="flex-1 border-b border-gray-300 pb-1">Name (First, Middle, Last, Suffix)</div>
                          </div>
                          <div className="mt-1 ops-mono text-blue-900 font-medium">MARIA TORRES</div>
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <div className="flex-1 border-b border-gray-300 pb-1">Social Security Number</div>
                          <div className="flex-1 border-b border-gray-300 pb-1">DOB (mm/dd/yyyy)</div>
                        </div>
                      </div>
                      <div className="w-1/2 p-2 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <div className="flex-1 border-b border-gray-300 pb-1">Citizenship</div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <div className="flex-1 border-b border-gray-300 pb-1">Type of Credit</div>
                        </div>
                        <div className="mt-auto flex justify-end">
                           <div className="w-4 h-4 border border-gray-400"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2 border-b border-black min-h-[100px]">
                      <div className="font-semibold mb-2">1b. Current Employment/Self-Employment and Income</div>
                      <div className="h-4 border-b border-gray-300 w-full mb-2"></div>
                      <div className="h-4 border-b border-gray-300 w-full mb-2"></div>
                      <div className="h-4 border-b border-gray-300 w-2/3 mb-2"></div>
                    </div>

                    <div className="p-2 flex-1">
                      <div className="font-semibold mb-2">1c. IF APPLICABLE, Complete Information for Additional Employment...</div>
                      <div className="h-4 border-b border-gray-300 w-full mb-2"></div>
                      <div className="h-4 border-b border-gray-300 w-full mb-2"></div>
                      <div className="h-4 border-b border-gray-300 w-3/4 mb-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filmstrip */}
            <div className="h-[92px] md:h-[112px] bg-[var(--ops-inset)] border-t border-[var(--ops-border)] flex items-center gap-2 px-3 overflow-x-auto shrink-0">
              {[
                { page: 1, label: '1–3', band: 'attend', active: true, resolved: true },
                { page: 2, label: '1–3', band: 'attend', resolved: true },
                { page: 3, label: '1–3', band: 'attend', resolved: true },
                { page: 4, label: '4', band: 'hold', resolved: false },
                { page: 5, label: '5', band: 'clean', resolved: true },
                { page: 6, label: '6–8', band: 'attend', resolved: false },
                { page: 7, label: '6–8', band: 'attend', resolved: false },
                { page: 8, label: '6–8', band: 'attend', resolved: false },
                { page: 9, label: '9', band: 'hold', resolved: false },
              ].map((it, i) => (
                <button
                  key={i}
                  className={`relative w-[52px] h-[68px] md:w-[62px] md:h-[82px] shrink-0 bg-white border overflow-hidden transition-all ${
                    it.active
                      ? 'border-[var(--ops-accent)] ring-1 ring-[var(--ops-accent)]'
                      : 'border-[var(--ops-border)] hover:border-[var(--ops-strong-border)]'
                  }`}
                >
                  {it.band !== 'clean' && (
                    <div className={`absolute top-0 left-0 right-0 h-[3px] z-10 ${
                      it.band === 'hold' ? 'bg-[var(--ops-critical-solid)]' : 'bg-[var(--ops-warning-solid)]'
                    }`} />
                  )}
                  {/* Thumbnail skeleton */}
                  <div className="absolute inset-0 p-1.5 flex flex-col gap-1 opacity-20">
                     <div className="h-1 bg-gray-600 w-1/2 rounded-full" />
                     <div className="h-1 bg-gray-600 w-3/4 rounded-full" />
                     <div className="flex-1 border border-gray-400 rounded-sm mt-1" />
                  </div>
                  
                  <span className={`absolute bottom-0.5 left-0.5 px-1 rounded-[2px] ops-mono text-[9px] leading-[14px] ${
                    it.active ? 'bg-[var(--ops-accent)] text-white' : 'bg-white/90 text-[var(--ops-muted)] border border-[var(--ops-border)]'
                  }`}>
                    {it.label}
                  </span>
                  {it.resolved && (
                    <span className="absolute bottom-0.5 right-0.5 bg-[var(--ops-ok-text)] rounded-full p-[2px]">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right Rail */}
          <aside className="w-full md:w-[320px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-[var(--ops-border)] flex flex-col min-h-0 max-h-[46vh] md:max-h-none">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-5 flex flex-col gap-4">
                <div>
                  <div className="micro-label mb-1">exception · attend</div>
                  <div className="font-semibold text-[14px] text-[var(--ops-ink)] leading-snug">URLA — Form 1003</div>
                  <div className="ops-mono text-[10.5px] text-[var(--ops-muted)] mt-0.5">
                    01 Initial Application · pp. 1–3
                  </div>
                </div>

                <div className="rounded-[4px] border p-3 text-[12.5px] leading-relaxed bg-[var(--ops-ok-wash)] border-[var(--ops-ok-border)] text-[var(--ops-ok-text)]">
                  Accepted by Underwriter — on the audit trail.
                  <button className="w-full mt-3 bg-white border border-[var(--ops-strong-border)] text-[var(--ops-ink)] hover:bg-[var(--ops-inset)] px-3 py-2 rounded-[4px] shadow-sm font-medium transition-colors text-[12.5px]">
                    Next stop →
                  </button>
                </div>

                <div>
                  <div className="micro-label mb-2.5">callouts (7)</div>
                  <div className="flex flex-col gap-3.5">
                    {[
                      { severity: 'clay', label: 'Mixed document types', detail: 'Pages 2-3 appear to be a W-2, not part of the URLA.' },
                      { severity: 'amber', label: 'Duplicate page alert', detail: 'Page 1 appears twice in this packet.' },
                      { severity: 'amber', label: 'Incomplete document', detail: 'Missing pages 4-5 of the standard URLA form.' },
                      { severity: 'clay', label: 'Missing borrower signature', detail: 'Section 6 is unsigned.' },
                    ].map((c, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          <span className={`mt-[4px] shrink-0 w-2 h-2 rounded-[2px] border ${
                            c.severity === 'clay' ? 'bg-[var(--ops-critical-wash)] border-[var(--ops-critical-solid)]' : 'bg-[var(--ops-warning-wash)] border-[var(--ops-warning-solid)]'
                          }`} />
                          <span className="text-[12.5px] font-medium text-[var(--ops-ink)] leading-snug">{c.label}</span>
                        </div>
                        {c.detail && <div className="text-[11.5px] text-[var(--ops-muted)] pl-4 leading-relaxed">{c.detail}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--ops-inner-rule)] pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="micro-label">doc date</span>
                    <span className="ops-mono text-[11px] text-[var(--ops-body-sec)]">2026-02-15</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--ops-border)] bg-[var(--ops-inset)] p-3 md:p-4 flex flex-col gap-2.5 shrink-0">
              <div className="flex justify-between items-center">
                <button className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] disabled:opacity-30 min-h-[40px] px-1" disabled>
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--ops-muted)] hover:text-[var(--ops-ink)] min-h-[40px] px-1">
                  Skip <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="hidden md:flex items-center justify-between micro-label pt-2 border-t border-[var(--ops-border)]">
                <span>↵ accept</span>
                <span>← → navigate</span>
                <span>esc close</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

const CSS = `
  .ops-baseline {
    --ops-ink: #0F172A;
    --ops-muted: #64748B;
    --ops-body-sec: #475569;
    --ops-faint: #94A3B8;
    --ops-border: #E2E8F0;
    --ops-strong-border: #CBD5E1;
    --ops-inner-rule: #F1F5F9;
    --ops-inset: #F8FAFC;
    --ops-accent: #2563EB;
    
    --ops-ok-text: #15803D;
    --ops-ok-wash: #F0FDF4;
    --ops-ok-border: #BBF7D0;
    
    --ops-warning-text: #B45309;
    --ops-warning-wash: #FFFBEB;
    --ops-warning-border: #FDE68A;
    --ops-warning-solid: #F59E0B;
    
    --ops-critical-text: #B91C1C;
    --ops-critical-wash: #FEF2F2;
    --ops-critical-border: #FECACA;
    --ops-critical-solid: #EF4444;

    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--ops-ink);
    background-color: var(--ops-inner-rule);
    height: 100vh;
    width: 100vw;
  }
  
  .ops-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }

  .micro-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ops-muted);
  }
`;
