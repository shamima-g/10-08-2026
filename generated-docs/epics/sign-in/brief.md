# Epic: Sign in

Inherits roles, auth, data source, compliance, and styling from project.md.

## Goal

A team member signs in with their email and password to reach their task board, and can sign out again.

## Data Model

No schema or design file specifies a credential/session shape — the following is inferred from the requirement and the mock-only data source in project.md.

| Entity | Fields | Notes |
|---|---|---|
| **Credential** (mock layer) | `email`, `password` | Seed data only — a fixed set of email/password pairs in the mock layer. Never exposed to the client beyond the sign-in check itself. |
| **Session** | `email` (identifies the signed-in user) | Represents "who is signed in" for the rest of the app. Frontend-only per project.md §Authentication — no server session, no token exchange. Persists across reloads until sign-out. |

The design digest's **Data Shapes** section describes a separate `Assignee / User` entity (display name, initials) used by the Board and Settings screens — that entity's display-name field is out of scope here; it belongs to whichever epic builds Settings. This epic only needs enough identity (the signed-in user's email) to gate access and to drive sign-out.

## Functional Requirements

- **R1:** A user signs in from a dedicated sign-in screen using an email field and a password field.
- **R2:** Submitted credentials are validated against the mock data layer (no backend call) — there is no SSO option.
- **R3:** On successful sign-in, the user is taken to the Board screen.
- **R4:** On failed sign-in (email/password don't match a seeded credential, or either field is empty), the user sees an error and stays on the sign-in screen.
- **R5:** A signed-in user sees a sign-out control; using it returns them to the sign-in screen and clears the session.
- **R6:** There is a single "Team member" role for launch — no admin tier, no role-based differences in what a signed-in user can see or do.
- **R7:** Visiting any protected screen (Board, Task detail, Settings) while signed out redirects to the sign-in screen.

## Business Rules

- **BR1:** Both email and password are required — submitting either field empty shows an inline validation message and does not attempt sign-in.
- **BR2:** An invalid-credentials error is generic (e.g. "Incorrect email or password") — it never reveals which of the two fields was wrong.
- **BR3:** No SSO, "forgot password," or self-registration entry points are shown on the sign-in screen.
- **BR4:** The session persists across page reloads/tab closes until the user explicitly signs out (mock/local persistence — there is no server session to expire it).

## Key Workflows

1. **Cold visit:** an unauthenticated user opens the app → redirected to the sign-in screen.
2. **Sign in (success):** user enters a seeded email + matching password → submits → reaches the Board.
3. **Sign in (failure):** user enters an email/password that doesn't match, or leaves a field empty → sees an error → remains on the sign-in screen.
4. **Sign out:** a signed-in user uses the sign-out control → session clears → returns to the sign-in screen.
5. **Protected-route guard:** a signed-out user directly navigates (or is linked) to Board/Task detail/Settings → redirected to sign-in instead of the requested screen.

## Feature NFRs

- **NFR-signin-1:** The sign-in form is fully operable by keyboard (tab order, Enter-to-submit) and its error message is announced to screen readers — extends baseline NFR-base-1 for this screen specifically.
- **NFR-signin-2:** Seeded mock credentials live in a single, clearly-named mock-data location (not scattered inline) so they're easy to find and swap out when a real backend arrives.

## Out of Scope

- Password reset / "forgot password" flow.
- SSO or any third-party identity provider.
- Self-service account registration or sign-up — the mock layer seeds a fixed set of users.
- Multi-role permissions or an admin tier (single "Team member" role only, per project.md).
- "Remember me" / persistent-login options beyond the default session persistence in BR4.
- Real backend authentication — this epic validates against the mock layer only; swapping in a real auth backend is future work.

## Notes & Caveats

- **Design gap — no sign-in screen in the source design.** The design digest's Screens section covers only Board, Task detail, and Settings; nothing depicts a sign-in screen. Build a clean, minimal email + password form using the project's existing design tokens (primary `#2563eb` / hover `#1d4ed8`, background `#f8fafc`, surface `#ffffff`, text `#0f172a`, muted `#64748b`, `"Inter", system-ui, sans-serif`, `8px` radius, `16px` base spacing unit) rather than inventing new colors or type choices for this screen.
- **Translate, don't copy** (from the digest, applies here too): avoid inert placeholder handlers and inline styles — the sign-in form's submit/sign-out actions must be real handlers wired to the mock credential check and session state, expressed through design tokens and composed Shadcn primitives, not one-off inline styling.
- The digest's Uncertainties around the *Assignee/User* entity (initials derivation, where the assignee list comes from) are not this epic's concern — they belong to the Board/Task-detail epic. This epic's "user" is only the sign-in identity (email), tracked separately from that display-name/initials entity until a later epic reconciles them (e.g. if Settings' display name should map to the signed-in email).
