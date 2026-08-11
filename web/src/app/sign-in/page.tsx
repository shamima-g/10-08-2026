'use client';

/**
 * Sign-in screen (epic "sign-in", Story 1 — route /sign-in).
 *
 * A clean, minimal email + password form composed from Shadcn primitives and the
 * project's design tokens (there is no sign-in screen in the source design — a
 * documented design gap; see the epic brief's Notes & Caveats). Submitted
 * credentials are validated against the seeded mock set via the AuthProvider with
 * no backend call (brief R2). On success the session is established and the user
 * is taken to the board home ("/", brief R3); on failure a single generic error
 * is shown and the user stays on the page (brief R4/BR2). Empty fields short-
 * circuit with an inline "required" message before any credential check (BR1).
 *
 * No SSO, "forgot password", or sign-up entry points are offered (brief BR3).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signInSchema } from '@/lib/validation/schemas';
import { useAuth } from '@/contexts/AuthContext';

interface FieldErrors {
  email?: string;
  password?: string;
}

const GENERIC_ERROR = 'Incorrect email or password';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Presence validation first — empty fields short-circuit before any
    // credential check (brief BR1).
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email' && !nextErrors.email) {
          nextErrors.email = issue.message;
        }
        if (field === 'password' && !nextErrors.password) {
          nextErrors.password = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});

    // Validate against the seeded mock credentials (no backend call — brief R2).
    const ok = signIn(parsed.data.email, parsed.data.password);
    if (!ok) {
      // A single generic error — never reveal which field was wrong (brief BR2).
      setFormError(GENERIC_ERROR);
      return;
    }

    setFormError(null);
    router.push('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl leading-none font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to reach your board.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
              />
              {fieldErrors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            {formError ? (
              <Alert
                variant="destructive"
                aria-live="assertive"
                className="border-destructive/50"
              >
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
