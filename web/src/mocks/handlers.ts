/**
 * MSW Mock Handlers
 *
 * AUTO-GENERATED from generated-docs/specs/api-spec.yaml
 * by mock-setup-agent. Editable — /api-mock-refresh does smart
 * partial updates and will not overwrite handlers you have
 * customised, as long as the endpoint signature is unchanged.
 *
 * Regenerate with: /api-mock-refresh
 */
import type { HttpHandler } from 'msw';

/**
 * Intentionally empty for now.
 *
 * No OpenAPI spec exists yet (generated-docs/specs/api-spec.yaml) — this
 * project's data source is mock-only (project.md §Data Source & Backend
 * Integration) and the sign-in epic
 * (generated-docs/epics/sign-in/brief.md) validates credentials directly
 * against the mock data layer (web/src/mocks/data/user.ts,
 * web/src/mocks/data/identity.ts) with no REST call — see brief R2 ("no
 * backend call"). There is nothing to serve over HTTP for this epic.
 *
 * The task-board epic will introduce the first REST endpoints (tasks
 * list, task detail, etc.). When it does, add their handlers here:
 *   - Compose the entity factories in web/src/mocks/data/ — never
 *     re-derive an entity's shape inline.
 *   - Compose the shared param-reading/pagination helpers from
 *     ./handler-utils (create that file at that point, per the
 *     mock-setup-agent conventions) rather than inlining query-param
 *     logic per handler.
 *   - Do not add an `if (MOCK_API)` branch — handlers only run while
 *     MSW is active (see MockProvider).
 */
export const handlers: HttpHandler[] = [];
