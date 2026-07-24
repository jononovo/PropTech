import { Link } from "wouter";
import { useListApplications, useListTemplates } from "@workspace/api-client-react";
import type { TemplateListing } from "@workspace/api-client-react";

export function Dashboard() {
  const { data: apps = [], isLoading: appsLoading, error: appsError } = useListApplications();
  const { data: templates = [], isLoading: tplLoading, error: tplError } = useListTemplates();

  if (appsLoading || tplLoading) {
    return <div className="p-8 font-mono text-sm text-[#64748B]">Loading...</div>;
  }
  if (appsError) {
    return <div className="p-8 font-mono text-sm text-[#B91C1C]">Failed to load dashboard.</div>;
  }

  const withOpen = apps
    .map((a) => ({ ...a, open: Math.max(0, a.docsTotal - a.docsFiled) }))
    .sort(
      (a, b) => b.open - a.open || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const needsYou = withOpen.filter((a) => a.open > 0);
  const docsFiled = apps.reduce((n, a) => n + a.docsFiled, 0);
  const docsOutstanding = withOpen.reduce((n, a) => n + a.open, 0);
  const activeTemplates = templates.filter((t) => t.status === "active");

  const families = Object.values(
    templates.reduce(
      (acc, t) => {
        if (!acc[t.family]) acc[t.family] = { family: t.family, name: t.name, program: t.program, versions: [] };
        acc[t.family].versions.push(t);
        return acc;
      },
      {} as Record<string, { family: string; name: string; program: string; versions: TemplateListing[] }>,
    ),
  );

  return (
    <main className="flex-1 p-8 pb-32">
      <div className="max-w-[960px] mx-auto">
        <div className="mb-6">
          <h1 className="text-[16px] font-semibold text-[#0F172A]">Overview</h1>
          <div className="font-mono text-[11px] text-[#64748B] tracking-wide mt-1">
            {apps.length} {apps.length === 1 ? "application" : "applications"} in flight
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <div
            data-testid="card-stat-applications"
            className="flex-1 min-w-[150px] bg-white border border-[#E2E8F0] rounded-[6px] px-4 py-3"
          >
            <div className="font-mono text-[21px] font-semibold tracking-[-0.02em]">{apps.length}</div>
            <div className="text-[11px] text-[#64748B] uppercase tracking-[0.05em] font-semibold mt-0.5">
              applications in flight
            </div>
          </div>
          <div
            data-testid="card-stat-filed"
            className="flex-1 min-w-[150px] bg-white border border-[#E2E8F0] rounded-[6px] px-4 py-3"
          >
            <div className="font-mono text-[21px] font-semibold tracking-[-0.02em]">{docsFiled}</div>
            <div className="text-[11px] text-[#64748B] uppercase tracking-[0.05em] font-semibold mt-0.5">
              documents filed
            </div>
          </div>
          <div
            data-testid="card-stat-outstanding"
            className={`flex-1 min-w-[150px] rounded-[6px] px-4 py-3 border ${
              docsOutstanding > 0 ? "bg-[#FFFBEB] border-[#FDE68A]" : "bg-white border-[#E2E8F0]"
            }`}
          >
            <div
              className={`font-mono text-[21px] font-semibold tracking-[-0.02em] ${
                docsOutstanding > 0 ? "text-[#B45309]" : ""
              }`}
            >
              {docsOutstanding}
            </div>
            <div
              className={`text-[11px] uppercase tracking-[0.05em] font-semibold mt-0.5 ${
                docsOutstanding > 0 ? "text-[#B45309]" : "text-[#64748B]"
              }`}
            >
              documents outstanding
            </div>
          </div>
          <div
            data-testid="card-stat-templates"
            className="flex-1 min-w-[150px] bg-white border border-[#E2E8F0] rounded-[6px] px-4 py-3"
          >
            <div className="font-mono text-[21px] font-semibold tracking-[-0.02em]">
              {tplError ? "—" : activeTemplates.length}
            </div>
            <div className="text-[11px] text-[#64748B] uppercase tracking-[0.05em] font-semibold mt-0.5">
              active templates
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[6px] mb-8">
          <div className="flex items-center px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-[6px]">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Needs you</div>
            <div className="flex-1" />
            <Link
              href="/applications"
              data-testid="link-all-applications"
              className="text-[12px] font-medium text-[#334155] hover:text-[#0F172A]"
            >
              All applications →
            </Link>
          </div>
          {apps.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="text-[13.5px] text-[#64748B] mb-4">No applications in flight yet.</div>
              <Link
                href="/applications"
                data-testid="button-start-application"
                className="inline-block bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors text-white text-[12.5px] font-medium px-3.5 py-1.5 rounded-[4px]"
              >
                Start an application
              </Link>
            </div>
          ) : needsYou.length === 0 ? (
            <div className="px-4 py-6 text-[12.5px] text-[#15803D]">
              All documents filed — nothing waiting on you.
            </div>
          ) : (
            needsYou.map((app, idx) => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                data-testid={`row-needs-you-${app.id}`}
                className={`flex items-center px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors ${
                  idx < needsYou.length - 1 ? "border-b border-[#F1F5F9]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-[#0F172A] truncate">{app.applicantName}</div>
                  <div className="font-mono text-[10.5px] text-[#64748B] mt-0.5 truncate">
                    {app.templateName} · v{app.version} · started {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-mono text-[11.5px] text-[#64748B] mr-3 shrink-0">
                  {app.docsFiled} / {app.docsTotal} filed
                </div>
                <div className="font-mono text-[10.5px] font-medium text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-[2px] px-1.5 py-0.5 shrink-0">
                  {app.open} open
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[6px]">
          <div className="flex items-center px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-[6px]">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Form templates</div>
            <div className="flex-1" />
            <Link
              href="/templates"
              data-testid="link-open-library"
              className="text-[12px] font-medium text-[#334155] hover:text-[#0F172A]"
            >
              Open library →
            </Link>
          </div>
          {tplError ? (
            <div className="px-4 py-6 font-mono text-[12.5px] text-[#B91C1C]">Failed to load templates.</div>
          ) : families.length === 0 ? (
            <div className="px-4 py-6 text-[13.5px] text-[#64748B]">No templates yet.</div>
          ) : (
            families.map((family, idx) => {
              const inUse = family.versions.reduce((n, v) => n + (v.inUseBy || 0), 0);
              return (
                <Link
                  key={family.family}
                  href="/templates"
                  data-testid={`row-template-family-${family.family}`}
                  className={`flex items-center px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors ${
                    idx < families.length - 1 ? "border-b border-[#F1F5F9]" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-[#0F172A] truncate">{family.name}</div>
                    <div className="font-mono text-[10.5px] text-[#64748B] mt-0.5 truncate">{family.program}</div>
                  </div>
                  <div className="flex items-center gap-1.5 mr-3 shrink-0">
                    {family.versions.map((v) => (
                      <div
                        key={v.version}
                        className={`font-mono text-[10px] font-medium uppercase tracking-[0.06em] border rounded-[2px] px-1.5 py-0.5 ${
                          v.status === "active"
                            ? "text-[#1D4ED8] border-[#BFDBFE]"
                            : "text-[#64748B] border-[#CBD5E1]"
                        }`}
                      >
                        v{v.version} {v.status}
                      </div>
                    ))}
                  </div>
                  <div className="font-mono text-[11px] text-[#94A3B8] shrink-0">
                    in use by {inUse} {inUse === 1 ? "application" : "applications"}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
