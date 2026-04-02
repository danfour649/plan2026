# plan2026

## 0.24.4

### Patch Changes

- 0b3c269: TECH-0080 misc small features

## 0.24.3

### Patch Changes

- 24aa027: TECH-0080 Copy button to task list and other stuff

## 0.24.2

### Patch Changes

- 340243e: TECH-0070 more fixes

## 0.24.1

### Patch Changes

- c1714e5: TECH-0069 Fix text in dark mode, other fixes

## 0.24.0

### Minor Changes

- 281a2b9: Switch to pnpm, upgrade to Prisma ORM 7 with `prisma.config.ts` and the PostgreSQL driver adapter, and upgrade Zod to 4.

### Patch Changes

- 281a2b9: TECH-0068 Upgrade to pnpm, zod4, prisma7

## 0.23.6

### Patch Changes

- 3073885: TECH-6005 cleanup, optimize misc

## 0.23.5

### Patch Changes

- 5e0ff6a: Use a smaller app logo on mobile (narrow viewports); desktop size unchanged.

## 0.23.4

### Patch Changes

- 11dd4b6: Fix Cancel on edit plan in mobile: use Link so navigation works when not dirty; when dirty, prevent default and show discard confirm. Place Cancel at bottom left of the form and Save at bottom right; ensure 44px touch target for Cancel.

## 0.23.3

### Patch Changes

- 14a1fb2: Disable save and delete buttons while the form action is in progress to prevent duplicate tasks or records when there is a delay (e.g. on mobile). Uses useFormStatus for in-form buttons and onSubmit/onStateChange for the edit-task external Save button.

## 0.23.2

### Patch Changes

- 742f203: Show trash icon for delete buttons on mobile: task delete, plan delete (already present), supply item delete. Desktop still shows text label.

## 0.23.1

### Patch Changes

- ad1a529: Enforce 4.2 MB maximum file size for task attachments. Client shows a translated message when file exceeds limit; API rejects oversized uploads.

## 0.23.0

### Minor Changes

- d9989f6: New Actions page at `/actions` showing urgent and upcoming tasks (urgency 6+ or due within three days). Logo now links to Actions instead of Plans. Overdue tasks show an alarm icon; list supports edit, mark done, and add to calendar.

### Patch Changes

- c1bce7a: Reduce navbar icon size and highlight area on mobile; pull nav icons closer to the logo and to each other. Desktop unchanged.

## 0.22.1

### Patch Changes

- c886944: TECH-0060 Fix edit button on supplies list

## 0.22.0

### Minor Changes

- 7cd7aef: TECH-0058: bundle analysis, lazy-load editor, remove unused deps and dead code. Add `npm run analyze` (Next.js bundle analyzer), lazy-load TaskContentEditor in TaskForm, remove unused devDependencies and unused `formatPlanStatus`; update roadmap docs.

## 0.21.2

### Patch Changes

- 071ad08: Apply dark mode to all popout edit and add forms (task add/edit, supply edit, share plan, delete plan, discard confirm modals) so dialogs and form fields respect the app theme.

## 0.21.1

### Patch Changes

- 37db87f: TECH-6003 branch report

## 0.21.0

### Minor Changes

- 3df0359: Plans list and plan form: show plan color as a small flag icon (rectangular flag on pole) instead of circles. Add black, pink, and silver as flag color options. All new strings translated (en, fr, pidgin).

## 0.20.6

### Patch Changes

- 36ce6dc: Plan form: label the 1–7 scale "Urgency" (matching tasks) in all locales. Urgency bubbles already use short labels on mobile for one-line layout.

## 0.20.5

### Patch Changes

- 3d66f43: Add top padding above the logo in the app header on mobile (e.g. Pixel 8) so the navbar has visible margin.

## 0.20.4

### Patch Changes

- 56b7e03: Move save task button to the bottom of the edit task form in the dialog (below attachments, export, mark done, and delete).

## 0.20.3

### Patch Changes

- 8337bec: Remove "Remove this task permanently." text from edit-task delete section; delete button is sufficient.

## 0.20.2

### Patch Changes

- 36c1c9e: Fix toast when marking a task as done inside a plan: show "Marked done" / "Task completed" instead of "Task restored".

## 0.20.1

### Patch Changes

- 85b6d11: Task form: use dark black text for task name and description fields. When adding a new task with a name but no description, default the description to the entered name (server-side).

## 0.20.0

### Minor Changes

- cb1776c: Add dark mode: theme setting (Light / Dark / System) in Settings, persisted via cookie. App shell, settings, and login use dark-aware styles so users can spare their eyes in low light.

