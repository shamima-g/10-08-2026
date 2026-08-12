import { AuthGate } from '@/components/auth/AuthGate';
import { NotesView } from '@/components/notes/NotesView';

/**
 * /notes — the Notes feature behind the session gate. While signed out this renders the
 * sign-in screen (deep links are not reachable without a session).
 */
export default function NotesPage() {
  return (
    <AuthGate>
      <NotesView />
    </AuthGate>
  );
}
