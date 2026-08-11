# Story 2 — Board home with sign-out and route guard

**Slug:** story-2-board-home-sign-out-guard
**Route:** /
**Target file:** web/src/app/page.tsx
**Page action:** modify_existing
**Roles:** Team member
**Requirement IDs:** R3, R5, R7, BR4
**Infrastructure only:** false

## Summary
Replaces the template welcome page at the app root with a protected board home that shows the signed-in team member and a sign-out control, and adds the route guard that redirects signed-out visitors (including at the root) to the sign-in screen. Wires sign-out to clear the session, and keeps the session across reloads. The board content itself is a minimal placeholder — the full Board screen is a later epic.

## Plain summary
Once signed in, a team member lands on their board home and can sign out. While signed out, opening the app — or coming back with the browser Back button after signing out — sends them to the sign-in screen instead.

## Acceptance criteria
- **AC-1** (vitest): A signed-in team member landing on the board home sees who they're signed in as and a sign-out control.
- **AC-2** (playwright): Using the sign-out control clears the session and returns the user to the sign-in screen.
- **AC-3** (playwright): While signed out, any protected URL — including the app root — sends the user to the sign-in screen (not a welcome page).
- **AC-4** (playwright): After signing out, pressing the browser Back button does not reveal the board home — the user is returned to the sign-in screen.
- **AC-5** (playwright): The session persists across a page reload — a signed-in user who reloads stays signed in on the board home.

## Manual test checklist
- Sign in with a seeded account → you land on the board home and see a Sign out control
- Click Sign out → you return to the sign-in screen
- While signed out, open the app at its root address → you're sent to sign-in, not a welcome page
- Sign in, sign out, then press the browser Back button → you're sent to sign-in, not back into the app
- Sign in, then reload the page → you're still signed in and on the board home

## Additional technical checks (1)
- Local session store is cleared on sign-out (verified internally)

## Infrastructure reuse notes
- web/src/app/page.tsx is the template welcome page — replace its contents with the protected board home (CLAUDE.md §6, replace rather than nest).
- Reuse the AuthProvider/session context created in Story 1 for session read + sign-out.
- All colours/fonts come from tokens in web/src/app/globals.css — no hex literals.

## Design choices
None — Story 2's board home is an intentional minimal placeholder; the real Board digest screen is a later epic.
