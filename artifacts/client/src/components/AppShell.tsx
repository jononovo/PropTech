import type { ReactNode } from "react";
import { Link } from "wouter";
import { useProfile } from "@/features/auth/ProfileContext";

const TABS = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "applications", label: "Applications", href: "/applications" },
  { key: "templates", label: "Templates", href: "/templates" },
] as const;

export type ShellTab = (typeof TABS)[number]["key"];

export function AppShell({ active, children }: { active: ShellTab; children: ReactNode }) {
  return (
    <div className="w-full min-h-[100dvh] flex flex-col font-sans bg-[#F3F5F7] text-[#0F172A] selection:bg-[#BFDBFE] selection:text-[#1E40AF]">
      <header className="h-[52px] bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0 sticky top-0 z-20">
        <Link href="/" data-testid="link-brand-home" className="flex items-center gap-2.5">
          <div className="w-[22px] h-[22px] bg-[#0F172A] rounded-[5px] flex items-center justify-center">
            <div className="w-[10px] h-[10px] border-[1.5px] border-white rounded-[2px]" />
          </div>
          <div className="text-[15px] font-bold tracking-[-0.01em] text-[#0F172A]">Sheaf</div>
        </Link>
        <div className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] bg-[#F1F5F9] rounded-[3px] px-1.5 py-0.5 ml-2.5 mr-8 hidden sm:block">
          DOCUMENT OPS
        </div>
        <nav className="flex items-stretch h-full gap-5">
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <Link
                key={t.key}
                href={t.href}
                data-testid={`link-nav-${t.key}`}
                className={`flex items-center text-[12.5px] font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-[#1D4ED8] text-[#0F172A]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        <ProfileChip />
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function ProfileChip() {
  const { profile } = useProfile();
  return (
    <Link
      href="/login"
      data-testid="link-profile"
      title="Switch profile"
      className="flex items-center gap-2 px-2 py-1 rounded-[4px] hover:bg-[#F8FAFC] transition-colors"
    >
      <div className="w-6 h-6 rounded-[4px] bg-[#F1F5F9] border border-[#E2E8F0] text-[#334155] text-[10px] font-semibold flex items-center justify-center">
        {profile.initials}
      </div>
      <div className="hidden sm:flex flex-col leading-none text-left">
        <span className="text-[11.5px] font-medium text-[#0F172A]">{profile.name}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#64748B] mt-0.5">
          {profile.role}
        </span>
      </div>
    </Link>
  );
}
