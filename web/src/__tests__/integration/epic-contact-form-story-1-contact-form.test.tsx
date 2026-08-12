/**
 * Story Metadata:
 * - Route: /
 * - Target File: web/src/app/page.tsx
 * - Page Action: modify_existing
 *
 * Tests for Epic "contact-form", Story 1: Contact form with validation and
 * confirmation on the site root.
 *
 * Front-end only: there is NO backend, NO API client, and NO mock data. The form
 * validates entirely client-side and, on a valid submit, swaps in place for a
 * confirmation message — it must never issue a network request. Accordingly this
 * suite mocks nothing and imports nothing from `@/mocks/`.
 *
 * These tests import the real page component and WILL FAIL until it is
 * implemented (TDD red).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
// Import based on Story Metadata Target File — fails until implemented (TDD red).
import HomePage from '@/app/page';

const REQUIRED_ERROR = 'This field is required';
const EMAIL_FORMAT_ERROR = 'Enter a valid email address';
const CONFIRMATION = "Thanks, we'll be in touch.";

describe('Contact form (site root)', () => {
  // AC-1
  it('shows the heading, the three placeholder-labelled fields, and the submit button', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /get in touch/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'placeholder',
      'Your name',
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'placeholder',
      'you@example.com',
    );
    expect(screen.getByLabelText('Message')).toHaveAttribute(
      'placeholder',
      'How can we help?',
    );

    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeInTheDocument();
  });

  // AC-2
  it('shows a required error under each empty field on submit, keeping the form and typed input', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    // Fill Name only; leave Email and Message empty.
    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    // The two empty fields (Email, Message) each surface the required error.
    const requiredErrors = await screen.findAllByText(REQUIRED_ERROR);
    expect(requiredErrors).toHaveLength(2);

    // The form is still on screen (not swapped for the confirmation)...
    expect(
      screen.getByRole('heading', { name: /get in touch/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(CONFIRMATION)).not.toBeInTheDocument();

    // ...and the previously typed Name input is preserved.
    expect(screen.getByLabelText('Name')).toHaveValue('Ada Lovelace');
  });

  // AC-3
  it('shows the format error for a present-but-invalid email, but the required error takes precedence when empty', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    // All fields filled, but email is present-but-invalid → format error only.
    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Email'), 'abc');
    await user.type(screen.getByLabelText('Message'), 'How can we help?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(EMAIL_FORMAT_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument();

    // Clear the email → now empty. Required takes precedence over format (BR2).
    await user.clear(screen.getByLabelText('Email'));
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(REQUIRED_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(EMAIL_FORMAT_ERROR)).not.toBeInTheDocument();
  });

  // AC-6
  it('programmatically associates each inline error with its field for assistive technology', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    // Wait for validation to render the errors, then assert each field exposes
    // the error via its accessible description (aria-describedby), so it is
    // announced to assistive technology.
    await screen.findAllByText(REQUIRED_ERROR);

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      /this field is required/i,
    );
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      /this field is required/i,
    );
    expect(screen.getByLabelText('Message')).toHaveAccessibleDescription(
      /this field is required/i,
    );
  });
});
