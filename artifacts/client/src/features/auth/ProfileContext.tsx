import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { setDefaultHeadersGetter, type User } from '@workspace/api-client-react';

/**
 * The signed-in demo user, as returned by POST /login. Kept whole in
 * localStorage — no sessions or tokens yet; real authentication replaces
 * this edge later, the rest of the app only ever consumes `Profile`.
 */
export type Profile = User;

const STORAGE_KEY = 'sheaf.profile';

interface ProfileContextValue {
  profile: Profile | null;
  login: (user: Profile) => void;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function readStored(): Profile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

/**
 * The signed-in profile as an `x-profile` header — the server's access
 * matrix identifies every call by it. Exported for the few raw fetches that
 * bypass the generated client (citations resolver, agent chat transport).
 */
export function profileHeaders(): Record<string, string> {
  const p = readStored();
  return p ? { 'x-profile': p.username } : {};
}

// Every generated-client request carries the current profile (module-level:
// registered once at import, reads storage per request so login/logout and
// multi-tab changes are always current).
setDefaultHeadersGetter(() => {
  const p = readStored();
  return p ? { 'x-profile': p.username } : null;
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(readStored);

  const login = useCallback((user: Profile) => {
    setProfile(user);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // storage unavailable — session-only sign-in is fine
    }
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
  }, []);

  return <ProfileContext.Provider value={{ profile, login, logout }}>{children}</ProfileContext.Provider>;
}

/** Nullable accessor — only for the login gate and the login page itself. */
export function useProfileState(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileState must be used within ProfileProvider');
  return ctx;
}

/** Non-null accessor for everything behind the login gate. */
export function useProfile(): { profile: Profile; logout: () => void } {
  const { profile, logout } = useProfileState();
  if (!profile) throw new Error('useProfile called outside the login gate');
  return { profile, logout };
}
