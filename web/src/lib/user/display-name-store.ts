/**
 * Session-scoped display-name override store (mock-only — project.md §Data Source).
 *
 * BR8/NFR-2: when the signed-in team member renames themselves on Settings, the new
 * name (and its derived initials, BR2) must appear wherever that user is shown — the
 * header account menu, their Board cards, and the Board's assignee references. The
 * canonical seeded team (`seededTeam`) is immutable, so a rename is recorded here as
 * an override keyed by user id and layered over the seeded name at read time.
 *
 * The store is an in-memory module singleton exposed through `useSyncExternalStore`
 * (mirroring AuthContext's pattern — no setState-in-effect), so the header, Board
 * cards, and assignee filter re-render live when a name changes and stay consistent
 * across client navigation within a session. A full page reload resets it — accepted
 * for a mock-only data layer with no backend to persist to.
 */
import { useSyncExternalStore } from 'react';

import type { User } from '@/mocks/data/user';

/** userId → saved display name. */
const overrides = new Map<string, string>();
const listeners = new Set<() => void>();

// Monotonic version so `useSyncExternalStore` snapshots stay Object.is-stable
// between writes and change exactly once per write (no render loop).
let version = 0;

function getSnapshot(): number {
  return version;
}

/** SSR / hydration snapshot — no overrides exist on the server. */
function getServerSnapshot(): number {
  return 0;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Record a renamed display name for a user id and notify subscribers. */
export function setDisplayNameOverride(
  userId: string,
  displayName: string,
): void {
  overrides.set(userId, displayName);
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

/** The effective display name for a seeded user — a saved override, else the seed. */
export function resolveDisplayName(user: User): string {
  return overrides.get(user.id) ?? user.displayName;
}

/**
 * Subscribe a client component to override changes so it re-renders when a name is
 * saved. Call it for the subscription; read the effective name via
 * `resolveDisplayName`.
 */
export function useDisplayNameOverrides(): void {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
