# Design Digest — TaskBoard

A small team task board: a Board screen with three status columns of task cards, a Task detail screen for viewing and editing one task, and a Settings screen for the user's display name.

| Field | Value |
|---|---|
| Read from | `documentation/design/design-notes.md`, `documentation/design/mockup.html`, `documentation/design/tokens.css` |
| Artifact verdict | design — three screens, a full palette, and typography all comprehended cleanly from text + markup + tokens |
| Interpreter confidence | high |
| Last updated | 2026-08-11T10:50:00Z |

---

## Your Decisions

*Nothing yet — this fills in as you settle things while we build.*

---

## Screens

### Board

- **Purpose:** The landing screen. See all tasks grouped by status, filter by assignee, and start a new task.
- **Layout:** A top header row with the assignee filter at top-left and the primary action button at top-right. Below it, three equal-width columns side by side — **To do**, **In progress**, **Done** — each with a column heading and a stack of task cards. Each card shows the task title and the assignee's initials. An empty column shows placeholder copy instead of cards.
- **Fields:** Assignee filter — a dropdown labelled **All assignees** (its default/all option is also **All assignees**).
- **Validation:** None specified.
- **Navigation:** **New task** (top-right button) → Task detail (create a new task); clicking a task card → Task detail (edit that task). How Settings is reached is not shown (see Uncertainties).
- **Copy:** Column headings **To do**, **In progress**, **Done**; primary button **New task**; filter label **All assignees**; empty-column copy **Nothing here yet**.

### Task detail

- **Purpose:** View and edit a single task; save changes or delete it.
- **Layout:** A single-column form of labelled fields, with a primary **Save changes** button and a **Delete task** text link below.
- **Fields:**
  - **Title** — text input
  - **Assignee** — dropdown (options not enumerated in the design; see Uncertainties)
  - **Status** — dropdown with options **To do**, **In progress**, **Done**
  - **Due date** — date input
- **Validation:** None specified.
- **Navigation:** **Save changes** → returns to Board (implied); **Delete task** → removes the task and returns to Board (implied; any confirmation step is unspecified — see Uncertainties). Opened from a Board card, or from **New task**.
- **Copy:** Field labels **Title**, **Assignee**, **Status**, **Due date**; status options **To do** / **In progress** / **Done**; button **Save changes**; text link **Delete task**.

### Settings

- **Purpose:** Set the user's own display name.
- **Layout:** A heading followed by a single labelled field and a Save button.
- **Fields:** **Your display name** — text input.
- **Validation:** None specified.
- **Navigation:** How the user reaches Settings and where **Save** returns to are not shown (see Uncertainties).
- **Copy:** Heading **Your settings**; field label **Your display name**; button **Save**.

---

## Palette & Typography

| Token | Value | Where found |
|---|---|---|
| Primary (buttons, active column header) | `#2563eb` | `documentation/design/tokens.css` (`--color-primary`) |
| Primary hover | `#1d4ed8` | `tokens.css` (`--color-primary-hover`) |
| Background (light) | `#f8fafc` | `tokens.css` (`--color-bg`) |
| Surface | `#ffffff` | `tokens.css` (`--color-surface`) |
| Text | `#0f172a` | `tokens.css` (`--color-text`) |
| Muted | `#64748b` | `tokens.css` (`--color-muted`) |
| Done (Done column heading) | `#16a34a` | `tokens.css` (`--color-done`) |

- **Font (body):** `"Inter", system-ui, sans-serif` (design notes name Inter; `tokens.css` `--font-sans`)
- **Font (headings):** Not separately specified — same family (Inter) implied.
- **Theme:** Light only (no dark palette in the tokens).
- **Other tokens:** border radius `8px` (`--radius`); base spacing unit `16px` (`--space`).

---

## Data Shapes

- **Task** — id (implied), title (text), assignee (a person), status (one of **To do** / **In progress** / **Done**), due date (date). The Board card renders the assignee as initials.
- **Assignee / User** — display name (set on Settings), initials (shown on cards; derivation from the display name is unspecified — see Uncertainties). The Board assignee filter and the Task detail Assignee dropdown both draw from a set of assignees whose source is not specified.

All data shapes are inferred from the screens; no schema or data-model file shipped with the design.

---

## Assets

- None. No images, logos, icons, or attachments are present in the design files.

---

## Translate, Don't Copy

- **Placeholder / sample data → real data.** The mockup's single card (title "Draft launch email", assignee "JD") and the empty Assignee/filter option lists are illustrative — the built screens read tasks and assignees from the configured data source.
- **Inline styles & the mockup's raw markup → design tokens + Shadcn primitives.** The mockup expresses layout and colour with inline `style` attributes and CSS variables; re-express that visual intent through the project's tokens and composed primitives, not by copying the markup.
- **Inert placeholder handlers → real handlers.** The mockup's buttons, the `<a href="#">Delete task</a>` link, the filter, and the card click are non-functional stand-ins for real actions.
- **Static single-screen mockup → real navigation.** The three screens live in one HTML file (two `hidden`); rebuild them as distinct surfaces with real routing/navigation between them.

---

## Uncertainties

- **Due-date format is deliberately unspecified.** The design notes leave it open ("`2026-05-01` vs `1 May 2026`"). A sensible default is ISO format (e.g. `2026-05-01`) — please confirm which format to display.
- **Assignee list source and options.** Neither the Board filter nor the Task detail **Assignee** dropdown enumerates its options. Where does the set of assignees come from (a fixed team list, user-managed, from a backend)?
- **Assignee initials derivation.** Cards show initials (e.g. "JD"); how are they derived from a display name (first+last initial, first two letters)?
- **Reaching Settings.** No navigation control to the Settings screen appears in the design. How does the user get there (a nav item, a menu, an avatar)?
- **Delete confirmation.** **Delete task** removes a task; the design doesn't say whether a confirmation step is expected.
- **Validation rules.** No validation or error messages are specified for any field (e.g. is Title required?). Confirm expected rules and error text.
- **New task flow.** Assumed to open Task detail in a create/empty state; confirm this is the intended flow.
- **Backend / persistence.** The design implies stored tasks and a saved display name but names no API or data source; confirm where data is read from and written to.
