/**
 * Story Metadata:
 * - Route: /settings
 * - Target File: web/src/app/(app)/settings/page.tsx
 * - Page Action: create_new
 *
 * Mocking strategy:
 * - Backend calls are ALWAYS mocked — a Playwright spec never contacts a live
 *   backend. For this epic there is NO backend at all: the project is mock-only
 *   (project.md §Data Source) and auth is frontend-only (project.md
 *   §Authentication). Sign-in, the shared user/task store, and the display-name
 *   rename all run in the browser against the app's compiled-in mock layer
 *   (web/src/mocks/data/), so there is nothing to intercept with page.route()/MSW.
 *   The specs drive the real UI and let the app's own in-browser logic run.
 * - Implementation pattern this spec assumes:
 *   - Sign-in validates the seeded email/password client-side and lands on the
 *     board home at "/" (Story 1 of the sign-in epic); the session persists in
 *     localStorage so protected routes stay reachable within a test.
 *   - The (app) shell header exposes a directly-clickable "Settings" control
 *     (resolved design choice: the header avatar/link menu added in Story 1) — a
 *     link or button named "Settings". If a design nests it in a closed dropdown,
 *     that dropdown must be open by default or the control otherwise directly
 *     clickable, mirroring how Story 2 clicks "Sign out" directly.
 *   - Settings pre-fills "Your display name" from the current user and its "Save"
 *     persists the new name to the SHARED user store (BR8 / NFR-2). Save surfaces a
 *     success toast and stays on /settings (it does NOT navigate away — contrast
 *     the task-detail "Save changes" which returns to the board, BR5). The board is
 *     re-reached via browser history (client-side), which preserves the shared
 *     store; a full page reload is avoided deliberately.
 *   - Board task cards are keyboard-operable (a link/button — WCAG 2.1 AA, opens
 *     task detail on click), locatable by their task title, and render the
 *     assignee's derived initials (first + last, e.g. "Sam Rivera" -> "SR") as text.
 *     The board's assignee filter is a single combobox listing team members by
 *     display name, so a rename is observable there too.
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic task-board, Story 3: Settings — set your display name.
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; there
 * is no backend to contact and no real credentials are used.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Mock form-fill identity — auth is validated in-browser against the mock seed, so
// this is never a real account. The seeded email/password come from the shared
// project fixture, never inlined here.
import { teamMember } from './fixtures/credentials';

import type { Page } from '@playwright/test';

/** Any URL ending in the sign-in route — the app's single unauthenticated screen. */
const SIGN_IN_URL = /\/sign-in$/;
/** The Settings route. */
const SETTINGS_URL = /\/settings$/;
/** WCAG 2.1 AA tag set matching NFR-base-1 (excludes axe best-practice rules). */
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Sign in through the real UI and land on the protected board home at "/". */
async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(teamMember.email);
  await page.getByLabel(/password/i).fill(teamMember.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
}

/**
 * The header's Settings control (resolved design choice: header avatar/link menu).
 * Accepts a link or a button so the spec does not over-fit one markup choice.
 */
function settingsControl(page: Page) {
  return page
    .getByRole('link', { name: /settings/i })
    .or(page.getByRole('button', { name: /settings/i }));
}

/**
 * A board task card located by its task title. Cards open task detail on click, so
 * an accessible board renders them as a link or button (WCAG 2.1 AA); the located
 * element's text content includes the assignee's initials.
 */
function boardCard(page: Page, title: string) {
  const pattern = new RegExp(title, 'i');
  return page
    .getByRole('link', { name: pattern })
    .or(page.getByRole('button', { name: pattern }));
}

test.describe('Epic task-board, Story 3: Settings — set your display name', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-2
  test('the header Settings control navigates to the Settings screen', async ({
    page,
  }) => {
    await signIn(page);

    await settingsControl(page).click();

    await expect(page).toHaveURL(SETTINGS_URL);
    await expect(
      page.getByRole('heading', { name: /your settings/i }),
    ).toBeVisible();
  });

  // AC-3
  test("saving a new display name updates the current user's name and initials across the board", async ({
    page,
  }) => {
    await signIn(page);

    // Baseline: the current user's card shows their derived initials ("Sam
    // Rivera" -> "SR"), scoped to that card so the two-letter check is unambiguous.
    await expect(boardCard(page, 'Draft launch email')).toContainText('SR');

    // Rename via Settings.
    await settingsControl(page).click();
    await expect(page).toHaveURL(SETTINGS_URL);
    const nameField = page.getByLabel(/your display name/i);
    await expect(nameField).toHaveValue('Sam Rivera'); // pre-filled from current user
    await nameField.fill('Alex Morgan');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Return to the board via browser history (client-side navigation preserves the
    // shared user/task store — NFR-2 — where a full reload would not).
    await page.goBack();
    await expect(page).toHaveURL('/');

    // The derived initials on the current user's card now reflect the new name
    // ("Alex Morgan" -> "AM") and no longer show the old ones.
    const card = boardCard(page, 'Draft launch email');
    await expect(card).toContainText('AM');
    await expect(card).not.toContainText('SR');

    // The updated name also propagates to the board's assignee references: the
    // filter now lists "Alex Morgan" and no longer "Sam Rivera".
    await page.getByRole('combobox').click();
    await expect(
      page.getByRole('option', { name: 'Alex Morgan' }),
    ).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sam Rivera' })).toHaveCount(
      0,
    );
  });

  // AC-5
  test('a signed-out visit to /settings redirects to the sign-in screen', async ({
    page,
  }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    // The Settings screen must never render for a signed-out visitor.
    await expect(
      page.getByRole('heading', { name: /your settings/i }),
    ).toBeHidden();
  });

  // Accessibility — real-browser axe scan of the Settings screen, the new surface
  // this story introduces, scoped to WCAG 2.1 AA (NFR-base-1). Axe's defaults also
  // run best-practice rules that fail outside that agreed bar, so scope them out.
  // Scans both the default state and the empty-name validation state (violations
  // are usually state-specific); each scan runs only after the page has settled.
  test('the Settings screen has no accessibility violations (default and validation states)', async ({
    page,
  }) => {
    await signIn(page);
    await settingsControl(page).click();
    await expect(page).toHaveURL(SETTINGS_URL);
    await expect(
      page.getByRole('heading', { name: /your settings/i }),
    ).toBeVisible();

    const defaultScan = await new AxeBuilder({ page })
      .withTags(WCAG_AA_TAGS)
      .analyze();
    expect(defaultScan.violations).toEqual([]);

    // Saving an empty display name surfaces the inline validation state (AC-4)
    // without leaving the page — scan that distinct state too.
    await page.getByLabel(/your display name/i).fill('');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page).toHaveURL(SETTINGS_URL);

    const errorScan = await new AxeBuilder({ page })
      .withTags(WCAG_AA_TAGS)
      .analyze();
    expect(errorScan.violations).toEqual([]);
  });
});
