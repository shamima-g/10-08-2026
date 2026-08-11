/**
 * Mock sign-in identities for Playwright form-fill ONLY.
 *
 * Auth is frontend-only and the data source is mock-only (project.md
 * §Authentication / §Data Source): there is no backend and no real account. These
 * are a TEST FIXTURE — the email mirrors the canonical seeded mock user
 * (web/src/mocks/data/user.ts, the single source of truth for that identity) and
 * the password is the value the app's seeded mock credential layer validates
 * sign-in against. Never a real password; never hard-code a real one here.
 *
 * Import discipline: the sibling mock user factory is pulled in by relative path
 * (not the `@/` alias) so the Playwright runtime resolves it without alias
 * plumbing.
 */
import { createUser } from '../../src/mocks/data/user';

/**
 * The canonical seeded team member, paired with the test-fixture password the
 * mock credential layer checks sign-in against. The developer seeds the mock
 * credential store (created in Story 1) with this exact email/password pair.
 */
export const teamMember = {
  email: createUser().email, // sam.rivera@taskboard.test
  password: 'taskboard-dev-pw', // scan-secrets-ignore — Playwright test fixture, mock-only (see file header)
};
