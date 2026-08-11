# Story 2 — Task detail: view, edit, move, create, and delete a task

**Slug:** story-2-task-detail
**Route:** /tasks/[id]
**Target file:** web/src/app/(app)/tasks/[id]/page.tsx
**Page action:** create_new
**Roles:** Team member
**Requirement IDs:** R2, R4, BR4, BR5, BR6, BR7, NFR-2
**Infrastructure only:** false

## Summary
Builds the Task detail routed screen inside the (app) shell, serving both edit (opened from a card) and create (opened from "New task", empty/create state, default Status To do). A single-column Shadcn form over Title / Assignee (dropdown from the seeded assignee list) / Status (To do / In progress / Done) / Due date (ISO), with Save changes and a Delete task control. Adds the create/update/delete MSW handlers + store mutations composing the Story-1 task store, so a Status change moves the card between columns and edits/creates/deletes reflect on the Board (NFR-2). Applies the field-validation and delete-confirmation rules below.

## Plain summary
Opening a card shows the task's Title, Assignee, Status, and Due date, which the team member can edit; changing the Status moves the task to that column. Saving returns to the board with the change reflected, "New task" saves a brand-new task, and "Delete task" removes it.

## Acceptance criteria
- **AC-1** (vitest): Opened from a card, the screen shows Title, Assignee (dropdown), Status (To do / In progress / Done), and Due date populated from that task, with Save changes and Delete task controls.
- **AC-2** (playwright): Opened from "New task", the form is empty in a create state (default Status To do), and saving creates a new task that appears on the board.
- **AC-3** (playwright): Saving an edit — including changing the Status — persists the change and returns to the board, with the task shown in the column matching its status.
- **AC-4** (vitest): Submitting with the Title empty shows a validation message and does not save.
- **AC-5** (playwright): Deleting a task (after confirming) removes it and returns to the board, where it no longer appears.
- **AC-6** (playwright): A signed-out visitor to a task's URL is redirected to the sign-in screen.

## Manual test checklist
- Click a card → you see Title, Assignee, Status, and Due date filled in, with Save changes and Delete task.
- Change the Status and Save changes → back on the board, the task now sits in the new column.
- Click New task, fill it in, and Save → the new task appears on the board.
- Leave the Title empty and Save → you see a validation message and nothing is saved.
- Delete the task (confirm at the prompt) → it disappears from the board.
- Type a task's URL into the address bar while signed out → you're sent to sign-in.

## Additional technical checks (2)
- Status change moves the task between columns on the board (store mutation reflected).
- Due date displayed/stored in ISO format.

## Resolved design choices
- **Due-date format:** ISO (e.g. `2026-05-01`).
- **Delete confirmation:** yes — show a confirm step (Shadcn alert-dialog) before deleting.
- **Field validation:** Title is required (error: "Title is required"); Assignee, Status, Due date optional. Status defaults to "To do" on create.
- **New-task flow:** create state opened from the Board's "New task" button.

## Infrastructure reuse notes
- Reuse the Story-1 Task store + factory and (app) shell/guard.
- Add create/update/delete handlers to web/src/mocks/handlers.ts composing the task store. API via web/src/lib/api/client.ts (post/put/del).
- Add the task Zod schema to web/src/lib/validation/schemas.ts (follow signInSchema). Surface success/error via ToastContext.
- Install Shadcn select and alert-dialog via the CLI. No raw hex; tokens only.
