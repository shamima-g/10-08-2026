# Journal — Sign in epic

## Story 1 — Sign-in screen
- Built the sign-in screen from scratch: the design has no sign-in screen (a documented gap), so I made a clean, minimal email + password card using the project's brand colours, matching the rest of the app's look.
- Applied the project's brand palette (blue primary, light background, 8px corners) to the app's central colour settings. Previously the starter used a plain black-and-grey theme; now every screen we build will inherit the TaskBoard colours automatically.
- Note: the digest specifies Inter, but the layout still falls back to the system font (the starter's `--font-sans` points at an undefined Geist variable). Logged as cross-epic debt in architecture.md — to be wired when the main Board/Settings screens are built in the task-board epic.
