/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/page.tsx
 * - Page Action: modify_existing
 *
 * Mocking strategy:
 * - FRONT-END ONLY. This story has NO backend and issues NO network request of any
 *   kind. There is therefore nothing to mock and nothing to intercept — the assertion
 *   that matters is the *absence* of any fetch/XHR when the form is submitted (AC-5).
 * - Implementation pattern this assumes:
 *   - The form/confirmation swap is genuine React component state (not a navigation and
 *     not a `hidden`-attribute toggle): on a valid submit the form is replaced in place,
 *     on the same `/` route, with no `<Link>`/router navigation and no data fetch.
 *   - The submit handler is a pure client-side no-op — it validates, then renders the
 *     confirmation. It must call no API client, `fetch`, `XMLHttpRequest`, or Server
 *     Action (any of those would surface as a fetch/XHR and fail AC-5).
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic "contact-form", Story 1: Contact form with validation and confirmation.
 * playwright.config.ts's webServer block boots the FRONTEND dev server only; this story
 * contacts no backend at all, so no server mocks and no credentials are involved.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to know more about your services.',
};

async function fillValidForm(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.getByLabel(/name/i).fill(VALID.name);
  await page.getByLabel(/email/i).fill(VALID.email);
  await page.getByLabel(/message/i).fill(VALID.message);
}

test.describe('Epic contact-form, Story 1: Contact form with validation and confirmation', () => {
  // AC-4
  test('a valid submit replaces the form in place with the confirmation, URL unchanged', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Get in touch' }),
    ).toBeVisible();

    const urlBeforeSubmit = page.url();

    await fillValidForm(page);
    await page.getByRole('button', { name: 'Send message' }).click();

    // The confirmation replaces the form on the SAME surface.
    await expect(page.getByText("Thanks, we'll be in touch.")).toBeVisible();
    // The form is gone — its submit control is no longer present.
    await expect(
      page.getByRole('button', { name: 'Send message' }),
    ).toHaveCount(0);

    // No navigation occurred: same `/` route, unchanged URL.
    await expect(page).toHaveURL(/\/$/);
    expect(page.url()).toBe(urlBeforeSubmit);
  });

  // AC-5
  test('submitting valid data issues no network request of any kind', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Get in touch' }),
    ).toBeVisible();

    await fillValidForm(page);

    // Start recording only around the submit action, so we measure exactly the requests
    // the app fires *on submit* (not the initial document/asset/HMR traffic). A front-end
    // no-op submit must produce zero fetch/XHR.
    const submitRequests: string[] = [];
    const recordFetchOrXhr = (
      request: import('@playwright/test').Request,
    ): void => {
      const type = request.resourceType();
      if (type === 'fetch' || type === 'xhr') {
        submitRequests.push(`${request.method()} ${request.url()}`);
      }
    };
    page.on('request', recordFetchOrXhr);

    await page.getByRole('button', { name: 'Send message' }).click();
    // Wait for the observable result of the submit before asserting on network activity.
    await expect(page.getByText("Thanks, we'll be in touch.")).toBeVisible();
    // Give any (erroneous) async submit call a chance to appear before we stop listening.
    await page.waitForLoadState('networkidle');

    page.off('request', recordFetchOrXhr);

    expect(submitRequests).toEqual([]);
  });
});
