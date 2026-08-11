# Journal — Design update: Board and Task detail

## Conflict resolution (design update)
- The updated `tokens.css` set the primary colour to purple `#7c3aed`, contradicting the recorded decision that primary is blue `#2563eb`. Surfaced to the user, resolved per direction: **keep blue** — the earlier decision wins over the design file. Recorded in the digest's Your Decisions; the purple was not applied and `globals.css` primary tokens were left unchanged.

## Story 1 — Board header ("Add task" + top-right filter)
- Renamed the board's primary button from "New task" to "Add task" and moved the assignee filter to sit next to it at the top-right of the header. The button behaves exactly as before.
- Updated the older task-board tests that still looked for "New task" so they find "Add task" — behaviour assertions intact.
