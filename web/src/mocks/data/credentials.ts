/**
 * Seeded mock credentials — the single named location for sign-in email/password
 * pairs (brief NFR-signin-2). Auth is frontend-only and mock-only (project.md
 * §Authentication / §Data Source): there is no backend, so `signIn` in
 * `@/contexts/AuthContext` validates submitted credentials against this set with
 * no REST call (brief R2).
 *
 * The password literal lives ONLY in this module — specs and the Playwright
 * fixture reference the value here (or the shared fixture that mirrors it), never
 * a second hard-coded copy. When a real auth backend arrives this is the one file
 * to swap out.
 *
 * The first entry is the canonical team member: its email is the shared identity
 * from `@/mocks/data/user` (createUser().email) and its password matches the
 * Playwright fixture `web/e2e/fixtures/credentials.ts`.
 */
import { createUser } from './user';

export interface SeededCredential {
  email: string;
  password: string;
}

export const seededCredentials: SeededCredential[] = [
  {
    email: createUser().email, // sam.rivera@taskboard.test
    password: 'taskboard-dev-pw', // scan-secrets-ignore — mock-only seed fixture, no real backend (see file header)
  },
];

/**
 * Validate a submitted email/password against the seeded set. Email match is
 * case-insensitive (emails are case-insensitive identifiers); password match is
 * exact. Returns the matched credential's canonical email, or null when no pair
 * matches — the caller surfaces a single generic error either way (brief BR2), so
 * this never reveals which field was wrong.
 */
export function matchCredential(
  email: string,
  password: string,
): SeededCredential | null {
  const normalized = email.trim().toLowerCase();
  return (
    seededCredentials.find(
      (cred) =>
        cred.email.toLowerCase() === normalized && cred.password === password,
    ) ?? null
  );
}
