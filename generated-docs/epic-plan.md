# Epic Plan — Personal Notes & Tasks

Every epic in this project, what it delivers, and what it builds on. Live status
(not started / in flight / done) is shown by `/status` and the dashboard.

> Plan only — edited during planning on `main`, never on an epic branch.

## Epics

| # | Epic | Delivers | Builds on |
|---|---|---|---|
| 1 | Notes (`notes`) | After a simple sign-in, Sam lands on a home screen and can jot quick notes on a Notes page — newest-first list with a running count, empty notes blocked, friendly empty state. | — |
| 2 | Tasks (`tasks`) | Sam can track simple tasks on a Tasks page — add a task, tick it done (struck-through), see how many are still outstanding, empty titles blocked, friendly empty state. | Notes (`notes`) |

## Coverage

Everything in the spec is assigned to an epic:

| What you asked for | Epic |
|---|---|
| Stubbed sign-in with one seeded user (R1) | Notes (`notes`) |
| Home screen after sign-in (R2) | Notes (`notes`) |
| Add a note to a newest-first list with a count (R3) | Notes (`notes`) |
| Field clears and shows a "Note added" confirmation (R4) | Notes (`notes`) |
| Empty note is prevented (R5) | Notes (`notes`) |
| Empty state "No notes yet" (R6) | Notes (`notes`) |
| Add a task and mark it done (struck-through) (R7) | Tasks (`tasks`) |
| Outstanding-task count (R8) | Tasks (`tasks`) |
| Empty task title is prevented (R9) | Tasks (`tasks`) |
| Empty state "No tasks yet" (R10) | Tasks (`tasks`) |

_10 requirements, all assigned._
