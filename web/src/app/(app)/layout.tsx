'use client';

/**
 * Shared authenticated shell — the `(app)` route group layout.
 *
 * Every signed-in screen in the task-board epic (Board, Task detail, Settings)
 * renders as a child of this shell, so the cross-screen invariants live here once
 * rather than being repeated per screen:
 *   - the header navigation (an account menu carrying a Settings control and the
 *     Sign out action), present on every authenticated screen;
 *   - the signed-out route guard + bfcache guard, lifted from the sign-in epic's
 *     board home so protected content is never shown (or leaked from the
 *     back/forward cache) to a signed-out visitor.
 *
 * The route group `(app)` does not change the URL, so `(app)/page.tsx` still
 * serves "/". Auth is read from the shared AuthProvider (`@/contexts/AuthContext`)
 * — the guard is not reimplemented here, only its wiring is lifted.
 *
 * The guard waits for `isHydrated` before treating a null session as "signed
 * out", so a genuinely-signed-in user is never bounced during the hydration
 * window (see AuthContext for why the server/first-client render report no user).
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { seededTeam } from '@/mocks/data/task';
import { getInitials } from '@/lib/initials';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isHydrated, signOut } = useAuth();

  // Route guard: once rehydration has settled, a signed-out visitor is sent to
  // the sign-in screen. `replace` (not `push`) so the protected URL doesn't
  // linger in history behind sign-in.
  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/sign-in');
    }
  }, [isHydrated, user, router]);

  // bfcache guard: re-assert the guard if the page is restored from the
  // back/forward cache while signed out, so cached protected content is never
  // revealed.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted && !user) {
        router.replace('/sign-in');
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [user, router]);

  // Render nothing for the pre-hydration window and the signed-out state, so no
  // protected content ever paints for a signed-out user (or on the server) and
  // neither the initial guard nor a bfcache restore can leak it.
  if (!user) {
    return null;
  }

  // The current user's display name comes from the mock data layer (mock-only —
  // project.md §Data Source); resolve it live from the seeded team by the session
  // email so a later Settings rename propagates here (BR8/NFR-2). Fall back to the
  // email when no seeded match exists.
  const member = seededTeam.find((teammate) => teammate.email === user.email);
  const displayName = member?.displayName ?? user.email;
  const initials = getInitials(displayName);

  function handleSignOut() {
    signOut();
    router.replace('/sign-in');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="text-lg font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            TaskBoard
          </Link>
          <nav aria-label="Account">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span>{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
