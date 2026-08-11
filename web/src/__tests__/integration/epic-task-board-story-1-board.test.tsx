/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/(app)/page.tsx (Board) — inside the shared
 *   authenticated shell web/src/app/(app)/layout.tsx
 * - Page Action: create_new (replace the placeholder board home)
 *
 * Vitest + RTL integration tests for Epic "task-board", Story 1: the Board.
 *
 * Scope — only the two vitest-tagged ACs live here:
 *   - AC-1: three columns (To do / In progress / Done), each listing its tasks as
 *     cards with the task title and the assignee's derived initials.
 *   - AC-2: a column with no matching tasks shows "Nothing here yet" instead of cards.
 * The other four ACs are browser/navigation behaviours tagged `playwright` and live
 * in the e2e spec, NOT recreated here:
 *   - AC-3 assignee filter narrows/restores cards across columns (client-side)
 *   - AC-4 "New task" opens the task screen in a create state
 *   - AC-5 clicking a card opens that task's detail screen
 *   - AC-6 signed-out visitor is redirected to sign-in
 *
 * The colour-token rider on AC-1 ("Done heading uses the done-green token; the
 * active column heading uses primary blue") is a visual concern jsdom cannot see —
 * jsdom applies no Tailwind/CSS — and asserting the class would be the forbidden
 * class-assertion anti-pattern. It is covered by the story's @axe-core/playwright
 * scan (real browser) and the manual checklist, not here.
 *
 * Data-loading contract this test drives (TDD): the Board loads the full task list
 * ONCE via GET through `@/lib/api/client` and groups it by status client-side, so
 * the assignee filter works with no page reload (brief: "Assignee filter is
 * client-side (no page reload)"). So `get` is mocked to resolve a `Task[]`; that is
 * the single boundary mocked — the Board itself is the real code under test.
 *
 * Mocking — only environment/data boundaries jsdom cannot provide are stubbed:
 *   - `@/lib/api/client` — the HTTP boundary; `get` resolves the seeded task list.
 *   - `@/contexts/AuthContext` — the shared session; stubbed to a signed-in team
 *     member (the shared seeded identity — Sam Rivera) exactly as the sign-in tests
 *     do, so a card-click/New-task handler that reads the session still mounts.
 *   - `next/navigation` — jsdom has no App Router; the Board wires card-click and
 *     "New task" through `useRouter` (those navigations are asserted in Playwright).
 * Assignee initials are NEVER hard-coded onto a task — the card resolves the
 * assignee id through the seeded team list, so the expected initials below are
 * derived the same way (findTeamMember → display name → initials).
 *
 * These tests WILL FAIL until web/src/app/(app)/page.tsx renders the Board (TDD red).
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// Imported against the REAL target page — fails to resolve until built (TDD red).
import Board from '@/app/(app)/page';
import { get } from '@/lib/api/client';
// Shared entity factory — the ONE source of the Task shape + seeded team/tasks that
// both test layers draw from. Never re-defined here.
import {
  seededTasks,
  findTeamMember,
  TASK_STATUSES,
  type Task,
} from '@/mocks/data/task';
// The shared session provider that carries any consumer-side ToastProvider needs.
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

// jsdom has no App Router — stub the navigation the card-click / New-task handlers
// consume. Those navigations (AC-4/AC-5) are asserted in the Playwright layer.
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
// member so the Board (or a handler it wires) can read the session without the
// route-guard machinery. Mocking the boundary, not the page, keeps the Board real.
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
 * Initials as the design derives them (digest §Your Decisions): first + last
 * initial, with a single-word name falling back to its first two letters. Computed
 * from the seeded team member's display name so the expectation mirrors production's
 * source of truth rather than baking a name onto a task.
 */
function initialsOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return displayName.trim().slice(0, 2).toUpperCase();
}

/** Resolve a seeded task's assignee id to the initials the card should render. */
function initialsForTask(task: Task): string {
  const member = findTeamMember(task.assignee);
  return initialsOf(member!.displayName);
}

function renderBoard() {
  return render(
    <ToastProvider>
      <Board />
    </ToastProvider>,
  );
}

describe('Epic task-board · Story 1 — Board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-1 — three columns, each listing its tasks as cards with the title and the
  // assignee's derived initials.
  it('renders To do / In progress / Done columns with cards showing each task title and the assignee initials', async () => {
    mockGet.mockResolvedValue(seededTasks);
    renderBoard();

    // The three status columns are present, in the canonical order, as headings.
    for (const status of TASK_STATUSES) {
      expect(
        await screen.findByRole('heading', { name: status }),
      ).toBeInTheDocument();
    }

    // Every column is populated — one representative card title per status column.
    const toDoTask = seededTasks.find((t) => t.status === 'To do')!; // task-1
    const inProgressTask = seededTasks.find((t) => t.status === 'In progress')!; // task-3
    const doneTask = seededTasks.find((t) => t.status === 'Done')!; // task-5
    expect(await screen.findByText(toDoTask.title)).toBeInTheDocument();
    expect(screen.getByText(inProgressTask.title)).toBeInTheDocument();
    expect(screen.getByText(doneTask.title)).toBeInTheDocument();

    // Initials are resolved from the seeded team list, not stored on the task.
    // Use assignees whose initials are unique across the seeded set (Priya Patel →
    // "PP" on the In-progress card, Marcus Chen → "MC" on the Done card) so the
    // lookup is unambiguous.
    expect(
      screen.getByText(initialsForTask(inProgressTask)),
    ).toBeInTheDocument();
    expect(screen.getByText(initialsForTask(doneTask))).toBeInTheDocument();
  });

  // AC-2 — a column with no matching tasks shows the placeholder copy instead of cards.
  it('shows "Nothing here yet" in a column that has no matching tasks', async () => {
    // Seed only To-do tasks, leaving In progress and Done empty.
    const onlyToDo = seededTasks.filter((t) => t.status === 'To do');
    mockGet.mockResolvedValue(onlyToDo);
    renderBoard();

    // The populated column still renders its card.
    expect(await screen.findByText(onlyToDo[0].title)).toBeInTheDocument();

    // The two empty columns (In progress, Done) each show the placeholder copy.
    const placeholders = await screen.findAllByText('Nothing here yet');
    expect(placeholders).toHaveLength(2);
  });
});
