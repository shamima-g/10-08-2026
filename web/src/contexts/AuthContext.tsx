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
 * Rehydration is done through `useSyncExternalStore` rather than a `useState`
 * lazy initializer. That matters because this is a `'use client'` component that
 * still renders on the server: a lazy initializer reads localStorage only in the
 * browser, so the server would render signed-out (null) while the client's first
 * render rehydrated to signed-in — a React hydration mismatch on any persisted
 * session. `useSyncExternalStore`'s server snapshot returns null, so the server's
 * first render and the client's first (hydration) render agree; React then re-
 * renders with the client snapshot. It also avoids a setState-in-effect (which
 * the React hooks lint rule forbids as a cascading-render trigger).
 *
 * `isHydrated` is false during SSR and the first client render, then true once the
 * client snapshot is read. Route guards use it to distinguish "signed out" from
 * "not yet rehydrated" so a genuinely-signed-in user is never redirected during
 * the hydration window (see web/src/app/page.tsx).
 *
 * Mirrors the ToastContext provider/hook pattern: a context created with an
 * `undefined` default so `useAuth` throws when used outside its provider.
 */

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
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
   * False during SSR and the first client render, true once the persisted
   * session has been read on the client. Route guards should wait for this
   * before treating a null `user` as "signed out" (otherwise they'd redirect a
   * signed-in user during the hydration window).
   */
  isHydrated: boolean;
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

/* ---------------------------------------------------------------------------
 * Session store (module singleton, read via useSyncExternalStore)
 *
 * The store's client snapshot reflects the persisted session; its server
 * snapshot is null. `getClientSnapshot` must return a referentially-stable value
 * between renders (Object.is) or useSyncExternalStore loops forever, so the
 * parsed user is cached keyed on the raw stored string and only recomputed when
 * that string actually changes. The read always re-checks localStorage, so an
 * external clear (e.g. between tests) is picked up correctly.
 * ------------------------------------------------------------------------- */

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function parseSession(raw: string | null): AuthUser | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed && typeof parsed.email === 'string') {
      return { email: parsed.email };
    }
  } catch {
    // A malformed/unreadable persisted value simply means "start signed out".
  }
  return null;
}

function getClientSnapshot(): AuthUser | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedUser = parseSession(raw);
  }
  return cachedUser;
}

/** SSR / hydration snapshot — matches the server so there is no mismatch. */
function getServerSnapshot(): AuthUser | null {
  return null;
}

function subscribeToSession(onChange: Listener): () => void {
  listeners.add(onChange);
  // Reflect a sign-in/out performed in another tab/document (same-tab changes
  // are pushed synchronously via emitChange below).
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function writeSession(next: AuthUser | null): void {
  try {
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Persistence is best-effort; the in-memory snapshot still updates below.
  }
  emitChange();
}

/* ---- isHydrated flag, also via useSyncExternalStore (no setState-in-effect) --- */
function noopSubscribe(): () => void {
  return () => {};
}
const getHydratedClientSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(
    subscribeToSession,
    getClientSnapshot,
    getServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot,
  );

  const signIn = useCallback((email: string, password: string): boolean => {
    const matched = matchCredential(email, password);
    if (!matched) {
      return false;
    }
    writeSession({ email: matched.email });
    return true;
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isHydrated, signIn, signOut }),
    [user, isHydrated, signIn, signOut],
  );

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
