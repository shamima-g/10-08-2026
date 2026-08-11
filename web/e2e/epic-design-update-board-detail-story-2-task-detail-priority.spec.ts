/**
 * Story Metadata:
 * - Route: /tasks/[id]
 * - Target File: web/src/app/(app)/tasks/[id]/page.tsx
 * - Page Action: modify_existing
 *
 * Mocking strategy:
 * - Backend calls: NONE to mock as a live boundary. The data source is mock-only
 *   and auth is frontend-only (project.md §Data Source / §Authentication) — there
 *   is no backend. Task CRUD goes through web/src/lib/api/client.ts into the app's
 *   compiled-in mock data layer (the in-session task store + the create/update
 *   MSW handlers wired into the app bundle, seeded from web/src/mocks/data/task.ts).
 *   So no live backend is ever contacted and page.route() interception is
 *   unnecessary — the mocks-only invariant holds trivially (there is no backend at
 *   all). If the implementation instead makes real network calls to an external
 *   backend, that would violate mock-only and this spec would not pass.
 * - Implementation pattern this spec assumes:
 *   - The Task detail route lives inside the (app) shell/guard: a signed-in visitor
 *     to a task URL sees the populated form; the Priority Select renders its current
 *     value as the trigger's accessible text (Shadcn Select, accessible name
 *     "Priority", options exposed as `role=option`).
 *   - The in-session mock data layer persists the saved Priority across CLIENT
 *     navigation between Task detail and the Board within a session (BR4), so this
 *     spec drives the real UI (card click / "Save changes") and never `page.goto`s
 *     back to the board mid-flow, which would reset the in-memory store.
 *   - "Save changes" persists the edit and returns to the Board (`/`), where the
 *     same card can be re-opened to read the persisted Priority back (AC-4).
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic design-update-board-detail, Story 2: Task detail — Priority
 * dropdown (Low / Medium / High).
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; data
 * and auth are the app's compiled-in mock layer, so no live backend is contacted
 * and no real credentials are needed.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
// Mock identity for form-fill — auth is frontend-only (no backend), so this is
// never a real account; the seeded email/password come from the shared fixture.
import { teamMember } from './fixtures/credentials';
// Seeded tasks + canonical Priority list from the single project-wide source of
// truth — never re-define the task shape or its values inline. Relative import
// (not `@/`) so the Playwright runtime resolves it without alias plumbing.
import { seededTasks, TASK_PRIORITIES } from '../src/mocks/data/task';

import type { Page, Locator } from '@playwright/test';

/** The seeded task edited here (task-1 — "Draft launch email", seeded Priority High). */
const targetTask = seededTasks[0];

/** A Priority distinct from the seed, so the assertion proves the change persisted. */
const originalPriority = targetTask.priority;
const newPriority = TASK_PRIORITIES.find((p) => p !== originalPriority);
if (!newPriority) {
  throw new Error(
    'Test fixture expects more than one Priority option so the edit is observable.',
  );
}

/** Sign in through the real UI and land on the protected board home at `/`. */
async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(teamMember.email);
  await page.getByLabel('Password').fill(teamMember.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
}

/** A board task card addressed by its title (link or button — either is accessible). */
function taskCard(page: Page, title: string): Locator {
  const name = new RegExp(title, 'i');
  return page
    .getByRole('link', { name })
    .or(page.getByRole('button', { name }));
}

/** The Task-detail Priority Select, addressed by its accessible name. */
function priorityControl(page: Page): Locator {
  return page.getByRole('combobox', { name: /priority/i });
}

test.describe('Epic design-update-board-detail, Story 2: Task detail — Priority dropdown', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-4
  test('changing Priority and saving persists the new value — re-opening the task shows it', async ({
    page,
  }) => {
    await signIn(page);

    // Open the seeded task; its Priority Select shows the currently-stored value.
    await taskCard(page, targetTask.title).click();
    await expect(page.getByLabel('Title')).toHaveValue(targetTask.title);
    await expect(priorityControl(page)).toContainText(originalPriority);

    // Change Priority to a different option via the accessible Select.
    await priorityControl(page).click();
    await page.getByRole('option', { name: newPriority, exact: true }).click();
    await expect(priorityControl(page)).toContainText(newPriority);

    // Save returns to the Board (client navigation keeps the in-session store alive).
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page).toHaveURL('/');

    // Re-open the same card — the changed Priority persisted, not the seeded one.
    await taskCard(page, targetTask.title).click();
    await expect(page.getByLabel('Title')).toHaveValue(targetTask.title);
    await expect(priorityControl(page)).toContainText(newPriority);
    await expect(priorityControl(page)).not.toContainText(originalPriority);
  });
});
