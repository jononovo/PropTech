import { useState } from 'react';
import { useLocation } from 'wouter';
import { FileStack, FolderKanban, LayoutDashboard, LogOut } from 'lucide-react';
import { useProfile } from '@/features/auth/ProfileContext';

/** Mockup panel: anchored dropdown on desktop, full-width sheet under the 52px header on mobile. */
export const PANEL =
  'fixed inset-x-2 top-[58px] md:absolute md:inset-x-auto md:top-[calc(100%+8px)] bg-white border border-[#E2E8F0] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] z-50 overflow-hidden';

const NAV = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, testid: 'link-menu-dashboard' },
  { label: 'Applications', href: '/applications', icon: FolderKanban, testid: 'link-menu-applications' },
  { label: 'Templates', href: '/templates', icon: FileStack, testid: 'link-menu-templates' },
] as const;

/**
 * Account menu (mockup: Backbone account panel). Global nav + sign out live
 * behind the avatar — clicking it no longer bounces straight to the login
 * switcher.
 */
export function UserMenu() {
  const { profile, logout } = useProfile();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const go = (href: string) => {
    setOpen(false);
    setLocation(href);
  };

  return (
    <div className="relative shrink-0">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="button-user-menu"
        title={`${profile.name} — ${profile.role}`}
        className={`relative z-50 w-[26px] h-[26px] rounded-full bg-[#F1F5F9] border flex items-center justify-center text-[9.5px] font-semibold text-[#334155] transition-colors ${
          open ? 'border-[#1D4ED8]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
        }`}
      >
        {profile.initials}
      </button>

      {open && (
        <div className={`${PANEL} md:right-0 md:w-[264px]`} data-testid="menu-user">
          <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-[#F1F5F9]">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[10.5px] font-semibold text-[#1E40AF] shrink-0">
              {profile.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold leading-tight text-[#0F172A]">{profile.name}</div>
              <div className="text-[10.5px] text-[#64748B] leading-tight mt-0.5">{profile.role}</div>
            </div>
          </div>
          <div className="py-1">
            {NAV.map(({ label, href, icon: Icon, testid }) => (
              <button
                key={href}
                onClick={() => go(href)}
                data-testid={testid}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[12px] text-[#334155] hover:bg-[#F8FAFC] transition-colors"
              >
                <Icon className="w-[13px] h-[13px] text-[#64748B] shrink-0" />
                {label}
              </button>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                logout();
                setLocation('/login');
              }}
              data-testid="button-sign-out"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-[12px] text-[#334155] hover:bg-[#F8FAFC] transition-colors border-t border-[#F1F5F9] mt-1"
            >
              <LogOut className="w-[13px] h-[13px] text-[#64748B] shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
