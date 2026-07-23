import React, { useState, useEffect, useRef } from "react";
import { GripVertical, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { PALETTE, PURCHASE_LOAN, templateToJson, templateStats, expiryLabel, SAVED_SECTIONS, Section } from "./builderData";

// URL Params Supported:
// ?json=1 - Opens the bottom drawer with JSON output
// ?drop=1 - Shows a drop indicator and dragged ghost card in the Income & Assets section
// ?drop=2 - Shows a section-level drop indicator between sections 03 and 04
// ?collapsed=1 - Starts sections 02 (Identity) and 05 (Title) in collapsed state
// ?menu=1 - Starts with the section menu open on section 01 (Initial Application)
// ?focus=income - Scrolls the Income & Assets section into view on mount

const getSectionStats = (section: Section) => {
  let blocks = 0;
  let docs = 0;
  section.subsections.forEach(ss => {
    blocks += ss.blocks.length;
    ss.blocks.forEach(b => {
      if (b.kind === "document") docs++;
    });
  });
  return { blocks, docs };
};

export default function FormBuilderA() {
  const [params, setParams] = useState(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const isCollapsedInit = params.get("collapsed") === "1";
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() =>
    isCollapsedInit ? { "identity": true, "title-escrow": true } : {}
  );

  const isMenuInit = params.get("menu") === "1";
  const [openMenuId, setOpenMenuId] = useState<string | null>(isMenuInit ? "initial-application" : null);

  useEffect(() => {
    const handlePopState = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (params.get("focus") === "income") {
      const el = sectionRefs.current["income-assets"];
      if (el) {
        el.scrollIntoView({ block: "start" });
      }
    }
  }, [params]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const showJson = params.get("json") === "1";
  const showDrop = params.get("drop") === "1";
  const showDrop2 = params.get("drop") === "2";
  
  const stats = templateStats(PURCHASE_LOAN);
  
  const toggleJson = () => {
    const newParams = new URLSearchParams(params.toString());
    if (showJson) {
      newParams.delete("json");
    } else {
      newParams.set("json", "1");
    }
    window.history.pushState({}, "", "?" + newParams.toString());
    setParams(newParams);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const highlightJson = (json: string) => {
    const formatted = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    return formatted.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // Key
          return `<span class="text-[#1E40AF]">${match.slice(0, -1)}</span><span class="text-[#94A3B8]">:</span>`;
        }
        // String
        return `<span class="text-[#0F172A]">${match}</span>`;
      }
      // Boolean / Number
      return `<span class="text-[#0F172A]">${match}</span>`;
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}} />
      
      <div className="w-full h-[100dvh] flex flex-col font-sans bg-[#F3F5F7] text-[#0F172A] overflow-hidden relative selection:bg-[#BFDBFE] selection:text-[#1E40AF]">
        
        {/* Header */}
        <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 z-10">
          <div className="text-[14px] font-medium text-[#0F172A] border-b border-dashed border-[#94A3B8] pb-[1px] cursor-text mr-2">{PURCHASE_LOAN.template}</div>
          <div className="font-mono text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[2px]">v{PURCHASE_LOAN.version}</div>
          <div className="flex-1" />
          <button onClick={toggleJson} className="font-mono text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] mr-6 transition-colors">
            {`{ } JSON`}
          </button>
          <button className="text-[12.5px] font-medium text-[#64748B] hover:text-[#0F172A] mr-4 transition-colors">
            Duplicate
          </button>
          <button className="bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px] shadow-sm">
            Export JSON
          </button>
        </header>

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Rail (Palette) */}
          <aside className="w-[260px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 relative z-10">
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
              <div>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#64748B] mb-3">Blocks</div>
                <div className="space-y-2">
                  {PALETTE.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 bg-white border border-[#E2E8F0] rounded-[4px] cursor-grab hover:border-[#94A3B8] transition-colors shadow-sm group">
                      <GripVertical size={14} className="text-[#94A3B8] mt-[2px] opacity-60 group-hover:opacity-100 shrink-0" />
                      <div>
                        <div className="text-[13px] font-medium text-[#0F172A] leading-tight">{item.label}</div>
                        <div className="text-[11px] text-[#64748B] mt-1 leading-snug">{item.hint}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="h-px bg-[#E2E8F0] mb-4" />
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#64748B] mb-3">Saved Sections</div>
                <div className="space-y-2">
                  {SAVED_SECTIONS.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 p-2.5 bg-white border border-[#E2E8F0] rounded-[4px] cursor-grab hover:border-[#94A3B8] transition-colors shadow-sm group">
                      <GripVertical size={14} className="text-[#94A3B8] mt-[2px] opacity-60 group-hover:opacity-100 shrink-0" />
                      <div>
                        <div className="text-[13px] font-medium text-[#0F172A] leading-tight">{item.name}</div>
                        <div className="font-mono text-[10px] text-[#64748B] mt-1 leading-snug">
                          {item.blocks} blocks · {item.docs} docs · {item.source}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer Stats */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="font-mono text-[10.5px] text-[#64748B] leading-relaxed">
                {stats.sections} sections · {stats.docs} documents<br/>{stats.fieldGroups} field groups
              </div>
            </div>
          </aside>

          {/* Center Form */}
          <main className="flex-1 overflow-auto p-8 pb-40">
            <div className="max-w-[760px] mx-auto">
              
              {PURCHASE_LOAN.sections.map((section, sIdx) => {
                const sStats = getSectionStats(section);
                const isCollapsed = collapsedSections[section.id];
                const isMenuOpen = openMenuId === section.id;
                
                return (
                  <React.Fragment key={section.id}>
                    <div ref={(el) => { sectionRefs.current[section.id] = el; }} className="mb-10 last:mb-0">
                      
                      {/* Section Header */}
                      <div className="flex items-center group mb-4 relative">
                        <button 
                          onClick={() => toggleCollapse(section.id)} 
                          className="p-1 -ml-1 mr-1 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-[2px] hover:bg-[#E2E8F0]"
                        >
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <div className="font-mono text-[13px] text-[#94A3B8] w-6 font-medium">
                          {(sIdx + 1).toString().padStart(2, '0')}
                        </div>
                        
                        <div className="text-[15px] font-semibold text-[#0F172A] flex-1 flex items-center cursor-default">
                          {section.name}
                          {isCollapsed && (
                            <span className="font-mono text-[11px] text-[#64748B] ml-3 font-normal">
                              {sStats.blocks} blocks · {sStats.docs} documents
                            </span>
                          )}
                        </div>
                        
                        <div className="px-1.5 py-0.5 bg-[#E2E8F0] text-[#475569] text-[9.5px] uppercase tracking-[0.06em] font-semibold rounded-[2px] mr-3">
                          {section.owner}
                        </div>
                        <GripVertical size={15} className="text-[#94A3B8] opacity-0 group-hover:opacity-100 cursor-grab transition-opacity mr-2" />
                        
                        {/* Section Menu */}
                        <div className="relative">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(isMenuOpen ? null : section.id);
                            }} 
                            className={`p-1 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-[2px] hover:bg-[#E2E8F0] ${isMenuOpen ? 'opacity-100 bg-[#E2E8F0] text-[#0F172A]' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-[160px] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] rounded-[4px] py-1 z-50">
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Save as block</button>
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Duplicate section</button>
                              <div className="h-px bg-[#E2E8F0] my-1" />
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors">Remove section</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subsections */}
                      {!isCollapsed && (
                        <div className="pl-6 space-y-8 border-l border-[#E2E8F0] ml-3 mt-4">
                          {section.subsections.map(subsection => (
                            <div key={subsection.id} className="relative">
                              
                              {/* Subsection Header */}
                              <div className="text-[10.5px] font-semibold text-[#64748B] uppercase tracking-[0.08em] mb-3 -ml-[25px] bg-[#F3F5F7] px-1 inline-block">
                                {subsection.name}
                              </div>
                              
                              {/* Blocks */}
                              <div className="space-y-2.5 ml-4">
                                {subsection.blocks.map((block) => (
                                  <React.Fragment key={block.id}>
                                    
                                    {/* Block Card */}
                                    {block.id === "bank-statements" ? (
                                      // Editing State (Inline)
                                      <div className="bg-white border-2 border-[#1D4ED8] rounded-[4px] p-3 flex shadow-sm relative z-10">
                                        <GripVertical size={14} className="text-[#94A3B8] mr-2 mt-0.5 cursor-grab shrink-0" />
                                        <div className="flex-1">
                                          <div className="flex items-center">
                                            <input 
                                              type="text" 
                                              defaultValue={block.name}
                                              className="text-[13px] font-medium text-[#0F172A] border-b border-dashed border-[#1D4ED8] bg-transparent outline-none pb-0.5 flex-1 focus:border-solid" 
                                            />
                                          </div>
                                          <div className="flex items-center gap-3 font-mono text-[11px] mt-2.5 bg-[#F8FAFC] p-2 rounded-[2px] border border-[#E2E8F0] flex-wrap">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                              <input type="checkbox" defaultChecked={block.kind === "document" ? block.required : false} className="accent-[#1D4ED8] w-3 h-3" />
                                              <span className="text-[#334155]">Required</span>
                                            </label>
                                            <div className="text-[#CBD5E1]">|</div>
                                            
                                            {block.kind === "document" && (
                                              <>
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[#64748B]">Fmt:</span>
                                                  <input type="text" defaultValue={block.formats.join(", ")} className="border-b border-[#CBD5E1] outline-none text-[#0F172A] w-24 bg-transparent focus:border-[#1D4ED8] pb-px" />
                                                </div>
                                                <div className="text-[#CBD5E1]">|</div>
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[#64748B]">Exp:</span>
                                                  <select className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px cursor-pointer">
                                                    <option>stale after 90d</option>
                                                    <option>valid through closing</option>
                                                    <option>no clock</option>
                                                  </select>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      // Rest State
                                      <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-2.5 flex group hover:border-[#CBD5E1] transition-colors shadow-sm">
                                        <GripVertical size={14} className="text-[#94A3B8] mr-2 mt-[1px] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity" />
                                        <div className="flex-1">
                                          <div className="text-[12.5px] font-medium text-[#0F172A]">{block.name}</div>
                                          
                                          {block.kind === "document" && (
                                            <div className="font-mono text-[10.5px] text-[#64748B] mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
                                              <span>{block.formats.join(", ")}</span>
                                              <span className="text-[#CBD5E1]">•</span>
                                              <span className={block.required ? "text-[#334155]" : ""}>{block.required ? "req" : "opt"}</span>
                                              <span className="text-[#CBD5E1]">•</span>
                                              <span>{expiryLabel(block.expiry)}</span>
                                              {block.multiPage && (
                                                <>
                                                  <span className="text-[#CBD5E1]">•</span>
                                                  <span>multi-page</span>
                                                </>
                                              )}
                                            </div>
                                          )}

                                          {block.kind === "fields" && (
                                            <div className="mt-2.5 flex flex-col gap-1.5 border-t border-[#F1F5F9] pt-2.5">
                                              {block.fields.map(f => (
                                                <div key={f.id} className="flex items-center text-[11.5px]">
                                                  <div className="w-20 font-mono text-[#64748B] text-[10px] uppercase tracking-wider">{f.type}</div>
                                                  <div className="flex-1 text-[#334155]">{f.label}</div>
                                                  {f.required && <div className="font-mono text-[9.5px] text-[#64748B] bg-[#F1F5F9] px-1 rounded-[2px]">req</div>}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Drop Indicator ?drop=1 (Block Level) */}
                                    {showDrop && block.id === "pay-stubs" && (
                                      <div className="relative my-3.5 z-20">
                                        {/* Blue Line */}
                                        <div className="h-[2px] bg-[#1D4ED8] w-full relative">
                                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] bg-[#F3F5F7] border-[2px] border-[#1D4ED8] rounded-full" />
                                        </div>
                                        {/* Drop Label */}
                                        <div className="absolute -top-[7px] left-6 font-mono text-[9.5px] text-[#1D4ED8] bg-[#F3F5F7] px-1.5 tracking-[0.05em] font-medium z-10">
                                          DROP — DOCUMENT UPLOAD
                                        </div>
                                        
                                        {/* Dragged Ghost Card */}
                                        <div className="absolute top-4 left-12 w-[240px] bg-white border border-[#1D4ED8] shadow-[0_8px_24px_rgba(15,23,42,0.12)] rounded-[4px] p-2.5 flex opacity-90 z-30 pointer-events-none rotate-[2deg]">
                                          <GripVertical size={14} className="text-[#94A3B8] mr-2 mt-[2px]" />
                                          <div>
                                            <div className="text-[13px] font-medium text-[#0F172A] leading-tight">Document upload</div>
                                            <div className="text-[11px] text-[#64748B] mt-1 leading-snug">A required page or multi-page document</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Section Drop Indicator ?drop=2 (Section Level) */}
                    {showDrop2 && section.id === "income-assets" && (
                      <div className="relative my-8 z-20">
                        {/* Blue Line */}
                        <div className="h-[2px] bg-[#1D4ED8] w-full relative">
                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] bg-[#F3F5F7] border-[2px] border-[#1D4ED8] rounded-full" />
                        </div>
                        {/* Drop Label */}
                        <div className="absolute -top-[7px] left-6 font-mono text-[9.5px] text-[#1D4ED8] bg-[#F3F5F7] px-1.5 tracking-[0.05em] font-medium z-10">
                          DROP — STANDARD APPLICATION · 3 BLOCKS
                        </div>
                        
                        {/* Dragged Ghost Card */}
                        <div className="absolute top-4 left-12 w-[260px] bg-white border border-[#1D4ED8] shadow-[0_8px_24px_rgba(15,23,42,0.12)] rounded-[4px] p-2.5 flex opacity-90 z-30 pointer-events-none rotate-[2deg]">
                          <GripVertical size={14} className="text-[#94A3B8] mr-2 mt-[2px] shrink-0" />
                          <div>
                            <div className="text-[13px] font-medium text-[#0F172A] leading-tight">Standard Application</div>
                            <div className="font-mono text-[10px] text-[#64748B] mt-1 leading-snug">
                              3 blocks · 2 docs · saved Jul 12
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              
            </div>
          </main>
        </div>

        {/* JSON Drawer Overlay */}
        {showJson && (
          <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-white border-t border-[#E2E8F0] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] flex flex-col z-50 animate-in slide-in-from-bottom-full duration-300">
            <div className="h-[42px] border-b border-[#E2E8F0] flex items-center px-4 bg-[#F8FAFC] shrink-0">
              <div className="font-mono text-[11px] text-[#334155] font-semibold">purchase-loan-ca.v3.json</div>
              <div className="flex-1" />
              <button className="text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] mr-4 transition-colors">Copy</button>
              <button className="text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">Download</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#FFFFFF]">
              <pre 
                className="font-mono text-[11px] text-[#94A3B8] leading-[1.6]" 
                dangerouslySetInnerHTML={{ __html: highlightJson(templateToJson(PURCHASE_LOAN)) }} 
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
