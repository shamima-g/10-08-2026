/**
 * Seeded prototype identity for form-fill in E2E specs.
 *
 * This is a FRONT-END-ONLY prototype (project.md PI-01): there is no backend, no real
 * authentication, and no secret here to protect. Sign-in is validated entirely in the
 * browser against this single hard-coded seeded user (project.md §Authentication) — so
 * these values are the app's own fixture data, not a real account or credential.
 */
export const seededUser = {
  email: 'user@example.com',
  password: 'Test123',
  displayName: 'Sam',
} as const;

/** Credentials that must be rejected by the client-side sign-in (BR3). */
export const wrongUser = {
  email: 'intruder@example.com',
  password: 'WrongPass9',
} as const;
