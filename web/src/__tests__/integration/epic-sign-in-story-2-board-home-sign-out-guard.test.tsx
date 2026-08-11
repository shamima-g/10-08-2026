/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/page.tsx
 * - Page Action: modify_existing
 *
 * Vitest + RTL integration test for Epic "Sign in", Story 2:
 * Board home with sign-out and route guard.
 *
 * Scope — the ONLY vitest-tagged AC for this story is AC-1: a signed-in team
 * member landing on the board home sees who they're signed in as and a sign-out
 * control. The other four ACs are browser/navigation/persistence behaviours
 * tagged `playwright` and live in the e2e spec, NOT recreated here:
 *   - AC-2 sign-out clears the session and returns to the sign-in screen
 *   - AC-3 route guard: any protected URL while signed out → sign-in screen
 *   - AC-4 browser Back after sign-out does not reveal the board home
 *   - AC-5 the session persists across a page reload
 * Rendering identity + the presence of a control is jsdom-observable; the
 * redirect/persistence/back-button flows are not — one tag, one layer.
 *
 * Mocking — only the auth boundary is mocked. The board home (page.tsx) is the
 * code under test; the session it reads comes from the Story-1 AuthProvider /
 * session context (`@/contexts/AuthContext`), which is infrastructure here, so
 * `useAuth` is stubbed to a signed-in team member (the shared seeded identity —
 * Sam Rivera) exactly as the "Context providers" pitfall in testing-policy.md
 * prescribes. Next.js navigation is stubbed because the page wires its route
 * guard through `useRouter`. The signed-in identity value comes from the single
 * project-wide user factory — never re-defined here.
 *
 * These tests WILL FAIL until web/src/app/page.tsx renders the protected board
 * home (TDD red).
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// Import the REAL target page — the code under test (TDD red until implemented).
import HomePage from '@/app/page';
// Shared seeded identity — the ONE source both test layers draw from.
import { createUser } from '@/mocks/data/user';

import type { ReactNode } from 'react';

const signedInUser = createUser(); // Sam Rivera / sam.rivera@taskboard.test

// The page wires its signed-out route guard through Next.js navigation; stub it so
// the client component mounts under jsdom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Stub the Story-1 session context to a signed-in team member. This is the data
// boundary the board home reads from — mocking it (not the page) keeps the page
// itself as real production code under test.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: signedInUser, signOut: vi.fn() }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('Board home — signed-in identity and sign-out control (Epic sign-in, Story 2)', () => {
  beforeEach(() => vi.clearAllMocks());

  // AC-1
  it('shows who the team member is signed in as, and a sign-out control', () => {
    render(<HomePage />);

    // "who they're signed in as" — the session identity for this epic is the email
    // (brief Data Model: Session identifies the user by email). Substring match so
    // it is found whether rendered bare or inside "Signed in as <email>".
    expect(
      screen.getByText(signedInUser.email, { exact: false }),
    ).toBeInTheDocument();

    // A real, operable sign-out control — a button, not decorative text.
    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });
});
