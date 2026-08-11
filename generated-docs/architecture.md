# Architecture & Reuse Registry

The index of reusable surfaces, conventions, and cross-epic debt. Reuse what's
listed here before building new. One row per durable thing; keep it terse.

## Reusable surfaces

| Surface | Where | Capability |
|---|---|---|
| `AuthProvider` / `useAuth()` | `web/src/contexts/AuthContext.tsx` | App auth session — `{ user: { email } | null, isHydrated: boolean, signIn(email, password) → boolean, signOut() }`; frontend-only, persisted to localStorage across reloads (BR4), rehydrated via `useSyncExternalStore` (SSR snapshot null → no hydration mismatch). Route guards must wait for `isHydrated` before treating `user: null` as signed-out. Mounted in the root layout. |
| `seededCredentials` / `matchCredential()` | `web/src/mocks/data/credentials.ts` | Single named seed of mock sign-in email/password pairs (NFR-signin-2); the only place the mock password literal lives. Swap this file when a real auth backend arrives. |
| `signInSchema` / `SignInInput` | `web/src/lib/validation/schemas.ts` | Zod presence-only validation for the sign-in form (both fields required). |
| `createUser()` / `User` | `web/src/mocks/data/user.ts` | Canonical seeded team-member identity (email `sam.rivera@taskboard.test`, display name). Shared by both test layers. |
| `Task` / `seededTasks` / `seededTeam` / `findTeamMember()` / `TASK_STATUSES` | `web/src/mocks/data/task.ts` | Shared Task entity factory + the fixed seeded team (assignee pool) and seeded tasks across all three statuses. Assignee is a user-id reference; resolve display name/initials live via `findTeamMember`, never bake onto a task (BR2/NFR-2). |
| `AppLayout` (the `(app)` shell) | `web/src/app/(app)/layout.tsx` | Shared authenticated shell every signed-in screen renders inside: header account menu (avatar + display name → Settings link + Sign out) and the signed-out route guard + bfcache guard (reuses `useAuth()`). New authenticated screens go under `web/src/app/(app)/`. |
| `getTasks()` / `getTask(id)` / `TASKS_PATH` | `web/src/lib/api/tasks.ts` | Task read endpoints through the API client (`/v1/tasks`, `/v1/tasks/:id`). MSW serves them from `seededTasks` in `web/src/mocks/handlers.ts`. Add create/edit/delete endpoints here as stories need them. |
| `getInitials()` | `web/src/lib/initials.ts` | Derive initials from a display name (first+last initial; single word → first two letters). Used by Board cards and the header avatar so the rule never drifts. |

## Conventions

- **Design tokens are the single source of colour.** The TaskBoard brand palette lives in `web/src/app/globals.css` `:root` (light theme only). Components reference tokens via Tailwind utilities (`bg-primary`, `text-muted-foreground`, `text-destructive`, `text-done`, …) — never raw hex. Primary `#2563eb`, done-accent `--color-done` `#16a34a` (Done column heading), radius `8px`.
- **Inter is the body/heading font.** Loaded via `next/font/google` in `web/src/app/layout.tsx` as `--font-inter`, mapped onto `--font-sans` in `globals.css`; `body` applies `font-sans`.
- **Context providers** mirror the ToastContext shape: `createContext(undefined)` + a `useX()` hook that throws outside its provider. New app-wide providers compose inside the root layout (`web/src/app/layout.tsx`), never replace existing ones.

## Cross-epic debt

- **Task write endpoints not yet served.** Only `GET /v1/tasks` and `GET /v1/tasks/:id` have MSW handlers; create/edit/move/delete (`POST`/`PUT`/`DELETE`) are added by the Task-detail story.
- **Display-name store is read-only.** The `(app)` shell resolves the signed-in user's display name from `seededTeam` by email; there is no mutable store yet, so a Settings rename (BR8/NFR-2) won't propagate until the Settings story adds a persistent mock display-name layer.
