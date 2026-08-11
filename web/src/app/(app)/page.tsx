'use client';

/**
 * Board — the landing screen (epic "task-board", Story 1, route "/").
 *
 * Shows every task grouped across the three status columns (To do / In progress /
 * Done), lets a team member narrow the board to one assignee, and start a new
 * task. Rendered inside the shared authenticated shell (`(app)/layout.tsx`), which
 * carries the header/account menu and the signed-out route guard.
 *
 * Data: the full task list is loaded ONCE through the API client
 * (`@/lib/api/tasks` → `@/lib/api/client`, CLAUDE.md §2 — never `fetch()`
 * directly) and grouped by status client-side, so the assignee filter narrows the
 * board with no page reload (NFR-1). Assignee is a user-id reference; the card
 * resolves the display name/initials live from the seeded team (`findTeamMember`),
 * never baking them onto the task, so a Settings rename propagates (BR2/NFR-2).
 *
 * Colour: column headings reference design tokens only (styling-centralisation) —
 * the Done heading uses `--color-done` (`text-done`) and the active In-progress
 * heading uses primary blue (`text-primary`); To do stays default foreground.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks } from '@/lib/api/tasks';
import {
  TASK_STATUSES,
  findTeamMember,
  seededTeam,
  type Task,
  type TaskStatus,
} from '@/mocks/data/task';
import { getInitials } from '@/lib/initials';
import {
  resolveDisplayName,
  useDisplayNameOverrides,
} from '@/lib/user/display-name-store';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Sentinel filter value meaning "show every assignee's tasks" (BR1 default). */
const ALL_ASSIGNEES = 'all';

/**
 * Heading colour per column: Done → done-green token, the active In-progress
 * column → primary blue, To do → default foreground (R1/NFR-3). Tokens only.
 */
function headingClass(status: TaskStatus): string {
  if (status === 'Done') {
    return 'text-done';
  }
  if (status === 'In progress') {
    return 'text-primary';
  }
  return 'text-foreground';
}

/** Slug-safe id fragment for a column heading (status contains spaces). */
function headingId(status: TaskStatus): string {
  return `column-${status.replace(/\s+/g, '-').toLowerCase()}`;
}

export default function Board() {
  const router = useRouter();
  // Re-render cards and the assignee filter when a user is renamed (BR8/NFR-2).
  useDisplayNameOverrides();

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [assignee, setAssignee] = useState<string>(ALL_ASSIGNEES);
  // Bumping this re-runs the load effect (the "Try again" retry) without calling
  // setState synchronously in the effect body — the loading state comes from the
  // useState initializers above, not a synchronous reset inside the effect.
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Guard against a resolve/reject landing after unmount (or a superseding
    // reload) — the setState calls run only after the await, never synchronously,
    // satisfying the React Compiler set-state-in-effect rule.
    let ignore = false;
    getTasks()
      .then((loaded) => {
        if (!ignore) {
          setTasks(loaded);
        }
      })
      .catch(() => {
        if (!ignore) {
          setLoadError(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, [reloadCount]);

  // Retry runs from a click handler (not an effect), so resetting to the loading
  // state synchronously here is fine; bumping reloadCount re-runs the load effect.
  const retryLoad = useCallback(() => {
    setLoadError(false);
    setTasks(null);
    setReloadCount((count) => count + 1);
  }, []);

  // Client-side filter (no reload) — narrow to one assignee or show all (BR1/NFR-1).
  const visibleTasks = useMemo(() => {
    if (!tasks) {
      return [];
    }
    return assignee === ALL_ASSIGNEES
      ? tasks
      : tasks.filter((task) => task.assignee === assignee);
  }, [tasks, assignee]);

  // Group the visible tasks into the three columns in canonical order.
  const columns = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        tasks: visibleTasks.filter((task) => task.status === status),
      })),
    [visibleTasks],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-end gap-4">
        {/* Filter and primary action are grouped together at the top-right of the
            header, filter first (R2/NFR-1). The inner group keeps them clustered as
            one unit that reflows together across breakpoints. */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Assignee filter. A role="combobox" trigger does not take its accessible
              name from its shown value, so name it explicitly (WCAG 4.1.2
              button-name). 2.5.3 Label-in-Name does not apply — combobox has no
              name-from-content, so there is no visible text label to conflict with. */}
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger className="w-56" aria-label="Filter by assignee">
              <SelectValue placeholder="All assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ASSIGNEES}>All assignees</SelectItem>
              {seededTeam.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {resolveDisplayName(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Primary action → Task detail in create state (BR1). */}
          <Button onClick={() => router.push('/tasks/new')}>Add task</Button>
        </div>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
            <span>We couldn&apos;t load your tasks. Please try again.</span>
            <Button variant="outline" size="sm" onClick={retryLoad}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : tasks === null ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading tasks…
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {columns.map(({ status, tasks: columnTasks }) => (
            <section
              key={status}
              aria-labelledby={headingId(status)}
              className="flex flex-col gap-4"
            >
              <h2
                id={headingId(status)}
                className={`text-xl font-bold ${headingClass(status)}`}
              >
                {status}
              </h2>

              {columnTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nothing here yet
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {columnTasks.map((task) => (
                    <li key={task.id}>
                      <TaskCard
                        task={task}
                        onOpen={() => router.push(`/tasks/${task.id}`)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

/**
 * A single task card. Rendered as a real `<button>` (keyboard-focusable and
 * activatable) that opens the task's detail screen — the click/keyboard
 * navigation is wired through the router by the parent. Initials are resolved
 * live from the assignee id via the seeded team, never stored on the task.
 */
function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const member = findTeamMember(task.assignee);
  const displayName = member ? resolveDisplayName(member) : '';
  const initials = getInitials(displayName);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="font-medium text-foreground">{task.title}</span>
      <span
        title={displayName}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
      >
        {initials}
      </span>
    </button>
  );
}
