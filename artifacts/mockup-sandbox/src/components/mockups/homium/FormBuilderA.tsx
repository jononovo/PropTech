import React, { useState, useEffect, useRef } from "react";
import { GripVertical, ChevronDown, ChevronRight, MoreHorizontal, Eye, Monitor, Smartphone, List, Upload } from "lucide-react";
import { DocDimensions } from "./DocDimensions";
import { PALETTE, PURCHASE_LOAN, templateToJson, templateStats, expiryLabel, SAVED_SECTIONS, Section, Role, Permission, RequirementLevel, Criticality, Sourcing, requirementLabel, criticalityLabel, sourcingLabel, groupForPrimary, groupsSatisfiedBy, blockName, Template } from "./builderData";

// URL Params Supported:
// ?json=1 - Opens the bottom drawer with JSON output
// ?drop=1 - Shows a drop indicator and dragged ghost card in the Income & Assets section
// ?drop=2 - Shows a section-level drop indicator between sections 03 and 04
// ?collapsed=1 - Starts sections 02 (Identity) and 05 (Title) in collapsed state
// ?menu=1 - Starts with the section menu open on section 01 (Initial Application)
// ?focus=income - Scrolls the Income & Assets section into view on mount
// ?focus=identity - Scrolls the Identity Verification section into view on mount and selects gov-id block
// ?preview=1 - Opens the Live Preview right pane
// ?pview=mobile|desktop|register - Selects the view mode in the Preview pane
// ?perms=1 - Opens the permissions strip for section 03 (Income & Assets)
// ?tip=1 - Opens the first tooltip in the preview pane

