# plan2026

## 0.1.3

### Patch Changes

- d38a868: Rename the dashboard tab to Tasks with a remaining-count badge, move completed items into a toggle on the main tasks page, switch task creation to a modal, and use `/tasks` as the canonical route.
- 160b036: Google sign-in now reuses previously granted Google scopes when available, preserves an existing Google refresh token when later sign-ins do not return a new one, adds an authenticated settings page where users can disconnect Google Calendar access, keeps tasks linked to a single Google Calendar event instead of creating duplicates on repeated adds, lets users edit or delete task details from the task editor instead of from the main list, and adds color-coded task urgency with highest-priority tasks sorted first plus a manual reload button on the tasks page.

## 0.1.2

### Patch Changes

- 667efa7: Clean up task auth plumbing and editor syncing, use the configured app font consistently, and clarify that PostgreSQL is used for both local and deployed environments.

## 0.1.1

### Patch Changes

- 7201886: Refresh the tasks and login styling with blue and red accents, active navigation states, and updated app metadata.

  Improve the add-task form by renaming the rich text field to Description, making the layout more responsive, moving the Add button below the editor, and removing redundant header and toolbar text.
