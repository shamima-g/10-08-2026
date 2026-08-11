'use client';

/**
 * Board home (epic "sign-in", Story 2 — route "/").
 *
 * Replaces the starter welcome page with the app's protected board home
 * (CLAUDE.md §6 — replace the template, don't nest on top of it). It reads the
 * session from the Story-1 AuthProvider and:
 *   - shows who you're signed in as (the session email) and a real Sign out
 *     control (brief R5 / AC-1);
 *   - guards the route — a signed-out visitor to "/" is redirected to /sign-in
 *     and the board home is never rendered for them (brief R7 / AC-3);
 *   - clears the session on sign-out and returns to /sign-in (brief R5 / AC-2);
 *   - never leaks board content when signed out, including after a bfcache
 *     restore via the browser Back button (AC-4).
 *
 * The guard waits for the AuthProvider to finish rehydrating (`isHydrated`)
 * before treating a null session as "signed out". During the hydration window
 * both the server and the first client render report no user; redirecting then
 * would bounce a genuinely-signed-in user off their board. So while not yet
 * hydrated we render nothing and hold the redirect, then act once the persisted
 * session (if any) has been read.
 *
 * Session persistence across reloads (BR4 / AC-5) is provided by the
 * AuthProvider's localStorage rehydration — nothing extra is needed here.
 *
 * The board content is an intentional minimal placeholder; the full Board screen
 * (assignee filter + status columns of task cards) is a later epic.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, isHydrated, signOut } = useAuth();

  // Route guard: once rehydration has settled, a signed-out visitor is sent to
  // the sign-in screen. Waiting for `isHydrated` avoids redirecting a signed-in
  // user during the hydration window (server + first client render report no
  // user until the persisted session is read). `replace` (not `push`) so the
  // protected URL doesn't linger in history behind sign-in.
  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/sign-in');
    }
  }, [isHydrated, user, router]);

  // bfcache guard: if the page is restored from the back/forward cache while
  // signed out (e.g. Back after sign-out), re-assert the guard so the cached
  // board home is never revealed (AC-4).
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted && !user) {
        router.replace('/sign-in');
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [user, router]);

  // Render nothing until a user is present — this covers both the pre-hydration
  // window and the signed-out state, so no board content ever paints for a
  // signed-out user (or on the server) and neither the initial guard nor a
  // bfcache restore can leak the board home (AC-3 / AC-4).
  if (!user) {
    return null;
  }

  function handleSignOut() {
    signOut();
    router.replace('/sign-in');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Your board</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </header>

      <section className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>Your task board will appear here.</p>
      </section>
    </main>
  );
}
