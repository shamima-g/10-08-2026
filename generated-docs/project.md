# Personal Notes & Tasks

A tiny personal productivity app for one signed-in user to jot quick notes and track
simple tasks, each on its own page reached from a home screen after sign-in. Built as
two independent front-end-only features (Notes, Tasks) — no real backend, no API
calls, all data kept in memory for the session.

| Field | Value |
|---|---|
| Project slug | `personal-notes-tasks` |
| Created | 2026-08-12 |
| Intake source | docs |
| Backend connectivity | no-backend |

---

## Roles & Permissions

**Template:** `custom`

Single role: **User** — the one signed-in user. No sharing, no other people's data,
no back-office roles. The matrix below is minimal by design (per the `custom`
template convention) and extends during BUILD as stories surface new actions.

| Permission | User |
|---|---|
| View main dashboard | ✓ |

> Permissions extend during BUILD as new stories surface new actions — see [agent-autonomy.md](../.claude/shared/agent-autonomy.md). Additions land here via a project-change PR (§6.1 of the epic-branch plan). Permission removals or role-set changes halt for user review.

---

## Authentication

| Field | Value |
|---|---|
| Method | `custom` |
| BFF login endpoint (if BFF) | N/A |
| BFF userinfo endpoint (if BFF) | N/A |
| BFF logout endpoint (if BFF) | N/A |
| Custom auth notes | Stubbed, client-side-only sign-in with **one seeded user**: email `user@example.com`, password `Test123`, display name **Sam**, role User. No real authentication, no backend, no OIDC / next-auth — the session is simulated entirely client-side (per prototype invariant PI-01, below). After sign-in the user lands on a home screen linking to the two features (Notes, Tasks). |

> Auth method is never inferred — the user confirmed this explicitly during INTAKE per [authentication-intake.md](../.claude/policies/authentication-intake.md).

---

## Data Source & Backend Integration

| Field | Value |
|---|---|
| Data source | `mock-only` |
| Backend status | `N/A` |
| Mock layer required | yes |

No backend connectivity subsection applies — this project has no real backend to
smoke-test or proxy.

### Prototype Invariants

These invariants are project-wide and apply to both epics (Notes and Tasks):

- **PI-01 — Simulated server.** Sign-in and all data are simulated **client-side**
  (in-memory fixtures). No real backend, database, email, or network calls anywhere
  in this app.
- **PI-02 — In-memory data.** Data persists within a session but need not survive a
  page reload. The seeded user (`user@example.com` / `Test123`, display name "Sam")
  starts with an **empty** notes list and an **empty** tasks list on every fresh
  session.
- **PI-03 — Visual validation.** Field validation and confirmations (e.g. "Note
  added", empty-input blocking) are rendered client-side exactly as specified in
  each epic's brief; there is no server-side enforcement to fall back on.

### API specs

No API specs apply — front-end only, in-memory fixtures (per PI-01). Any data model
needed per feature is defined in that feature's epic `brief.md`.

---

## Compliance

**Applicable domains:** None
**Region (if Personal data applies):** N/A

### Compliance Requirements

No compliance domains were identified during intake screening. This is not a
regulated domain and the app holds no other people's data — only the single seeded
user's own notes and tasks, held in memory for the session.

---

## Styling & Branding

| Field | Value |
|---|---|
| Primary brand color | `#2563eb` <!-- Tailwind blue-600 — Shadcn default, no bespoke brand supplied --> |
| Accent / secondary | `#64748b` <!-- Tailwind slate-500 --> |
| Background (light) | `#ffffff` |
| Background (dark, if applicable) | N/A |
| Font family (headings) | system UI stack |
| Font family (body) | system UI stack |
| Theme | light only |
| Source | defaulted — no bespoke design system; Shadcn defaults with a clean, neutral palette |

> Component-specific styling (button radii, card shadows, etc.) emerges during BUILD. This section captures only palette intent and typography per [styling-centralisation.md](../.claude/policies/styling-centralisation.md).

---

## Baseline NFRs

- **NFR-base-1:** Accessibility — WCAG 2.1 Level AA baseline
- **NFR-base-2:** Performance — First Contentful Paint < 2.5s on a mid-tier mobile network
- **NFR-base-3:** Responsive design — mobile (≥360px) / tablet (≥768px) / desktop (≥1280px) breakpoints
- **NFR-base-4:** Browser support — latest two versions of Chrome / Edge / Firefox / Safari
- **NFR-base-5:** Error UX — user-visible error states with retry affordance for all async operations
- **NFR-base-6:** Validation & confirmations are rendered client-side only, with no server-side enforcement to fall back on (per prototype invariant PI-03) — client-side validation logic must be complete and correct on its own

