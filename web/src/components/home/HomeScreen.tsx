'use client';

/**
 * HomeScreen — the shared home shell shown after sign-in (Notes epic R2).
 *
 * Links to the two features (Notes and Tasks). This is the shared foundation the Tasks
 * epic reuses as-is; the Tasks route is added by that epic, but the link is present here.
 */

import Link from 'next/link';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function HomeScreen() {
  const { user } = useSession();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-muted-foreground">
          {user ? `Welcome back, ${user.displayName}.` : 'Welcome.'} Choose
          where to go.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Jot quick notes for yourself.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/notes">Go to Notes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Track things you need to do.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/tasks">Go to Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
