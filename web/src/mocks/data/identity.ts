/**
 * Project-wide identity source: userInfoFor(role).
 *
 * The ONE place the "who is signed in" userinfo body is defined. Both the Vitest
 * layer and the Playwright layer import this — never inline a userinfo body in a
 * spec, or the two layers drift.
 *
 * Built from project.md §Roles & Permissions: a single "Team member" role for
 * launch (R6 — no admin tier, no role-based differences). Auth is frontend-only
 * (project.md §Authentication) — there is no server session or token exchange, so
 * this shape only needs enough identity to gate access (Roles/Pages) and to drive
 * sign-out.
 *
 * Import discipline: sibling factory imported by relative path, its type via
 * `import type` — never the `@/` alias (keeps the e2e runtime resolving this
 * without alias plumbing).
 */
import { createUser } from './user';

import type { User } from './user';

/** The userinfo shape the app gates protected screens on. */
export interface UserInfo {
  Email: string;
  DisplayName: string;
  Roles: string[];
  Pages: string[];
}

/**
 * Pages each role may reach, derived from project.md §Roles & Permissions. The
 * single "Team member" role can view every protected screen (R6), so it maps to
 * all three: Board, Task detail, Settings.
 */
const PAGES_BY_ROLE: Record<string, string[]> = {
  'Team member': ['Board', 'Task detail', 'Settings'],
};

/**
 * Build the userinfo body for a role name. Defaults to the canonical seeded team
 * member's identity; pass `identity` overrides to sign in as a different seeded
 * user in a multi-user test.
 */
export function userInfoFor(
  roleName: string,
  identity: Partial<User> = {},
): UserInfo {
  const user = createUser(identity);
  return {
    Email: user.email,
    DisplayName: user.displayName,
    Roles: [roleName],
    Pages: PAGES_BY_ROLE[roleName] ?? [],
  };
}
