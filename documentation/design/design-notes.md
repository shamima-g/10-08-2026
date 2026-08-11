# TaskBoard — updated design (Phase 2 / #15)

This replaces the original `design-notes.md`. It changes only the **Board** and **Task detail**
screens. **Settings is unchanged** — do not touch it.

## Board (changed)
- The primary action button is now labelled **Add task** (was "New task").
- The **All assignees** filter moves from the top-left to the **top-right**, next to the button.
- Empty column copy is unchanged: **Nothing here yet**.

## Task detail (changed)
- Add a **Priority** field: a dropdown with **Low / Medium / High**.
- All other fields (Title, Assignee, Status, Due date) and the **Save changes** / **Delete task**
  buttons are unchanged.

## Settings (unchanged)
No change.

## Note on colour (intentional conflict)
`tokens.css` in this update sets the primary colour to purple (`#7c3aed`). This **contradicts**
the decision already recorded during the first build (primary is blue `#2563eb`). The workflow
should not silently switch — it should ask which one wins.
