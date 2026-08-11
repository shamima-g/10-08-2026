/**
 * Derive a person's initials from their display name.
 *
 * The single source of the initials rule (digest §Your Decisions): first-name +
 * last-name initial (e.g. "Jane Doe" → "JD"); a single-word name falls back to
 * its first two letters (e.g. "Cher" → "CH"). Used wherever a person is shown as
 * initials — Board cards (BR2) and the app header's account avatar — so the rule
 * never drifts between surfaces.
 *
 * Initials are always derived live from the current display name (never baked
 * onto a task), so a Settings rename propagates everywhere (BR8/NFR-2).
 */
export function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}
