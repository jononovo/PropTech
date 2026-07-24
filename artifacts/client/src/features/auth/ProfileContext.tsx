import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { DEFAULT_PROFILE_ID, PROFILES, type Profile } from './profiles';

const STORAGE_KEY = 'sheaf.profileId';

interface ProfileContextValue {
  profile: Profile;
  setProfileId: (id: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function readStoredId(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PROFILE_ID;
  } catch {
    return DEFAULT_PROFILE_ID;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileIdState] = useState<string>(readStoredId);

  const setProfileId = useCallback((id: string) => {
    setProfileIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // storage unavailable — session-only profile is fine
    }
  }, []);

  const profile = PROFILES.find((p) => p.id === profileId) ?? PROFILES[0];

  return <ProfileContext.Provider value={{ profile, setProfileId }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
