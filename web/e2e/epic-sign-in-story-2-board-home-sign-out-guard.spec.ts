/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/page.tsx
 * - Page Action: modify_existing
 *
 * Mocking strategy:
 * - Backend calls: NONE to mock. Auth is frontend-only and the data source is
 *   mock-only (project.md §Authentication / §Data Source) — there is no backend
 *   and no auth network endpoint. The sign-in check runs entirely in the browser
 *   against the seeded mock credentials compiled into the app bundle
 *   (web/src/mocks/data/), so no live backend is ever contacted and page.route()
 *   interception is unnecessary here. (The mocks-only invariant holds trivially:
 *   there is no backend at all.)
 * - Implementation pattern this spec assumes:
 *   - Sign-in validates the submitted email/password against the seeded mock
 *     credential layer client-side; a successful sign-in establishes a session
 *     and navigates to the board home at `/`.
 *   - The session is persisted in localStorage (BR4 — mock/local persistence): it
 *     survives a page reload and is CLEARED on sign-out.
 *   - The board-home route guard reads that session: a signed-out visitor to any
 *     protected route (including the root `/`) is redirected to `/sign-in`, and the
 *     signed-out board home must never render — so the browser Back button after
 *     sign-out cannot reveal cached board content.
 * - If the implementation diverges (a network auth call, sessionStorage instead of
 *   localStorage, or a different sign-in route), this spec will not pass.
 *
 * E2E spec for Epic sign-in, Story 2: Board home with sign-out and route guard.
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; auth
 * and data are the app's compiled-in mock layer, so no live backend is contacted
 * and no real credentials are needed.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Mock identity for form-fill — auth is mocked (frontend-only, no backend), so
// this is never a real account. The seeded email/password come from the shared
// project fixture, never inlined here.
import { teamMember } from './fixtures/credentials';

import type { Page } from '@playwright/test';

/** Any URL ending in the sign-in route — the app's single unauthenticated screen. */
const SIGN_IN_URL = /\/sign-in$/;

/** Sign in through the real UI and land on the protected board home at `/`. */
async function signIn(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(teamMember.email);
  await page.getByLabel('Password').fill(teamMember.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Epic sign-in, Story 2: Board home with sign-out and route guard', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-3
  test('a signed-out visit to the app root redirects to the sign-in screen (not a welcome page)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    // The starter welcome page must be gone — the root is now a protected screen.
    await expect(
      page.getByText(/replace this with your feature implementation/i),
    ).toBeHidden();
  });

  // AC-2
  test('using the sign-out control clears the session and returns to the sign-in screen', async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  // AC-4
  test('after signing out, the browser Back button does not reveal the board home', async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(SIGN_IN_URL);

    // Returning via the browser history must not surface the cached board home
    // (bfcache leak) — the guard sends the signed-out user back to sign-in.
    await page.goBack();
    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.getByRole('button', { name: /sign out/i })).toBeHidden();
  });

  // AC-5
  test('the session persists across a page reload — a signed-in user stays on the board home', async ({
    page,
  }) => {
    await signIn(page);
    await page.reload();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });

  // Accessibility — real-browser axe scan of the signed-in board home, the new
  // surface this story introduces, scoped to WCAG 2.1 AA to match NFR-base-1.
  // (Axe's defaults also run best-practice rules that fail outside that agreed
  // bar — scope them out.) Scan only once the board home has settled.
  test('the signed-in board home has no accessibility violations', async ({
    page,
  }) => {
    await signIn(page);
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(violations).toEqual([]);
  });
});
