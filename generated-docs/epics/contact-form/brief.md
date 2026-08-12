# Epic: Contact Form

Inherits roles, auth, data source, compliance, and styling from project.md.

## Goal

A visitor fills in Name, Email, and Message, submits, and sees an in-place "Thanks, we'll be in touch." confirmation — all in the browser, nothing sent anywhere.

## Data Model

- **ContactSubmission** (client-side only, held in component state — never persisted, never transmitted):
  - `name` (string, required)
  - `email` (string, required, must match a valid email format)
  - `message` (string, required, multi-line)

There is no API and no storage for this entity. It exists only to hold the form's field values while the user types and to run the client-side validation described below.

## Functional Requirements

- **R1 — Contact page at the site root.** A single public screen served at the site root (`/`) with the heading "Get in touch". No sign-in, no navigation to other screens.
- **R2 — Name field (required).** A required Name text input with placeholder "Your name".
- **R3 — Email field (required, format-validated).** A required Email input with placeholder "you@example.com" that must be a valid email format, validated client-side.
- **R4 — Message field (required).** A required multi-line Message textarea with placeholder "How can we help?".
- **R5 — Inline required/format validation.** Client-side validation only: all three fields required; email must be valid format. Show an inline error under each invalid field (required-but-empty uses "This field is required").
- **R6 — Send message button.** A primary submit button labelled "Send message" below the form.
- **R7 — In-place confirmation on valid submit.** On a valid submit the form is replaced in place, on the same `/` route with no navigation and no backend call, by the confirmation "Thanks, we'll be in touch."

## Business Rules

- **BR1 — Per-field errors.** Each of the three fields gets its own inline error shown directly under it when invalid — not a single shared error line — so a visitor can see at a glance which fields still need attention.
- **BR2 — Required takes precedence.** For the Email field, if the value is empty, show the required error ("This field is required"); only check the email-format rule once a value is present.
- **BR3 — Submission is a client-side no-op.** A valid submit never calls an API and never persists data anywhere — it only swaps the form for the confirmation message in the same component tree, on the same route.
- **BR4 — Validate on submit.** Validation runs when the visitor presses "Send message". (Re-validating as the visitor types/blurs is a reasonable BUILD-time UX enhancement, not a requirement here.)

## Key Workflows

1. Visitor lands on `/` and sees the "Get in touch" heading with the empty Name, Email, and Message fields and the "Send message" button.
2. Visitor fills in one or more fields incorrectly (e.g. leaves Message empty, types an invalid email) and presses "Send message" — each invalid field shows its inline error; the form remains on screen with the visitor's input preserved.
3. Visitor corrects the invalid fields and presses "Send message" again — validation passes, no network call is made, and the form is replaced in place by "Thanks, we'll be in touch." on the same `/` route.

## Feature NFRs

- **NFR-1 — No network activity.** The story must not issue any `fetch`/API call on submit — confirmed by the absence of any network request when submitting valid data (this is stricter than baseline NFR-base-5, which assumes async operations exist; here there are none).
- **NFR-2 — Keyboard and screen-reader accessible validation.** Inline errors must be programmatically associated with their field (e.g. `aria-describedby`) so the required/format errors are announced, consistent with baseline NFR-base-1.

## Out of Scope

- Sending the message anywhere (email, API, webhook) — the design and INTAKE both confirm this is a pure front-end, no-backend build.
- Persisting the submission (database, local storage, session storage, analytics event) — nothing survives a page refresh.
- Any additional screens, navigation, or routes — this epic is the single `/` screen only.
- Server-side or duplicate validation — validation is client-side only, per the design.
- Re-showing the form after confirmation (e.g. a "send another message" action) — not described in the design; confirmation is a terminal state for this epic.

## Notes & Caveats

- **Translate, don't copy (from the design digest):** the source design is a static HTML mockup that (a) wires its colours through inline `style` attributes referencing CSS custom properties, (b) represents the form/confirmation swap as two sibling elements toggled by a `hidden` attribute (`data-state="form"` / `data-state="confirmation"`), and (c) has a single inert, hidden error placeholder rather than real per-field validation. None of this markup should be carried forward: rebuild the palette through the project's design tokens + Shadcn primitives (Button, Input, Textarea, Label), rebuild the form/confirmation swap as genuine component state (not a `hidden`-attribute toggle), and rebuild validation as real per-field checks that render an inline error under each invalid field (BR1 above).
- **Email-format error text is unresolved.** The design digest flags this as an open uncertainty: the "This field is required" copy is verbatim and applies to any empty field, but no verbatim copy exists for an invalid (non-empty) email. This brief assumes a placeholder wording such as "Enter a valid email address" for that case — the developer agent should treat this string as provisional and it may be revisited if the user has a preference during BUILD.
- **Styling tokens are verbatim from the design digest / project.md:** primary `#2563eb` (hover `#1d4ed8`), background `#f8fafc`, surface `#ffffff`, text `#0f172a`, muted `#64748b`, error `#dc2626`; font Inter/system-ui/sans-serif for both heading and body; `--radius: 8px`, `--space: 16px`; light theme only. Reference these through the centralized tokens (`globals.css`), never as hex literals in components, per styling-centralisation.md.
