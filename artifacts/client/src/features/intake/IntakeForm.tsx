import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { ChevronRight, Upload, X, FileText } from "lucide-react";
import {
  useGetApplication,
  useSaveFieldValues,
  useUploadDocument,
  useDeleteDocument,
  getGetApplicationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DocDimensions } from "../dimensions/DocDimensions";
import { PermissionRole } from "@workspace/api-client-react";

export function IntakeForm() {
  const [match, params] = useRoute("/apply/:applicationId");
  const appId = params?.applicationId || "";
  
  const { data: application, isLoading, error } = useGetApplication(appId, { query: { enabled: !!appId, queryKey: getGetApplicationQueryKey(appId) } });
  const saveFieldsFn = useSaveFieldValues();
  const uploadDocFn = useUploadDocument();
  const deleteDocFn = useDeleteDocument();
  const queryClient = useQueryClient();

  const [activeRole, setActiveRole] = useState<PermissionRole>("Applicant");
  const [fieldState, setFieldState] = useState<Record<string, Record<string, string>>>({});
  
  // Initialize local field state from server data
  const initializedFor = useRef("");
  useEffect(() => {
    if (application && initializedFor.current !== appId) {
      setFieldState(application.fieldValues || {});
      initializedFor.current = appId;
    }
  }, [application, appId]);

  if (isLoading || !application) return <div className="p-8 font-mono text-sm text-[#64748B]">Loading application...</div>;
  if (error) return <div className="p-8 font-mono text-sm text-[#B91C1C]">Failed to load application.</div>;

  const tpl = application.template;

  // Filter sections by role view permission
  const visibleSections = tpl.sections.filter(s => {
    const perm = s.permissions.find(p => p.role === activeRole);
    return perm?.view;
  });

  const handleFieldChange = (blockId: string, fieldId: string, value: string) => {
    setFieldState(prev => ({
      ...prev,
      [blockId]: {
        ...(prev[blockId] || {}),
        [fieldId]: value
      }
    }));
  };

  const handleFieldSave = (blockId: string) => {
    saveFieldsFn.mutate(
      { applicationId: appId, blockId, data: { values: fieldState[blockId] || {} } },
      {
        onSuccess: (updatedApp) => {
          queryClient.setQueryData(getGetApplicationQueryKey(appId), updatedApp);
        }
      }
    );
  };

  const handleFileUpload = (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    uploadDocFn.mutate(
      { applicationId: appId, blockId, data: { file } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
        }
      }
    );
    e.target.value = "";
  };

  const handleDeleteFile = (blockId: string, filename: string) => {
    deleteDocFn.mutate(
      { applicationId: appId, blockId, filename },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
        }
      }
    );
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col font-sans bg-[#F3F5F7] text-[#0F172A] selection:bg-[#BFDBFE] selection:text-[#1E40AF]">
      <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 z-10 sticky top-0">
        <Link href="/applications" className="text-[#64748B] hover:text-[#0F172A] mr-4 transition-colors">
          <ChevronRight size={18} className="rotate-180" />
        </Link>
        <div className="text-[14px] font-medium text-[#0F172A] mr-3">{application.applicantName}</div>
        <div className="font-mono text-[11px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[2px] mr-6">
          {tpl.template} v{tpl.version}
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">Viewing As:</span>
          <select 
            value={activeRole} 
            onChange={e => setActiveRole(e.target.value as PermissionRole)}
            className="text-[12.5px] font-medium bg-[#F1F5F9] border border-[#CBD5E1] rounded-[4px] px-2 py-1 outline-none focus:border-[#1D4ED8]"
          >
            {["Applicant", "Originator", "Underwriter", "Manager"].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 p-8 pb-32">
        <div className="max-w-[760px] mx-auto space-y-12">
          {visibleSections.length === 0 ? (
            <div className="text-center py-20 text-[14px] text-[#64748B]">
              This role has no sections visible.
            </div>
          ) : (
            visibleSections.map((section, sIdx) => {
              const perm = section.permissions.find(p => p.role === activeRole);
              const canUpload = perm?.upload;
              
              return (
                <div key={section.id} className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-sm overflow-hidden">
                  <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-4 flex items-center">
                    <div className="font-mono text-[13px] text-[#94A3B8] w-6 font-medium">
                      {(sIdx + 1).toString().padStart(2, '0')}
                    </div>
                    <h2 className="text-[15px] font-semibold text-[#0F172A] flex-1">{section.name}</h2>
                    <div className="px-1.5 py-0.5 bg-[#E2E8F0] text-[#475569] text-[9.5px] uppercase tracking-[0.06em] font-semibold rounded-[2px]">
                      Owner: {section.owner}
                    </div>
                  </div>

                  <div className="p-5 space-y-8">
                    {section.subsections.map(sub => (
                      <div key={sub.id}>
                        <h3 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-[0.08em] mb-4">
                          {sub.name}
                        </h3>
                        
                        <div className="space-y-4">
                          {sub.blocks.map(block => {
                            const isDoc = block.kind === "document";
                            
                            return (
                              <div key={block.id} className="border border-[#E2E8F0] rounded-[4px] overflow-hidden">
                                <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2.5 flex items-center">
                                  <div className="flex-1">
                                    <div className="text-[13px] font-medium text-[#0F172A]">{block.name}</div>
                                    {isDoc && (
                                      <div className="mt-1">
                                        <DocDimensions block={block} template={tpl} variant="labels" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-white">
                                  {isDoc ? (
                                    // Document Block
                                    <div>
                                      {application.uploads[block.id]?.length > 0 ? (
                                        <div className="space-y-2 mb-4">
                                          {application.uploads[block.id].map(file => (
                                            <div key={file.filename} className="flex items-center justify-between border border-[#E2E8F0] rounded-[4px] p-2 bg-[#F8FAFC]">
                                              <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-[#64748B]" />
                                                <div>
                                                  <div className="text-[12.5px] text-[#0F172A]">{file.filename}</div>
                                                  <div className="font-mono text-[10px] text-[#64748B]">
                                                    {(file.size / 1024).toFixed(1)} KB · {new Date(file.uploadedAt).toLocaleDateString()}
                                                  </div>
                                                </div>
                                              </div>
                                              {canUpload && (
                                                <button 
                                                  onClick={() => handleDeleteFile(block.id, file.filename)}
                                                  className="p-1 text-[#94A3B8] hover:text-[#B91C1C] transition-colors"
                                                >
                                                  <X size={16} />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[12.5px] text-[#64748B] mb-4 italic">No documents filed yet.</div>
                                      )}
                                      
                                      {canUpload && (!application.uploads[block.id]?.length || block.multiPage) && (
                                        <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#CBD5E1] rounded-[4px] text-[12.5px] font-medium text-[#64748B] cursor-pointer hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors bg-[#F8FAFC] hover:bg-[#EFF6FF]">
                                          <Upload size={16} />
                                          <span>Upload {block.formats?.join(", ")}</span>
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            accept={block.formats?.join(",")}
                                            onChange={(e) => handleFileUpload(block.id, e)}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  ) : (
                                    // Fields Block
                                    <div className="space-y-4">
                                      {block.fields?.map(field => (
                                        <div key={field.id}>
                                          <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                                            {field.label} {field.required && <span className="text-[#B91C1C]">*</span>}
                                          </label>
                                          {field.type === "select" ? (
                                            <select 
                                              value={fieldState[block.id]?.[field.id] || ""}
                                              onChange={(e) => handleFieldChange(block.id, field.id, e.target.value)}
                                              disabled={!canUpload}
                                              className="w-full text-[13px] border border-[#CBD5E1] rounded-[4px] px-3 py-2 outline-none focus:border-[#1D4ED8] disabled:bg-[#F1F5F9]"
                                            >
                                              <option value="">Select...</option>
                                              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                          ) : (
                                            <input 
                                              type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                                              value={fieldState[block.id]?.[field.id] || ""}
                                              onChange={(e) => handleFieldChange(block.id, field.id, e.target.value)}
                                              disabled={!canUpload}
                                              className="w-full text-[13px] border border-[#CBD5E1] rounded-[4px] px-3 py-2 outline-none focus:border-[#1D4ED8] disabled:bg-[#F1F5F9]"
                                            />
                                          )}
                                        </div>
                                      ))}
                                      {canUpload && (
                                        <div className="pt-2">
                                          <button 
                                            onClick={() => handleFieldSave(block.id)}
                                            disabled={saveFieldsFn.isPending}
                                            className="bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#94A3B8] text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px]"
                                          >
                                            Save Fields
                                          </button>
                                        </div>
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
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
