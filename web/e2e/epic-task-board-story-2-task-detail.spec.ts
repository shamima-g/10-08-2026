/**
 * Story Metadata:
 * - Route: /tasks/[id]
 * - Target File: web/src/app/(app)/tasks/[id]/page.tsx
 * - Page Action: create_new
 *
 * Mocking strategy:
 * - Backend calls: NONE to mock as a live boundary. The data source is mock-only
 *   and auth is frontend-only (project.md §Data Source / §Authentication) — there
 *   is no backend. Task CRUD goes through web/src/lib/api/client.ts into the app's
 *   compiled-in mock data layer (the Story-1 task store + the create/update/delete
 *   MSW handlers wired into the app bundle, seeded from web/src/mocks/data/task.ts).
 *   So no live backend is ever contacted and page.route() interception is
 *   unnecessary — the mocks-only invariant holds trivially (there is no backend at
 *   all). If the implementation instead makes real network calls to an external
 *   backend, that would violate mock-only and this spec would not pass.
 * - Implementation pattern this spec assumes:
 *   - The Task detail route lives inside the (app) shell/guard: a signed-out
 *     visitor to a task URL is redirected to `/sign-in`, and a signed-in visitor
 *     sees the form.
 *   - The mock data layer persists task state across CLIENT navigation between
 *     Board (`/`) and Task detail within a session (NFR-2), so create / edit /
 *     move / delete are reflected on the Board without a full reload. These specs
 *     therefore drive the real UI (button clicks / SPA navigation), never
 *     `page.goto` back to the board mid-flow, so the in-memory store survives.
 *   - The Board's three status columns are labelled landmark regions (each
 *     `<section>` labelled by its `To do` / `In progress` / `Done` heading), so a
 *     card can be scoped to the column its Status places it in (BR4).
 *   - Status is an accessible select (accessible name "Status", options exposed as
 *     `role=option`); "Delete task" opens a Shadcn alert-dialog (`role=alertdialog`)
 *     whose confirm action is labelled "Delete" (resolved design choice — confirm
 *     step required before deleting).
 *
 * E2E spec for Epic task-board, Story 2: Task detail — view, edit, move, create,
 * delete. playwright.config.ts's webServer block boots the FRONTEND dev server
 * only; data and auth are the app's compiled-in mock layer, so no live backend is
 * contacted and no real credentials are needed.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Mock identity for form-fill — auth is frontend-only (no backend), so this is
// never a real account; the seeded email/password come from the shared fixture.
import { teamMember } from './fixtures/credentials';
// Seeded Task from the single project-wide source of truth — never re-define the
// task shape or its values inline. Relative import (not `@/`) so the Playwright
// runtime resolves it without alias plumbing.
import { createTask } from '../src/mocks/data/task';

import type { Page, Locator } from '@playwright/test';
import type { TaskStatus } from '../src/mocks/data/task';

/** Any URL ending in the sign-in route — the app's single unauthenticated screen. */
const SIGN_IN_URL = /\/sign-in$/;

/** WCAG 2.1 AA — matches NFR-base-1; scopes out axe's best-practice rules. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** The canonical seeded task (task-1 — "Draft launch email" — To do). */
const seededTask = createTask();

/** Sign in through the real UI and land on the protected board home at `/`. */
async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(teamMember.email);
  await page.getByLabel('Password').fill(teamMember.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
}

/**
 * The "Add task" control on the board. Whether it renders as a link or a button is
 * a valid accessible choice, so match either — `.or()` is Playwright's sanctioned
 * either-locator, not a forbidden `||` query fallback.
 */
function newTaskControl(page: Page): Locator {
  return page
    .getByRole('button', { name: /add task/i })
    .or(page.getByRole('link', { name: /add task/i }));
}

/** A board task card addressed by its title (link or button — either is accessible). */
function taskCard(page: Page, title: string): Locator {
  const name = new RegExp(title, 'i');
  return page
    .getByRole('link', { name })
    .or(page.getByRole('button', { name }));
}

/** A status column as its labelled landmark region (labelled by the status heading). */
function column(page: Page, status: TaskStatus): Locator {
  return page.getByRole('region', { name: new RegExp(`^${status}$`, 'i') });
}

