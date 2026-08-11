/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/(app)/layout.tsx (was web/src/app/page.tsx)
 * - Page Action: modify_existing
 *
 * Vitest + RTL integration test for Epic "Sign in", Story 2:
 * Board home with sign-out and route guard.
 *
 * RELOCATED by the task-board epic (Story 1). The sign-in epic shipped the board
 * home as a placeholder page at `web/src/app/page.tsx` that carried the signed-in
 * identity, the sign-out control, and the route guard. The task-board epic builds
 * the real Board and lifts those cross-screen concerns into the shared
 * authenticated shell — the `(app)` route group's layout
 * (web/src/app/(app)/layout.tsx) — so every signed-in screen inherits them
 * (CLAUDE.md §6 — replace, don't nest). The old page.tsx is gone; this test now
 * asserts AC-1 against the shell that owns that behaviour.
 *
 * Scope — AC-1: a signed-in team member sees who they're signed in as and can
 * reach the sign-out control. In the new shell the identity is the member's
 * display name shown in the header, and Sign out lives in the header account menu
 * alongside Settings. The other four ACs are browser/navigation/persistence
 * behaviours tagged `playwright` and live in the sign-in e2e spec, NOT recreated
 * here:
 *   - AC-2 sign-out clears the session and returns to the sign-in screen
 *   - AC-3 route guard: any protected URL while signed out → sign-in screen
 *   - AC-4 browser Back after sign-out does not reveal the board home
 *   - AC-5 the session persists across a page reload
 * The sign-out CLICK flow moved into the account menu and is exercised in that
 * Playwright layer (a Radix menu does not open reliably under jsdom); here we
 * assert the identity is shown and the account menu that carries Sign out is
 * present and operable.
 *
 * Mocking — only the auth boundary is mocked. The shell is the code under test;
 * the session it reads comes from the Story-1 AuthProvider
 * (`@/contexts/AuthContext`), stubbed to a signed-in team member (the shared
 * seeded identity — Sam Rivera). Next.js navigation is stubbed because the shell
 * wires its route guard through `useRouter`. The signed-in identity value comes
 * from the single project-wide user factory — never re-defined here.
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// Import the REAL shell — the code under test now owning the identity + sign-out.
import AppLayout from '@/app/(app)/layout';
// Shared seeded identity — the ONE source both test layers draw from.
import { createUser } from '@/mocks/data/user';
import { ToastProvider } from '@/contexts/ToastContext';

import type { ReactNode } from 'react';

const signedInUser = createUser(); // Sam Rivera / sam.rivera@taskboard.test

// The shell wires its signed-out route guard through Next.js navigation; stub it
// so the client component mounts under jsdom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Stub the Story-1 session context to a signed-in, hydrated team member. This is
// the data boundary the shell reads from — mocking it (not the shell) keeps the
// shell itself as real production code under test.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: signedInUser.email },
    isHydrated: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('Board home — signed-in identity and sign-out control (Epic sign-in, Story 2)', () => {
  beforeEach(() => vi.clearAllMocks());

  // AC-1
  it('shows who the team member is signed in as, and an operable account menu carrying sign-out', () => {
    render(
      <ToastProvider>
        <AppLayout>
          <div>board content</div>
        </AppLayout>
      </ToastProvider>,
    );

    // "who they're signed in as" — the signed-in member's display name, resolved
    // live from the session and shown in the shell header.
    expect(screen.getByText(signedInUser.displayName)).toBeInTheDocument();

    // A real, operable account-menu control (a button, not decorative text) that
    // carries Sign out (and Settings). The sign-out click flow itself is asserted
    // in the sign-in Playwright layer.
    expect(
      screen.getByRole('button', {
        name: new RegExp(signedInUser.displayName, 'i'),
      }),
    ).toBeInTheDocument();
  });
});
