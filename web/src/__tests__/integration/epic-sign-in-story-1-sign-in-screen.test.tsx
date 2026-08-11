/**
 * Story Metadata:
 * - Route: /sign-in
 * - Target File: web/src/app/sign-in/page.tsx
 * - Page Action: create_new
 *
 * Integration tests for Epic "sign-in", Story 1: the Sign-in screen.
 *
 * These render the REAL sign-in page inside the REAL AuthProvider (the session
 * foundation this story introduces) and drive it through Testing Library user
 * interactions. Nothing about the page is faked — the only things mocked are
 * environment boundaries jsdom cannot provide:
 *   - `next/navigation` (App Router router/hooks) — there is no live router in
 *     jsdom. Successful-navigation-to-the-board (AC-4) is asserted in the
 *     Playwright layer, not here.
 * There is NO HTTP client to mock: auth is frontend-only (project.md
 * §Authentication) and validated against the mock data layer, not a backend
 * (brief R2 — "no backend call").
 *
 * Accessibility beyond the error live-region below is asserted once, in a real
 * browser, by the story's @axe-core/playwright scan — not with vitest-axe here.
 *
 * These tests WILL FAIL until the page + AuthProvider are implemented (TDD red).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
// Imported against the real target files — fails to resolve until built (TDD red).
import SignInPage from '@/app/sign-in/page';
import { AuthProvider } from '@/contexts/AuthContext';
// Canonical seeded identity — the single shared source both test layers use.
import { createUser } from '@/mocks/data/user';

// jsdom has no App Router — stub the navigation surface the client page consumes.
// Successful navigation (AC-4) is covered by the Playwright spec.
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/sign-in',
  useSearchParams: () => new URLSearchParams(),
}));

function renderSignIn() {
  return render(
    <AuthProvider>
      <SignInPage />
    </AuthProvider>,
  );
}

describe('Epic sign-in · Story 1 — Sign-in screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  // AC-1 — the screen presents an email field, a password field, and a Sign in button.
  it('shows an email field, a password field, and a Sign in button', () => {
    renderSignIn();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  // AC-2 — submitting with a field empty shows an inline "required" message and
  // does NOT attempt sign-in (so no generic credential error appears, and the
  // user stays on the sign-in screen).
  it('shows a required message and does not attempt sign-in when a field is empty', async () => {
    const user = userEvent.setup();
    renderSignIn();

    // Fill only the password, leave the email empty, then submit.
    await user.type(screen.getByLabelText(/password/i), 'Some-Password-1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Inline "required" validation is surfaced to the user.
    expect(await screen.findByText(/required/i)).toBeInTheDocument();

    // It short-circuited before any credential check: the generic
    // invalid-credentials error is NOT shown, and we remain on the sign-in screen.
    expect(
      screen.queryByText(/incorrect email or password/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  // AC-3 — credentials that don't match a seeded pair show a generic error and
  // keep the user on the sign-in screen.
  it('shows a generic error and stays on the page for unrecognised credentials', async () => {
    const user = userEvent.setup();
    renderSignIn();

    await user.type(
      screen.getByLabelText(/email/i),
      'unknown.person@taskboard.test',
    );
    await user.type(screen.getByLabelText(/password/i), 'Wrong-Password-1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/incorrect email or password/i),
    ).toBeInTheDocument();
    // Still on the sign-in screen.
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  // AC-5 — no SSO, "Forgot password", or sign-up entry points are shown.
  it('shows no SSO, forgot-password, or sign-up entry points', () => {
    renderSignIn();

    expect(
      screen.queryByRole('link', { name: /forgot password/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /sign up|create account|register/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /sign up|create account|register/i,
      }),
    ).not.toBeInTheDocument();
    // No third-party / single sign-on affordance (e.g. "Continue with Google").
    expect(
      screen.queryByRole('button', {
        name: /sso|single sign-on|continue with/i,
      }),
    ).not.toBeInTheDocument();
  });

  // Additional technical check — the invalid-credentials error is announced to
  // screen readers via a live region (role="alert" ⇒ aria-live). NFR-signin-1.
  it('announces the invalid-credentials error in a live region', async () => {
    const user = userEvent.setup();
    renderSignIn();

    // A definitely-unseeded email guarantees the failure path deterministically.
    await user.type(
      screen.getByLabelText(/email/i),
      `not-${createUser().email}`,
    );
    await user.type(screen.getByLabelText(/password/i), 'Wrong-Password-1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const liveRegion = await screen.findByRole('alert');
    expect(liveRegion).toHaveTextContent(/incorrect email or password/i);
  });
});
