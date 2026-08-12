# Epic: Notes

Inherits roles, auth, data source, compliance, and styling from project.md.

## Goal

After a simple sign-in, Sam lands on a home screen and can jot quick notes on a Notes
page — adding to a newest-first list with a running count, with empty notes blocked and
a friendly empty state. This is the first epic and owns the shared sign-in and
home-screen shell that the Tasks epic will build on.

## Data Model

Front-end only, in-memory — no backend, no API calls (PI-01). Data need not survive a
page reload (PI-02).

**User (seeded, single record)**

| Field | Type | Notes |
|---|---|---|
| email | string | `user@example.com` — the only valid sign-in email |
| password | string | `Test123` — the only valid sign-in password |
| displayName | string | `Sam` |
| role | string | `User` |

**Session**

| Field | Type | Notes |
|---|---|---|
| isSignedIn | boolean | Simulated client-side; no token, no cookie, no real auth |
| user | User \| null | The seeded user once signed in |

**Note**

| Field | Type | Notes |
|---|---|---|
| id | string | Client-generated (e.g. incrementing counter or `crypto.randomUUID()`) |
| text | string | Non-empty; the note content typed by the user |
| createdAt | number \| Date | Used to order the list newest-first |

The seeded user starts each fresh session with an **empty** notes list (PI-02).

## Functional Requirements

- **R1:** A stubbed, client-side-only sign-in accepts exactly one seeded user (email
  `user@example.com`, password `Test123`, display name Sam, role User); there is no real
  authentication or backend, and the session is simulated entirely client-side (PI-01).
- **R2:** After signing in, the user lands on a home screen that links to the two
  features (Notes and Tasks).
- **R3:** On `/notes`, the signed-in user types a note into a single text field and
  clicks Add; a non-empty note is added to a list shown newest-first, with a count of
  notes displayed.
- **R4:** On a successful add, the note field clears and a "Note added" confirmation is
  shown.
- **R5:** Adding an empty note is prevented — Add is blocked and/or an inline message is
  shown.
- **R6:** When there are no notes, the page shows an empty state reading "No notes yet".

## Business Rules

- **BR1:** Notes are always displayed newest-first (most recently added note at the top
  of the list).
- **BR2:** A note consisting only of whitespace counts as empty and is blocked the same
  as a fully empty field (per R5).
- **BR3:** Sign-in succeeds only for the exact seeded credentials
  (`user@example.com` / `Test123`); any other input is rejected with a visible error —
  there is no account creation, password reset, or additional seeded user.
- **BR4:** All sign-in and note state is held in memory only; there is no server-side
  enforcement of any rule in this epic (PI-03) — client-side validation must be complete
  and correct on its own.
- **BR5:** The notes list and count start empty at the beginning of every fresh session,
  even for the seeded user (PI-02).

## Key Workflows

1. **Sign in:** user opens the app → enters email + password on a sign-in screen → on
   matching the seeded credentials, session is set client-side and user is routed to the
   home screen. On mismatched credentials, an inline error is shown and the user stays on
   the sign-in screen.
2. **Navigate to Notes:** from the home screen, the signed-in user clicks the Notes link
   → routed to `/notes`.
3. **View empty state:** on first visit with zero notes, `/notes` shows "No notes yet"
   and a count of 0.
4. **Add a note:** user types text into the note field → clicks Add → (if non-empty)
   the note appears at the top of the list, the count increments, the field clears, and
   a "Note added" confirmation is shown. (if empty/whitespace-only) Add is blocked and/or
   an inline message is shown; no note is added, list and count are unchanged.
5. **Add subsequent notes:** repeating the add flow always inserts the newest note at the
   top of the existing list, keeping the count accurate.

## Feature NFRs

No feature-specific NFRs beyond the project baseline (see project.md §Baseline NFRs,
including NFR-base-6 on client-side-only validation).

## Out of Scope

- Editing or deleting existing notes.
- Persisting notes across a page reload or browser session (per PI-02).
- Sharing notes, multiple users, or any back-office/admin view of notes.
- The Tasks feature (`/tasks`) — delivered in its own, independent epic.
- Sign-out flow, password reset, or account creation (not called for in the requirements;
  refine during BUILD if scope ambiguity surfaces).

## Notes & Caveats

- No design was supplied for this project (docs-only intake) — there is no digest, no
  palette override, and no screen-level layout spec to follow beyond project.md's
  defaulted Shadcn styling. Layout, spacing, and component choice for the sign-in, home,
  and Notes screens are left to BUILD's judgment within the project's styling and
  baseline NFRs.
- This epic owns the shared sign-in stub and home-screen shell (R1, R2) that the Tasks
  epic depends on and will reuse as-is — do not duplicate this logic when Tasks is
  planned; it should link to the same session state and home screen.
