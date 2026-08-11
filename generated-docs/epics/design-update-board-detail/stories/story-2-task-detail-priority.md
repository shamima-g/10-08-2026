# Story 2 — Task detail: Priority dropdown (Low / Medium / High)

**Slug:** story-2-task-detail-priority
**Route:** /tasks/[id]
**Target file:** web/src/app/(app)/tasks/[id]/page.tsx
**Page action:** modify_existing
**Roles:** Team member
**Requirement IDs:** R3, BR3, BR4, BR5, NFR-2
**Infrastructure only:** false

## Summary
Add a Priority field to the Task entity (Low | Medium | High, optional, defaulting to Medium) in the shared mock data factory and seed values, and render it as a Shadcn Select on the Task detail form between Status and Due date. Save persists Priority alongside the existing fields; tasks with no stored priority read as "Medium" so the dropdown is never empty. TaskInput (Omit<Task,'id'>) picks up the field automatically. No other Task detail field, button, or flow changes.

## Plain summary
The Task detail form gains a "Priority" dropdown (Low / Medium / High) between Status and Due date. New tasks default to "Medium", and older tasks with no priority set also show "Medium". Every other field and the Save/Delete buttons stay the same.

## Acceptance criteria
- **AC-1** (vitest): Task detail shows a "Priority" dropdown with options Low / Medium / High, positioned between Status and Due date.
- **AC-2** (vitest): On the create (new task) form, Priority is preselected to "Medium".
- **AC-3** (vitest): Editing an existing task shows its saved Priority; a task with no stored priority shows "Medium".
- **AC-4** (playwright): Changing Priority and clicking "Save changes" persists the new value — re-opening the task shows the changed Priority.
- **AC-5** (vitest): Title, Assignee, Status, Due date and the Save changes / Delete task actions are unchanged.

## Manual test checklist
- Open a task → a 'Priority' dropdown appears between Status and Due date, with Low / Medium / High
- Open the new-task form → Priority is already set to 'Medium'
- Open a task that existed before this change → Priority shows 'Medium', not blank
- Change Priority to 'High', Save changes, re-open → it still shows 'High'
- Title, Assignee, Status, Due date and Save changes / Delete task all still work as before

## Additional technical checks (1)
- Priority defaults to Medium on create (BR3) and missing priority reads as Medium (BR5).

## Infrastructure reuse notes
- Task detail form already composes the Shadcn Select for Status — add Priority as a sibling Select in the same pattern (label + SelectTrigger/Content with an accessible name), between the Status and Due date blocks; don't hand-roll a dropdown.
- Extend the Task interface + createTask factory + seededTasks in web/src/mocks/data/task.ts with `priority`; add a priority value to each seed. Never redefine Task inside a spec.
- TaskInput = Omit<Task,'id'> in web/src/lib/api/tasks.ts picks up `priority` automatically. Update the mock create handler (web/src/mocks/handlers.ts) to default Medium on create (BR3) and read missing priority as Medium (BR5).
- Thread `priority` through the form's input state and the load effect. Primary colour stays blue; Settings out of scope.
