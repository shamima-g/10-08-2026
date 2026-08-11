'use client';

import { useEffect, useState } from 'react';

/**
 * Whether the browser mock layer (MSW) is active. Baked in at build time from the
 * NEXT_PUBLIC_ env var, so it holds the SAME value during server render and the
 * first client render — reading it into the initial `ready` state below therefore
 * can't cause a hydration mismatch.
 */
const mockingEnabled = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// Module-level guard so the worker is started at most once per page lifetime, even
// if the provider remounts.
let started = false;

/**
 * Boots the MSW request-mocking worker and, crucially, DEFERS rendering the app
 * until the worker is actually intercepting.
 *
 * The worker registers asynchronously (`worker.start()` resolves only once the
 * service worker is active and this client is intercepting). Client screens fetch
 * their data on mount, so if we rendered them before the worker was ready — as on a
 * hard page load / reload — the very first request would race the worker, escape to
 * the (nonexistent, mock-only) backend, and fail. Gating the render on worker
 * readiness closes that race so a reload lands on real data, not the error state.
 *
 * When mocking is disabled (`mockingEnabled` false — e.g. a real-backend
 * deployment), `ready` starts true and the app renders immediately with SSR intact;
 * this gate applies only to the mock-only configuration.
 */
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    if (!mockingEnabled || ready) {
      return;
    }
    let cancelled = false;
    async function enableMocking() {
      if (!started) {
        started = true;
        const { worker } = await import('../mocks/browser');
        await worker.start({ onUnhandledRequest: 'warn' });
      }
      if (!cancelled) {
        setReady(true);
      }
    }
    void enableMocking();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
