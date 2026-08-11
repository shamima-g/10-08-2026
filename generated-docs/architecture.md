# Architecture & Reuse Registry

The index of reusable surfaces, conventions, and cross-epic debt. Reuse what's
listed here before building new. One row per durable thing; keep it terse.

## Reusable surfaces

| Surface | Where | Capability |
|---|---|---|
| `AuthProvider` / `useAuth()` | `web/src/contexts/AuthContext.tsx` | App auth session — `{ user: { email } | null, signIn(email, password) → boolean, signOut() }`; frontend-only, persisted to localStorage across reloads (BR4). Mounted in the root layout. |
| `seededCredentials` / `matchCredential()` | `web/src/mocks/data/credentials.ts` | Single named seed of mock sign-in email/password pairs (NFR-signin-2); the only place the mock password literal lives. Swap this file when a real auth backend arrives. |
| `signInSchema` / `SignInInput` | `web/src/lib/validation/schemas.ts` | Zod presence-only validation for the sign-in form (both fields required). |
| `createUser()` / `User` | `web/src/mocks/data/user.ts` | Canonical seeded team-member identity (email `sam.rivera@taskboard.test`, display name). Shared by both test layers. |

## Conventions

- **Design tokens are the single source of colour.** The TaskBoard brand palette lives in `web/src/app/globals.css` `:root` (light theme only). Components reference tokens via Tailwind utilities (`bg-primary`, `text-muted-foreground`, `text-destructive`, …) — never raw hex. Primary `#2563eb`, radius `8px`.
- **Context providers** mirror the ToastContext shape: `createContext(undefined)` + a `useX()` hook that throws outside its provider. New app-wide providers compose inside the root layout (`web/src/app/layout.tsx`), never replace existing ones.

## Cross-epic debt

- **Body font not yet wired.** Digest specifies Inter; the layout currently falls back to the system font stack (`--font-sans` maps to an undefined Geist var). Load Inter when the main screens (Board/Settings) are built.
