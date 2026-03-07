# plan2026

## 0.4.0

### Minor Changes

- 55166aa: Add export to JSON for plans and tasks. Export buttons appear on the tasks list, plans list, plan edit page, and in the task edit dialog. Exported JSON includes source and schema hints for debugging and for AI/automation to ingest when extending the app.

## 0.3.0

### Minor Changes

- c8e51d9: Plans now support an "On hold" status in addition to draft, started, completed, and abandoned. On-hold plans appear in the main list (they are not archived) and use a violet pill in the UI.
- c8e51d9: Plans page now matches tasks: nav uses #plans/#tasks, list has refresh and "Show completed/abandoned" toggle, and each plan row has Edit and a status dropdown. Plan detail page lists tasks with an edit modal so you can edit tasks without leaving the plan.

## 0.2.1

### Patch Changes

- d85a376: Security hardening: require AUTH_SECRET in production (dev uses random secret), CUID validation for task IDs, rate limiting on task API routes, CSP and security headers, generic error messages for task operations, reduced Prisma logging, and HTML sanitizer no longer allows `<u>`. Docs updated for CSRF and secret rotation.

## 0.2.0

### Minor Changes

- 08e8843: Add Plans: list plans at /plans, create at /plans/new, edit at /plans/[id]. Plans have name, status (draft/started/completed/abandoned), priority 1–7, percent completed, dates, optional goal/notes/color/image URL. Tasks can be linked to a plan; task list shows plan link when set.

## 0.1.5

### Patch Changes

- 838a2ef: Fix Google Calendar reconnects after permissions are revoked by forcing fresh Google consent and showing a reconnect action in Settings.
- 838a2ef: Replace the Settings text tab with a gear icon in the header and move it beside the signed-in email address.
- 838a2ef: TECH-0008 Fix build

## 0.1.4

### Patch Changes

- 6eb08a5: Add a branded Plan 2026 logo to the app header and sign-in screen for a more polished identity.

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