## 0.19.0

### Minor Changes

- 836b4de: Add public share links for plans. Plan owners can generate a shareable link from the plan detail page; anyone with the link can view the plan and its tasks in read-only form and, when allowed, mark tasks done or restore them. Only explicitly shared plans are exposed; invalid or expired links show a single generic message.

## 0.18.0

### Minor Changes

- c554c3a: Add Facebook login as an authentication option.

### Patch Changes

- 1239db5: Mobile and nav UI improvements: logo top margin on mobile; larger nav icons and currency icon for supplies; illuminated lightbulb; help/about/settings/sign-out icons and label in hamburger menu; larger, bolder nav badges with tighter spacing; mobile nav bubbles overlap slightly to remove gaps; supplies icon nudged left on mobile. Input contrast: text and placeholders use darker colors (text-zinc-900, placeholder:text-zinc-500) across PlanForm, PlanSupplyList, SupplyItemForm, SharePlanButton, TaskContentEditor, NewPlanSection.

## 0.17.0

### Minor Changes

- d53eef1: Add optional Facebook login: when `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` are set, the login page shows "Continue with Facebook" and NextAuth uses the Facebook provider. Documented in README (Facebook app setup, redirect URI).

## 0.16.0

### Minor Changes

- 1e7ae05: Add per-plan Supplies (tab on plan detail) with add/edit/delete supply items including quantity, status, optional price/link/description, plus a central Supplies page that aggregates items by plan with per-plan totals and inline editing.

## 0.15.0

### Minor Changes

- 77717b5: Add prebuilt plan templates on new plan page: "Start from" dropdown with Empty, Project launch, and Trip planning. Selecting a template pre-fills plan name, goal, and default task titles. Template names and task titles translated (en, fr, pidgin).

## 0.14.0

### Minor Changes

- 7410c56: Improve login screen: add value-proposition headline ("Plans and tasks, shared"), three benefit bullets (plans and tasks in one place, share with others, works in your language), and responsive layout. All copy in i18n (en, fr, pidgin).

## 0.13.0

### Minor Changes

- bc8373d: Add Help and About pages: in-app /help (how to use tasks and plans, recent updates, link to changelog) and /about (app version from package.json, contributors). Nav includes Help and About links; all copy translated (en, fr, pidgin).

## 0.12.0

### Minor Changes

- d85ce04: TECH-1001 Data handling optimizations: cache revalidation on task delete, shared format/task service layer, plan create/update transactions and createMany, task API parity (planId/urgency, GET includes), pagination for tasks/plans/plan-detail tasks, Prisma dev logging, blob cleanup on attachment/task delete, GET /api/plans.

## 0.11.1

### Patch Changes

- f838046: Added "Print checklist" on plan detail: links to a print view that shows plan name, printed date, and unfinished tasks (sorted by priority then due date). Print view has a Print button and @media print hides chrome so only the checklist is printed.

## 0.11.0

### Minor Changes

- b4e133a: Discard-changes confirmation for new and edit plan forms (custom dialog when leaving with unsaved data).

### Patch Changes

- c78de33: Plan "color" is now shown as "Flag" in the UI: form label is "Flag (optional)" with emoji per option; plans list shows a flag emoji next to the plan name when set.

## 0.10.5

### Patch Changes

- 9dce14b: On mobile, task rows now show shorter dates (e.g. "Mar 8") and plan names truncate; status button (Mark done / Restore) is explicitly ordered first before Edit on both plan detail and tasks page.

## 0.10.4

### Patch Changes

- 84ee00c: Plans list now shows task completion as a segment bar (green for completed, grey for incomplete), with "X of Y" text and an accessible aria-label.

## 0.10.3

### Patch Changes

- a9ed5a9: On the plan detail page, the tasks section header (with "Add task") is now sticky on mobile so it stays in view when scrolling the task list.

## 0.10.2

### Patch Changes

- fa22ef5: New task form: due date is blank by default instead of tomorrow 9am.

## 0.10.1

### Patch Changes

- 6938d02: Pidgin: rename "Waka" to "Work" for tasks label to avoid offensive term.

## 0.10.0

### Minor Changes

- 33c6aa2: Plan form: urgency and percent complete moved to top; percent complete is a slider. Plans list shows progress bar graphic for percent complete.

## 0.9.3

### Patch Changes

- 44d08b3: Plan edit page and form are more mobile friendly: reduced padding on small screens, full-width inputs, stacked layout for add-task row, and resizable textareas.

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
