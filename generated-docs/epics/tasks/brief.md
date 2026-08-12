# Epic: Tasks

Inherits roles, auth, data source, compliance, and styling from project.md.

## Goal

Sam can track simple tasks on a Tasks page — adding a task, ticking it done
(struck-through), seeing how many are still outstanding, with empty titles
blocked and a friendly empty state.

This epic depends on the **Notes** epic, which stands up the shared
client-side sign-in session and the home-screen shell. Tasks reuses that
existing session and is reached via a link from the home screen — this epic
does **not** re-implement sign-in, the home screen, or session state; it only
adds the `/tasks` page and its own task list.

## Data Model

Front-end only, in-memory (per project.md Prototype Invariants PI-01/PI-02) —
no API, no backend, no persistence across reloads.

**Task** (held in client-side state, scoped to the signed-in user's session):

| Field | Type | Notes |
|---|---|---|
| `id` | string | Generated client-side (e.g. `crypto.randomUUID()` or incrementing counter) |
| `title` | string | Short task title; non-empty (see R3) |
| `done` | boolean | Defaults to `false` on creation |
| `createdAt` | timestamp | For stable ordering; not shown to the user |

The seeded user starts with an **empty** tasks list on every fresh session
(PI-02) — the empty state (R4) is the default view.

## Functional Requirements

- **R1:** On `/tasks`, the signed-in user types a short task title into a text
  field and clicks Add; the task appears in a list with a checkbox to mark it
  done.
- **R2:** When a task's checkbox is checked, the task is marked done and its
  title renders struck-through in the list; unchecking reverses this.
- **R3:** Adding a task with an empty (or whitespace-only) title is prevented
  — Add is blocked and/or an inline validation message shows; the list is
  unchanged and the input is not cleared into an empty task.
- **R4:** When there are no tasks, the page shows an empty state reading
  exactly "No tasks yet".
- **R5:** The page displays a live count of tasks that are still outstanding
  (i.e., not done) — the count updates immediately as tasks are added,
  checked, or unchecked.

## Business Rules

- **BR1:** A task's `done` state defaults to `false` on creation — new tasks
  always start as outstanding.
- **BR2:** The outstanding count (R5) reflects only tasks where `done` is
  `false`; done tasks are excluded from the count but remain visible
  (struck-through) in the list.
- **BR3:** Task title validation (R3) is trimmed of leading/trailing
  whitespace before the empty check — a title of only spaces is treated as
  empty.
- **BR4:** On successful add, the input field clears so the user can add the
  next task without manually clearing it (consistent with the Notes epic's
  add-and-clear pattern).

## Key Workflows

1. **Sign in and navigate to Tasks** (owned by the Notes epic — assumed
   available): Sam signs in → lands on the home screen → clicks the link to
   Tasks → arrives at `/tasks`.
2. **Add a task:** Sam types a title into the input → clicks Add → the task
   appears at the top or bottom of the list (list-order choice is a BUILD
   detail; no ordering requirement was specified) with an unchecked checkbox
   → the input clears → the outstanding count increments by one.
3. **Mark a task done:** Sam checks a task's checkbox → the title renders
   struck-through → the outstanding count decrements by one.
4. **Attempt to add an empty task:** Sam clicks Add with an empty or
   whitespace-only title → nothing is added to the list → an inline message
   or disabled-state feedback communicates why → the outstanding count is
   unchanged.
5. **View with no tasks:** Sam arrives at `/tasks` with an empty list (fresh
   session, per PI-02) → sees "No tasks yet" instead of an empty list area.

## Feature NFRs

- **NFR-1:** Checkbox toggling (R2) and the outstanding count (R5) update
  synchronously and immediately — no perceptible delay, since all state is
  client-side in-memory (per PI-01).
- **NFR-2:** The checkbox and struck-through styling are keyboard-operable
  and screen-reader-friendly (checkbox has an accessible label tied to the
  task title; `done` state is conveyed through more than strikethrough alone
  — e.g. `aria-checked` / semantic checkbox state) per project.md
  NFR-base-1.

## Out of Scope

- Editing or deleting a task title after creation — not specified.
- Reordering, sorting, filtering, or categorizing tasks.
- Due dates, priorities, notes/descriptions on a task, or any field beyond
  the title.
- Persistence across page reloads or sessions (explicitly excluded per
  PI-02).
- Any sharing of tasks between users, or multi-user visibility — there is
  only the single seeded user (per project.md §Roles & Permissions).
- Sign-in, the home screen, and session management — owned by the Notes
  epic; this epic only consumes the existing session.

## Notes & Caveats

- No design digest exists for this project (docs-only intake, no wireframes
  or design files attached) — layout, spacing, and visual treatment of the
  checkbox/strikethrough are BUILD-time decisions guided by project.md
  §Styling & Branding (Shadcn defaults, blue-600 primary) and NFR-base-3
  (responsive breakpoints).
- The requirements source (`documentation/requirements.md`) explicitly calls
  for Notes and Tasks to remain **independent, single-story epics** — do not
  pull in Notes' add/clear/confirmation UI beyond the shared sign-in session
  and home-screen shell already assumed available.
- Validation (R3) and the outstanding count (R5) are enforced entirely
  client-side with no backend fallback, per PI-03 / NFR-base-6 — get the
  client-side logic right since there is nothing else to catch mistakes.
