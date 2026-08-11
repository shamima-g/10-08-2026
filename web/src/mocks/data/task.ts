/**
 * Project-wide entity factory: Task, plus the seeded team + seeded tasks the
 * Board renders.
 *
 * The single source of truth for the Task shape and its canonical values, shared
 * by BOTH the Vitest and Playwright layers so response bodies never drift — never
 * re-define this shape inside a spec.
 *
 * Anchored to the design digest's Data Shapes (`generated-docs/design/digest.md`)
 * and the task-board brief's Data Model (`generated-docs/epics/task-board/brief.md`).
 * No `@/types/api-generated` exists (mock-only, no OpenAPI spec — project.md
 * §Data Source), so the shape is inferred from those docs.
 *
 * Assignee is referenced by USER ID, not by an embedded display name: BR8/NFR-2
 * require a Settings rename of the current user to propagate to every card and
 * dropdown that references them. Storing only the id means the display name (and
 * its derived initials, BR2) is always resolved live from the team list — a copy
 * on each task would go stale on rename.
 *
 * Import discipline (so the Playwright runtime resolves these without alias
 * plumbing): sibling factories imported by relative path, types via `import type`
 * — never the `@/` alias.
 */
import { createUser } from './user';

import type { User } from './user';

/** The three Board columns / Task-detail Status options (digest §Screens). */
export type TaskStatus = 'To do' | 'In progress' | 'Done';

/**
 * Column order as it appears left-to-right on the Board (R1). Exported so the
 * Board and its tests iterate the same canonical order instead of re-listing it.
 */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'To do',
  'In progress',
  'Done',
];

export interface Task {
  id: string;
  title: string;
  /** User id of the assigned team member (see `seededTeam` / `findTeamMember`). */
  assignee: string;
  status: TaskStatus;
  /** ISO date string, displayed verbatim (e.g. `2026-05-01`) — digest decision. */
  dueDate: string;
}

/**
 * The fixed seeded team — the resolved design choice for the assignee pool
 * (digest §Your Decisions: "a fixed seeded team list"). Both the Board's
 * "All assignees" filter (BR1) and the Task-detail Assignee dropdown draw from
 * this list. Composed from `createUser` so the signed-in canonical member
 * (`sam.rivera@taskboard.test`, `user-1`) stays in sync with the identity source;
 * distinct display names give distinct initials for the cards (BR2).
 */
export const seededTeam: readonly User[] = [
  createUser(), // user-1 — Sam Rivera — the signed-in team member
  createUser({
    id: 'user-2',
    email: 'jordan.lee@taskboard.test',
    displayName: 'Jordan Lee',
  }),
  createUser({
    id: 'user-3',
    email: 'priya.patel@taskboard.test',
    displayName: 'Priya Patel',
  }),
  createUser({
    id: 'user-4',
    email: 'marcus.chen@taskboard.test',
    displayName: 'Marcus Chen',
  }),
];

/** Resolve a task's `assignee` id to the seeded team member, or `undefined`. */
export function findTeamMember(id: string): User | undefined {
  return seededTeam.find((member) => member.id === id);
}

/**
 * Canonical Task. Defaults to the mockup's illustrative card ("Draft launch
 * email") but as REAL seeded data (Translate-Don't-Copy), assigned to the
 * signed-in member and due on the digest's example ISO date.
 */
export function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Draft launch email',
    assignee: 'user-1',
    status: 'To do',
    dueDate: '2026-05-01',
    ...overrides,
  };
}

/**
 * Seeded tasks spread across all three statuses (two per column) and across
 * multiple assignees, so the Board renders content in every column and the
 * assignee filter (BR1) has more than one option's worth of data to narrow. The
 * signed-in member (`user-1`) owns tasks in two columns, so filtering to the
 * current user shows real content.
 */
export const seededTasks: readonly Task[] = [
  createTask(), // task-1 — Draft launch email — Sam — To do
  createTask({
    id: 'task-2',
    title: 'Review Q2 roadmap',
    assignee: 'user-2',
    status: 'To do',
    dueDate: '2026-05-03',
  }),
  createTask({
    id: 'task-3',
    title: 'Fix onboarding bug',
    assignee: 'user-3',
    status: 'In progress',
    dueDate: '2026-05-05',
  }),
  createTask({
    id: 'task-4',
    title: 'Update API docs',
    assignee: 'user-1',
    status: 'In progress',
    dueDate: '2026-05-08',
  }),
  createTask({
    id: 'task-5',
    title: 'Ship pricing page',
    assignee: 'user-4',
    status: 'Done',
    dueDate: '2026-04-28',
  }),
  createTask({
    id: 'task-6',
    title: 'Archive old tickets',
    assignee: 'user-2',
    status: 'Done',
    dueDate: '2026-04-25',
  }),
];
