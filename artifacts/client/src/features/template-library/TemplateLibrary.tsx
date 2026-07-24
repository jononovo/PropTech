import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MoreHorizontal } from "lucide-react";
import {
  useListTemplates,
  useCreateNewVersion,
  useDuplicateTemplate,
  useActivateTemplate,
  useCreateTemplate,
  getListTemplatesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { TemplateListing } from "@workspace/api-client-react";

export function TemplateLibrary() {
  const { data: templates = [], isLoading, error } = useListTemplates();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const createVersion = useCreateNewVersion();
  const duplicateTpl = useDuplicateTemplate();
  const activateTpl = useActivateTemplate();
  const createTpl = useCreateTemplate();

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="p-8 font-mono text-sm text-[#64748B]">Loading library...</div>;
  }
  if (error) {
    return <div className="p-8 font-mono text-sm text-[#B91C1C]">Failed to load templates.</div>;
  }

  const families = Object.values(templates.reduce((acc, t) => {
    if (!acc[t.family]) acc[t.family] = { family: t.family, name: t.name, program: t.program, versions: [] };
    acc[t.family].versions.push(t);
    return acc;
  }, {} as Record<string, { family: string, name: string, program: string, versions: TemplateListing[] }>));

  const handleCreateTemplate = () => {
    createTpl.mutate(
      { data: { name: "New Template", program: "General" } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          setLocation(`/builder/${res.family}/${res.version}`);
        }
      }
    );
  };

  const handleUpdateVersion = (family: string, version: number) => {
    createVersion.mutate(
      { family, version },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          setLocation(`/builder/${res.family}/${res.version}`);
        }
      }
    );
  };

  const handleActivate = (family: string, version: number) => {
    activateTpl.mutate(
      { family, version },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        }
      }
    );
  };

  const handleDuplicate = (family: string, version: number, name: string) => {
    duplicateTpl.mutate(
      { family, version, data: { name: `${name} (Copy)` } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          setLocation(`/builder/${res.family}/${res.version}`);
        }
      }
    );
  };

  const handleExportJson = (family: string, version: number) => {
    // In a real app we'd fetch the template JSON and download it.
    // For now we just alert.
    alert(`Exporting ${family} v${version}`);
  };

  const totalVersions = templates.length;
  const totalFamilies = families.length;

  return (
    <div className="w-full flex flex-col flex-1">
      <main className="flex-1 p-8 pb-32">
        <div className="max-w-[960px] mx-auto space-y-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[16px] font-semibold text-[#0F172A]">Form Templates</h1>
              <div className="font-mono text-[11px] text-[#64748B] tracking-wide mt-1">
                {totalFamilies} families · {totalVersions} versions
              </div>
            </div>
            <button
              onClick={handleCreateTemplate}
              data-testid="button-new-template"
              className="bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px] shadow-sm"
            >
              New template
            </button>
          </div>
          {families.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-[14px] text-[#64748B]">No templates found.</div>
            </div>
          ) : (
            families.map((family) => (
              <div key={family.family}>
                <div className="mb-4">
                  <h2 className="text-[15px] font-semibold text-[#0F172A]">{family.name}</h2>
                  <div className="font-mono text-[10.5px] text-[#64748B] mt-0.5">{family.program}</div>
                </div>
                
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-sm flex flex-col">
                  {family.versions.map((v, vIdx) => {
                    const uniqueId = `${family.family}-v${v.version}`;
                    const isMenuOpen = openMenuId === uniqueId;
                    const nextVersionNumber = v.version + 1;
                    
                    return (
                      <div 
                        key={uniqueId} 
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
                          {v.sections} sections · {v.docs} docs · updated {new Date(v.updated).toLocaleDateString()}
                        </div>
                        
                        <div className="font-mono text-[11px] text-[#94A3B8] mr-4 text-right min-w-[180px]">
                          {v.status === "draft" ? "— not assignable" : `in use by ${v.inUseBy} applications`}
                        </div>

                        <div className="relative">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(isMenuOpen ? null : uniqueId);
                            }} 
                            className={`p-1.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-[4px] hover:bg-[#F1F5F9] ${isMenuOpen ? 'opacity-100 bg-[#F1F5F9] text-[#0F172A]' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-[220px] bg-white border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] rounded-[4px] py-1 z-50">
                              <button 
                                onClick={() => setLocation(`/builder/${family.family}/${v.version}`)}
                                className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                              >
                                {v.status === 'draft' ? 'Edit' : 'View'}
                              </button>
                              
                              <button 
                                onClick={() => handleUpdateVersion(family.family, v.version)}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#F8FAFC] transition-colors flex flex-col group/update"
                              >
                                <span className="text-[12.5px] text-[#334155] group-hover/update:text-[#0F172A]">Update to a new version</span>
                                <span className="font-mono text-[10px] text-[#64748B] mt-0.5">copies v{v.version} → v{nextVersionNumber} draft</span>
                              </button>
                              
                              <button 
                                onClick={() => handleDuplicate(family.family, v.version, family.name)}
                                className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                              >
                                Duplicate
                              </button>
                              
                              <button 
                                onClick={() => handleExportJson(family.family, v.version)}
                                className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                              >
                                Export JSON
                              </button>
                              <div className="h-px bg-[#E2E8F0] my-1" />
                              {v.status === "draft" ? (
                                <button 
                                  onClick={() => handleActivate(family.family, v.version)}
                                  className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors"
                                >
                                  Activate
                                </button>
                              ) : (
                                <button disabled className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#94A3B8] cursor-not-allowed">
                                  Retire version
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
