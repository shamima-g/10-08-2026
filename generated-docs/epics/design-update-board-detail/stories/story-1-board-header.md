# Story 1 — Board header: "Add task" label and top-right filter grouping

**Slug:** story-1-board-header
**Route:** /
**Target file:** web/src/app/(app)/page.tsx
**Page action:** modify_existing
**Roles:** Team member
**Requirement IDs:** R1, R2, BR1, BR2, NFR-1
**Infrastructure only:** false

## Summary
Modify the existing Board page so the primary action button label changes from "New task" to "Add task" and the assignee filter is regrouped with it at the top-right of the header (filter first, then button). No change to card contents, column structure, filtering logic, or the create navigation target — behaviour is preserved from the task-board epic.

## Plain summary
On the Board, the primary button now reads "Add task" instead of "New task", and the "All assignees" filter moves to the top-right of the header, sitting next to the Add task button. Filtering and the create flow behave exactly as before.

## Acceptance criteria
- **AC-1** (vitest): The Board's primary action button reads "Add task".
- **AC-2** (vitest): The assignee filter and the "Add task" button are grouped together in the header, with the filter appearing before the button.
- **AC-3** (playwright): Clicking "Add task" opens the Task detail screen in its empty create state.
- **AC-4** (playwright): Selecting an assignee from the filter narrows the columns to that assignee's tasks; "All assignees" shows every task.
- **AC-5** (vitest): An empty column still shows "Nothing here yet".

## Manual test checklist
- Open the board → the primary button reads 'Add task'
- The assignee filter and 'Add task' button sit together at the top-right, filter first
- Click 'Add task' → the empty new-task form opens
- Pick an assignee → columns narrow; pick 'All assignees' → every task is back
- An empty column still shows 'Nothing here yet'
- The board header stays readable on a narrow phone-width window

## Infrastructure reuse notes
- Change the button label + regroup the header only; do NOT rebuild column/card/filter logic (findTeamMember, getInitials, display-name store, retry/loading/error all stay).
- The header is already a flex row (justify-between) with filter then button — wrap both in a right-aligned group rather than adding new components. Keep the assignee filter's accessible name (aria-label).
- Primary colour stays blue #2563eb — do NOT apply the design's purple #7c3aed; do NOT modify globals.css primary tokens.
- Settings is out of scope — do not touch it.
