# Story 1 — Sign-in screen

**Slug:** story-1-sign-in-screen
**Route:** /sign-in
**Target file:** web/src/app/sign-in/page.tsx
**Page action:** create_new
**Roles:** Team member
**Requirement IDs:** R1, R2, R3, R4, R6, BR1, BR2, BR3, NFR-signin-1, NFR-signin-2
**Infrastructure only:** false

## Summary
Creates the sign-in page (email + password form composed from Shadcn primitives and the project's design tokens) plus the auth session foundation — a session context/provider added to the root layout, seeded mock credentials in a single named mock-data module, and local persistence. Submissions validate against the mock credential set (no backend call); success establishes the session and navigates to the board home, failure shows a generic error and stays on the page.

## Plain summary
A team member signs in with their email and password on a clean, minimal sign-in screen. Leaving a field blank or entering the wrong details shows a clear message; a correct login takes them to their board.

## Acceptance criteria
- **AC-1** (vitest): The sign-in screen shows an email field, a password field, and a Sign in button, styled from the project's design tokens.
- **AC-2** (vitest): Submitting with either field empty shows an inline "required" message under the empty field and does not attempt sign-in.
- **AC-3** (vitest): Submitting an email/password that does not match a seeded credential shows a generic "Incorrect email or password" message and keeps the user on the sign-in screen.
- **AC-4** (playwright): Entering a seeded email with its matching password signs the user in and takes them to the board home.
- **AC-5** (vitest): The sign-in screen shows no SSO, "Forgot password", or sign-up links.
- **AC-6** (playwright): The form is operable by keyboard — Tab reaches both fields and pressing Enter submits it.

## Manual test checklist
- Open the sign-in page → you see an email field, a password field, and a Sign in button
- Leave a field blank and click Sign in → you see a 'required' message and stay on the page
- Enter a wrong email or password → you see 'Incorrect email or password' and stay on the page
- Enter a seeded email and its matching password → you're signed in and taken to the board
- Check the sign-in page has no 'Forgot password', 'Sign up', or SSO buttons
- Tab through the two fields and press Enter → the form submits

## Additional technical checks (2)
- Error message announced to screen readers (aria-live)
- Seeded credentials live in a single named mock-data module (NFR-signin-2)

## Infrastructure reuse notes
- Root layout at web/src/app/layout.tsx already wraps the app in ToastProvider — add the new AuthProvider here (compose, don't replace the ToastProvider).
- Shadcn primitives button/card/input/label already exist in web/src/components/ui/ — compose the form from these; install any others (form/alert) via the Shadcn CLI.
- web/src/lib/validation/schemas.ts holds Zod schemas — add the sign-in credential schema here.
- All colours/fonts come from tokens in web/src/app/globals.css — no hex literals in components.
- web/src/contexts/ToastContext.tsx is the existing context pattern — mirror it for the AuthProvider/session context.

## Design choices
None — the design digest has no sign-in screen (documented design gap). Build a minimal form from the design tokens.
