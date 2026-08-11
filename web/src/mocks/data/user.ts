/**
 * Project-wide entity factory: User.
 *
 * The single source of truth for the signed-in team member's identity shape and
 * canonical values. Shared by BOTH the Vitest and Playwright layers so response
 * bodies never drift between them — never re-define this shape inside a spec.
 *
 * Anchored to the sign-in brief's Data Model (Session identifies the user by
 * email) plus the design digest's Assignee/User shape (display name), which the
 * later task-board epic reuses. No `@/types/api-generated` exists (mock-only,
 * no OpenAPI spec), so the shape is inferred from those docs.
 *
 * Import discipline (so the Playwright runtime can import this without alias
 * plumbing): sibling factories are imported by relative path, types via
 * `import type` — never the `@/` alias.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
}

/**
 * Canonical seeded team member. Its `email` is the shared identity the mock
 * auth layer validates against and that Vitest/Playwright specs fill into the
 * sign-in form — keep the mock credential seed's email in sync with this value.
 */
export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'sam.rivera@taskboard.test',
    displayName: 'Sam Rivera',
    ...overrides,
  };
}
