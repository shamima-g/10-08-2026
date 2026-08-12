# Architecture & Reuse Registry

Durable, reusable surfaces and conventions. Reuse these instead of rebuilding; update a
row when its export changes, delete it when the export is removed.

## Reusable surfaces

| What | Where | Capability |
|---|---|---|
| SessionProvider / useSession | web/src/contexts/SessionContext.tsx | Client-side in-memory session; `signIn(email,password)` accepts only the seeded user, `signOut`, `isSignedIn`, `user` |
| AuthGate | web/src/components/auth/AuthGate.tsx | Wraps a page; renders the sign-in screen while signed out, children once signed in |
| SignInForm | web/src/components/auth/SignInForm.tsx | Stubbed sign-in screen with accessible error (role="alert") |
| HomeScreen | web/src/components/home/HomeScreen.tsx | Shared post-sign-in shell linking to /notes and /tasks |
| signInSchema / noteTextSchema | web/src/lib/validation/schemas.ts | Zod schemas for sign-in fields and trimmed non-empty note text |

## Conventions

- Providers are composed in web/src/app/layout.tsx: ToastProvider > SessionProvider; gate each page's content with `AuthGate`.
- Toast confirmations use the shared ToastContext (`useToast`); call `clearAllToasts()` before a new confirmation to avoid stacked duplicates.

## Cross-epic debt

- None yet.
