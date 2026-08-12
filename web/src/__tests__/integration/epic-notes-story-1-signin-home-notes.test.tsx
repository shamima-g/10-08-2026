/**
 * Story Metadata:
 * - Route: /notes
 * - Target File: web/src/app/notes/page.tsx
 * - Page Action: create_new
 *
 * Epic: notes — Story 1 (Sign in, home shell, and Notes page).
 *
 * Front-end-only prototype: NO backend, NO API client, NO MSW — all state is
 * in-memory React state (PI-01 / PI-02). Nothing from @/lib/api/client is imported
 * or mocked here; sign-in is a client-side stub validated against one seeded user.
 *
 * Contract these TDD-red tests pin (implement to match):
 *  - @/contexts/SessionContext → { SessionProvider, useSession }. signIn(email, password)
 *    accepts ONLY user@example.com / Test123 (display name "Sam", role User); any other
 *    input is rejected and surfaces a visible error (BR3).
 *  - @/app/page (root) → renders the sign-in gate while signed out, the home shell once
 *    signed in (replaces the starter welcome page).
 *  - @/components/notes/NotesView → the notes feature UI that app/notes/page.tsx renders
 *    behind the session gate: a single text field (textbox), an Add button, a
 *    newest-first list, a visible "N notes" count, and a "No notes yet" empty state.
 *    The route guard / redirect itself is a Playwright concern (AC-3), not asserted here.
 *  - The "Note added" confirmation and validation errors use accessible announcements
 *    (an element with role="alert", or the shared success toast for the confirmation).
 *
 * These tests WILL FAIL until implemented (TDD red).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
// Production imports — resolve only once the story is implemented (TDD red).
import RootPage from '@/app/page';
import { NotesView } from '@/components/notes/NotesView';
import { SessionProvider } from '@/contexts/SessionContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/toast/ToastContainer';

// Framework mocks (not the code under test): app-router hooks + Link, so components
// that navigate on success or render nav links mount cleanly in jsdom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The notes feature UI, wired to the real toast so the "Note added" confirmation is
// observable. NotesView owns only the feature; the session gate lives in the page.
function renderNotes() {
  return render(
    <ToastProvider>
      <NotesView />
      <ToastContainer />
    </ToastProvider>,
  );
}

// The root page behind the real, in-memory session + toast providers (mirrors the
// app's real provider stack). Signed out by default → shows the sign-in gate.
function renderRoot() {
  return render(
    <ToastProvider>
      <SessionProvider>
        <RootPage />
        <ToastContainer />
      </SessionProvider>
    </ToastProvider>,
  );
}

describe('Epic notes, Story 1: Sign in, home shell, and Notes page', () => {
  // AC-2
  it('shows an inline error and keeps the user on the sign-in screen for wrong credentials', async () => {
    const user = userEvent.setup();
    renderRoot();

    await user.type(screen.getByLabelText(/email/i), 'someone@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Visible, accessible error is announced…
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    // …and the user is still on the sign-in screen (sign-in control present, and the
    // home shell's feature links have NOT appeared).
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /notes/i }),
    ).not.toBeInTheDocument();
  });

  // AC-4
  it('shows the "No notes yet" empty state and a count of 0 when there are no notes', () => {
    renderNotes();

    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByText(/\b0 notes\b/i)).toBeInTheDocument();
  });

  // AC-5
  it('adds a non-empty note to the top of the list, increments the count, clears the input, and confirms', async () => {
    const user = userEvent.setup();
    renderNotes();

    const input = screen.getByRole('textbox');
    const addButton = screen.getByRole('button', { name: /add/i });

    await user.type(input, 'Buy milk');
    await user.click(addButton);
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();

    await user.type(input, 'Call Alice');
    await user.click(addButton);
    expect(await screen.findByText('Call Alice')).toBeInTheDocument();

    // Newest-first (BR1): getAllByText returns matches in DOM order, which is the
    // user-visible order — the most recently added note comes first.
    const noteEls = screen.getAllByText(/^(Buy milk|Call Alice)$/);
    expect(noteEls).toHaveLength(2);
    expect(noteEls[0]).toHaveTextContent('Call Alice');
    expect(noteEls[1]).toHaveTextContent('Buy milk');

    // Running count reflects both notes, and the input was cleared on success (R4).
    expect(screen.getByText(/\b2 notes\b/i)).toBeInTheDocument();
    expect(input).toHaveValue('');

    // "Note added" confirmation (via the shared toast).
    expect(await screen.findByText(/note added/i)).toBeInTheDocument();
  });

  // AC-6
  it('blocks a whitespace-only note with an inline message and leaves the list and count unchanged', async () => {
    const user = userEvent.setup();
    renderNotes();

    // Whitespace-only input keeps the Add control active but must be rejected the same
    // as an empty field (BR2) — this catches a naive non-trimming check.
    await user.type(screen.getByRole('textbox'), '   ');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByText(/\b0 notes\b/i)).toBeInTheDocument();
  });
});
