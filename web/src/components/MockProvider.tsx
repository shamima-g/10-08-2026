'use client';

import { useEffect } from 'react';

let started = false;

export function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' && !started) {
      started = true;
      import('../mocks/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'warn' });
      });
    }
  }, []);

  return <>{children}</>;
}
