/**
 * Story Metadata:
 * - Route: /tasks/[id]
 * - Target File: web/src/app/(app)/tasks/[id]/page.tsx
 * - Page Action: create_new
 *
 * Vitest + RTL integration test for Epic "task-board", Story 2: Task detail —
 * view, edit, move, create, and delete a task.
 *
 * Scope — only the two vitest-tagged ACs live here; the rest are browser /
 * navigation / persistence flows tagged `playwright` and covered by the e2e spec,
 * NOT recreated here:
 *   - AC-1 (vitest): opened from a card, the edit view shows Title, Assignee
 *     (dropdown), Status (To do / In progress / Done), and Due date populated from
 *     that task, with Save changes and Delete task controls.
 *   - AC-4 (vitest): submitting with the Title empty shows a validation message
 *     ("Title is required") and does not save.
 *   - AC-2 (create-and-appears-on-board), AC-3 (edit + status move reflected on
 *     board), AC-5 (delete after confirm returns to board), AC-6 (signed-out
 *     redirect) — all `playwright`.
 * Rendering populated fields and firing field-level validation are jsdom-
 * observable; the cross-screen navigation / persistence / redirect flows are not
 * — one tag, one layer.
 *
 * Mocking — only environment boundaries and the HTTP client are mocked; the page
 * (page.tsx) is the code under test.
 *   - `@/lib/api/client` — the task is read for the edit view via `get` (all API
 *     calls go through the client per CLAUDE.md §2). `get` resolves the shared
 *     seeded Task; `put`/`post`/`del` are inert spies. This is the ONLY module the
 *     policy allows mocking.
 *   - `next/navigation` — jsdom has no App Router. `useParams` supplies the route
 *     id the edit view loads from; `useRouter` is stubbed for the back-to-board
 *     navigation asserted in the Playwright layer, not here. (The page is a client
 *     component that reads its id via `useParams`, not a `params` prop.)
 *   - `@/contexts/AuthContext` — a signed-in team member is a precondition for
 *     this surface (brief "Depends on"). The session is the data boundary the page
 *     reads; stubbing it (not the page) keeps the page as real production code, per
 *     the "Context providers" pitfall in testing-policy.md. The identity comes from
 *     the single project-wide user factory.
 *   - `@/contexts/ToastContext` — used REAL (wrapped provider), not mocked; it is
 *     harmless in-session infrastructure the page calls to surface save/delete
 *     outcomes.
 *
 * Task shape + seeded values come from the ONE shared factory
 * (`@/mocks/data/task`), never re-defined here, so this layer and Playwright agree.
 *
 * These tests WILL FAIL until web/src/app/(app)/tasks/[id]/page.tsx renders the
 * Task detail edit form (TDD red).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
// Imported against the real target page — fails to resolve until built (TDD red).
import TaskDetailPage from '@/app/(app)/tasks/[id]/page';
import { get } from '@/lib/api/client';
import { ToastProvider } from '@/contexts/ToastContext';
// Shared seeded Task + the team-list resolver — the single source both layers use.
import { createTask, findTeamMember } from '@/mocks/data/task';
import { createUser } from '@/mocks/data/user';

// The task this edit view opens on. Canonical seeded card: "Draft launch email",
// assigned to user-1 (Sam Rivera), status "To do", due 2026-05-01 (ISO).
const task = createTask();
// Assignee is a user-id reference resolved live via the team list (BR2/NFR-2), so
// the dropdown shows the display name, not the raw id.
const assigneeName = findTeamMember(task.assignee)!.displayName; // "Sam Rivera"
// Signed-in team member — the precondition for reaching this surface.
const signedInUser = createUser();

// Only @/lib/api/client is mocked (testing-policy.md § Mocking strategy). The edit
// view loads its task via `get`; the mutation verbs are inert spies here.
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

// jsdom has no App Router — stub the navigation surface the client page consumes.
// `useParams` feeds the id the edit view fetches; the back-to-board navigation is a
// Playwright concern.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: task.id }),
  usePathname: () => `/tasks/${task.id}`,
  useSearchParams: () => new URLSearchParams(),
}));

// Stub the session context to a signed-in team member — the data boundary the page
// reads. `signedInUser` is read lazily inside `useAuth`, so it is safe against the
// vi.mock hoist (the value is initialised before any render invokes it).
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: signedInUser, isHydrated: true, signOut: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderTaskDetail() {
  return render(
    <ToastProvider>
      <TaskDetailPage />
    </ToastProvider>,
  );
}

describe('Epic task-board · Story 2 — Task detail (edit view)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // Every render's edit view resolves to the shared seeded task.
    vi.mocked(get).mockResolvedValue(task);
  });

  // AC-1 — opened from a card, the edit view shows Title, Assignee (dropdown),
  // Status (To do / In progress / Done), and Due date populated from that task,
  // with Save changes and Delete task controls.
  it('shows the task fields populated with Save changes and Delete task controls', async () => {
    renderTaskDetail();

    // Title populated (fields fill in once the task has loaded).
    const titleField = await screen.findByLabelText(/title/i);
    await waitFor(() => expect(titleField).toHaveValue(task.title));

    // Due date shown in ISO, verbatim.
    expect(screen.getByLabelText(/due date/i)).toHaveValue(task.dueDate);

    // Assignee dropdown resolves the id to the team member's display name.
    expect(
      screen.getByRole('combobox', { name: /assignee/i }),
    ).toHaveTextContent(assigneeName);

    // Status dropdown reflects the task's current status.
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveTextContent(
      task.status,
    );

    // Both operable controls the story names.
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete task/i }),
    ).toBeInTheDocument();
  });

  // AC-4 — submitting with the Title empty shows a validation message and does not
  // save (so the user stays on the detail form). Mirrors the sign-in required-field
  // pattern: the validation message only renders on the blocked path, so its
  // presence is the proof the submit short-circuited before saving.
  it('shows "Title is required" and stays on the form when the Title is empty', async () => {
    const user = userEvent.setup();
    renderTaskDetail();

    const titleField = await screen.findByLabelText(/title/i);
    await waitFor(() => expect(titleField).toHaveValue(task.title));

    await user.clear(titleField);
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // The field-level validation message is surfaced to the user.
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();

    // Did not save: still on the detail form — the Save control remains and the
    // Title field is still the (now empty) editable field, i.e. no navigation away.
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
  });
});
