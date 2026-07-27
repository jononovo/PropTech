import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListApplications, 
  useListTemplates, 
  useCreateApplication,
  getListApplicationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function Applications() {
  const { data: apps = [], isLoading } = useListApplications();
  const { data: templates = [] } = useListTemplates();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const createFn = useCreateApplication();

  const [showNew, setShowNew] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const activeTemplates = templates.filter(t => t.status === "active");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !selectedTemplate) return;
    const [family, versionStr] = selectedTemplate.split(":");
    
    createFn.mutate({
      data: {
        applicantName,
        family,
        version: parseInt(versionStr, 10)
      }
    }, {
      onSuccess: (newApp) => {
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        setLocation(`/applications/${newApp.id}/intake`);
      }
    });
  };

  return (
    <div className="w-full flex flex-col flex-1">
      <main className="flex-1 p-8 pb-32">
        <div className="max-w-[960px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-[16px] font-semibold text-[#0F172A]">Applications</h1>
              <div className="font-mono text-[11px] text-[#64748B] tracking-wide mt-1">
                {apps.length} in flight
              </div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              data-testid="button-new-application"
              className="bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px] shadow-sm"
            >
              New application
            </button>
          </div>
          
          {showNew && (
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-6 mb-8 shadow-sm">
              <h3 className="text-[14px] font-semibold text-[#0F172A] mb-4">Start New Application</h3>
              <form onSubmit={handleCreate} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">Applicant Name</label>
                  <input 
                    type="text" 
                    value={applicantName}
                    onChange={e => setApplicantName(e.target.value)}
                    required
                    className="w-full text-[13px] border border-[#CBD5E1] rounded-[4px] px-3 py-2 outline-none focus:border-[#1D4ED8]"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">Template</label>
                  <select 
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    required
                    className="w-full text-[13px] border border-[#CBD5E1] rounded-[4px] px-3 py-2 outline-none focus:border-[#1D4ED8] bg-white"
                  >
                    <option value="">Select active template...</option>
                    {activeTemplates.map(t => (
                      <option key={`${t.family}:${t.version}`} value={`${t.family}:${t.version}`}>
                        {t.name} (v{t.version})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNew(false)} className="px-3.5 py-2 text-[12.5px] font-medium text-[#64748B] hover:text-[#0F172A]">
                    Cancel
                  </button>
                  <button type="submit" disabled={createFn.isPending} className="bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#94A3B8] text-white text-[12.5px] font-medium px-3.5 py-2 rounded-[4px]">
                    Start
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="font-mono text-sm text-[#64748B]">Loading...</div>
          ) : apps.length === 0 ? (
            <div className="text-center py-20 bg-white border border-[#E2E8F0] rounded-[6px]">
              <div className="text-[14px] text-[#64748B]">No applications started yet.</div>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-sm flex flex-col">
              <div className="flex items-center p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider w-1/3">Applicant</div>
                <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider w-1/3">Template</div>
                <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex-1 text-right">Progress</div>
              </div>
              {apps.map((app, idx) => (
                <Link 
                  key={app.id} 
                  href={`/applications/${app.id}`}
                  data-testid={`row-application-${app.id}`}
                  className={`flex items-center p-4 hover:bg-[#F8FAFC] transition-colors ${idx < apps.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
                >
                  <div className="w-1/3">
                    <div className="text-[14px] font-medium text-[#0F172A]">{app.applicantName}</div>
                    <div className="font-mono text-[10.5px] text-[#64748B] mt-0.5">Started {new Date(app.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="w-1/3">
                    <div className="text-[13px] text-[#334155]">{app.templateName}</div>
                    <div className="font-mono text-[10.5px] text-[#64748B] mt-0.5">v{app.version}</div>
                  </div>
                  <div className="flex-1 flex justify-end items-center gap-3">
                    <div className="text-[12px] font-mono text-[#64748B]">
                      {app.docsFiled} / {app.docsTotal} docs
                    </div>
                    <div className="w-24 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#1D4ED8]" 
                        style={{ width: `${app.docsTotal > 0 ? (app.docsFiled / app.docsTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