test.describe('Epic task-board, Story 2: Task detail', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-2
  test('creating a task from "Add task" opens an empty form and adds the card to the board', async ({
    page,
  }) => {
    await signIn(page);

    await newTaskControl(page).click();

    // Create/empty state — Title starts blank (default Status is To do, proven by
    // where the saved card lands below).
    await expect(page.getByLabel('Title')).toHaveValue('');

    await page.getByLabel('Title').fill('Plan the launch party');
    await page.getByRole('button', { name: /save changes/i }).click();

    // Returns to the board, where the new task appears in the To do column (default).
    await expect(page).toHaveURL('/');
    await expect(
      column(page, 'To do').getByText('Plan the launch party'),
    ).toBeVisible();
  });

  // AC-3
  test('editing a task and changing its Status moves it to the matching column', async ({
    page,
  }) => {
    await signIn(page);

    // The seeded task starts in the To do column.
    await expect(
      column(page, 'To do').getByText(seededTask.title),
    ).toBeVisible();

    await taskCard(page, seededTask.title).click();

    // Detail opens populated from that task.
    await expect(page.getByLabel('Title')).toHaveValue(seededTask.title);

    // Change Status To do → Done via the accessible select.
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: 'Done' }).click();

    await page.getByRole('button', { name: /save changes/i }).click();

    // Back on the board, the task now sits in the Done column and no longer in To do.
    await expect(page).toHaveURL('/');
    await expect(
      column(page, 'Done').getByText(seededTask.title),
    ).toBeVisible();
    await expect(
      column(page, 'To do').getByText(seededTask.title),
    ).toBeHidden();
  });

  // AC-5
  test('deleting a task after confirming removes it from the board', async ({
    page,
  }) => {
    await signIn(page);

    await expect(
      column(page, 'To do').getByText(seededTask.title),
    ).toBeVisible();

    await taskCard(page, seededTask.title).click();
    await page.getByRole('button', { name: /delete task/i }).click();

    // A confirm step is required before deleting (resolved design choice).
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /delete/i }).click();

    // Returns to the board, where the task no longer appears anywhere.
    await expect(page).toHaveURL('/');
    await expect(page.getByText(seededTask.title)).toBeHidden();
  });

  // AC-6
  test('a signed-out visitor to a task URL is redirected to the sign-in screen', async ({
    page,
  }) => {
    await page.goto(`/tasks/${seededTask.id}`);
    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  // Accessibility — real-browser axe scan of the Task detail surface this story
  // introduces, scoped to WCAG 2.1 AA (NFR-base-1). Scans each distinct state the
  // story adds — the empty create form, the populated edit form, and the open
  // delete-confirm dialog — since violations are usually state-specific. Each scan
  // runs only after the surface has settled.
  test('the task detail screen has no accessibility violations', async ({
    page,
  }) => {
    // Disable Radix entrance animations (fade + zoom) for this scan. Without this,
    // axe can analyze the delete-confirm dialog mid-entrance, while its content is
    // still composited over the overlay tint — measuring a transient ~4.34 contrast
    // for muted-foreground text that passes (~4.6) once the dialog settles on its
    // solid popover background. Reduced motion makes the content reach its final
    // opacity/background immediately, so the scan measures the true settled state.
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await signIn(page);

    // Empty create state.
    await newTaskControl(page).click();
    await expect(page.getByLabel('Title')).toHaveValue('');
    const create = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(create.violations).toEqual([]);

    // Populated edit state.
    await page.goto('/');
    await taskCard(page, seededTask.title).click();
    await expect(page.getByLabel('Title')).toHaveValue(seededTask.title);
    const edit = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(edit.violations).toEqual([]);

    // Open delete-confirm dialog. Wait for it to be fully settled at final opacity
    // (belt-and-braces alongside reduced motion) so axe scans the solid popover
    // background, never a mid-animation composited one — no bare waitForTimeout.
    await page.getByRole('button', { name: /delete task/i }).click();
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible();
    await expect(alertDialog).toHaveCSS('opacity', '1');
    const dialog = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(dialog.violations).toEqual([]);
  });
});
