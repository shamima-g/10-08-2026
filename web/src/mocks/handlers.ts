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
import type { Task, TaskStatus } from './data/task';

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
 * Full CRUD is served: GET (list + single), POST (create), PUT (edit / status
 * move), DELETE. The mutable session store below is seeded from the canonical
 * tasks and mutated in place, so a create / edit / move / delete is reflected on
 * the Board's next GET within the same browser session — that is NFR-2 (state
 * persists across client navigation, since MSW handlers run in the page and the
 * store survives SPA navigation, resetting only on a full page reload).
 */
const TASKS_URL = `${API_BASE_URL}/v1/tasks`;

/** Mutable, session-scoped copy of the seeded tasks (never mutate the canon). */
const taskStore: Task[] = seededTasks.map((task) => ({ ...task }));
/** Monotonic id source for created tasks within this session. */
let nextTaskId = taskStore.length + 1;

/** Shape of the create/edit request body sent by the Task-detail form. */
interface TaskInputBody {
  title?: string;
  assignee?: string;
  status?: TaskStatus;
  dueDate?: string;
}

export const handlers: HttpHandler[] = [
  // GET /v1/tasks — the full task list the Board groups by status.
  http.get(TASKS_URL, () => {
    return HttpResponse.json(taskStore);
  }),

  // GET /v1/tasks/:id — a single task (Task detail).
  http.get(`${TASKS_URL}/:id`, ({ params }) => {
    const task = taskStore.find((t) => t.id === params.id);
    if (!task) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(task);
  }),

  // POST /v1/tasks — create a task; the store assigns its id (BR7).
  http.post(TASKS_URL, async ({ request }) => {
    const body = (await request.json()) as TaskInputBody;
    const task: Task = {
      id: `task-${nextTaskId++}`,
      title: body.title ?? '',
      assignee: body.assignee ?? '',
      status: body.status ?? 'To do',
      dueDate: body.dueDate ?? '',
    };
    taskStore.push(task);
    return HttpResponse.json(task, { status: 201 });
  }),

  // PUT /v1/tasks/:id — persist edits, including a Status move (BR4/BR5).
  http.put(`${TASKS_URL}/:id`, async ({ params, request }) => {
    const index = taskStore.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = (await request.json()) as TaskInputBody;
    const updated: Task = {
      ...taskStore[index],
      ...body,
      id: taskStore[index].id,
    };
    taskStore[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /v1/tasks/:id — remove a task (BR6). 204 No Content on success.
  http.delete(`${TASKS_URL}/:id`, ({ params }) => {
    const index = taskStore.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    taskStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
