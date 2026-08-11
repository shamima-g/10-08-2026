# TaskBoard — design notes

A small team task board. These notes plus `mockup.html` and `tokens.css` in this folder are
the **design** — build the app to match them. (Text reads most reliably; the mockup and tokens
back it up.)

## Screens

### Board
The landing screen. Three columns — **To do**, **In progress**, **Done** — each holding task
cards. A card shows the task **title** and its **assignee** initials.

- Primary action button, top-right: **New task**
- A filter control, top-left, labelled **All assignees** (a dropdown).
- Empty column copy: **Nothing here yet**

### Task detail
Opens when a card is clicked. Shows and edits one task.

- Fields: **Title** (text), **Assignee** (dropdown), **Status** (To do / In progress / Done),
  **Due date** (date).
- Buttons: **Save changes**, and a text link **Delete task**.

### Settings
- One field: **Your display name** (text), with a **Save** button.
- Heading copy: **Your settings**

## Palette & type
Brand colours are in `tokens.css`. Primary is the blue used for buttons and the active column
header. Body font is Inter.

## Deliberately not specified
The **due-date format** (e.g. `2026-05-01` vs `1 May 2026`) is not decided here — pick a sensible
default and flag it so we can confirm.
