/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/(app)/page.tsx (Board) — inside the shared
 *   authenticated shell web/src/app/(app)/layout.tsx
 * - Page Action: modify_existing
 *
 * Vitest + RTL integration tests for Epic "design-update-board-detail", Story 1:
 * the Board header relabel + filter regrouping.
 *
 * Scope — only the three vitest-tagged ACs live here:
 *   - AC-1: the Board's primary action button reads "Add task" (was "New task").
 *   - AC-2: the assignee filter and the "Add task" button are grouped together in
 *     the header, with the filter appearing BEFORE the button.
 *   - AC-5: an empty column still shows "Nothing here yet".
 * The other two ACs are browser/navigation behaviours tagged `playwright` and live
 * in the e2e spec, NOT recreated here:
 *   - AC-3 "Add task" opens the Task detail screen in its empty create state
 *   - AC-4 the assignee filter narrows/restores the columns
 *
 * AC-2 is asserted through ACCESSIBLE STRUCTURE, never CSS classes: the filter is
 * the `combobox` named "Filter by assignee" and the primary action is the `button`
 * named "Add task"; we assert (a) the filter precedes the button in document order,
 * and (b) the two share a common ancestor that does NOT also contain the board
 * columns — i.e. they are clustered in the header, not merely both-somewhere-on-page.
 * Which side of the header the cluster sits on (top-right) and its Tailwind layout
 * classes are visual concerns jsdom cannot see; they are covered by the story's
 * @axe-core/playwright scan (real browser) and the manual checklist, not here.
 *
 * Data-loading contract this test drives (unchanged from the task-board epic): the
 * Board loads the full task list ONCE via GET through `@/lib/api/client` and groups
 * it by status client-side. So `get` is mocked to resolve a `Task[]`; that is the
 * single boundary mocked — the Board itself is the real code under test.
 *
 * Mocking — only environment/data boundaries jsdom cannot provide are stubbed:
 *   - `@/lib/api/client` — the HTTP boundary; `get` resolves the seeded task list.
 *   - `@/contexts/AuthContext` — the shared session; stubbed to a signed-in team
 *     member (the shared seeded identity — Sam Rivera) so the authenticated-shell
 *     consumers mount without the route-guard machinery.
 *   - `next/navigation` — jsdom has no App Router; the Board wires card-click and
 *     "Add task" through `useRouter` (those navigations are asserted in Playwright).
 *
 * These tests WILL FAIL against the current "New task" implementation (TDD red).
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// Imported against the REAL target page — the current build still renders the old
// "New task" label, so AC-1/AC-2 fail until the relabel + regroup lands (TDD red).
import Board from '@/app/(app)/page';
import { get } from '@/lib/api/client';
// Shared entity factory — the ONE source of the seeded task list both test layers
// draw from. Never re-defined here.
import { seededTasks } from '@/mocks/data/task';
// The shared toast provider the authenticated shell / page tree expects to be present.
import { ToastProvider } from '@/contexts/ToastContext';

import type { ReactNode } from 'react';

// Only the HTTP boundary is mocked — the Board is the real code under test.
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));
const mockGet = get as ReturnType<typeof vi.fn>;

// jsdom has no App Router — stub the navigation the card-click / Add-task handlers
// consume. Those navigations (AC-3/AC-4) are asserted in the Playwright layer.
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

// The shared session context is infrastructure here — stub it to a signed-in team
// member so the page tree mounts without the route-guard machinery. Mocking the
// boundary, not the page, keeps the Board real.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'sam.rivera@taskboard.test' },
    isHydrated: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

/**
 * Nearest common ancestor of two elements — walk up from `a` until an ancestor also
 * contains `b`. Used to prove the filter and the button are genuinely grouped rather
 * than just co-present on the page, without touching layout classes.
 */
function nearestCommonAncestor(
  a: HTMLElement,
  b: HTMLElement,
): HTMLElement | null {
  let node: HTMLElement | null = a;
  while (node && !node.contains(b)) {
    node = node.parentElement;
  }
  return node;
}

function renderBoard() {
  return render(
    <ToastProvider>
      <Board />
    </ToastProvider>,
  );
}

describe('Epic design-update-board-detail · Story 1 — Board header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-1 — the primary action button reads "Add task" (and no longer "New task").
  it('renders the primary action button labelled "Add task"', async () => {
    mockGet.mockResolvedValue(seededTasks);
    renderBoard();

    expect(
      await screen.findByRole('button', { name: 'Add task' }),
    ).toBeInTheDocument();
    // The old label is gone — this is a relabel, not an added second button.
    expect(
      screen.queryByRole('button', { name: 'New task' }),
    ).not.toBeInTheDocument();
  });

  // AC-2 — the assignee filter and the "Add task" button are grouped in the header,
  // filter first. Asserted via accessible structure + document order, not CSS.
  it('groups the assignee filter and the "Add task" button together, with the filter before the button', async () => {
    mockGet.mockResolvedValue(seededTasks);
    renderBoard();

    // Wait for the board to finish loading so the columns exist to exclude below.
    const toDoHeading = await screen.findByRole('heading', { name: 'To do' });
    const filter = screen.getByRole('combobox', { name: 'Filter by assignee' });
    const addTaskButton = screen.getByRole('button', { name: 'Add task' });

    // (a) Document order: the filter precedes the button.
    expect(
      filter.compareDocumentPosition(addTaskButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // (b) Grouping: filter and button share a container that does NOT also contain
    // the board columns — proving they are clustered in the header, not merely both
    // rendered somewhere on the page.
    const group = nearestCommonAncestor(filter, addTaskButton);
    expect(group).not.toBeNull();
    expect(group).not.toContainElement(toDoHeading);
  });

  // AC-5 — a column with no matching tasks still shows the placeholder copy.
  it('shows "Nothing here yet" in a column that has no matching tasks', async () => {
    // Seed only To-do tasks, leaving In progress and Done empty.
    const onlyToDo = seededTasks.filter((task) => task.status === 'To do');
    mockGet.mockResolvedValue(onlyToDo);
    renderBoard();

    // The populated column still renders its card.
    expect(await screen.findByText(onlyToDo[0].title)).toBeInTheDocument();

    // The two empty columns (In progress, Done) each show the placeholder copy.
    const placeholders = await screen.findAllByText('Nothing here yet');
    expect(placeholders).toHaveLength(2);
  });
});
