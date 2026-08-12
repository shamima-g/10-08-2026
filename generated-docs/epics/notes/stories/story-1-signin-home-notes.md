# Story 1 — Sign in, home shell, and Notes page

- **slug:** story-1-signin-home-notes
- **epic:** notes
- **route:** /notes
- **targetFile:** web/src/app/notes/page.tsx
- **pageAction:** create_new
- **roles:** User
- **requirementIds:** R1, R2, R3, R4, R5, R6, BR1, BR2, BR3, BR4, BR5
- **isInfrastructureOnly:** false

## Summary

Delivers the epic's full vertical slice — a stubbed client-side sign-in accepting only
the seeded user (user@example.com / Test123, "Sam"), a session Provider and home shell
shared with the Tasks epic, and the /notes page with add-to-list, newest-first ordering,
running count, cleared field, "Note added" toast, empty/whitespace blocking, and the
"No notes yet" empty state. All state is in-memory (PI-01/PI-02); validation and
confirmations are client-side only (PI-03). Replaces the starter welcome page so the app
root gates to sign-in while signed out.

## Plain summary

Sam signs in with the seeded account, lands on a home screen linking to Notes and Tasks,
and on the Notes page can add quick notes to a newest-first list with a running count —
empty notes are blocked and a friendly "No notes yet" shows when the list is empty.

## Acceptance Criteria

- **AC-1** (playwright): Signing in with the seeded email and password lands the user on a home screen that links to Notes and Tasks.
- **AC-2** (vitest): Signing in with any other email or password shows an inline error and keeps the user on the sign-in screen.
- **AC-3** (playwright): While signed out, visiting the app root or a feature URL directly shows the sign-in screen — not a welcome page and not the notes page.
- **AC-4** (vitest): On the Notes page with no notes, an empty state reading "No notes yet" and a count of 0 are shown.
- **AC-5** (vitest): Adding a non-empty note places it at the top of the list (newest-first), increments the count, clears the input, and shows a "Note added" confirmation.
- **AC-6** (vitest): Adding an empty or whitespace-only note is blocked with an inline message; the list and count stay unchanged.

## Manual Test Checklist

- Open the app while signed out -> you land on the sign-in page, not a welcome page.
- While signed out, type /notes in the address bar -> you land on sign-in, not the notes page.
- Sign in with user@example.com / Test123 -> you land on the home screen with links to Notes and Tasks.
- Enter a wrong email or password -> you see an error and stay on the sign-in page.
- From the home screen click Notes -> the Notes page shows "No notes yet" and a count of 0.
- Type a note and click Add -> it appears at the top, the count goes up, the field clears, and a "Note added" message shows; add another -> it sits above the previous one.
- Click Add with the field empty or only spaces -> nothing is added and you see an inline message.

## Infrastructure / Reuse Notes

- ToastContext + ToastContainer are already wired into the root layout (web/src/app/layout.tsx) — use the existing toast for the "Note added" confirmation; do not build a new notification mechanism.
- Shadcn primitives button, card, input, label already exist in web/src/components/ui/ — compose them for the sign-in form, home links, and Notes UI. Install any others (e.g. form) via the Shadcn CLI per CLAUDE.md §1; do not hand-roll.
- Replace the starter welcome page at web/src/app/page.tsx so the root gates to sign-in when signed out — replace, don't wrap, per CLAUDE.md §6.
- Put sign-in and note validation in web/src/lib/validation/schemas.ts (Zod) rather than inline.
- Do NOT use web/src/lib/api/client.ts — this epic is in-memory only (PI-01); there are no API calls.
- Create the session context/Provider and home shell as the shared foundation the Tasks epic will reuse as-is — do not duplicate this logic when Tasks is planned.
