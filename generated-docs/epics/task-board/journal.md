# Journal — Task board epic

## Story 1 — Board with columns, cards, assignee filter, and New task
- The board home moved out of the standalone page into a shared signed-in shell (an `(app)` route group), and the Sign out control moved into a header account menu next to Settings — the design's chosen way to reach Settings. The sign-in feature's two existing checks for the board home were updated to look at the new shell and to sign out via that menu; the behaviour they verify is unchanged.
- Wired the Inter font the design calls for (it was previously falling back to the system font), and added the green accent used for the Done column heading, both as central design tokens.
- Tasks load through the API client (get /v1/tasks) served by MSW from the seeded task data; columns group by status client-side and the assignee filter is client-side.

## Story 2 — Task detail (view, edit, move, create, delete)
- The mock task store now supports create, edit, move, and delete. It keeps your changes as you move between the board and a task within a session, but it's an in-memory stand-in (no real backend yet), so a full browser refresh resets it to the starting tasks.
- Delete asks for confirmation (a dialog) before removing a task; the delete control is hidden while creating a brand-new task.

## Story 3 — Settings (display name)
- The Settings "Save" writes the new display name into an in-memory store (mock-only, no backend to send it to — mirrors how sign-in keeps the session in the browser). The name and derived initials update everywhere the person appears on the board for the rest of the session; a full browser refresh resets it, as expected for the mock-only setup.
- This resolved the earlier open item where the header/board name was fixed to the seeded value — a saved display name now propagates live.

## Epic-end E2E fixes
- Gave the Board's assignee filter an accessible name (a role=combobox control takes no name from its value, so it needed an explicit label) — fixes a critical accessibility check.
- Fixed a real reliability bug in the mock data layer: the mock service that stands in for the backend wasn't fully ready before the first screen loaded its data, so a hard page refresh could show "We couldn't load your tasks". The app now waits for that service before showing the screen. Mock/demo mode only; a real backend is unchanged.
- Reconciled the Settings E2E test to open the header account menu before clicking Settings (the approved design keeps Settings in that menu).
