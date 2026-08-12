'use client';

/**
 * NotesView — the Notes feature UI (Notes epic R3–R6, BR1–BR2).
 *
 * A single note field + Add button, a newest-first list, a running "N notes" count, and a
 * "No notes yet" empty state. All state is in-memory (PI-01 / PI-02) — notes reset on a
 * fresh session. Empty/whitespace-only input is blocked with an inline, accessible message
 * (role="alert"); a successful add clears the field and shows the shared "Note added" toast.
 */

import { useState, type FormEvent } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { noteTextSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

export function NotesView() {
  const { showToast, clearAllToasts } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const count = notes.length;

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = noteTextSchema.safeParse(text);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? 'Please enter a note before adding.',
      );
      return;
    }

    const newNote: Note = {
      id: crypto.randomUUID(),
      text: parsed.data,
      createdAt: Date.now(),
    };

    // Newest-first (BR1): prepend so the most recent note sits at the top.
    setNotes((prev) => [newNote, ...prev]);
    setText('');
    setError(null);
    // Replace any prior confirmation so a single, current "Note added" toast shows.
    clearAllToasts();
    showToast({ variant: 'success', title: 'Note added' });
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <p className="text-muted-foreground" aria-live="polite">
          {count} {count === 1 ? 'note' : 'notes'}
        </p>
      </header>

      <form onSubmit={handleAdd} noValidate className="flex flex-col gap-2">
        <Label htmlFor="note-input">Note</Label>
        <div className="flex gap-2">
          <Input
            id="note-input"
            name="note"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Write a note…"
          />
          <Button type="submit">Add</Button>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </form>

      {count === 0 ? (
        <p className="text-muted-foreground">No notes yet</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-border p-3 text-sm"
            >
              {note.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