const getBlockSectionNumber = (t: Template, blockId: string) => {
  for (let i = 0; i < t.sections.length; i++) {
    for (const ss of t.sections[i].subsections) {
      for (const b of ss.blocks) {
        if (b.id === blockId) return (i + 1).toString().padStart(2, '0');
      }
    }
  }
  return "00";
};

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
    isCollapsedInit ? { "identity": true, "title-escrow": true } : {} as Record<string, boolean>
  );

  const isMenuInit = params.get("menu") === "1";
  const [openMenuId, setOpenMenuId] = useState<string | null>(isMenuInit ? "initial-application" : null);

  const isPermsInit = params.get("perms") === "1";
  const [openPermsSectionId, setOpenPermsSectionId] = useState<string | null>(isPermsInit ? "income-assets" : null);

  useEffect(() => {
    const handlePopState = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const focusParam = params.get("focus");
    if (focusParam === "income") {
      const el = sectionRefs.current["income-assets"];
      if (el) el.scrollIntoView({ block: "start" });
    } else if (focusParam === "identity") {
      const el = sectionRefs.current["identity"];
      if (el) el.scrollIntoView({ block: "start" });
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
  const showPreview = params.get("preview") === "1";
  const pview = params.get("pview") || "mobile";
  const showTip = params.get("tip") === "1";
  const editedBlockId = params.get("focus") === "identity" ? "gov-id" : "bank-statements";
  const editedBlockData = PURCHASE_LOAN.sections.flatMap(s => s.subsections).flatMap(ss => ss.blocks).find(b => b.id === editedBlockId);
  
  const [localReq, setLocalReq] = useState<RequirementLevel | null>(null);
  useEffect(() => {
    if (editedBlockData && editedBlockData.kind === "document" && "requirement" in editedBlockData) {
      setLocalReq(editedBlockData.requirement);
    }
  }, [editedBlockId, editedBlockData]);
  
  const stats = templateStats(PURCHASE_LOAN);
  
  const toggleJson = () => {
    const newParams = new URLSearchParams(params.toString());
    if (showJson) newParams.delete("json");
    else newParams.set("json", "1");
    window.history.pushState({}, "", "?" + newParams.toString());
    setParams(newParams);
  };

  const togglePreview = () => {
    const newParams = new URLSearchParams(params.toString());
    if (showPreview) {
      newParams.delete("preview");
    } else {
      newParams.set("preview", "1");
      if (!newParams.has("pview")) newParams.set("pview", "mobile");
    }
    window.history.pushState({}, "", "?" + newParams.toString());
    setParams(newParams);
  };

  const updatePview = (view: string) => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("pview", view);
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
        if (/:$/.test(match)) return `<span class="text-[#1E40AF]">${match.slice(0, -1)}</span><span class="text-[#94A3B8]">:</span>`;
        return `<span class="text-[#0F172A]">${match}</span>`;
      }
      return `<span class="text-[#0F172A]">${match}</span>`;
    });
  };

  // Preview Data Preparation
  const targetSection = PURCHASE_LOAN.sections.find(s => 
    s.subsections.some(ss => ss.blocks.some(b => b.id === editedBlockId))
  ) || PURCHASE_LOAN.sections[0];
  const targetSectionIndex = PURCHASE_LOAN.sections.indexOf(targetSection) + 1;
  const totalSections = PURCHASE_LOAN.sections.length;
  
  const targetDocs = targetSection.subsections.flatMap(ss => 
    ss.blocks.filter(b => b.kind === "document")
  );

  const appHiddenSections = PURCHASE_LOAN.sections
    .map((s, i) => ({ section: s, index: i + 1 }))
    .filter(({ section }) => {
      const appPerm = section.permissions.find(p => p.role === "Applicant");
      return appPerm && !appPerm.view;
    })
    .map(({ section, index }) => `${index.toString().padStart(2, '0')} ${section.name}`)
    .join(", ");

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

          <div className="flex-1" />

          <div className="font-mono text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[2px] mr-2">v{PURCHASE_LOAN.version}</div>
          {PURCHASE_LOAN.status === "draft" ? (
            <div className="font-mono text-[10px] font-medium text-[#64748B] uppercase tracking-[0.06em] border border-[#CBD5E1] px-1.5 py-0.5 rounded-[2px] mr-6">draft</div>
          ) : (
            <div className="font-mono text-[10px] font-medium text-[#1D4ED8] uppercase tracking-[0.06em] border border-[#BFDBFE] px-1.5 py-0.5 rounded-[2px] mr-6">active</div>
          )}
          
          <button onClick={togglePreview} className={`flex items-center gap-1.5 text-[12.5px] font-medium mr-6 transition-colors ${showPreview ? 'text-[#1D4ED8]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
            <Eye size={15} />
            Preview
          </button>
          <button onClick={toggleJson} className="font-mono text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] mr-2 transition-colors">
            {`{ } JSON`}
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
                      <div className="flex items-center group mb-4 relative z-20">
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
                              <button 
                                className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                                onClick={() => {
                                  setOpenPermsSectionId(openPermsSectionId === section.id ? null : section.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                Permissions
                              </button>
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Save as block</button>
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Duplicate section</button>
                              <div className="h-px bg-[#E2E8F0] my-1" />
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors">Remove section</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Permissions Strip */}
                      {openPermsSectionId === section.id && (
                        <div className="bg-[#F8FAFC] border-y border-[#E2E8F0] px-4 py-3 flex items-center mb-5 overflow-x-auto -ml-7 z-10 relative">
                          <div className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-[0.08em] mr-8 shrink-0">Who sees · Who adds</div>
                          <div className="flex items-center gap-8 flex-1">
                            {section.permissions.map(perm => (
                              <div key={perm.role} className="flex flex-col gap-2 shrink-0">
                                <div className="text-[11px] font-medium text-[#0F172A]">{perm.role}</div>
                                <div className="flex items-center gap-3">
                                  {/* View Switch */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-wider">View</span>
                                    <button 
                                      className={`w-6 h-[14px] rounded-[7px] relative transition-colors ${perm.view ? 'bg-[#1D4ED8]' : 'bg-[#CBD5E1]'}`}
                                    >
                                      <div className={`absolute top-[2px] left-[2px] w-[10px] h-[10px] bg-white rounded-full transition-transform ${perm.view ? 'translate-x-[10px]' : ''}`} />
                                    </button>
                                  </div>
                                  {/* Upload Switch */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-wider">Upload</span>
                                    <button 
                                      className={`w-6 h-[14px] rounded-[7px] relative transition-colors ${perm.upload ? 'bg-[#1D4ED8]' : 'bg-[#CBD5E1]'}`}
                                    >
                                      <div className={`absolute top-[2px] left-[2px] w-[10px] h-[10px] bg-white rounded-full transition-transform ${perm.upload ? 'translate-x-[10px]' : ''}`} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="font-mono text-[10px] text-[#64748B] ml-8 shrink-0">
                            responsible: <span className="text-[#0F172A]">{section.owner}</span>
                          </div>
                        </div>
                      )}

                      {/* Subsections */}
                      {!isCollapsed && (
                        <div className="pl-6 space-y-8 border-l border-[#E2E8F0] ml-3 mt-4 relative z-0">
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
                                    {block.id === editedBlockId ? (
                                      // Editing State (Inline)
                                      <div className="bg-white border-2 border-[#1D4ED8] rounded-[4px] p-3 flex shadow-sm relative z-10 flex-col">
                                        <div className="flex">
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
                                              
                                              {block.kind === "document" && (
                                                <>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[#64748B]">Req:</span>
                                                    <select 
                                                      value={localReq || block.requirement} 
                                                      onChange={(e) => setLocalReq(e.target.value as RequirementLevel)}
                                                      className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px cursor-pointer"
                                                    >
                                                      <option value="required">{requirementLabel("required")}</option>
                                                      <option value="required_alt">{requirementLabel("required_alt")}</option>
                                                      <option value="recommended">{requirementLabel("recommended")}</option>
                                                      <option value="optional">{requirementLabel("optional")}</option>
                                                    </select>
                                                  </div>
                                                  <div className="text-[#CBD5E1]">|</div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[#64748B]">Weight:</span>
                                                    <select 
                                                      defaultValue={block.criticality}
                                                      className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px cursor-pointer"
                                                    >
                                                      <option value="critical">{criticalityLabel("critical")}</option>
                                                      <option value="standard">{criticalityLabel("standard")}</option>
                                                      <option value="supporting">{criticalityLabel("supporting")}</option>
                                                    </select>
                                                  </div>
                                                  <div className="text-[#CBD5E1]">|</div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[#64748B]">Sourcing:</span>
                                                    <select 
                                                      defaultValue={block.sourcing}
                                                      className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px cursor-pointer"
                                                    >
                                                      <option value="readily_available">{sourcingLabel("readily_available")}</option>
                                                      <option value="constrained">{sourcingLabel("constrained")}</option>
                                                      <option value="scarce">{sourcingLabel("scarce")}</option>
                                                    </select>
                                                  </div>
                                                  <div className="text-[#CBD5E1]">|</div>
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
                                        
                                        {block.kind === "document" && localReq === "required_alt" && (
                                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0] ml-6">
                                            <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">SATISFIED BY ANY OF:</span>
                                            {groupForPrimary(PURCHASE_LOAN, block.id)?.satisfiedBy.map((altId, idx, arr) => (
                                              <React.Fragment key={altId}>
                                                <span className="text-[11px] text-[#334155]">{blockName(PURCHASE_LOAN, altId)} <span className="text-[#94A3B8]">({getBlockSectionNumber(PURCHASE_LOAN, altId)})</span></span>
                                                {idx < arr.length - 1 && <span className="text-[#CBD5E1]">,</span>}
                                              </React.Fragment>
                                            ))}
                                            <button className="text-[10px] text-[#64748B] border-b border-dashed border-[#CBD5E1] hover:text-[#0F172A] hover:border-[#94A3B8] transition-colors ml-1">
                                              + add alternative
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      // Rest State
                                      <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-2.5 flex group hover:border-[#CBD5E1] transition-colors shadow-sm">
                                        <GripVertical size={14} className="text-[#94A3B8] mr-2 mt-[1px] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity" />
                                        <div className="flex-1">
                                          <div className="text-[12.5px] font-medium text-[#0F172A]">{block.name}</div>
                                          
                                          {block.kind === "document" && (
                                            <div className="font-mono text-[10.5px] mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
                                              <span className="text-[#64748B]">{block.formats.join(", ")}</span>
                                              <span className="text-[#CBD5E1]">•</span>
                                              <DocDimensions block={block} template={PURCHASE_LOAN} variant="labels" />
                                              <span className="text-[#CBD5E1]">•</span>
                                              <span className="text-[#64748B]">{expiryLabel(block.expiry)}</span>
                                              {block.multiPage && (
                                                <>
                                                  <span className="text-[#CBD5E1]">•</span>
                                                  <span className="text-[#64748B]">multi-page</span>
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
                                        <div className="h-[2px] bg-[#1D4ED8] w-full relative">
                                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] bg-[#F3F5F7] border-[2px] border-[#1D4ED8] rounded-full" />
                                        </div>
                                        <div className="absolute -top-[7px] left-6 font-mono text-[9.5px] text-[#1D4ED8] bg-[#F3F5F7] px-1.5 tracking-[0.05em] font-medium z-10">
                                          DROP — DOCUMENT UPLOAD
                                        </div>
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
                        <div className="h-[2px] bg-[#1D4ED8] w-full relative">
                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[8px] h-[8px] bg-[#F3F5F7] border-[2px] border-[#1D4ED8] rounded-full" />
                        </div>
                        <div className="absolute -top-[7px] left-6 font-mono text-[9.5px] text-[#1D4ED8] bg-[#F3F5F7] px-1.5 tracking-[0.05em] font-medium z-10">
                          DROP — STANDARD APPLICATION · 3 BLOCKS
                        </div>
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

          {/* Right Preview Pane */}
          {showPreview && (
            <aside className="w-[420px] bg-[#EFF1F4] border-l border-[#E2E8F0] flex flex-col shrink-0 relative z-10 shadow-[-8px_0_24px_rgba(15,23,42,0.03)]">
              <div className="p-6 pb-2 border-b border-[#E2E8F0]">
                {/* Control Row */}
                <div className="flex flex-col items-start gap-2.5 mb-4">
                  <div className="flex bg-[#E2E8F0] p-0.5 rounded-[6px] shadow-inner">
                    <button onClick={() => updatePview('mobile')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] transition-colors ${pview === 'mobile' ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                      <Smartphone size={14} /> <span className="text-[11px] font-medium">Mobile</span>
                    </button>
                    <button onClick={() => updatePview('desktop')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] transition-colors ${pview === 'desktop' ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                      <Monitor size={14} /> <span className="text-[11px] font-medium">Desktop</span>
                    </button>
                    <button onClick={() => updatePview('register')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] transition-colors ${pview === 'register' ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                      <List size={14} /> <span className="text-[11px] font-medium">Register</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] px-2.5 py-1 rounded-[4px] shadow-sm flex-none whitespace-nowrap">
                    <span className="text-[10px] text-[#64748B] uppercase tracking-wide">Previewing as:</span>
                    <span className="font-mono text-[11px] text-[#0F172A] font-medium">Applicant</span>
                    <ChevronDown size={14} className="text-[#94A3B8]" />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 pt-8">
                
                {pview === "mobile" && (
                  <div className="w-[300px] h-[600px] mx-auto border-[1.5px] border-[#0F172A] rounded-[24px] bg-[#F8FAFC] flex flex-col overflow-hidden relative shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                    <div className="px-5 pt-12 pb-4 bg-white border-b border-[#E2E8F0] shrink-0">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: totalSections }).map((_, i) => (
                          <div key={i} className={`h-[2px] flex-1 rounded-full ${i < targetSectionIndex ? 'bg-[#1D4ED8]' : 'bg-[#E2E8F0]'}`} />
                        ))}
                      </div>
                      <div className="font-mono text-[10px] text-[#64748B] tracking-wider mb-1">SECTION {targetSectionIndex.toString().padStart(2, '0')} OF {totalSections.toString().padStart(2, '0')}</div>
                      <div className="text-[20px] font-semibold text-[#0F172A] leading-tight">{targetSection.name}</div>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-4 space-y-3">
                      {targetSection.subsections.map(ss => 
                        ss.blocks.map((block, bIdx) => (
                          <div key={block.id} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3 shadow-sm flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-[13px] font-medium text-[#0F172A] leading-snug">{block.name}</div>
                              {block.kind === "document" && <DocDimensions block={block} template={PURCHASE_LOAN} variant="icons" initTipOpen={showTip && bIdx === 0 && ss === targetSection.subsections[0]} />}
                            </div>
                            
                            {block.kind === "document" && (
                              <>
                                <div className="font-mono text-[10px] text-[#64748B]">{block.formats.join(", ")} · {expiryLabel(block.expiry)}</div>
                                
                                {block.id === "bank-statements" ? (
                                  <div className="flex items-center gap-2 mt-1 pt-3 border-t border-[#F1F5F9]">
                                    <span className="font-mono text-[11px] text-[#15803D]">chase_checking_jun.pdf</span>
                                    <div className="flex-1" />
                                    <span className="text-[11px] text-[#15803D] font-medium">filed</span>
                                  </div>
                                ) : (
                                  <div className="border border-dashed border-[#CBD5E1] bg-[#F8FAFC] rounded-[4px] py-2.5 flex items-center justify-center gap-1.5 text-[#64748B] mt-1">
                                    <Upload size={14} />
                                    <span className="text-[12px] font-medium">Add file</span>
                                  </div>
                                )}
                              </>
                            )}

                            {block.kind === "fields" && (
                              <div className="mt-1 space-y-3">
                                {block.fields.map(f => (
                                  <div key={f.id}>
                                    <div className="text-[11px] text-[#475569] mb-1">{f.label} {f.required && "*"}</div>
                                    <div className="h-8 border border-[#E2E8F0] rounded-[4px] bg-[#F8FAFC]" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0">
                      <button className="w-full bg-[#1D4ED8] text-white font-medium text-[13px] py-2.5 rounded-[6px] shadow-sm">Save & continue</button>
                    </div>
                  </div>
                )}

                {pview === "desktop" && (
                  <div className="w-full max-w-[460px] mx-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] flex flex-col overflow-hidden relative shadow-sm">
                    <div className="px-6 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shrink-0">
                      <div className="flex gap-1 mb-4 w-[200px]">
                        {Array.from({ length: totalSections }).map((_, i) => (
                          <div key={i} className={`h-[2px] flex-1 rounded-full ${i < targetSectionIndex ? 'bg-[#1D4ED8]' : 'bg-[#E2E8F0]'}`} />
                        ))}
                      </div>
                      <div className="font-mono text-[10px] text-[#64748B] tracking-wider mb-1">SECTION {targetSectionIndex.toString().padStart(2, '0')} OF {totalSections.toString().padStart(2, '0')}</div>
                      <div className="text-[20px] font-semibold text-[#0F172A] leading-tight">{targetSection.name}</div>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-6 space-y-4">
                      {targetSection.subsections.map(ss => 
                        ss.blocks.map(block => (
                          <div key={block.id} className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-sm flex flex-col gap-2">
                            <div className="text-[14px] font-medium text-[#0F172A] leading-snug">{block.name}</div>
                            
                            {block.kind === "document" && (
                              <>
                                <div className="font-mono text-[10.5px] flex flex-wrap gap-x-2 gap-y-1 items-center mt-1">
                                  <span className="text-[#64748B]">{block.formats.join(", ")}</span>
                                  <span className="text-[#CBD5E1]">•</span>
                                  <DocDimensions block={block} template={PURCHASE_LOAN} variant="labels" />
                                  <span className="text-[#CBD5E1]">•</span>
                                  <span className="text-[#64748B]">{expiryLabel(block.expiry)}</span>
                                </div>
                                
                                {block.id === "bank-statements" ? (
                                  <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[#F1F5F9]">
                                    <span className="font-mono text-[12px] text-[#15803D]">chase_checking_jun.pdf</span>
                                    <div className="flex-1" />
                                    <span className="text-[12px] text-[#15803D] font-medium">filed</span>
                                  </div>
                                ) : (
                                  <div className="border border-dashed border-[#CBD5E1] bg-[#F8FAFC] rounded-[4px] py-3 flex items-center justify-center gap-1.5 text-[#64748B] mt-2">
                                    <Upload size={14} />
                                    <span className="text-[13px] font-medium">Add file</span>
                                  </div>
                                )}
                              </>
                            )}

                            {block.kind === "fields" && (
                              <div className="mt-2 space-y-4">
                                {block.fields.map(f => (
                                  <div key={f.id}>
                                    <div className="text-[12px] text-[#475569] mb-1.5">{f.label} {f.required && "*"}</div>
                                    <div className="h-9 border border-[#E2E8F0] rounded-[4px] bg-[#F8FAFC]" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-6 bg-white border-t border-[#E2E8F0] shrink-0">
                      <button className="bg-[#1D4ED8] text-white font-medium text-[13px] px-6 py-2.5 rounded-[6px] shadow-sm">Save & continue</button>
                    </div>
                  </div>
                )}

                {pview === "register" && (
                  <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                          <th className="px-2 py-2 font-mono text-[9px] text-[#64748B] uppercase tracking-wider font-normal">Requirement</th>
                          <th className="px-2 py-2 font-mono text-[9px] text-[#64748B] uppercase tracking-wider font-normal">Req</th>
                          <th className="px-2 py-2 font-mono text-[9px] text-[#64748B] uppercase tracking-wider font-normal">Weight</th>
                          <th className="px-2 py-2 font-mono text-[9px] text-[#64748B] uppercase tracking-wider font-normal">Responsible</th>
                          <th className="px-2 py-2 font-mono text-[9px] text-[#64748B] uppercase tracking-wider font-normal">Clock</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-[10px] text-[#0F172A] divide-y divide-[#E2E8F0]">
                        {targetDocs.map(doc => (
                          <tr key={doc.id}>
                            <td className="px-2 py-2.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[104px]" title={doc.name}>{doc.name}</td>
                            <td className="px-2 py-2.5 text-[#64748B]">
                              {doc.requirement === "required" ? "req" : doc.requirement === "required_alt" ? "req·alt" : doc.requirement === "recommended" ? "rec" : "opt"}
                            </td>
                            <td className="px-2 py-2.5 text-[#64748B]">
                              {doc.criticality === "critical" ? "crit" : doc.criticality === "standard" ? "std" : "supp"}
                            </td>
                            <td className="px-2 py-2.5">Applicant</td>
                            <td className="px-2 py-2.5 text-[#64748B] whitespace-nowrap">
                              {doc.expiry === null ? "—" : doc.expiry.kind === "hard" ? "closing" : `${doc.expiry.days}d clock`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Shared Captions */}
                <div className="mt-6 space-y-1.5 text-center">
                  <div className="font-mono text-[10.5px] text-[#64748B]">renders from the same JSON — one definition, every view</div>
                  {appHiddenSections && (
                    <div className="font-mono text-[10px] text-[#94A3B8]">hidden from Applicant: {appHiddenSections}</div>
                  )}
                </div>

              </div>
            </aside>
          )}

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