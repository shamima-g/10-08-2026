/**
 * Per-epic BASELINE — Epic "sign-in".
 *
 * Written once (with Story 1) because this epic introduces a shared surface every
 * later story builds on: the auth-session foundation (AuthProvider / useAuth) plus
 * the single named seeded-credentials module (NFR-signin-2). The cross-story
 * invariants that hold regardless of which screen is on top live here, so they are
 * asserted once rather than re-proved per story:
 *   - a fresh app starts signed out;
 *   - a seeded credential establishes a session that exposes the signed-in email;
 *   - signing out clears it;
 *   - the session survives a reload (BR4 — mock/local persistence).
 *
 * These exercise the provider through its public hook via a small consumer probe
 * (the standard way to test a context provider — the AuthProvider is the unit under
 * test, the probe is only a window onto its state). Nothing about the provider is
 * faked. Credentials are read from the shared seed module, never hard-coded, so the
 * password literal lives in exactly one place.
 *
 * Successful sign-in *navigation* and the signed-out route-guard REDIRECT are
 * flow/navigation behaviours asserted in the Playwright layer, not here. Epic
 * accessibility is the @axe-core/playwright scan in the story spec, not this file.
 *
 * These tests WILL FAIL until the AuthProvider + seeded-credentials module are
 * implemented (TDD red).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
// Imported against the real target files — fails to resolve until built (TDD red).
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
// The single named seeded-credentials module (NFR-signin-2) — the one place the
// email/password seed lives. Its first entry is the canonical team member.
import { seededCredentials } from '@/mocks/data/credentials';

const seeded = seededCredentials[0];

/**
 * A minimal consumer that renders the auth state as text and exposes buttons to
 * drive the shared surface. Not a stand-in for any production screen — it exists
 * only to observe the AuthProvider contract.
 */
function AuthProbe() {
  const { user, signIn, signOut } = useAuth();
  return (
    <div>
      <p>{user ? `Signed in as ${user.email}` : 'Signed out'}</p>
      <button
        type="button"
        onClick={() => signIn(seeded.email, seeded.password)}
      >
        probe sign in
      </button>
      <button type="button" onClick={() => signOut()}>
        probe sign out
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('Epic sign-in · baseline — auth-session foundation', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts signed out with no persisted session', () => {
    renderProbe();
    expect(screen.getByText(/signed out/i)).toBeInTheDocument();
  });

  it('establishes a session for a seeded credential and clears it on sign out', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: /probe sign in/i }));
    expect(
      await screen.findByText(new RegExp(`signed in as ${seeded.email}`, 'i')),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /probe sign out/i }));
    expect(await screen.findByText(/signed out/i)).toBeInTheDocument();
  });

  it('remembers the session across a reload (BR4)', async () => {
    const user = userEvent.setup();
    const first = renderProbe();

    await user.click(screen.getByRole('button', { name: /probe sign in/i }));
    await screen.findByText(new RegExp(`signed in as ${seeded.email}`, 'i'));

    // Simulate a reload: tear down the tree and mount a fresh provider. It should
    // rehydrate the session from local persistence rather than starting fresh.
    first.unmount();
    renderProbe();

    expect(
      await screen.findByText(new RegExp(`signed in as ${seeded.email}`, 'i')),
    ).toBeInTheDocument();
  });
});
