import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { useListUsers, useLogin, type User } from '@workspace/api-client-react';
import { useProfileState } from './ProfileContext';

/**
 * Demo sign-in: the boxes are the seeded users from the database; clicking
 * one pre-fills the credentials (every demo password is "1234"), Log In
 * validates against POST /login. No sessions — the user lives in localStorage.
 */
const DEMO_PASSWORD = '1234';

export function LoginPage() {
  const { login } = useProfileState();
  const [, setLocation] = useLocation();
  const { data: users, isLoading } = useListUsers();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (user) => {
        login(user);
        setLocation('/');
      },
      onError: () => setError('Wrong username or password.'),
    },
  });

  const pick = (u: User) => {
    setUsername(u.username);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ data: { username, password } });
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
          Pick a user — their credentials are filled in for you. Verdicts and edits are recorded under
          their name and role.
        </p>

        {isLoading ? (
          <div className="text-[12.5px] text-[#94A3B8] py-6 text-center" data-testid="text-users-loading">
            Loading users…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(users ?? []).map((u) => {
              const active = u.username === username;
              return (
                <button
                  key={u.id}
                  type="button"
                  data-testid={`button-profile-${u.id}`}
                  onClick={() => pick(u)}
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
                    {u.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{u.name}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                      {u.role}
                    </div>
                    <div className="text-[11px] text-[#94A3B8] truncate">{u.org}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={submit} className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2.5">
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#64748B] mb-1">
              Username
            </label>
            <input
              data-testid="input-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full h-9 px-2.5 text-[13px] rounded-[4px] border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#64748B] mb-1">
              Password
            </label>
            <input
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-9 px-2.5 text-[13px] rounded-[4px] border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
          {error && (
            <div className="text-[12px] text-[#B91C1C]" data-testid="text-login-error">
              {error}
            </div>
          )}
          <button
            type="submit"
            data-testid="button-login"
            disabled={!username || !password || loginMutation.isPending}
            className="w-full h-9 rounded-[4px] bg-[#0F172A] text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-[#1E293B] transition-colors"
          >
            {loginMutation.isPending ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>

      <div className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#94A3B8]">
        test sign-in — all demo passwords are 1234
      </div>
    </div>
  );
}
