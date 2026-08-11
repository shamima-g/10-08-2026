# Story 1 — Board with columns, cards, assignee filter, and New task

**Slug:** story-1-board
**Route:** /
**Target file:** web/src/app/(app)/layout.tsx (shared authenticated shell) + web/src/app/(app)/page.tsx (Board)
**Page action:** create_new (shared shell) / replace the placeholder board home
**Roles:** Team member
**Requirement IDs:** R1, R4, BR1, BR2, BR3, NFR-1, NFR-2, NFR-3
**Infrastructure only:** false

## Summary
Establishes the shared authenticated app shell — an (app) route group whose layout carries the header (avatar/link menu with a Settings nav control plus the existing Sign out) and the signed-out route guard — and rebuilds the Board at "/" inside it. Introduces the task mock-data foundation: a Task factory + an in-session in-memory store (survives navigation, NFR-2) and MSW list/read handlers in mocks/handlers.ts, composing the existing user.ts/identity.ts factories. Renders three status columns of cards (title + derived initials), the "All assignees" filter (client-side, no reload), empty-column copy, and the done/primary column-header tokens. Completes global styling this epic owns: wiring the Inter font (--font-sans) and adding the --color-done token.

## Plain summary
A signed-in team member lands on the board and sees every task grouped into To do, In progress, and Done columns, each card showing the task title and the assignee's initials. They can narrow the board to one person with the assignee filter, and start a new task from the top-right button.

## Acceptance criteria
- **AC-1** (vitest): The board shows three columns — To do, In progress, Done — each listing its tasks as cards with the task title and the assignee's initials; the Done heading uses the done-green token and an active column heading uses primary blue.
- **AC-2** (vitest): A column with no matching tasks shows "Nothing here yet" instead of cards.
- **AC-3** (playwright): Choosing a person from the assignee filter narrows the cards to that person across all three columns; choosing "All assignees" restores every task.
- **AC-4** (playwright): The "New task" button opens the task screen ready to create a new task.
- **AC-5** (playwright): Clicking a task card opens that task's detail screen.
- **AC-6** (playwright): A signed-out visitor to the board is redirected to the sign-in screen.

## Manual test checklist
- Sign in and land on the board → you see To do / In progress / Done columns with cards showing the task title and the assignee's initials.
- The Done column heading is green and an active column heading is blue; text renders in the Inter font.
- Pick a person from the assignee filter → only their tasks show across the columns; pick "All assignees" → every task returns.
- Click "New task" → the task screen opens ready for a new task; click a card → the task screen opens with that task's details.
- Sign out from the header → you return to the sign-in page.

## Additional technical checks (2)
- In-session task store survives navigation (NFR-2).
- Assignee filter is client-side (no page reload).

## Resolved design choices
- **Assignee list source:** a fixed seeded team list (defined in the mock data layer).
- **Initials derivation:** first name + last name initials (e.g. "Jane Doe" → "JD"); single-word names fall back to the first two letters.
- **Reaching Settings:** a link/avatar menu in the app header (this epic adds it — the design has no such control).
- **New-task flow:** the "New task" button opens the Task detail screen in an empty create state.

## Infrastructure reuse notes
- Use useAuth() from web/src/contexts/AuthContext.tsx (user.email, isHydrated, signOut). Do NOT add a new auth wrapper.
- Lift the route-guard + bfcache pattern from web/src/app/page.tsx into the shared (app) layout; replace the placeholder board home (CLAUDE.md §6: replace, don't nest).
- Extend the shared mock-data factories in web/src/mocks/data/ — add a Task factory alongside user.ts/identity.ts; never re-derive the User/Assignee shape inline.
- Add task list/read handlers to web/src/mocks/handlers.ts composing the data factories. All API calls go through web/src/lib/api/client.ts (CLAUDE.md §2).
- Design tokens single source in web/src/app/globals.css — WIRE Inter (--font-sans currently points at an undefined --font-geist-sans) and ADD --color-done (#16a34a). No raw hex in components (styling-centralisation).
- Shadcn: install select via (cd web && npx shadcn add select --yes). Compose, don't hand-roll (CLAUDE.md §1).
