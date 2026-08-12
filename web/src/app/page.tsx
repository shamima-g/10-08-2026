'use client';

import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const REQUIRED_ERROR = 'This field is required';
const EMAIL_FORMAT_ERROR = 'Enter a valid email address';
const CONFIRMATION = "Thanks, we'll be in touch.";

// Client-side only: a valid submit never leaves the browser.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactFields {
  name: string;
  email: string;
  message: string;
}

type FieldName = keyof ContactFields;

type FieldErrors = Partial<Record<FieldName, string>>;

function validate(fields: ContactFields): FieldErrors {
  const errors: FieldErrors = {};

  if (fields.name.trim() === '') {
    errors.name = REQUIRED_ERROR;
  }

  // BR2 — required takes precedence over format for Email.
  if (fields.email.trim() === '') {
    errors.email = REQUIRED_ERROR;
  } else if (!EMAIL_PATTERN.test(fields.email.trim())) {
    errors.email = EMAIL_FORMAT_ERROR;
  }

  if (fields.message.trim() === '') {
    errors.message = REQUIRED_ERROR;
  }

  return errors;
}

export default function HomePage() {
  const [fields, setFields] = useState<ContactFields>({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const updateField = (name: FieldName) => (value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      // BR3 / NFR-1 — pure client-side no-op: no API call, no navigation.
      setSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-none text-foreground">
            Get in touch
          </h1>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <p className="text-foreground" role="status">
              {CONFIRMATION}
            </p>
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  value={fields.name}
                  onChange={(e) => updateField('name')(e.target.value)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={fields.email}
                  onChange={(e) => updateField('email')(e.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="How can we help?"
                  value={fields.message}
                  onChange={(e) => updateField('message')(e.target.value)}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={
                    errors.message ? 'message-error' : undefined
                  }
                />
                {errors.message && (
                  <p id="message-error" className="text-sm text-destructive">
                    {errors.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="mt-2">
                Send message
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
