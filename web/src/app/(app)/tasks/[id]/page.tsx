'use client';

/**
 * Task detail — view, edit, create, move, and delete a single task (epic
 * "task-board", Story 2, route "/tasks/[id]"). Rendered inside the shared
 * authenticated shell (`(app)/layout.tsx`), which carries the header/account menu
 * and the signed-out route guard, so a signed-out visitor to a task URL is
 * redirected to sign-in (AC-6) without this screen re-implementing the guard.
 *
 * One screen serves BOTH flows (digest §Screens):
 *   - EDIT — opened from a Board card; the route id is the task id, loaded via the
 *     API client (`getTask` → `@/lib/api/client`, CLAUDE.md §2 — never `fetch()`).
 *   - CREATE — opened from the Board's "New task" button, which routes to the
 *     `/tasks/new` sentinel; the form starts empty with Status defaulting to
 *     "To do" (resolved design choice / BR7).
 *
 * The page is a client component that reads its id via `useParams` (not a `params`
 * prop). Assignee is stored as a user-id reference (BR2/NFR-2): the dropdown lists
 * the seeded team and the id is what is persisted, so a later Settings rename
 * propagates without stale copies.
 *
 * Save/create/delete all go through the API client into the mock data layer's
 * mutable session store (web/src/mocks/handlers.ts), then navigate back to the
 * Board via the client router (`router.push('/')`) — a SPA navigation, so the
 * in-memory store survives and the change is reflected on the Board (NFR-2). A
 * full reload would reset the store, so this screen never hard-navigates.
 *
 * Validation (resolved design choice): Title is required; Assignee / Status / Due
 * date are optional. Delete shows a confirm step (Shadcn alert-dialog) before
 * removing the task.
 *
 * Colours reference design tokens only (styling-centralisation) — no raw hex.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createTask, deleteTask, getTask, updateTask } from '@/lib/api/tasks';
import { TASK_STATUSES, seededTeam, type TaskStatus } from '@/mocks/data/task';
import {
  resolveDisplayName,
  useDisplayNameOverrides,
} from '@/lib/user/display-name-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/** Route id that opens the detail screen in its empty create state (BR7). */
const CREATE_ID = 'new';

/** Shared label styling for the non-native (combobox) fields. */
const FIELD_LABEL = 'text-sm font-medium leading-none text-foreground';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  // Re-render the Assignee dropdown when the signed-in user renames themselves,
  // so its option label reflects the new name too (BR8 — cards and dropdowns).
  useDisplayNameOverrides();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? '');
  const isCreate = id === CREATE_ID;

  // Default a new task's assignee to the signed-in team member (resolved from the
  // seeded team by session email), so a created card shows the author's initials.
  const currentUserId = useMemo(
    () => seededTeam.find((member) => member.email === user?.email)?.id ?? '',
    [user?.email],
  );

  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(isCreate ? currentUserId : '');
  const [status, setStatus] = useState<TaskStatus>('To do');
  const [dueDate, setDueDate] = useState('');
  // Create is immediately ready; edit stays in its loading state until the fetch
  // resolves so the form never flashes empty over a real task's values.
  const [loaded, setLoaded] = useState(isCreate);
  const [loadError, setLoadError] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Bumping this re-runs the load effect for the "Try again" retry without a
  // synchronous setState in the effect body.
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Create state loads nothing — the empty form is already the source of truth.
    if (isCreate) {
      return;
    }
    // Guard against a resolve landing after unmount / a superseding reload. Every
    // setState runs only after the await, never synchronously in the effect body,
    // satisfying the React Compiler set-state-in-effect rule.
    let ignore = false;
    getTask(id)
      .then((task) => {
        if (ignore) {
          return;
        }
        setTitle(task.title);
        setAssignee(task.assignee);
        setStatus(task.status);
        setDueDate(task.dueDate);
        setLoaded(true);
      })
      .catch(() => {
        if (!ignore) {
          setLoadError(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, isCreate, reloadCount]);

  // Retry runs from a click handler (not an effect), so resetting to the loading
  // state synchronously here is fine; bumping reloadCount re-runs the load effect.
  const retryLoad = useCallback(() => {
    setLoadError(false);
    setLoaded(false);
    setReloadCount((count) => count + 1);
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Title is required (resolved design choice) — an empty title short-circuits
    // before any save, so the message's presence proves the submit was blocked.
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required');
      return;
    }
    setTitleError(null);
    setSaving(true);

    const input = { title: trimmedTitle, assignee, status, dueDate };
    try {
      if (isCreate) {
        await createTask(input);
      } else {
        await updateTask(id, input);
      }
      showToast({ variant: 'success', title: 'Task saved' });
      // SPA navigation back to the Board so the mock store survives (NFR-2).
      router.push('/');
    } catch {
      setSaving(false);
      showToast({
        variant: 'error',
        title: "We couldn't save this task. Please try again.",
      });
    }
  }

  async function handleDelete() {
    try {
      await deleteTask(id);
      showToast({ variant: 'success', title: 'Task deleted' });
      router.push('/');
    } catch {
      showToast({
        variant: 'error',
        title: "We couldn't delete this task. Please try again.",
      });
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
            <span>We couldn&apos;t load this task. Please try again.</span>
            <Button variant="outline" size="sm" onClick={retryLoad}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <p role="status" className="text-sm text-muted-foreground">
          Loading task…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-semibold text-foreground">
        {isCreate ? 'New task' : 'Edit task'}
      </h1>

      <form onSubmit={handleSave} noValidate className="space-y-6">
        {/* Title — the one required field. */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'title-error' : undefined}
          />
          {titleError ? (
            <p id="title-error" className="text-sm text-destructive">
              {titleError}
            </p>
          ) : null}
        </div>

        {/* Assignee — the id is persisted; the seeded team supplies the options. */}
        <div className="space-y-2">
          <span id="assignee-label" className={FIELD_LABEL}>
            Assignee
          </span>
          <Select value={assignee || undefined} onValueChange={setAssignee}>
            <SelectTrigger className="w-full" aria-labelledby="assignee-label">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {seededTeam.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {resolveDisplayName(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status — changing this moves the task between Board columns (BR4). */}
        <div className="space-y-2">
          <span id="status-label" className={FIELD_LABEL}>
            Status
          </span>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as TaskStatus)}
          >
            <SelectTrigger className="w-full" aria-labelledby="status-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due date — displayed and stored in ISO (resolved design choice). */}
        <div className="space-y-2">
          <Label htmlFor="due-date">Due date</Label>
          <Input
            id="due-date"
            name="due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={saving}>
            Save changes
          </Button>

          {/* Delete is only meaningful for a task that already exists. */}
          {!isCreate ? (
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="link"
                  className="self-center text-destructive"
                >
                  Delete task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This can&apos;t be undone. The task will be removed from the
                    board.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </form>
    </main>
  );
}
