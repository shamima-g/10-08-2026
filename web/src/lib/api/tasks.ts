/**
 * Task API endpoint functions.
 *
 * All task HTTP access goes through the shared API client (`@/lib/api/client`,
 * CLAUDE.md §2 — never `fetch()` directly). The project is mock-only (project.md
 * §Data Source): MSW (web/src/mocks/handlers.ts) intercepts these calls in the
 * browser and serves the seeded factories, and the Vitest layer mocks the client.
 *
 * The `Task` shape lives in the shared entity factory (`@/mocks/data/task`) — the
 * one source of truth both test layers draw from — and is re-exported here for
 * consumers so they import the endpoints and the type from a single place.
 */
import { get } from '@/lib/api/client';

import type { Task } from '@/mocks/data/task';

/** Base path for the task collection. */
export const TASKS_PATH = '/v1/tasks';

/** Load the full task list. The Board groups it by status client-side (NFR-1). */
export function getTasks(): Promise<Task[]> {
  return get<Task[]>(TASKS_PATH);
}

/** Load a single task by id (Task detail screen). */
export function getTask(id: string): Promise<Task> {
  return get<Task>(`${TASKS_PATH}/${id}`);
}
