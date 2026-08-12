/**
 * Per-epic baseline — epic "notes".
 *
 * Cross-story invariant for the shared surface this epic introduces: the home shell
 * that the (future, independent) Tasks epic reuses as-is. It must link to BOTH
 * features — Notes and Tasks — so navigation stays intact as the app grows. Later
 * stories in this epic must NOT re-assert this; they cover only their own delta.
 *
 * Front-end-only prototype (PI-01): no backend, no API client, no MSW. The sign-in
 * flow itself (landing on home) is a Playwright concern (AC-1); this file asserts only
 * the shell's rendered link structure, in isolation.
 *
 * Contract pinned (implement to match):
 *  - @/components/home/HomeScreen → the shared home shell rendered after sign-in,
 *    exposing links to /notes and /tasks.
 *
 * These tests WILL FAIL until implemented (TDD red).
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { HomeScreen } from '@/components/home/HomeScreen';
import { SessionProvider } from '@/contexts/SessionContext';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Epic notes — shared shell baseline', () => {
  it('home shell links to both the Notes and Tasks features', () => {
    render(
      <SessionProvider>
        <HomeScreen />
      </SessionProvider>,
    );

    expect(screen.getByRole('link', { name: /notes/i })).toHaveAttribute(
      'href',
      '/notes',
    );
    expect(screen.getByRole('link', { name: /tasks/i })).toHaveAttribute(
      'href',
      '/tasks',
    );
  });
});
