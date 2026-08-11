'use client';

/**
 * AuthContext — the app's auth-session foundation.
 *
 * Auth is frontend-only and mock-only (project.md §Authentication / §Data
 * Source): there is no server session and no token exchange. `signIn` validates
 * the submitted credentials against the seeded mock set (`@/mocks/data/credentials`)
 * with no backend call (brief R2), and a successful session is persisted to
 * localStorage so it survives reloads/tab closes until the user explicitly signs
 * out (brief BR4).
 *
 * Mirrors the ToastContext provider/hook pattern: a context created with an
 * `undefined` default so `useAuth` throws when used outside its provider.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { matchCredential } from '@/mocks/data/credentials';

/** The signed-in identity for the rest of the app — email only (brief Data Model). */
export interface AuthUser {
  email: string;
}

export interface AuthContextValue {
  /** The signed-in user, or null when signed out. */
  user: AuthUser | null;
  /**
   * Validate `email`/`password` against the seeded mock credentials and, on a
   * match, establish + persist the session. Returns true on success, false when
   * the credentials don't match (the caller shows a single generic error — BR2).
   */
  signIn: (email: string, password: string) => boolean;
  /** Clear the session and its persisted copy. */
  signOut: () => void;
}

const STORAGE_KEY = 'taskboard.auth.session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Read any persisted session from localStorage. Runs as the `useState` lazy
 * initializer so rehydration happens as part of the first render — no
 * setState-in-effect cascade. Client-only: `window` is absent during SSR, where
 * we simply start signed out (this is a `'use client'` component, so the browser
 * render immediately re-reads storage). This is what makes the session survive a
 * reload (BR4).
 */
function readPersistedSession(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthUser;
      if (parsed && typeof parsed.email === 'string') {
        return { email: parsed.email };
      }
    }
  } catch {
    // A malformed/unreadable persisted value simply means "start signed out".
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readPersistedSession);

  const signIn = useCallback((email: string, password: string): boolean => {
    const matched = matchCredential(email, password);
    if (!matched) {
      return false;
    }
    const nextUser: AuthUser = { email: matched.email };
    setUser(nextUser);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch {
      // Persistence is best-effort; the in-memory session still works this visit.
    }
    return true;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to recover from — the in-memory session is already cleared.
    }
  }, []);

  const value: AuthContextValue = { user, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — access the auth session. Throws if used outside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
