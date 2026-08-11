# Journal — Task board epic

## Story 1 — Board with columns, cards, assignee filter, and New task
- The board home moved out of the standalone page into a shared signed-in shell (an `(app)` route group), and the Sign out control moved into a header account menu next to Settings — the design's chosen way to reach Settings. The sign-in feature's two existing checks for the board home were updated to look at the new shell and to sign out via that menu; the behaviour they verify is unchanged.
- Wired the Inter font the design calls for (it was previously falling back to the system font), and added the green accent used for the Done column heading, both as central design tokens.
- Tasks load through the API client (get /v1/tasks) served by MSW from the seeded task data; columns group by status client-side and the assignee filter is client-side.

## Story 2 — Task detail (view, edit, move, create, delete)
- The mock task store now supports create, edit, move, and delete. It keeps your changes as you move between the board and a task within a session, but it's an in-memory stand-in (no real backend yet), so a full browser refresh resets it to the starting tasks.
- Delete asks for confirmation (a dialog) before removing a task; the delete control is hidden while creating a brand-new task.
