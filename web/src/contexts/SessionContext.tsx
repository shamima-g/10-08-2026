'use client';

/**
 * SessionContext — client-side-only, in-memory session for the prototype.
 *
 * Front-end-only prototype (project.md PI-01 / PI-02): there is NO backend, NO token, NO
 * cookie and NO real authentication. Sign-in is validated in the browser against a single
 * seeded user, and the session lives purely in React state — it need not survive a page
 * reload. This provider is the shared sign-in foundation the Tasks epic reuses as-is; do
 * not duplicate it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface SessionUser {
  email: string;
  displayName: string;
  role: string;
}

/**
 * The one seeded identity accepted by sign-in (project.md §Authentication, Notes epic BR3).
 * These are fixture values for a simulated session, not a real account or secret (PI-01).
 */
const SEEDED_USER: SessionUser & { password: string } = {
  email: 'user@example.com',
  password: 'Test123',
  displayName: 'Sam',
  role: 'User',
};

export interface SessionContextValue {
  isSignedIn: boolean;
  user: SessionUser | null;
  /** Returns true only for the exact seeded credentials; false otherwise (no side effect). */
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const signIn = useCallback((email: string, password: string): boolean => {
    const emailMatches =
      email.trim().toLowerCase() === SEEDED_USER.email.toLowerCase();
    const passwordMatches = password === SEEDED_USER.password;

    if (emailMatches && passwordMatches) {
      setUser({
        email: SEEDED_USER.email,
        displayName: SEEDED_USER.displayName,
        role: SEEDED_USER.role,
      });
      return true;
    }
    return false;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ isSignedIn: user !== null, user, signIn, signOut }),
    [user, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
