# Story 1 — Contact form with validation and confirmation

- **slug:** story-1-contact-form
- **route:** /
- **targetFile:** web/src/app/page.tsx
- **pageAction:** modify_existing
- **roles:** Public visitor
- **requirementIds:** R1, R2, R3, R4, R5, R6, R7, BR1, BR2, BR3, BR4, NFR-1, NFR-2
- **isInfrastructureOnly:** false

## Summary

The single Contact screen at the site root (`/`). Renders the "Get in touch" heading and a
Name/Email/Message form built from Shadcn primitives, wired to the project's design tokens. On
pressing "Send message" it runs client-side per-field validation (all required; email
format-checked, required-before-format for Email) and, on success, swaps the form for the
confirmation message via genuine component state — no navigation and no network call of any kind.

## Plain summary

A visitor opens the site and sees a "Get in touch" form with Name, Email, and Message fields.
Filling it in correctly and pressing "Send message" replaces the form in place with "Thanks, we'll
be in touch."; leaving a field empty or typing a bad email shows an error right under that field
instead.

## Acceptance criteria

- **AC-1** (vitest): Visiting the site root shows the "Get in touch" heading, the Name / Email /
  Message fields with their placeholders, and a "Send message" button.
- **AC-2** (vitest): Pressing "Send message" with empty fields shows "This field is required" inline
  under each empty field, and the form stays on screen with any typed input preserved.
- **AC-3** (vitest): Pressing "Send message" with a present-but-invalid email shows an email-format
  error under the Email field; an empty Email shows "This field is required" instead (required takes
  precedence).
- **AC-4** (playwright): Pressing "Send message" with a filled Name, a valid email, and a Message
  replaces the form in place with "Thanks, we'll be in touch." on the same `/` route with no
  navigation.
- **AC-5** (playwright): Submitting valid data issues no network request of any kind.
- **AC-6** (vitest): Each inline error is programmatically associated with its field (e.g.
  aria-describedby) so it is announced to assistive technology.

## Manual test checklist

- Open the app at its address → you see the "Get in touch" heading with Name, Email, and Message
  fields and a "Send message" button.
- Press "Send message" without filling anything in → each empty field shows "This field is required"
  right underneath it.
- Type an invalid email (e.g. "abc"), fill the other fields, and press "Send message" → the Email
  field shows an email-format error.
- Fill Name, a valid email, and a Message, then press "Send message" → the form is replaced in place
  by "Thanks, we'll be in touch." and the address bar stays the same.
- After seeing errors, correct the fields → the text you already typed is still there, not cleared.

## Resolved design choices

- **Email-format error wording:** "Enter a valid email address" (the design only supplied
  "This field is required" for empty fields; this resolves the digest's open Uncertainty for the
  invalid-email case).

## Infrastructure reuse notes

- Shadcn Button, Input, Label, and Card are already in `web/src/components/ui/` — compose these;
  don't hand-roll equivalents.
- Textarea is NOT yet present — install it with `(cd web && npx shadcn add textarea --yes)` for the
  Message field rather than using a raw `<textarea>`.
- Design tokens live in `web/src/app/globals.css` — reference the palette (primary #2563eb, error
  #dc2626, etc.) through tokens per styling-centralisation.md; no hex literals in the component.
- The template's current `web/src/app/page.tsx` is the starter welcome page — replace its contents
  with the Contact form (project brief overrides template code, CLAUDE.md §6); don't nest the form
  inside the starter markup.
