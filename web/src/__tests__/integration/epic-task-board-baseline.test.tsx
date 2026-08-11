/**
 * Per-epic BASELINE — Epic "task-board".
 *
 * Written once (with Story 1) because this epic introduces a shared surface every
 * later story sits inside: the authenticated app shell — the `(app)` route group's
 * layout (web/src/app/(app)/layout.tsx), which carries the header navigation
 * (the Settings/Sign-out account menu) and the signed-out route guard. The Board,
 * Task detail, and Settings screens all render as children of this shell, so the
 * cross-story invariants that hold regardless of which screen is on top are asserted
 * once here rather than re-proved per story:
 *   - the shell renders the page content passed to it (every screen mounts inside it);
 *   - the shell provides the shared header navigation on every authenticated screen.
 *
 * WHY THIS ISN'T A vitest-axe FILE. The orchestrator brief calls this the epic's
 * "accessibility baseline", but accessibility is asserted with @axe-core/playwright
 * in a real browser (testing-policy.md; CLAUDE.md §11) — vitest-axe is not a
 * dependency of this project and jsdom cannot see the contrast/layout/focus issues
 * axe checks. So the epic's accessibility scan lives in the shared-surface story's
 * Playwright spec, and this Vitest baseline asserts the shared-shell STRUCTURE
 * (landmarks + content wrapping) that every screen inherits.
 *
 * Mocking — only the boundaries jsdom cannot provide are stubbed, never the shell:
 *   - `@/contexts/AuthContext` — the route guard reads the session; stubbed to a
 *     signed-in, hydrated team member so the guard renders the shell (the signed-out
 *     REDIRECT is a Playwright behaviour — AC-6 — not asserted here).
 *   - `next/navigation` — jsdom has no App Router; the guard/header wire through it.
 *
 * Sign-out and the Settings link are exercised where they are the story's subject
 * (the sign-in epic's Playwright sign-out flow; the Settings story's own tests),
 * not duplicated here — this baseline asserts only what is invariant across every
 * screen in the epic.
 *
 * These tests WILL FAIL until web/src/app/(app)/layout.tsx renders the shell (TDD red).
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// Imported against the REAL shared shell — fails to resolve until built (TDD red).
import AppLayout from '@/app/(app)/layout';
import { ToastProvider } from '@/contexts/ToastContext';

import type { ReactNode } from 'react';

// jsdom has no App Router — stub the navigation the guard/header consume.
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

// A signed-in, hydrated team member so the route guard renders the shell rather
// than redirecting. Mocking this boundary (not the layout) keeps the shell real.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'sam.rivera@taskboard.test' },
    isHydrated: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

/** A sentinel child standing in for any screen the shell wraps. */
const CHILD_MARKER = 'shell-child-content';

function renderShell() {
  return render(
    <ToastProvider>
      <AppLayout>
        <div>{CHILD_MARKER}</div>
      </AppLayout>
    </ToastProvider>,
  );
}

describe('Epic task-board · baseline — shared authenticated shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page content inside the shared shell for a signed-in team member', () => {
    renderShell();
    expect(screen.getByText(CHILD_MARKER)).toBeInTheDocument();
  });

  it('provides the shared header navigation on every authenticated screen', () => {
    renderShell();
    // The shell's header is a navigation landmark carried across all screens in the
    // epic (Board, Task detail, Settings), giving a consistent way to move between
    // them and to sign out.
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
