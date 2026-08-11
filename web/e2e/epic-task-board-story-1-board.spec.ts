/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/(app)/page.tsx (Board) + web/src/app/(app)/layout.tsx (shell)
 * - Page Action: create_new (replaces the placeholder board home)
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
 *   - The assignee filter is a Shadcn Select (role "combobox" trigger, role
 *     "option" items) driven by client-side state — no page reload (NFR-1).
 *   - "New task" and a task card navigate to the routed Task-detail surface inside
 *     the shared (app) shell; on that surface the Board's "New task" action is not
 *     present and the task's Title is an editable field labelled "Title" (R2).
 *   - A signed-out visit to the protected board is redirected to "/sign-in" by the
 *     shared (app) layout's route guard (AC-6).
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic task-board, Story 1: Board with columns, cards, assignee
 * filter, and New task.
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; auth
 * and data are the app's compiled-in mock layer (MSW + seeded credentials), so no
 * live backend is contacted and no real credentials are needed.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Mock form-fill identity — auth is validated in-browser against the mock seed, so
// this is never a real account. Never hard-code real passwords in specs.
import { teamMember } from './fixtures/credentials';
// The seeded team + tasks come from the ONE project-wide source both layers share
// (relative import, not @/, so the Playwright runtime resolves it without alias
// plumbing) — never inline task/assignee data in a spec.
import { seededTeam, seededTasks } from '../src/mocks/data/task';

import type { Page } from '@playwright/test';

/** Any URL ending in the sign-in route — the app's single unauthenticated screen. */
const SIGN_IN_URL = /\/sign-in$/;

/**
 * The team member to narrow the Board to: the signed-in canonical member, who owns
 * seeded tasks in more than one column so the filter's effect spans columns (AC-3).
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

test.describe('Epic task-board, Story 1: Board with columns, cards, assignee filter, and New task', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-6
  test('a signed-out visitor to the board is redirected to the sign-in screen', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  // AC-3
  test('the assignee filter narrows cards to one person across the columns, and "All assignees" restores every task', async ({
    page,
  }) => {
    await signIn(page);

    // Under the default "All assignees" filter, both the target member's tasks and
    // another member's task are on the board.
    for (const title of targetTaskTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByText(otherMemberTask.title)).toBeVisible();

    // Narrow to the target member.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: targetMember.displayName }).click();

    // Only that member's tasks remain — visible across the columns they span —
    // and the other member's task is gone.
    for (const title of targetTaskTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByText(otherMemberTask.title)).toBeHidden();

    // Restoring "All assignees" brings every task back.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /all assignees/i }).click();
    await expect(page.getByText(otherMemberTask.title)).toBeVisible();
  });

  // AC-4
  test('the "New task" button opens the task screen ready to create a new task', async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole('button', { name: /new task/i }).click();

    // We left the board (its "New task" action is gone) and reached the task
    // screen in a create state — the Title field is present and empty.
    await expect(page.getByRole('button', { name: /new task/i })).toBeHidden();
    await expect(page.getByLabel(/title/i)).toHaveValue('');
  });

  // AC-5
  test("clicking a task card opens that task's detail screen", async ({
    page,
  }) => {
    await signIn(page);
    const card = seededTasks[0]; // "Draft launch email"

    await page.getByText(card.title).click();

    // The detail screen loads THAT task's values — its Title populates the
    // editable Title field — and the board's "New task" action is gone.
    await expect(page.getByRole('button', { name: /new task/i })).toBeHidden();
    await expect(page.getByLabel(/title/i)).toHaveValue(card.title);
  });

  // Accessibility — real-browser axe scan of the Board, the surface this story
  // introduces, scoped to WCAG 2.1 AA to match NFR-base-1. (Axe's defaults also
  // run best-practice rules that fail outside that agreed bar — scope them out.)
  // Scans the default board and the filtered state, which surfaces the empty-column
  // "Nothing here yet" copy — violations are usually state-specific.
  test('the board has no accessibility violations (default and filtered states)', async ({
    page,
  }) => {
    await signIn(page);
    await expect(page.getByText(seededTasks[0].title)).toBeVisible();

    const defaultScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(defaultScan.violations).toEqual([]);

    // Narrowing to one member empties the columns they have no tasks in, surfacing
    // the "Nothing here yet" empty-column state — scan that distinct state too.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: targetMember.displayName }).click();
    await expect(page.getByText(otherMemberTask.title)).toBeHidden();

    const filteredScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(filteredScan.violations).toEqual([]);
  });
});
