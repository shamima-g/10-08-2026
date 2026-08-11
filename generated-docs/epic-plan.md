# Epic Plan — TaskBoard

Every epic in this project, what it delivers, and what it builds on. Live status
(not started / in flight / done) is shown by `/status` and the dashboard.

> Plan only — edited during planning on `main`, never on an epic branch.

## Epics

| # | Epic | Delivers | Builds on |
|---|---|---|---|
| 1 | Sign in (`sign-in`) | A team member signs in with email + password to reach their board, and can sign out again. | — |
| 2 | Task board, task detail, and settings (`task-board`) | A signed-in team member sees tasks across To do / In progress / Done, filters by assignee, creates / edits / moves / deletes a task, and sets their own display name. | Sign in (`sign-in`) |

## Coverage

Everything in the spec is assigned to an epic:

| What you asked for | Epic |
|---|---|
| Email and password sign-in (R5) | Sign in (`sign-in`) |
| Board screen with three status columns (R1) | Task board, task detail, and settings (`task-board`) |
| Task detail screen for viewing and editing a task (R2) | Task board, task detail, and settings (`task-board`) |
| Settings screen for the user's display name (R3) | Task board, task detail, and settings (`task-board`) |
| Task data and mock CRUD layer (R4) | Task board, task detail, and settings (`task-board`) |

_5 requirements, all assigned._
