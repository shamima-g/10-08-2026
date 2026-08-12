# Design Digest — ContactPage

A single-page contact form: one screen served at the site root (`/`), with a name/email/message form that validates client-side and, on a valid submit, swaps in place for a confirmation message. Front-end only — the design states there is no backend.

| Field | Value |
|---|---|
| Read from | `documentation/design/design-notes.md`, `documentation/design/mockup.html`, `documentation/design/tokens.css` |
| Artifact verdict | design — three text files (notes + HTML mockup + token stylesheet) that together describe one screen, its copy, validation, and palette |
| Interpreter confidence | high |
| Last updated | 2026-08-12T07:07:17Z |

---

## Your Decisions

- **Invalid-email error wording** (Contact screen) → "Enter a valid email address". The design only
  supplied "This field is required" for empty fields; this settles the wording for a present-but-invalid
  email. _(Stories approval, contact-form epic.)_

---

## Screens

### Contact

- **Purpose:** The only screen, served at the site root (`/`). A visitor fills in a short contact form and submits it; on success the form is replaced in place by a confirmation message.
- **Layout:** A heading above a single vertical form: three stacked fields (Name, Email, Message), an inline error line, and a primary submit button below the form. On a valid submit, the form is replaced on the **same page (same `/` route)** by a single confirmation line — no navigation to a new route. Two states of one surface: the default "form" state and the "confirmation" state shown in its place.
- **Fields:** All three fields are **required**.
  - Name — text input, placeholder "Your name".
  - Email — email input, placeholder "you@example.com"; must be a valid email format.
  - Message — multi-line text (textarea), placeholder "How can we help?".
- **Validation:** Client-side only. All three fields required; email must be a valid format. Show an inline error under any invalid field. The mockup carries one error string verbatim: "This field is required". (The notes describe the email-format rule but give no distinct error text for it — see Uncertainties.)
- **Navigation:** None between screens — single screen, single route (`/`). The "Send message" button submits the form; on a valid submit the confirmation replaces the form on the same route.
- **Copy (verbatim):**
  - Heading: "Get in touch"
  - Submit button: "Send message"
  - Inline field error: "This field is required"
  - Confirmation (shown in place of the form after a valid submit): "Thanks, we'll be in touch."

---

## Palette & Typography

| Token | Value | Where found |
|---|---|---|
| Primary | `#2563eb` | `tokens.css` `:root` — noted as "the Send message button" |
| Primary (hover) | `#1d4ed8` | `tokens.css` `:root` — `--color-primary-hover` |
| Background (light) | `#f8fafc` | `tokens.css` `:root` — `--color-bg` |
| Surface | `#ffffff` | `tokens.css` `:root` — `--color-surface` |
| Text | `#0f172a` | `tokens.css` `:root` — `--color-text` |
| Muted | `#64748b` | `tokens.css` `:root` — `--color-muted` |
| Error (inline field errors) | `#dc2626` | `tokens.css` `:root` — `--color-error` |

- **Font (headings):** Inter (no separate heading family specified; body font applies)
- **Font (body):** "Inter", system-ui, sans-serif (`--font-sans`; notes state "Body font is Inter")
- **Theme:** light only

Additional tokens present in `tokens.css`: `--radius: 8px`, `--space: 16px`.

---

## Data Shapes

- **ContactSubmission** (inferred from the form) — `name` (string, required), `email` (string, required, valid email format), `message` (string, required, multi-line). This is what the form collects. Where it is sent is not specified — see Uncertainties.

---

## Assets

- None. No images, logos, or icons ship with the design.

---

## Translate, Don't Copy

- **Inline styles / mockup markup → design tokens + Shadcn primitives.** The mockup wires colours through inline `style` attributes referencing CSS custom properties (e.g. `background: var(--color-primary)`, `color: #fff` on the button). Re-express the same visual intent through the project's tokens and Shadcn primitives (button, input, textarea, label) rather than copying the raw HTML and inline styles.
- **Mockup's two hidden states → real UI state.** The mockup represents the form/confirmation swap with two sibling elements toggled by a `hidden` attribute (`data-state="form"` / `data-state="confirmation"`). Rebuild this as genuine application state that replaces the form with the confirmation on a valid submit.
- **Inert error placeholder → real per-field validation.** The mockup has a single hidden error line ("This field is required"). Rebuild as real client-side validation that shows an inline error under each invalid field.
- **No submit destination → real (or explicitly no-op) handler.** The design states the message is not sent anywhere; the submit handler is not wired to a backend. Build the submit behaviour per what the user confirms at INTAKE (see Uncertainties) rather than inventing an endpoint.

---

## Uncertainties

- **Where does the submitted message go?** The design explicitly leaves this undecided and says to assume front-end only (not sent anywhere) and flag it. Please confirm: should submission be a pure client-side no-op that just shows the confirmation, or should it send somewhere (which would require a backend/endpoint the design does not define)?
- **Email-format error text.** The notes require a valid email format, but no distinct error message is given for an invalid (non-empty) email — only the "This field is required" string for empties. Please confirm the wording to show when a value is present but not a valid email.
- **Per-field vs. shared error copy.** The mockup shows a single error element carrying "This field is required". The notes ask for an inline error "under any invalid field". Confirm each field should get its own inline error (using that same text for required-but-empty), rather than one shared error line.
- **Heading typography.** No separate heading font is specified; the digest assumes Inter (the body font) applies to the "Get in touch" heading. Confirm if a different heading treatment is intended.
