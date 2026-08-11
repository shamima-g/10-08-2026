/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/(app)/page.tsx
 * - Page Action: modify_existing
 *
 * Mocking strategy:
 * - Backend calls are ALWAYS mocked — a Playwright spec never contacts a live
 *   backend. This project is mock-only (project.md §Data Source): the Board reads
 *   its tasks through the API client (web/src/lib/api/client.ts), and MSW —
 *   already wired in web/src/mocks/ (browser.ts + handlers.ts) — intercepts those
 *   task list/read calls IN THE BROWSER and serves the seeded factories
 *   (web/src/mocks/data/task.ts). No live backend is contacted.
 *   - Auth is frontend-only (project.md §Authentication): the sign-in check runs
 *     client-side against the seeded mock credential layer with no REST call, so
 *     there is nothing to intercept for auth either.
 * - Implementation pattern this spec assumes:
 *   - The Board fetches its tasks via the API client so MSW can intercept them;
 *     the seeded tasks/team come from web/src/mocks/data/task.ts (the single
 *     source of truth this spec also imports — response bodies never drift).
 *   - The primary action button's label is now "Add task" (was "New task", R1) and
 *     it navigates to the routed Task-detail create surface inside the shared
 *     (app) shell; on that surface the Board's "Add task" action is not present and
 *     the task's Title is an editable field labelled "Title", empty in create state.
 *   - The assignee filter is a Shadcn Select (role "combobox" trigger, role
 *     "option" items) driven by client-side state — no page reload (NFR-1) — with
 *     its position moved to the top-right next to "Add task" but its options and
 *     filtering logic unchanged (R2/BR2).
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic design-update-board-detail, Story 1: Board header — the
 * "Add task" relabel and the top-right filter grouping.
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; auth
 * and data are the app's compiled-in mock layer (MSW + seeded credentials), so no
 * live backend is contacted and no real credentials are needed.
 * These tests WILL FAIL until implemented (TDD red — the button still reads
 * "New task").
 */
import { test, expect } from '@playwright/test';
// Mock form-fill identity — auth is validated in-browser against the mock seed, so
// this is never a real account (sam.rivera@taskboard.test). Never hard-code real
// passwords in specs.
import { teamMember } from './fixtures/credentials';
// The seeded team + tasks come from the ONE project-wide source both layers share
// (relative import, not @/, so the Playwright runtime resolves it without alias
// plumbing) — never inline task/assignee data in a spec.
import { seededTeam, seededTasks } from '../src/mocks/data/task';

import type { Page } from '@playwright/test';

/**
 * The team member to narrow the Board to: the signed-in canonical member, who owns
 * seeded tasks in more than one column so the filter's effect spans columns (AC-4).
 */
const targetMember = seededTeam[0]; // Sam Rivera (user-1)
const targetTaskTitles = seededTasks
  .filter((task) => task.assignee === targetMember.id)
  .map((task) => task.title);

/** A task owned by a DIFFERENT member — must disappear when the Board is narrowed. */
const otherMemberTask = seededTasks.find(
  (task) => task.assignee !== targetMember.id,
);
if (!otherMemberTask) {
  throw new Error(
    'Test fixture expects at least one seeded task assigned to another team member.',
  );
}

/** Sign in through the real UI and land on the protected board home at "/". */
async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(teamMember.email);
  await page.getByLabel(/password/i).fill(teamMember.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Epic design-update-board-detail, Story 1: Board header — "Add task" label and top-right filter grouping', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-3
  test('clicking "Add task" opens the Task detail screen in its empty create state', async ({
    page,
  }) => {
    await signIn(page);
    // The relabelled primary action opens the create surface (R1/BR1 — same create
    // flow the old "New task" button opened; only the label changed).
    await page.getByRole('button', { name: /add task/i }).click();

    // We left the board (its "Add task" action is gone) and reached the Task detail
    // screen in a create state — the Title field is present and empty.
    await expect(page.getByRole('button', { name: /add task/i })).toBeHidden();
    await expect(page.getByLabel(/title/i)).toHaveValue('');
  });

  // AC-4
  test('the assignee filter narrows the columns to one person, and "All assignees" restores every task', async ({
    page,
  }) => {
    await signIn(page);

    // Under the default "All assignees" filter, both the target member's tasks and
    // another member's task are on the board.
    for (const title of targetTaskTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByText(otherMemberTask.title)).toBeVisible();

    // Narrow to the target member — filtering logic is unchanged from its new
    // top-right position (BR2).
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: targetMember.displayName }).click();

    // Only that member's tasks remain — visible across the columns they span — and
    // the other member's task is gone.
    for (const title of targetTaskTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByText(otherMemberTask.title)).toBeHidden();

    // Restoring "All assignees" brings every task back.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /all assignees/i }).click();
    await expect(page.getByText(otherMemberTask.title)).toBeVisible();
  });
});
