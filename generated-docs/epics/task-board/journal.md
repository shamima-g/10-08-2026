# Journal — Task board epic

## Story 1 — Board with columns, cards, assignee filter, and New task
- The board home moved out of the standalone page into a shared signed-in shell (an `(app)` route group), and the Sign out control moved into a header account menu next to Settings — the design's chosen way to reach Settings. The sign-in feature's two existing checks for the board home were updated to look at the new shell and to sign out via that menu; the behaviour they verify is unchanged.
- Wired the Inter font the design calls for (it was previously falling back to the system font), and added the green accent used for the Done column heading, both as central design tokens.
- Tasks load through the API client (get /v1/tasks) served by MSW from the seeded task data; columns group by status client-side and the assignee filter is client-side.
