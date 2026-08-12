import { AuthGate } from '@/components/auth/AuthGate';
import { HomeScreen } from '@/components/home/HomeScreen';

/**
 * App root. Gates to the sign-in screen while signed out; shows the shared home shell
 * once signed in. Replaces the starter welcome page (CLAUDE.md §6).
 */
export default function RootPage() {
  return (
    <AuthGate>
      <HomeScreen />
    </AuthGate>
  );
}
