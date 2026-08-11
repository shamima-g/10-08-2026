# TaskBoard

A small team task board where team members create, assign, and track tasks through **To do**, **In progress**, and **Done** columns.

| Field | Value |
|---|---|
| Project slug | `taskboard` |
| Created | 2026-08-11T11:00:00Z |
| Intake source | docs (design supplied within `documentation/`) |
| Backend connectivity | mock-only |

---

## Roles & Permissions

**Template:** `custom`

| Permission | Team member |
|---|---|
| View main dashboard | ✓ |

> Single role for launch — "Team member: everyone can create, edit, move, and delete tasks, and set their own display name. No admin tier." Permissions extend during BUILD as new stories surface new actions — see [agent-autonomy.md](.claude/shared/agent-autonomy.md). Additions land here via a project-change PR (§6.1 of the epic-branch plan). Permission removals or role-set changes halt for user review.

---

## Authentication

| Field | Value |
|---|---|
| Method | `frontend-only` |
| BFF login endpoint (if BFF) | N/A |
| BFF userinfo endpoint (if BFF) | N/A |
| BFF logout endpoint (if BFF) | N/A |
| Custom auth notes (if custom) | Simple email + password sign-in, no SSO for launch (flagged `NEEDS_CONFIRMATION` by the user). No backend yet, so credentials are validated against the mock/stand-in data layer for launch. Single role only. |

> Auth method is never inferred — the user must confirm explicitly per [authentication-intake.md](.claude/policies/authentication-intake.md).

---

## Data Source & Backend Integration

| Field | Value |
|---|---|
| Data source | `mock-only` |
| Backend status | `N/A` |
| Mock layer required | yes |

### API specs

| Path | Source |
|---|---|
| None | No API spec attached — data source is mock-only for launch; no backend to connect to yet. |

---

## Compliance

**Applicable domains:** None
**Region (if Personal data applies):** N/A

### Compliance Requirements

- No compliance domains were identified during intake screening.

---

## Styling & Branding

| Field | Value |
|---|---|
| Primary brand color | `#2563eb` |
| Primary hover | `#1d4ed8` |
| Accent / secondary | N/A — no secondary/accent color specified beyond primary hover and the status colour below |
| Background (light) | `#f8fafc` |
| Surface | `#ffffff` |
| Background (dark, if applicable) | N/A — light theme only |
| Text | `#0f172a` |
| Muted | `#64748b` |
| Done (status accent — Done column heading) | `#16a34a` |
| Font family (headings) | Inter (not separately specified — same family as body implied) |
| Font family (body) | `"Inter", system-ui, sans-serif` |
| Border radius | `8px` |
| Base spacing unit | `16px` |
| Theme | Light only |
| Source | design digest palette (`generated-docs/design/digest.md` §Palette & Typography, sourced from `documentation/design/tokens.css`) |

> Component-specific styling (button radii, card shadows, etc.) emerges during BUILD. This section captures only palette intent and typography per [styling-centralisation.md](.claude/policies/styling-centralisation.md).

---

## Baseline NFRs

- **NFR-base-1:** Accessibility — WCAG 2.1 Level AA baseline
- **NFR-base-2:** Performance — First Contentful Paint < 2.5s on a mid-tier mobile network
- **NFR-base-3:** Responsive design — mobile (≥360px) / tablet (≥768px) / desktop (≥1280px) breakpoints
- **NFR-base-4:** Browser support — latest two versions of Chrome / Edge / Firefox / Safari
- **NFR-base-5:** Error UX — user-visible error states with retry affordance for all async operations

---

## Design Source

| Field | Value |
|---|---|
| Digest | `generated-docs/design/digest.md` |
| Palette source | `documentation/design/tokens.css` (CSS custom properties) |
| Read from | `documentation/design/design-notes.md`, `documentation/design/mockup.html`, `documentation/design/tokens.css` |
| Attached files | None — no images, logos, icons, or attachments shipped with the design |

### Screens

| Screen | Key details |
|---|---|
| Board | Landing screen — assignee filter, "New task" action, three status columns (To do / In progress / Done) of task cards; see the digest for verbatim fields/copy/navigation |
| Task detail | View/edit one task — Title, Assignee, Status, Due date fields; Save changes / Delete task actions; see the digest for verbatim fields/copy/navigation |
| Settings | Set the user's own display name — single field + Save button; see the digest for verbatim fields/copy/navigation |

> The app is **rebuilt in our stack** (Shadcn + design tokens) to match the design as described in the digest — not copied from any source markup. Prototype constructs that must NOT carry forward to production — placeholder/fake data, inline styles, inert placeholder handlers, the single-file static mockup — are listed in the digest's "Translate, Don't Copy" section and flagged in the per-epic brief.md "Notes & Caveats" when an epic touches that screen.
