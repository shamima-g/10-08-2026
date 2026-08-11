# Story 3 — Settings: set your display name

**Slug:** story-3-settings
**Route:** /settings
**Target file:** web/src/app/(app)/settings/page.tsx
**Page action:** create_new
**Roles:** Team member
**Requirement IDs:** R3, BR8, NFR-2
**Infrastructure only:** false

## Summary
Builds the Settings routed screen inside the (app) shell — heading "Your settings", a single "Your display name" field pre-filled from the current user, and a Save button — and confirms the header nav control that reaches it (added in Story 1). Saving persists the display name to the mock data layer for the current user so cards and assignee references reflecting this user update accordingly (BR8, NFR-2). Applies the display-name validation rule below.

## Plain summary
From a control in the app header, the team member opens Settings, sees "Your settings" with their current display name, and saves a new one — after which their name and initials update everywhere they appear on the board.

## Acceptance criteria
- **AC-1** (vitest): Settings shows the heading "Your settings", a "Your display name" field pre-filled with the current name, and a Save button.
- **AC-2** (playwright): The header's Settings control navigates to the Settings screen.
- **AC-3** (playwright): Saving a new display name persists it, and the updated name and derived initials appear on this user's cards and assignee references on the board.
- **AC-4** (vitest): Saving with an empty display name shows a validation message and does not save.
- **AC-5** (playwright): A signed-out visitor to the Settings URL is redirected to the sign-in screen.

## Manual test checklist
- Open Settings from the header control → you see "Your settings" and "Your display name" showing your current name.
- Change your display name and Save → your new name and initials show on your cards and in assignee lists.
- Clear the display name and Save → you see a validation message and nothing is saved.
- Type /settings into the address bar while signed out → you're sent to sign-in.

## Additional technical checks (1)
- Display-name change propagates to the board's cards/assignee references (shared store).

## Resolved design choices
- **Field validation:** display name is required (error: "Display name is required").
- **Reaching Settings:** via the header avatar/link menu added in Story 1.

## Infrastructure reuse notes
- Reuse useAuth() for the current user, the (app) shell/guard, and the shared user/task store from Stories 1–2.
- Persist the display name through the mock data layer so the board reflects it (NFR-2). API via web/src/lib/api/client.ts.
- Add/extend the Zod schema in web/src/lib/validation/schemas.ts. Surface success via ToastContext. Tokens only, no raw hex.
