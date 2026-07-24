import { useLocation } from 'wouter';
import { useProfile } from './ProfileContext';
import { PROFILES } from './profiles';

/**
 * Test sign-in: click a user, you're that user. Every verdict and edit is
 * recorded under the selected profile. Real authentication lands later.
 */
export function LoginPage() {
  const { profile, setProfileId } = useProfile();
  const [, setLocation] = useLocation();

  const choose = (id: string) => {
    setProfileId(id);
    setLocation('/');
  };

  return (
    <div className="min-h-[100dvh] bg-[#F3F5F7] font-sans text-[#0F172A] flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-[26px] h-[26px] bg-[#0F172A] rounded-[5px] flex items-center justify-center">
          <div className="w-[12px] h-[12px] border-[1.5px] border-white rounded-[2px]" />
        </div>
        <div className="text-[17px] font-bold tracking-[-0.01em]">Sheaf</div>
      </div>
      <div className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] bg-[#F1F5F9] rounded-[3px] px-1.5 py-0.5 mb-8">
        DOCUMENT OPS
      </div>

      <div className="w-full max-w-[560px] bg-white border border-[#E2E8F0] rounded-[6px] p-5">
        <div className="text-[15px] font-semibold mb-1">Who's working?</div>
        <p className="text-[12.5px] text-[#64748B] mb-4">
          Pick a user — verdicts and edits are recorded under their name and role.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROFILES.map((p) => {
            const active = p.id === profile.id;
            return (
              <button
                key={p.id}
                data-testid={`button-profile-${p.id}`}
                onClick={() => choose(p.id)}
                className={`flex items-center gap-3 p-3 rounded-[4px] border text-left transition-colors ${
                  active
                    ? 'border-[#1D4ED8] bg-[#EFF6FF]'
                    : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-[4px] flex items-center justify-center text-[12px] font-semibold shrink-0 ${
                    active ? 'bg-[#1D4ED8] text-white' : 'bg-[#F1F5F9] text-[#334155]'
                  }`}
                >
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                    {p.role}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] truncate">{p.org}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#94A3B8]">
        test sign-in — real authentication arrives later
      </div>
    </div>
  );
}
