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
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '@/lib/utils/constants';
import { seededTasks } from './data/task';

import type { HttpHandler } from 'msw';

/**
 * Mock task endpoints (project.md §Data Source — mock-only, no backend).
 *
 * The Board reads its tasks through the API client (web/src/lib/api/tasks.ts),
 * and these handlers intercept those calls IN THE BROWSER and serve the seeded
 * task factory (web/src/mocks/data/task.ts) — the single source of truth both
 * test layers share, never re-derived inline. Paths mirror the endpoint functions
 * in web/src/lib/api/tasks.ts (`/v1/tasks`, `/v1/tasks/:id`), fully qualified with
 * API_BASE_URL so MSW matches the absolute URL the client builds.
 *
 * Only the read endpoints this story needs are served here; create/edit/delete
 * handlers are added by the Task-detail story that introduces those actions.
 */
const TASKS_URL = `${API_BASE_URL}/v1/tasks`;

export const handlers: HttpHandler[] = [
  // GET /v1/tasks — the full task list the Board groups by status.
  http.get(TASKS_URL, () => {
    return HttpResponse.json(seededTasks);
  }),

  // GET /v1/tasks/:id — a single task (Task detail).
  http.get(`${TASKS_URL}/:id`, ({ params }) => {
    const task = seededTasks.find((t) => t.id === params.id);
    if (!task) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(task);
  }),
];
