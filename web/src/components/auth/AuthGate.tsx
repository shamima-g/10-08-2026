'use client';

/**
 * AuthGate — renders its children only when a client-side session exists; otherwise it
 * renders the sign-in screen. Used by the app root and every feature page so that, while
 * signed out, visiting any route (including a deep link to /notes) lands on sign-in
 * (Notes epic — signed-out routing). Shared foundation reused by the Tasks epic.
 */

import type { ReactNode } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { SignInForm } from './SignInForm';

export function AuthGate({ children }: { children: ReactNode }) {
  const { isSignedIn } = useSession();

  if (!isSignedIn) {
    return <SignInForm />;
  }

  return <>{children}</>;
}
