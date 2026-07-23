import React, { useState, useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { TEMPLATE_INDEX, TemplateListing } from "./builderData";

// URL Params Supported:
// ?menu=1 - Starts with the version menu open on purchase-ca-v3 (the active CA Purchase version)

export default function FormLibrary() {
  const [params, setParams] = useState(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));
  const isMenuInit = params.get("menu") === "1";
  const [openMenuId, setOpenMenuId] = useState<string | null>(isMenuInit ? "purchase-ca-v3" : null);

  useEffect(() => {
    const handlePopState = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const families = Object.values(TEMPLATE_INDEX.reduce((acc, t) => {
    if (!acc[t.name]) acc[t.name] = { name: t.name, program: t.program, versions: [] };
    acc[t.name].versions.push(t);
    return acc;
  }, {} as Record<string, { name: string, program: string, versions: TemplateListing[] }>));

  const totalVersions = TEMPLATE_INDEX.length;
  const totalFamilies = families.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}} />
      
      <div className="w-full min-h-[100dvh] flex flex-col font-sans bg-[#F3F5F7] text-[#0F172A] selection:bg-[#BFDBFE] selection:text-[#1E40AF]">
        
        {/* Header */}
        <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 z-10 sticky top-0">
          <div className="text-[14px] font-medium text-[#0F172A] mr-3">Form Templates</div>
          <div className="font-mono text-[11px] text-[#64748B] tracking-wide">
            {totalFamilies} families · {totalVersions} versions
          </div>
          <div className="flex-1" />
          <button className="bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px] shadow-sm">
            New template
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 pb-32">
          <div className="max-w-[960px] mx-auto space-y-12">
            
            {families.map((family) => (
              <div key={family.name}>
                <div className="mb-4">
                  <h2 className="text-[15px] font-semibold text-[#0F172A]">{family.name}</h2>
                  <div className="font-mono text-[10.5px] text-[#64748B] mt-0.5">{family.program}</div>
                </div>
                
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-sm flex flex-col">
                  {family.versions.map((v, vIdx) => {
                    const isMenuOpen = openMenuId === v.id;
                    const nextVersionNumber = v.version + 1;
                    
                    return (
                      <div 
                        key={v.id} 
                        className={`flex items-center p-4 group ${vIdx < family.versions.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
                      >
                        <div className="font-mono text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[2px] mr-3">
                          v{v.version}
                        </div>
                        
                        {v.status === "draft" ? (
                          <div className="font-mono text-[10px] font-medium text-[#64748B] uppercase tracking-[0.06em] border border-[#CBD5E1] px-1.5 py-0.5 rounded-[2px] mr-4">
                            draft
                          </div>
                        ) : (
                          <div className="font-mono text-[10px] font-medium text-[#1D4ED8] uppercase tracking-[0.06em] border border-[#BFDBFE] px-1.5 py-0.5 rounded-[2px] mr-4">
                            active
                          </div>
                        )}

                        <div className="font-mono text-[11px] text-[#64748B] flex-1">
                          {v.sections} sections · {v.docs} docs · updated {v.updated}
                        </div>
                        
                        <div className="font-mono text-[11px] text-[#94A3B8] mr-4 text-right min-w-[180px]">
                          {v.status === "draft" ? "— not assignable" : `in use by ${v.inUseBy} applications`}
                        </div>

                        <div className="relative">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(isMenuOpen ? null : v.id);
                            }} 
                            className={`p-1.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-[4px] hover:bg-[#F1F5F9] ${isMenuOpen ? 'opacity-100 bg-[#F1F5F9] text-[#0F172A]' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-[220px] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] rounded-[4px] py-1 z-50">
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Edit</button>
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Preview</button>
                              <button className="w-full text-left px-3 py-1.5 hover:bg-[#F8FAFC] transition-colors flex flex-col group/update">
                                <span className="text-[12.5px] text-[#334155] group-hover/update:text-[#0F172A]">Update to a new version</span>
                                <span className="font-mono text-[10px] text-[#64748B] mt-0.5">copies v{v.version} → v{nextVersionNumber} draft · v{v.version} stays active</span>
                              </button>
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Duplicate</button>
                              <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">Export JSON</button>
                              <div className="h-px bg-[#E2E8F0] my-1" />
                              {v.status === "draft" ? (
                                <button className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors">Activate</button>
                              ) : (
                                <button disabled className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#94A3B8] cursor-not-allowed">Retire version</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
          </div>
        </main>
      </div>
    </>
  );
}