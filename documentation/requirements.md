# Requirements: Personal Notes & Tasks (minimal 2-epic prototype)

A tiny personal productivity app for **one signed-in user**, built as **two
INDEPENDENT features** so the plan decomposes into **two small epics** (one each). It
exists to be the cheapest realistic benchmark for the `/plan` experiment: small enough
to run many times, but with a signed-in user and two separable epics so `/plan` has a
real "next epic" to plan while another builds.

Front-end only — **no real backend, no API calls**, all data kept in memory for the
session.

## Application context

- **Name:** Personal Notes & Tasks
- **Purpose:** Let a single signed-in user jot quick **notes** and track simple
  **tasks**, each on its own page, reached from a home screen after sign-in.
- **Users:** exactly one role — the signed-in **User**. No sharing, no other people's
  data, no back-office roles.

## Sign-in (stub)

A simple **stubbed** sign-in with **one seeded user**: email `user@example.com`,
password `Test123`, display name **Sam**. No real auth and no backend — the session is
simulated client-side. After sign-in the user lands on a **home screen** linking to the
two features below.

## Feature 1 — Notes *(one small epic, one story)*

A page at `/notes` where the signed-in user types a note in a single text field and
clicks **Add**:

- A non-empty note is added to a list shown **newest-first**, with a **count** of notes.
- On add, the field **clears** and a **"Note added"** confirmation shows.
- Adding an **empty** note is prevented (Add is blocked / inline message).
- When there are no notes, the page shows an empty state: **"No notes yet"**.

## Feature 2 — Tasks *(one small epic, one story)*

A page at `/tasks` where the signed-in user adds a task (a short title) and clicks
**Add**:

- Each task appears in a list with a **checkbox** to mark it **done**; done tasks show
  **struck-through**.
- The page shows how many tasks are still **outstanding** (not done).
- Adding an **empty** title is prevented.
- When there are no tasks, the page shows an empty state: **"No tasks yet"**.

## Scope

- No roles beyond the single signed-in user; no sharing; no permission gating.
- Keep **each feature to one small epic with a single story** — Notes and Tasks are
  independent and must not be merged into one epic.

## Prototype invariants

- **PI-01 — Simulated server.** Sign-in and all data are simulated **client-side**
  (in-memory fixtures). No real backend, database, email, or network calls.
- **PI-02 — In-memory data.** Data persists within a session but need not survive a
  reload.
- **PI-03 — Visual validation.** Field validation and confirmations are rendered as
  specified; there is no server-side enforcement.
