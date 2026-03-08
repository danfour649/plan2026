# plan2026

## 0.9.2

### Patch Changes

- db9ff4f: Logo no longer shows off-center due to transparent padding: image is clipped with object-cover and header margin compensation removed.

## 0.9.1

### Patch Changes

- 21b3502: Plans page task list now shows incomplete tasks first and completed tasks at the bottom, so tasks are displayed more prominently and completed items no longer appear above active work.

## 0.9.0

### Minor Changes

- 7706085: After creating an invite link, a new "Email invite" button appears beside the copy button. It opens the user's mail client with a pre-filled subject (e.g. "You're invited to plan: [plan name]") and body containing plan details and the invite link, encouraging the recipient to open the plan. All copy is translated (en, fr, pidgin).

## 0.8.3

### Patch Changes

- 92e1918: Image placement for plan image URL: plan images (when added as URL) are now centered and no longer cropped; the bottom of the picture is no longer cut off. Plan form preview and plan list use object-contain with centered alignment inside a flex container.

## 0.8.2

### Patch Changes

- 896326d: Mobile task date and plan display: deadline, added/completed date, and associated plan are shown one per line on mobile with simplified short dates (e.g. "Mar 8, 2026"); status (Mark done / Restore) button is to the left of the Edit button on both the tasks list and the plan detail page. TaskActionButton now supports an optional planId for plan page revalidation.

## 0.8.1

### Patch Changes

- 5530655: Mobile add/edit task form: when opening the edit task dialog from the task list or from inside a plan, the dialog is now scrolled into view so users do not have to scroll up to see the form (fixes tasks further down the list being off-screen).

## 0.8.0

### Minor Changes

- 1f1e8cd: Add task dialogue from plans page: plan detail page now shows an "Add task" button that opens the full add-task dialog with the current plan pre-selected, so users can add tasks directly to the plan without adding then saving separately. Plan detail revalidates when a task is added to that plan.

## 0.7.3

### Patch Changes

- baf8207: Document bulk task → PR pipeline in AGENTS.md: when tasks are provided in JSON form, create one PR per task with incrementing tech IDs, implement or document future work, add detailed changesets, and optionally skip local build/typecheck for speed.

## 0.7.2

### Patch Changes

- db3a520: Fix task edit dialog and other modals so they appear at the top of the viewport and are scrollable, avoiding the need to scroll the page to see the form when there are many tasks.

## 0.7.1

### Patch Changes

- a927b7f: Ensure French and Nigerian Pidgin translations are shown for all app text. Added TranslationsProvider and useTranslations for client components; expanded i18n with all user-facing strings and wired every page and component to use them.

## 0.7.0

### Minor Changes

- 5665892: Add invite-by-link for plans: plan owner can create a secure invite link from the plan detail page. Anyone with the link can open it, sign in (or sign up), and be added to the plan as a viewer. Includes plan sharing by email and read-only view for shared users. Login page respects callbackUrl so invite flow redirects back after sign-in.

## 0.6.0

### Minor Changes

- 0f256aa: Share plans with another user by email. Plan owner can use "Share" on the plan detail page; the other user (must have signed in to Plan 2026 with that email) sees the plan in their list as "Shared with me" and can view it read-only.

## 0.5.0

### Minor Changes

- 2367578: Add file upload for tasks: attach files to a task from the edit dialog. Files are stored in Vercel Blob (or compatible). Requires `BLOB_READ_WRITE_TOKEN` when deployed. Task attachments are listed in the edit dialog with links and remove action.
- a73b10e: Add language preference: users can choose English, French (Français), or Nigerian Pidgin in Settings. Nav and settings labels use the selected language. Preference is stored in a cookie.

### Patch Changes

- 99b43fc: Fix add-task dialog on mobile: keep form visible on load by aligning dialog to top and making content scrollable instead of centered off-screen.
- 60020c4: Improve mobile layout for task and plan lists: stack list rows on small screens so content and actions wrap correctly, add break-words for metadata lines, and fix plan name truncation.
- 6bddc10: Plans page: show incomplete tasks first, completed tasks at the bottom of the task list.
- 03b20eb: Add SEO improvements: richer metadata (Open Graph, Twitter card, description), sitemap.xml, and robots.txt. Public pages remain indexable; app routes are disallowed for crawlers.

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
