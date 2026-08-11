# Epic: Design update — Board and Task detail

Inherits roles, auth, data source, compliance, and styling from project.md.

**Depends on:** the task-board epic (this epic modifies the Board and Task detail screens it built; Settings from that epic is untouched).

---

## Goal

Rebuild the Board and Task detail screens to match the updated design, leaving Settings exactly as it is.

---

## Data Model

Scoped to this epic (mock-only — no backend; see project.md §Data Source). This epic **modifies** the existing `Task` entity (defined in `web/src/mocks/data/task.ts`, seeded by the task-board epic) — it does not introduce a new entity.

**Task** (existing fields unchanged; one field added)

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unchanged. |
| `title` | string | Unchanged. |
| `assignee` | reference | Unchanged. |
| `status` | enum | Unchanged — `To do` \| `In progress` \| `Done`. |
| `priority` | enum | **New.** `Low` \| `Medium` \| `High`. Optional — defaults to `Medium` on create (see BR3, Notes & Caveats). Rendered on Task detail only in this epic; the Board card does not gain a priority indicator (not in the assigned requirements). |
| `dueDate` | date | Unchanged — ISO format (e.g. `2026-05-01`). |

Per the digest's Data Shapes section, Task now carries "priority (one of Low / Medium / High)" alongside the fields the task-board epic already modeled.

---

## Functional Requirements

- **R1:** On the Board, the primary action button reads "Add task" (was "New task"). Its behavior is unchanged — it opens the Task detail screen in an empty create state.
- **R2:** The "All assignees" assignee filter moves from the top-left to the top-right of the Board header, grouped next to the "Add task" button (filter first, then the button, per the digest's Board layout). Filtering behavior is unchanged. Empty-column copy "Nothing here yet" is unchanged.
- **R3:** Task detail gains a "Priority" field: a dropdown with options Low / Medium / High, positioned between Status and Due date. All other fields (Title, Assignee, Status, Due date) and the Save changes / Delete task buttons are unchanged.

---

## Business Rules

- **BR1:** "Add task" opens Task detail in the same create/empty state the "New task" button opened before this epic (BR7 of the task-board brief) — the label change does not alter the create flow.
- **BR2:** Moving the assignee filter to the top-right does not change its options or filtering logic (BR1 of the task-board brief still applies) — only its position in the header.
- **BR3:** Priority is optional on the Task detail form. On create, it defaults to "Medium" when the user makes no selection. On edit, an existing task's priority (or the default, for tasks seeded before this epic) is shown and can be changed. Only Title is a required field (per the digest's Your Decisions) — Priority, Assignee, Status, and Due date all remain optional.
- **BR4:** "Save changes" persists Priority to the mock data layer along with the existing Title / Assignee / Status / Due date fields (BR5 of the task-board brief, extended to include Priority).
- **BR5:** Existing seeded tasks that predate this epic (which have no `priority` value) are treated as "Medium" wherever priority is read or displayed, so the Task detail form never shows an empty Priority dropdown for pre-existing data.

---

## Key Workflows

1. **Create a task (relabelled entry point)** — user clicks "Add task" (top-right, next to the assignee filter) → Task detail opens in create/empty state → user fills Title (required) / Assignee / Status / Priority / Due date → "Save changes" → task appears on the Board in the column matching its Status.
2. **Edit a task's priority** — user clicks a card → Task detail opens with that task's values, including its current Priority (or "Medium" if unset) → user changes Priority → "Save changes" → the update persists to the mock data layer.
3. **Filter the board from its new position** — user finds "All assignees" now grouped with "Add task" at the top-right of the Board header → selects an assignee → the columns narrow to that assignee's tasks, exactly as before.

---

## Feature NFRs

- **NFR-1:** The Board header's assignee filter and "Add task" button remain usable and legibly grouped at all three baseline breakpoints (project.md §Baseline NFRs, NFR-base-3) after moving from top-left to top-right.
- **NFR-2:** The new Priority dropdown follows the same token-based styling as the existing Status dropdown on Task detail — no ad-hoc hex or one-off styling (per [styling-centralisation.md](../../../.claude/policies/styling-centralisation.md)).

---

## Out of Scope

- Any change to the Settings screen (`web/src/app/(app)/settings/page.tsx`) — it is explicitly unchanged by this epic.
- A priority indicator/badge on the Board card itself — the assigned requirements scope Priority to the Task detail form only.
- The primary brand colour — the updated design's purple `#7c3aed` is **not** applied; primary stays blue `#2563eb` (hover `#1d4ed8`) per the digest's reaffirmed decision. Do not modify `globals.css` primary tokens.
- Any change to Board card contents, column structure, or the To do / In progress / Done statuses.
- Any change to the assignee pool, initials derivation, or due-date format — all inherited unchanged from the task-board epic.
- Sorting or filtering by priority — not requested.

---

## Notes & Caveats

- **Colour conflict — already resolved, do not re-open.** The updated `documentation/design/tokens.css` sets `--color-primary` to purple `#7c3aed` (hover `#6d28d9`). The digest's Your Decisions section reaffirms the earlier decision: primary **stays blue `#2563eb`** (hover `#1d4ed8`). The developer must not apply the purple token and must not modify `globals.css` primary/primary-hover values. This is a Translate-Don't-Copy situation at the token level, not just markup.
- **Strict scope reminder.** Only `web/src/app/(app)/page.tsx` (Board) and `web/src/app/(app)/tasks/[id]/page.tsx` (Task detail) change, plus the `Task` type and mock data in `web/src/mocks/data/task.ts` (and `web/src/lib/api/tasks.ts` only if the `TaskInput` shape needs updating for the new field). `web/src/app/(app)/settings/page.tsx` must not be touched.
- **Pre-existing seeded tasks have no `priority` field.** BR5 (default to "Medium" when reading) covers this; the seeded task factories in `web/src/mocks/data/task.ts` should be updated to include a `priority` value for each seeded task so the Board/detail data stays realistic, rather than relying on the fallback for every seed.
- Everything else about the Board and Task detail screens (layout of the three columns, card contents, initials derivation, delete confirmation, due-date format, validation rules) is inherited unchanged from the task-board epic's brief (`generated-docs/epics/task-board/brief.md`) and the digest's Your Decisions — none of that is reopened by this epic.
