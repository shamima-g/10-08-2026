/**
 * Story Metadata:
 * - Route: /sign-in
 * - Target File: web/src/app/sign-in/page.tsx
 * - Page Action: create_new
 *
 * Mocking strategy:
 * - Backend calls are ALWAYS mocked — a Playwright spec never contacts a live
 *   backend. For this epic there is NO backend at all: the project is mock-only
 *   (project.md §Data Source) and auth is frontend-only (project.md
 *   §Authentication). Per brief R2, submitted credentials are validated
 *   client-side against the app's mock credential seed with no REST call — so
 *   there is nothing to intercept with page.route()/MSW. The specs fill the real
 *   form and let the app's own in-browser check run.
 * - Implementation pattern this assumes:
 *   - The sign-in form is a real <form> with an email field, a password field,
 *     and a submit button, so a click on "Sign in" AND pressing Enter from within
 *     a field both submit it (NFR-signin-1: keyboard operable, Enter-to-submit).
 *   - The app's mock credential seed (brief NFR-signin-2 — the single named
 *     mock-data location) pairs the seeded email (createUser().email,
 *     sam.rivera@taskboard.test) with the fixture password in
 *     ./fixtures/credentials. If the seed uses a different password, the
 *     success-path test cannot sign in.
 *   - On success the app establishes the session and navigates to the board home
 *     at "/"; the board itself is built by a later epic (currently the starter
 *     page renders there), so these tests assert only that sign-in LANDS on "/".
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic sign-in, Story 1: Sign-in screen.
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; there
 * is no backend to contact and no real credentials are used.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Mock form-fill identity — auth is validated in-browser against the mock seed, so
// this is never a real account. Never hard-code real passwords in specs.
import { teamMember } from './fixtures/credentials';

test.describe('Epic sign-in, Story 1: Sign-in screen', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-4
  test('a seeded email with its matching password signs in and lands on the board home', async ({
    page,
  }) => {
    await page.goto('/sign-in');

    await page.getByLabel(/email/i).fill(teamMember.email);
    await page.getByLabel(/password/i).fill(teamMember.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/');
    // Confirm we actually left the sign-in screen (not a silent no-op).
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeHidden();
  });

  // AC-6
  test('the form is keyboard operable — Tab reaches both fields and Enter submits', async ({
    page,
  }) => {
    await page.goto('/sign-in');

    const email = page.getByLabel(/email/i);
    const password = page.getByLabel(/password/i);

    // Focus the email field, then Tab: focus must move to the password field,
    // proving both fields are reachable and sequential in the tab order.
    await email.focus();
    await expect(email).toBeFocused();
    await page.keyboard.type(teamMember.email);

    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();
    await page.keyboard.type(teamMember.password);

    // Pressing Enter from within a field submits the form (no button click).
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
  });

  // Accessibility — real-browser axe scan, scoped to the WCAG 2.1 AA tags that
  // match NFR-base-1 / NFR-signin-1. Scan after the page settles, covering both
  // the default state and the post-failed-submit error state this story
  // introduces (violations are usually state-specific). Replaces per-component
  // jsdom axe; catches contrast / layout / focus-order jsdom can't see.
  test('the sign-in page has no accessibility violations (default and error states)', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    const defaultScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(defaultScan.violations).toEqual([]);

    // Submitting with both fields empty surfaces the inline validation state
    // (brief BR1) without leaving the page — scan that distinct state too.
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);

    const errorScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(errorScan.violations).toEqual([]);
  });
});
