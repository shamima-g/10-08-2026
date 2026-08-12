/**
 * Story Metadata:
 * - Route: /notes
 * - Target File: web/src/app/notes/page.tsx
 * - Page Action: create_new
 *
 * Mocking strategy:
 * - This is a FRONT-END-ONLY prototype (project.md PI-01): there is NO backend, NO API,
 *   NO database, and NO network calls anywhere in the app. Sign-in and all note state are
 *   simulated entirely client-side, in-memory, in React context. There is therefore
 *   nothing to intercept — no page.route(), no MSW. This is not the forbidden
 *   "live backend" case (there is no backend that exists to contact); the app validates
 *   the seeded credentials in the browser itself.
 * - Implementation pattern this assumes:
 *   - The app root (`/`) renders the sign-in screen while signed out and the home shell
 *     once signed in; `/notes` while signed out also gates to the sign-in screen
 *     (the starter welcome page at app/page.tsx is replaced — project.md story notes).
 *   - Sign-in accepts ONLY the seeded user (user@example.com / Test123, "Sam"); the
 *     session lives in a client-side context/provider shared with the future Tasks epic.
 *   - Because state is in-memory (PI-02), every fresh page load starts signed out with an
 *     empty notes list — deep-linking to a feature URL therefore lands on sign-in.
 *   - Notes render as an accessible list (one listitem per note), newest-first (BR1); the
 *     note field exposes an accessible name matching /note/i; the "Note added" confirmation
 *     is the existing ToastContext toast.
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic "notes", Story 1: Sign in, home shell, and Notes page.
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; there is no
 * backend and no real credentials — the seeded values below are the app's own fixture
 * data, validated client-side.
 * This story is ROUTABLE — every test below is a live test() (no test.fixme()).
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Seeded prototype identity for form-fill — no backend exists, so this is fixture data,
// never a real account or secret (see project.md PI-01).
import { seededUser } from './fixtures/credentials';

import type { Page } from '@playwright/test';

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Sign in with the seeded user from the root and wait for the home shell to render. */
async function signIn(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Email').fill(seededUser.email);
  await page.getByLabel('Password').fill(seededUser.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Home shell is confirmed by its feature links, since the exact home URL is not fixed.
  await expect(page.getByRole('link', { name: /notes/i })).toBeVisible();
}

test.describe('Epic notes, Story 1: Sign in, home shell, and Notes page', () => {
  // AC-1
  test('signing in with the seeded credentials lands on a home screen linking to Notes and Tasks', async ({
    page,
  }) => {
    await signIn(page);

    await expect(page.getByRole('link', { name: /notes/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /tasks/i })).toBeVisible();
    // The sign-in form is gone once signed in.
    await expect(page.getByRole('button', { name: /sign in/i })).toBeHidden();
  });

  // AC-3
  test('signed out, visiting the app root shows the sign-in screen — not the welcome page, not Notes', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    // Not the starter welcome page (its distinctive placeholder text must be gone).
    await expect(
      page.getByText(/replace this with your feature implementation/i),
    ).toBeHidden();
    // Not the Notes page — the note-entry field is not rendered on the sign-in screen.
    await expect(page.getByRole('textbox', { name: /note/i })).toBeHidden();
  });

  // AC-3
  test('signed out, deep-linking to /notes shows the sign-in screen — not the Notes page', async ({
    page,
  }) => {
    await page.goto('/notes');

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    // The Notes UI (its add-a-note field) must not be reachable without a session.
    await expect(page.getByRole('textbox', { name: /note/i })).toBeHidden();
  });

  // End-to-end note-adding happy path (sign in -> home -> Notes -> add notes)
  test('a signed-in user adds notes on /notes: newest-first, count grows, field clears, "Note added" shows', async ({
    page,
  }) => {
    await signIn(page);

    await page.getByRole('link', { name: /notes/i }).click();
    const noteField = page.getByRole('textbox', { name: /note/i });
    await expect(noteField).toBeVisible();

    // Add the first note.
    await noteField.fill('Buy oat milk');
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(page.getByText(/note added/i)).toBeVisible();
    await expect(noteField).toHaveValue(''); // field cleared on success (R4)
    await expect(page.getByRole('listitem')).toHaveCount(1); // count grew to 1
    await expect(page.getByRole('listitem').first()).toContainText(
      'Buy oat milk',
    );

    // Add a second note — it must land at the top (newest-first, BR1) and grow the count.
    await noteField.fill('Call the dentist');
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(noteField).toHaveValue('');
    await expect(page.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByRole('listitem').first()).toContainText(
      'Call the dentist',
    );
    // The earlier note is still present, now below the newest one.
    await expect(page.getByText('Buy oat milk')).toBeVisible();
  });

  // Per-epic baseline: shared sign-in + home shell cross-surface navigation.
  test('baseline: the shared home shell links out to both features and navigates to Notes', async ({
    page,
  }) => {
    await signIn(page);

    // The Tasks feature is delivered in its own epic; assert the shell exposes the link
    // targeting /tasks without navigating there (that route is not built in this epic).
    await expect(page.getByRole('link', { name: /tasks/i })).toHaveAttribute(
      'href',
      /\/tasks\/?$/,
    );

    // Navigating to the Notes feature via the shared shell reaches the Notes page.
    await page.getByRole('link', { name: /notes/i }).click();
    await expect(page).toHaveURL(/\/notes\/?$/);
    await expect(page.getByRole('textbox', { name: /note/i })).toBeVisible();
  });

  // Per-epic accessibility baseline: real-browser axe scan across every distinct state
  // this story introduces (sign-in, home shell, empty Notes, populated Notes), scoped to
  // WCAG 2.1 AA to match NFR-base-1. Replaces per-component jsdom axe.
  test('baseline: no accessibility violations across sign-in, home, and Notes states', async ({
    page,
  }) => {
    // State 1: sign-in screen (signed out).
    await page.goto('/');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze())
        .violations,
    ).toEqual([]);

    // State 2: home shell (signed in).
    await signIn(page);
    await expect(page.getByRole('link', { name: /notes/i })).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze())
        .violations,
    ).toEqual([]);

    // State 3: Notes page, empty state.
    await page.getByRole('link', { name: /notes/i }).click();
    await expect(page.getByRole('textbox', { name: /note/i })).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze())
        .violations,
    ).toEqual([]);

    // State 4: Notes page with a note added (populated list + confirmation).
    await page.getByRole('textbox', { name: /note/i }).fill('Buy oat milk');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByRole('listitem').first()).toContainText(
      'Buy oat milk',
    );
    expect(
      (await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze())
        .violations,
    ).toEqual([]);
  });
});
