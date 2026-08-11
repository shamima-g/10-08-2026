/**
 * Story Metadata:
 * - Route: /tasks/[id]
 * - Target File: web/src/app/(app)/tasks/[id]/page.tsx
 * - Page Action: modify_existing
 *
 * Vitest + RTL integration test for Epic "design-update-board-detail", Story 2:
 * Task detail gains a "Priority" dropdown (Low / Medium / High) between Status and
 * Due date. This MODIFIES the existing Task detail page the task-board epic built.
 *
 * Scope — only the four vitest-tagged ACs live here; AC-4 (changing Priority and
 * saving persists it — a cross-screen persistence round-trip) is tagged `playwright`
 * and lives in the e2e spec, NOT recreated here:
 *   - AC-1 (vitest): a "Priority" dropdown with options Low / Medium / High,
 *     positioned between Status and Due date.
 *   - AC-2 (vitest): the create (new task) form preselects Priority to "Medium".
 *   - AC-3 (vitest): editing an existing task shows its saved Priority; a task with
 *     no stored priority (seeded before this epic, BR5) shows "Medium".
 *   - AC-5 (vitest): Title, Assignee, Status, Due date and the Save changes /
 *     Delete task actions are unchanged.
 * Rendering the field, its default, and the surrounding fields are all jsdom-
 * observable; the save-and-re-open persistence flow is not — one tag, one layer.
 *
 * Mocking — only environment boundaries and the HTTP client are mocked; the page
 * (page.tsx) is the code under test.
 *   - `@/lib/api/client` — the edit view reads its task via `get` (all API access
 *     goes through the client, CLAUDE.md §2). `get` resolves the shared seeded Task;
 *     the mutation verbs are inert spies. This is the ONLY module the policy allows
 *     mocking.
 *   - `next/navigation` — jsdom has no App Router. `useParams` supplies the route id
 *     (an existing task id for the edit flow, the "new" sentinel for create);
 *     `useRouter` is stubbed for the back-to-board navigation asserted in Playwright.
 *   - `@/contexts/AuthContext` — a signed-in team member is the precondition for this
 *     surface; stubbing the session (not the page) keeps the page as real production
 *     code. The identity comes from the single project-wide user factory.
 *   - `@/contexts/ToastContext` — used REAL (wrapped provider), not mocked.
 *
 * Task shape, seeded values, and the Priority list come from the ONE shared factory
 * (`@/mocks/data/task`), never re-defined here, so this layer and Playwright agree.
 *
 * These tests WILL FAIL until page.tsx renders the Priority dropdown between Status
 * and Due date and reads a missing priority as "Medium" (TDD red).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
// Imported against the real target page — the Priority field does not exist yet (red).
import TaskDetailPage from '@/app/(app)/tasks/[id]/page';
import { get } from '@/lib/api/client';
import { ToastProvider } from '@/contexts/ToastContext';
// Shared seeded Task + the team-list resolver — the single source both layers use.
import { createTask, findTeamMember, type Task } from '@/mocks/data/task';
import { createUser } from '@/mocks/data/user';

import type { ReactNode } from 'react';

// The route id the page reads via useParams. A const holder read lazily inside the
// mock factory, so each test can point the page at the create sentinel or a specific
// task before rendering.
const mockRoute = { id: 'task-1' };

// Only @/lib/api/client is mocked (testing-policy.md § Mocking strategy). The edit
// view loads its task via `get`; the mutation verbs are inert spies here.
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

// jsdom has no App Router — stub the navigation surface the client page consumes.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: mockRoute.id }),
  usePathname: () => `/tasks/${mockRoute.id}`,
  useSearchParams: () => new URLSearchParams(),
}));

// Signed-in team member — the precondition for reaching this surface. Read lazily
// inside `useAuth`, so it is safe against the vi.mock hoist.
const signedInUser = createUser();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: signedInUser, isHydrated: true, signOut: vi.fn() }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

// Radix Select drives its listbox through pointer-capture + scrollIntoView, which
// jsdom does not implement. These minimal shims let AC-1 open the dropdown to
// enumerate its options — test-environment only, no production code touched.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

function renderTaskDetail() {
  return render(
    <ToastProvider>
      <TaskDetailPage />
    </ToastProvider>,
  );
}

describe('Epic design-update-board-detail · Story 2 — Task detail Priority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockRoute.id = 'task-1';
  });

  // AC-1 — the Priority dropdown carries options Low / Medium / High and sits
  // between Status and Due date. Position is asserted via accessible DOM order
  // (Status → Priority → Due date); the options are read by opening the control.
  it('renders a "Priority" dropdown of Low / Medium / High between Status and Due date', async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue(createTask({ priority: 'High' }));
    renderTaskDetail();

    const priority = await screen.findByRole('combobox', { name: /priority/i });
    const status = screen.getByRole('combobox', { name: /status/i });
    const dueDate = screen.getByLabelText(/due date/i);

    // Priority follows Status and precedes Due date in the document (the field order
    // the story requires), independent of markup nesting.
    expect(
      status.compareDocumentPosition(priority) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      priority.compareDocumentPosition(dueDate) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Opening the control exposes exactly the three Priority options to the user.
    await user.click(priority);
    expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument();
  });

  // AC-2 — on the create form (the "new" sentinel), Priority is preselected to
  // "Medium" with no user action (BR3).
  it('preselects Priority to "Medium" on the create form', async () => {
    mockRoute.id = 'new';
    renderTaskDetail();

    const priority = await screen.findByRole('combobox', { name: /priority/i });
    expect(priority).toHaveTextContent('Medium');
  });

  // AC-3 — editing shows the task's saved Priority; a task seeded before this epic
  // (no stored priority) reads as "Medium" so the dropdown is never empty (BR5).
  it('shows the saved Priority when editing, and "Medium" when none is stored', async () => {
    // A task with an explicit saved priority.
    vi.mocked(get).mockResolvedValue(createTask({ priority: 'High' }));
    const savedView = renderTaskDetail();
    const savedPriority = await screen.findByRole('combobox', {
      name: /priority/i,
    });
    await waitFor(() => expect(savedPriority).toHaveTextContent('High'));
    savedView.unmount();

    // A pre-epic task whose payload carries no `priority` field at all.
    const legacyTask: Task = createTask({
      id: 'task-legacy',
      title: 'Legacy roadmap task',
    });
    delete (legacyTask as Partial<Task>).priority;
    mockRoute.id = 'task-legacy';
    vi.mocked(get).mockResolvedValue(legacyTask);
    renderTaskDetail();

    const legacyPriority = await screen.findByRole('combobox', {
      name: /priority/i,
    });
    await waitFor(() => expect(legacyPriority).toHaveTextContent('Medium'));
  });

  // AC-5 — the existing fields and actions are unchanged: Title, Assignee, Status,
  // Due date are still populated from the task, and Save changes / Delete task
  // remain.
  it('leaves Title, Assignee, Status, Due date and the Save/Delete actions unchanged', async () => {
    const task = createTask({ priority: 'High' });
    const assigneeName = findTeamMember(task.assignee)!.displayName;
    vi.mocked(get).mockResolvedValue(task);
    renderTaskDetail();

    const titleField = await screen.findByLabelText(/title/i);
    await waitFor(() => expect(titleField).toHaveValue(task.title));

    expect(screen.getByLabelText(/due date/i)).toHaveValue(task.dueDate);
    expect(
      screen.getByRole('combobox', { name: /assignee/i }),
    ).toHaveTextContent(assigneeName);
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveTextContent(
      task.status,
    );
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete task/i }),
    ).toBeInTheDocument();
  });
});
