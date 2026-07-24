import React, { useState, useEffect, useRef } from "react";
import { Link, useRoute } from "wouter";
import { GripVertical, ChevronDown, ChevronRight, MoreHorizontal, Eye, Monitor, Smartphone, List, Upload } from "lucide-react";
import {
  useGetTemplate,
  useSaveTemplate,
  useListSavedSections,
  useCreateSavedSection,
  getGetTemplateQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DocDimensions } from "../dimensions/DocDimensions";
import { templateStats, expiryLabel, requirementLabel, criticalityLabel, sourcingLabel, groupForPrimary, blockName, getSectionNumber } from "../dimensions/helpers";
import { Template, Section, BlockRequirement } from "@workspace/api-client-react";

const PALETTE = [
  { kind: "section" as const,    label: "Section",        hint: "Top-level group with an owner" },
  { kind: "subsection" as const, label: "Subsection",     hint: "Group inside a section" },
  { kind: "document" as const,   label: "Document upload", hint: "A required page or multi-page document" },
  { kind: "fields" as const,     label: "Field group",    hint: "Typed inputs — text, date, select" },
];

export function TemplateEditor() {
  const [match, params] = useRoute("/builder/:family/:version");
  const family = params?.family || "";
  const version = parseInt(params?.version || "1", 10);
  
  const { data: serverTemplate, isLoading, error } = useGetTemplate(family, version, { query: { enabled: !!family, queryKey: getGetTemplateQueryKey(family, version) } });
  const { data: savedSections = [] } = useListSavedSections();
  const saveTemplateFn = useSaveTemplate();
  const queryClient = useQueryClient();

  // Local state for edits
  const [template, setTemplate] = useState<Template | null>(null);
  const initializedFor = useRef("");

  useEffect(() => {
    if (serverTemplate && initializedFor.current !== `${family}-${version}`) {
      setTemplate(serverTemplate);
      initializedFor.current = `${family}-${version}`;
    }
  }, [serverTemplate, family, version]);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openPermsSectionId, setOpenPermsSectionId] = useState<string | null>(null);
  const [editedBlockId, setEditedBlockId] = useState<string | null>(null);
  const [localReq, setLocalReq] = useState<BlockRequirement | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (!template || template.status === 'active') return;
    saveTemplateFn.mutate(
      { family, version, data: template },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetTemplateQueryKey(family, version), updated);
          setTemplate(updated);
        }
      }
    );
  };

  const getSectionStats = (section: Section) => {
    let blocks = 0, docs = 0;
    section.subsections.forEach(ss => {
      blocks += ss.blocks.length;
      ss.blocks.forEach(b => { if (b.kind === "document") docs++; });
    });
    return { blocks, docs };
  };

  if (isLoading || !template) return <div className="p-8 font-mono text-sm text-[#64748B]">Loading template...</div>;
  if (error) return <div className="p-8 font-mono text-sm text-[#B91C1C]">Failed to load template.</div>;

  const stats = templateStats(template);
  const isReadOnly = template.status === "active";

  return (
    <div className="w-full h-[100dvh] flex flex-col font-sans bg-[#F3F5F7] text-[#0F172A] overflow-hidden relative selection:bg-[#BFDBFE] selection:text-[#1E40AF]">
      <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 z-10">
        <Link href="/" className="text-[#64748B] hover:text-[#0F172A] mr-4 transition-colors">
          <ChevronRight size={18} className="rotate-180" />
        </Link>
        <div className="text-[14px] font-medium text-[#0F172A] mr-2">
          {isReadOnly ? template.template : (
            <input 
              value={template.template} 
              onChange={e => setTemplate({...template, template: e.target.value})}
              className="border-b border-dashed border-[#94A3B8] pb-[1px] bg-transparent outline-none focus:border-solid focus:border-[#1D4ED8]"
            />
          )}
        </div>

        <div className="flex-1" />

        <div className="font-mono text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[2px] mr-2">v{template.version}</div>
        {template.status === "draft" ? (
          <div className="font-mono text-[10px] font-medium text-[#64748B] uppercase tracking-[0.06em] border border-[#CBD5E1] px-1.5 py-0.5 rounded-[2px] mr-6">draft</div>
        ) : (
          <div className="font-mono text-[10px] font-medium text-[#1D4ED8] uppercase tracking-[0.06em] border border-[#BFDBFE] px-1.5 py-0.5 rounded-[2px] mr-6">active</div>
        )}
        
        <button onClick={() => setShowJson(!showJson)} className="font-mono text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] mr-4 transition-colors">
          {`{ } JSON`}
        </button>
        
        {!isReadOnly && (
          <button 
            onClick={handleSave} 
            disabled={saveTemplateFn.isPending}
            className="bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#94A3B8] transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px] shadow-sm"
          >
            {saveTemplateFn.isPending ? 'Saving...' : 'Save Draft'}
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[260px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 relative z-10">
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
            <div className={isReadOnly ? 'opacity-50 pointer-events-none' : ''}>
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
            
            <div className={isReadOnly ? 'opacity-50 pointer-events-none' : ''}>
              <div className="h-px bg-[#E2E8F0] mb-4" />
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#64748B] mb-3">Saved Sections</div>
              <div className="space-y-2">
                {savedSections.length === 0 ? (
                  <div className="text-[11px] text-[#94A3B8] italic">No saved sections.</div>
                ) : savedSections.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-2.5 bg-white border border-[#E2E8F0] rounded-[4px] cursor-grab hover:border-[#94A3B8] transition-colors shadow-sm group">
                    <GripVertical size={14} className="text-[#94A3B8] mt-[2px] opacity-60 group-hover:opacity-100 shrink-0" />
                    <div>
                      <div className="text-[13px] font-medium text-[#0F172A] leading-tight">{item.name}</div>
                      <div className="font-mono text-[10px] text-[#64748B] mt-1 leading-snug">
                        {item.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="font-mono text-[10.5px] text-[#64748B] leading-relaxed">
              {stats.sections} sections · {stats.docs} documents<br/>{stats.fieldGroups} field groups
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-8 pb-40">
          <div className="max-w-[760px] mx-auto">
            {template.sections.map((section, sIdx) => {
              const sStats = getSectionStats(section);
              const isCollapsed = collapsedSections[section.id];
              const isMenuOpen = openMenuId === section.id;
              
              return (
                <div key={section.id} className="mb-10 last:mb-0">
                  <div className="flex items-center group mb-4 relative z-20">
                    <button 
                      onClick={() => setCollapsedSections(prev => ({...prev, [section.id]: !prev[section.id]}))} 
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
                    {!isReadOnly && <GripVertical size={15} className="text-[#94A3B8] opacity-0 group-hover:opacity-100 cursor-grab transition-opacity mr-2" />}
                    
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
                          {!isReadOnly && (
                            <>
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Save as block</button>
                              <div className="h-px bg-[#E2E8F0] my-1" />
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors">Remove section</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {openPermsSectionId === section.id && (
                    <div className="bg-[#F8FAFC] border-y border-[#E2E8F0] px-4 py-3 flex items-center mb-5 overflow-x-auto -ml-7 z-10 relative">
                      <div className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-[0.08em] mr-8 shrink-0">Who sees · Who adds</div>
                      <div className="flex items-center gap-8 flex-1">
                        {section.permissions.map(perm => (
                          <div key={perm.role} className="flex flex-col gap-2 shrink-0">
                            <div className="text-[11px] font-medium text-[#0F172A]">{perm.role}</div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-wider">View</span>
                                <button className={`w-6 h-[14px] rounded-[7px] relative transition-colors ${perm.view ? 'bg-[#1D4ED8]' : 'bg-[#CBD5E1]'}`}>
                                  <div className={`absolute top-[2px] left-[2px] w-[10px] h-[10px] bg-white rounded-full transition-transform ${perm.view ? 'translate-x-[10px]' : ''}`} />
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] text-[#64748B] uppercase tracking-wider">Upload</span>
                                <button className={`w-6 h-[14px] rounded-[7px] relative transition-colors ${perm.upload ? 'bg-[#1D4ED8]' : 'bg-[#CBD5E1]'}`}>
                                  <div className={`absolute top-[2px] left-[2px] w-[10px] h-[10px] bg-white rounded-full transition-transform ${perm.upload ? 'translate-x-[10px]' : ''}`} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isCollapsed && (
                    <div className="pl-6 space-y-8 border-l border-[#E2E8F0] ml-3 mt-4 relative z-0">
                      {section.subsections.map(subsection => (
                        <div key={subsection.id} className="relative">
                          <div className="text-[10.5px] font-semibold text-[#64748B] uppercase tracking-[0.08em] mb-3 -ml-[25px] bg-[#F3F5F7] px-1 inline-block">
                            {subsection.name}
                          </div>
                          
                          <div className="space-y-2.5 ml-4">
                            {subsection.blocks.map((block) => (
                              <React.Fragment key={block.id}>
                                {block.id === editedBlockId && !isReadOnly ? (
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
                                          <button onClick={() => setEditedBlockId(null)} className="ml-2 text-[11px] text-[#1D4ED8] font-medium">Done</button>
                                        </div>
                                        <div className="flex items-center gap-3 font-mono text-[11px] mt-2.5 bg-[#F8FAFC] p-2 rounded-[2px] border border-[#E2E8F0] flex-wrap">
                                          {block.kind === "document" && (
                                            <>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[#64748B]">Req:</span>
                                                <select 
                                                  value={localReq || block.requirement || "optional"} 
                                                  onChange={(e) => setLocalReq(e.target.value as BlockRequirement)}
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
                                                <select defaultValue={block.criticality} className="border-b border-[#CBD5E1] outline-none text-[#0F172A] bg-transparent focus:border-[#1D4ED8] pb-px cursor-pointer">
                                                  <option value="critical">{criticalityLabel("critical")}</option>
                                                  <option value="standard">{criticalityLabel("standard")}</option>
                                                  <option value="supporting">{criticalityLabel("supporting")}</option>
                                                </select>
                                              </div>
                                              <div className="text-[#CBD5E1]">|</div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[#64748B]">Fmt:</span>
                                                <input type="text" defaultValue={(block.formats||[]).join(", ")} className="border-b border-[#CBD5E1] outline-none text-[#0F172A] w-24 bg-transparent focus:border-[#1D4ED8] pb-px" />
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {block.kind === "document" && (localReq === "required_alt" || block.requirement === "required_alt") && (
                                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E2E8F0] ml-6">
                                        <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">SATISFIED BY ANY OF:</span>
                                        {groupForPrimary(template, block.id)?.satisfiedBy?.map((altId, idx, arr) => (
                                          <React.Fragment key={altId}>
                                            <span className="text-[11px] text-[#334155]">{blockName(template, altId)} <span className="text-[#94A3B8]">({getSectionNumber(template, altId)})</span></span>
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
                                  <div 
                                    className={`bg-white border border-[#E2E8F0] rounded-[4px] p-2.5 flex group shadow-sm ${!isReadOnly ? 'hover:border-[#CBD5E1] cursor-pointer' : ''}`}
                                    onClick={() => !isReadOnly && setEditedBlockId(block.id)}
                                  >
                                    {!isReadOnly && <GripVertical size={14} className="text-[#94A3B8] mr-2 mt-[1px] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity" />}
                                    <div className="flex-1">
                                      <div className="text-[12.5px] font-medium text-[#0F172A]">{block.name}</div>
                                      
                                      {block.kind === "document" ? (
                                        <div className="font-mono text-[10.5px] mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
                                          <span className="text-[#64748B]">{(block.formats||[]).join(", ")}</span>
                                          <span className="text-[#CBD5E1]">•</span>
                                          <DocDimensions block={block} template={template} variant="labels" />
                                          <span className="text-[#CBD5E1]">•</span>
                                          <span className="text-[#64748B]">{expiryLabel(block.expiry)}</span>
                                          {block.multiPage && (
                                            <>
                                              <span className="text-[#CBD5E1]">•</span>
                                              <span className="text-[#64748B]">multi-page</span>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="font-mono text-[10.5px] text-[#64748B] mt-1">
                                          {block.fields?.map(f => f.label).join(", ")}
                                        </div>
                                      )}
                                    </div>
                                    {!isReadOnly && (
                                      <button className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#B91C1C] transition-all ml-2 self-start rounded-[2px] hover:bg-[#FEF2F2]">
                                        <MoreHorizontal size={14} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                            {!isReadOnly && (
                              <button className="text-[11px] font-medium text-[#64748B] border border-dashed border-[#CBD5E1] rounded-[4px] w-full py-2 hover:border-[#94A3B8] hover:text-[#0F172A] transition-colors bg-white/50">
                                + Add block
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && (
                        <button className="text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors flex items-center -ml-[25px]">
                          <span className="border-b border-dashed border-[#CBD5E1] hover:border-[#94A3B8]">
                            + Add subsection
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!isReadOnly && (
              <button className="text-[13px] font-medium text-[#64748B] border-2 border-dashed border-[#CBD5E1] rounded-[6px] w-full py-4 hover:border-[#94A3B8] hover:text-[#0F172A] transition-colors bg-white/50">
                + Add Section
              </button>
            )}
          </div>
        </main>
      </div>

      {showJson && (
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#0F172A] border-t border-[#334155] z-50 flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
            <div className="text-[11px] font-mono text-[#94A3B8]">template.json</div>
            <button onClick={() => setShowJson(false)} className="text-[11px] text-[#94A3B8] hover:text-white transition-colors">Close</button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className="font-mono text-[11px] text-[#E2E8F0] leading-relaxed">
              {JSON.stringify(template, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
