# Mock Data Context

Generated: 2026-08-11T00:00:00Z
Source spec: none — `generated-docs/specs/api-spec.yaml` does not exist yet

## Why there are no handlers yet

This project's data source is `mock-only` (see `generated-docs/project.md`
§Data Source & Backend Integration — "No API spec attached"). The first epic
built, **sign-in**, is frontend-only authentication per
`generated-docs/epics/sign-in/brief.md`: credentials are validated directly
against the mock data layer in the sign-in component/hook, not via an HTTP
call (brief R2: "Submitted credentials are validated against the mock data
layer (no backend call)"). There is therefore no REST endpoint for this
epic to mock, and `web/src/mocks/handlers.ts` is generated with an empty
`handlers` array plus a comment explaining why and how to extend it later.

The browser mock infrastructure (MSW worker, `MockProvider`, service worker)
is still fully wired up in this run (Call B) so the **next** epic that
introduces real REST endpoints (the task-board epic — tasks list/detail
endpoints) only needs to add handlers to the existing `handlers.ts`, not
build the plumbing from scratch.

## Data Conventions

Not yet established — no endpoint has been mocked. When the first list
endpoint is added:
- ID format: follow whatever the entity factory in `web/src/mocks/data/`
  already uses (e.g. `user.ts` uses a string id like `user-1`).
- Pagination envelope: match the spec's envelope shape exactly once
  `api-spec.yaml` exists.
- Date format: ISO 8601, consistent with the rest of the project's data
  conventions.

## Entities and Sample Values

### User (identity only, no HTTP endpoint)
- Source: factory `web/src/mocks/data/user.ts` (`createUser`) and
  `web/src/mocks/data/identity.ts` (`userInfoFor`).
- The sign-in epic's mock credential check (email `sam.rivera@taskboard.test`
  matched against a seeded password) lives in the sign-in feature code
  itself, per NFR-signin-2 ("seeded mock credentials live in a single,
  clearly-named mock-data location") — not in `handlers.ts`, since there is
  no HTTP call to intercept for sign-in.
- `userInfoFor('Team member')` is the canonical userinfo body for the single
  "Team member" role and should be reused wherever "who is signed in" is
  needed (never inline a userinfo body).

## Sample Data Used

None — no sample data file is recorded in `project.md` §Data Source &
Backend Integration, and there is no spec to derive schemas from yet.

## Assumptions

- No `api-spec.yaml` exists at the time of this run, so Step 5 (save
  `mock-spec-snapshot.yaml`) is deferred — there is nothing to snapshot.
  When a later epic's `design-api` step produces the first `api-spec.yaml`,
  the next `mock-setup-agent`/`/api-mock-refresh` run will find no prior
  snapshot and correctly treat every declared endpoint as new.
- `web/src/mocks/handler-utils.ts` (shared query-param/pagination helpers)
  is likewise deferred until the first list endpoint with query parameters
  is actually mocked — creating it now would have no consumer. Create it
  at that point and register it in `generated-docs/architecture.md` under
  `## Shared utilities & components`.
