# Journal — Epic Notes

## Story 1 — Sign in, home shell, and Notes page

- Built the shared sign-in stub, session state, and home shell as reusable pieces the Tasks epic will plug into as-is, exactly as the brief asked — the Notes page and Tasks page both sit behind the same sign-in gate and the same home screen.
- The "Note added" confirmation clears any earlier confirmation before showing the new one, so adding several notes in a row shows a single up-to-date message rather than a stack of duplicates.
