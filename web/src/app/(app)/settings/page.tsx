'use client';

/**
 * Settings — set your own display name (epic "task-board", Story 3, route
 * "/settings"). Rendered inside the shared authenticated shell
 * (`(app)/layout.tsx`), which carries the header account menu (whose Settings
 * control reaches this screen, AC-2) and the signed-out route guard (a signed-out
 * visitor is redirected to sign-in, AC-5) — so this page assumes a signed-in user.
 *
 * One field, "Your display name", pre-filled from the current user's name. Saving
 * records the new name in the session-scoped display-name override store — the mock
 * data layer for display names — so the name and its derived initials (BR2) update on
 * the header, this user's Board cards, and the Board's assignee references (BR8/NFR-2).
 * Save surfaces a success toast and STAYS on /settings (unlike Task detail, which
 * returns to the Board).
 *
 * Persistence goes straight to the store rather than through the HTTP client
 * (`@/lib/api/client`): the project is mock-only with no backend (project.md §Data
 * Source), so there is no user endpoint to call — this mirrors the frontend-only
 * AuthContext, which likewise persists the session without any HTTP request. CLAUDE.md
 * §2 (route API calls through the client) is not engaged because no API call is made.
 *
 * Validation (resolved design choice): display name is required — an empty value
 * shows "Display name is required" and does not save.
 *
 * Colours reference design tokens only (styling-centralisation) — no raw hex.
 */

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { displayNameSchema } from '@/lib/validation/schemas';
import { seededTeam } from '@/mocks/data/task';
import {
  resolveDisplayName,
  setDisplayNameOverride,
  useDisplayNameOverrides,
} from '@/lib/user/display-name-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  // Keep the pre-filled name in step with the shared display-name store.
  useDisplayNameOverrides();

  // Resolve the signed-in team member from the seeded team by session email (the
  // (app) shell guarantees a user here), then its effective (possibly already
  // renamed) display name. Fall back to the raw email if no seeded match exists.
  const member = useMemo(
    () => seededTeam.find((teammate) => teammate.email === user?.email),
    [user?.email],
  );
  const currentName = member ? resolveDisplayName(member) : (user?.email ?? '');

  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Display name is required — an empty value short-circuits before any save, so
    // the message's presence proves the submit was blocked (AC-4).
    const result = displayNameSchema.safeParse({ displayName: name });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(null);

    // Record the rename in the shared store so this user's header entry, Board cards,
    // and assignee references reflect the new name/initials (BR8/NFR-2). Fall back to
    // no-op only when the session has no seeded match (defensive — the shell
    // guarantees a signed-in seeded user here).
    if (member) {
      setDisplayNameOverride(member.id, result.data.displayName);
    }
    setName(result.data.displayName);
    showToast({ variant: 'success', title: 'Display name saved' });
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-semibold text-foreground">
        Your settings
      </h1>

      <form onSubmit={handleSave} noValidate className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="display-name">Your display name</Label>
          <Input
            id="display-name"
            name="display-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'display-name-error' : undefined}
          />
          {error ? (
            <p id="display-name-error" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <Button type="submit">Save</Button>
      </form>
    </main>
  );
}
