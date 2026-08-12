# ContactPage

A public, single-page contact form. A visitor fills in Name, Email, and Message, submits it, and sees an in-place confirmation — no sign-in, no backend, no data leaves the browser.

| Field | Value |
|---|---|
| Project slug | `contact-page` |
| Created | 2026-08-12T07:10:00Z |
| Intake source | design |
| Backend connectivity | no-backend |

---

## Roles & Permissions

**Template:** `custom`

| Permission | Public visitor (no sign-in) |
|---|---|
| View the contact page | ✓ |
| Submit the contact form | ✓ |

> Permissions extend during BUILD as new stories surface new actions — see [agent-autonomy.md](.claude/shared/agent-autonomy.md). Additions land here via a project-change PR (§6.1 of the epic-branch plan). Permission removals or role-set changes halt for user review.

---

## Authentication

| Field | Value |
|---|---|
| Method | `custom` |
| BFF login endpoint (if BFF) | N/A |
| BFF userinfo endpoint (if BFF) | N/A |
| BFF logout endpoint (if BFF) | N/A |
| Custom auth notes (if custom) | No authentication — this is a public single-page contact form with no sign-in and no user accounts. |

> Auth method is never inferred — the user must confirm explicitly per [authentication-intake.md](.claude/policies/authentication-intake.md).

---

## Data Source & Backend Integration

| Field | Value |
|---|---|
| Data source | `mock-only` |
| Backend status | `N/A` |
| Mock layer required | no |

There is no backend and no API calls of any kind. The form does not send its data anywhere; on a valid submit it swaps to an in-place confirmation message entirely within the browser.

### API specs

No API spec files were provided or generated — this project has no backend.

---

## Compliance

**Applicable domains:** None
**Region (if Personal data applies):** N/A

### Compliance Requirements

- No compliance domains were identified during intake screening. The form collects a name, email, and message but nothing is transmitted, stored, or persisted anywhere — there is no data at rest to protect.

---

## Styling & Branding

| Field | Value |
|---|---|
| Primary brand color | `#2563eb` |
| Accent / secondary (primary hover) | `#1d4ed8` |
| Background (light) | `#f8fafc` |
| Background (dark, if applicable) | N/A — light theme only |
| Surface | `#ffffff` |
| Muted | `#64748b` |
| Error (inline field errors) | `#dc2626` |
| Font family (headings) | Inter (no distinct heading family specified; body font applies) |
| Font family (body) | Inter, system-ui, sans-serif |
| Theme | light only |
| Source | design digest palette (`generated-docs/design/digest.md`, from `documentation/design/tokens.css`) |

Additional tokens carried from the design: `--radius: 8px`, `--space: 16px`.

> Component-specific styling (button radii, card shadows, etc.) emerges during BUILD. This section captures only palette intent and typography per [styling-centralisation.md](.claude/policies/styling-centralisation.md).

---

## Baseline NFRs

- **NFR-base-1:** Accessibility — WCAG 2.1 Level AA baseline
- **NFR-base-2:** Performance — First Contentful Paint < 2.5s on a mid-tier mobile network
- **NFR-base-3:** Responsive design — mobile (≥360px) / tablet (≥768px) / desktop (≥1280px) breakpoints
- **NFR-base-4:** Browser support — latest two versions of Chrome / Edge / Firefox / Safari
- **NFR-base-5:** Error UX — user-visible error states with retry affordance for all async operations (n/a for network calls here — applies to inline field-validation errors)

---

## Design Source

| Field | Value |
|---|---|
| Digest | `generated-docs/design/digest.md` |
| Palette source | `tokens.css` `:root` CSS custom properties |
| Read from | `documentation/design/design-notes.md`, `documentation/design/mockup.html`, `documentation/design/tokens.css` |
| Attached files | None — no images, logos, or icons ship with the design |

### Screens

| Screen | Key details |
|---|---|
| Contact | The only screen, served at `/`. Name/Email/Message form, all required, client-side validated (email format); on a valid submit the form is replaced in place by the confirmation "Thanks, we'll be in touch." — see the digest for verbatim copy, validation, and layout. |

> The app is **rebuilt in our stack** (Shadcn + design tokens) to match the design as described in the digest — not copied from any source markup. Prototype constructs that must NOT carry forward to production — the mockup's inline styles, its hidden-attribute state toggle, and its inert single error placeholder — are listed in the digest's "Translate, Don't Copy" section and flagged in the epic's brief.md "Notes & Caveats".
