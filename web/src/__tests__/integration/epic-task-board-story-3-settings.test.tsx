/**
 * Story Metadata:
 * - Route: /settings
 * - Target File: web/src/app/(app)/settings/page.tsx
 * - Page Action: create_new
 *
 * Vitest + RTL integration test for Epic "task-board", Story 3: Settings —
 * set your display name.
 *
 * Scope — only the two vitest-tagged ACs are rendered here (one tag → one test):
 *   - AC-1: Settings shows the heading "Your settings", a "Your display name"
 *           field pre-filled with the current user's name, and a Save button.
 *   - AC-4: Saving with an empty display name shows the validation message
 *           "Display name is required" and does not save.
 * The other three ACs are browser/navigation/persistence behaviours tagged
 * `playwright` and live in the e2e spec, NOT recreated here:
 *   - AC-2 the header's Settings control navigates to the Settings screen
 *   - AC-3 saving a new name persists it; updated name/initials appear on the board
 *   - AC-5 a signed-out visitor to /settings is redirected to sign-in
 *
 * Mocking — only environment/data boundaries are mocked; the Settings page itself
 * is real production code under test:
 *   - `@/contexts/AuthContext` — the session foundation (Story 1). Stubbed to a
 *     signed-in team member (the shared seeded identity, Sam Rivera) so the page
 *     can pre-fill from the current user. The value comes from the single
 *     project-wide user factory — never re-defined here.
 *   - `@/contexts/ToastContext` — the page surfaces save success via a toast;
 *     stub the hook so it renders without a live provider.
 *   - `@/lib/api/client` — the sanctioned HTTP-client mock (persistence goes
 *     through the mock data layer via this client). `get` resolves to the current
 *     user so an async pre-fill path yields the same value as a synchronous one.
 *   - `next/navigation` — jsdom has no App Router; stubbed defensively for the
 *     client page.
 *
 * These tests WILL FAIL until web/src/app/(app)/settings/page.tsx is implemented
 * (TDD red).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// Import the REAL target page — the code under test (TDD red until implemented).
import SettingsPage from '@/app/(app)/settings/page';
// Shared seeded identity — the ONE source both test layers draw from
// (sam.rivera@taskboard.test / display name "Sam Rivera").
import { createUser } from '@/mocks/data/user';

import type { ReactNode } from 'react';

const currentUser = createUser(); // Sam Rivera / sam.rivera@taskboard.test

// Stub the Story-1 session context to the signed-in team member. This is the data
// boundary the Settings page reads the current identity from — mocking it (not the
// page) keeps the page itself as real production code under test.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentUser,
    isHydrated: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

// Success is surfaced via ToastContext; stub the hook so the page mounts without a
// live provider. We assert AC-4's "does not save" through the visible validation
// state, not through this mock's call record.
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    dismissToast: vi.fn(),
    clearAllToasts: vi.fn(),
    toasts: [],
  }),
  ToastProvider: ({ children }: { children: ReactNode }) => children,
}));

// The mock data layer is reached through the sanctioned HTTP-client mock. `get`
// resolves to the current user so a pre-fill-via-fetch implementation yields the
// same "Sam Rivera" value as a pre-fill-from-session one; put/post resolve so a
// hypothetical save doesn't reject.
vi.mock('@/lib/api/client', () => ({
  get: vi.fn().mockResolvedValue(currentUser),
  post: vi.fn().mockResolvedValue(currentUser),
  put: vi.fn().mockResolvedValue(currentUser),
  del: vi.fn().mockResolvedValue(undefined),
}));

// jsdom has no App Router — stub the navigation surface the client page may consume.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Epic task-board · Story 3 — Settings: set your display name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  // AC-1
  it('shows "Your settings", the display-name field pre-filled with the current name, and a Save button', async () => {
    render(<SettingsPage />);

    // The screen heading.
    expect(
      screen.getByRole('heading', { name: /your settings/i }),
    ).toBeInTheDocument();

    // The "Your display name" field, pre-filled with the current user's name.
    // waitFor covers both a synchronous (from the session) and an asynchronous
    // (from the mock data layer) pre-fill path.
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toHaveValue(
        currentUser.displayName,
      );
    });

    // A real, operable Save control.
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  // AC-4
  it('shows "Display name is required" and does not save when the field is emptied', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    // Wait for the pre-filled value, then clear it and try to save.
    const field = screen.getByLabelText(/display name/i);
    await waitFor(() => expect(field).toHaveValue(currentUser.displayName));
    await user.clear(field);
    await user.click(screen.getByRole('button', { name: /save/i }));

    // The required-field validation message is surfaced to the user.
    expect(
      await screen.findByText(/display name is required/i),
    ).toBeInTheDocument();

    // Blocked before any save: we remain on the Settings screen with the field
    // still empty and editable (no success state / navigation away).
    expect(
      screen.getByRole('heading', { name: /your settings/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toHaveValue('');
  });
});
