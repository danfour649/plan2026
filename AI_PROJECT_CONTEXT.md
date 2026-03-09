# Project Context for AI Assistants

**Document purpose:** Brief, machine-readable summary of the `plan2026` codebase so other AI systems can reason about the app without reading the whole repository.

---

## 1. Project Overview

| Field | Value |
|-------|--------|
| **Name** | `plan2026` |
| **Type** | Next.js 16 App Router web application |
| **Role** | Authenticated task and plan planner with Google sign-in, rich task notes, urgency levels, optional due dates, plans (with tasks), and Google Calendar export |

**Tech stack:**
- **Runtime/UI:** Node.js, Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Prisma ORM with PostgreSQL only
- **Auth:** NextAuth v4 with Google provider and Prisma adapter; database sessions; session includes `user.id`
- **Validation:** Zod in `src/lib/validations/task.ts` and `src/lib/validations/plan.ts`
- **Rich text:** Tiptap editor for optional task content
- **Sanitization:** `sanitize-html` in `src/lib/sanitize.ts`
- **Calendar integration:** Google Calendar API via `googleapis`
- **UX:** Sonner toasts, loading skeletons, modal task create/edit flows, full-page plan create/edit at `/plans/new` and `/plans/[id]`, and an optional completed-task toggle on the main tasks page

---

## 2. Repository Layout (Relevant Paths)

```text
src/
  proxy.ts                              # Cookie-based guard for /tasks, /settings, and /plans
  auth.ts                               # NextAuth config, Google scopes, auth helpers
  app/
    (app)/
      layout.tsx                        # Authenticated shell; tasks nav, plans nav, settings gear, email, SignOutButton
      tasks/page.tsx                    # Unified tasks page for remaining and optional completed items; shows plan link when task has planId
      tasks/loading.tsx                 # Tasks page skeleton
      plans/page.tsx                    # Plans list (ordered by priority); refresh, show completed/abandoned toggle; per-row Edit and status dropdown; links to /plans/new and /plans/[id]
      plans/new/page.tsx                # Full-page create plan form; optional "Start from template" (see src/data/planTemplates.ts)
      plans/[id]/page.tsx               # Full-page plan detail and edit form; delete plan; tasks-in-plan list with edit-task modal
      settings/page.tsx                 # Calendar connection settings
    login/
      page.tsx                          # Login page; redirects signed-in users to /tasks
      GoogleSignInButton.tsx
    api/
      auth/[...nextauth]/route.ts
      tasks/route.ts                    # GET and POST tasks
      tasks/[id]/route.ts               # PATCH completed state; DELETE task
      tasks/[id]/calendar/route.ts      # POST Google Calendar event for a task
      tasks/[id]/attachments/route.ts   # POST upload file for task (Vercel Blob)
      tasks/[id]/attachments/[attachmentId]/route.ts  # DELETE attachment
    layout.tsx                          # Root layout with Sonner Toaster
    page.tsx                            # Redirects to /tasks
  components/
    AddTaskDialog.tsx                   # Modal wrapper for task creation
    EditTaskDialog.tsx                  # Modal wrapper for task editing/deletion
    TaskForm.tsx                        # Shared form used by create/edit dialogs
    AddToCalendarButton.tsx             # Calls calendar route, opens created event link
    DisconnectGoogleCalendarButton.tsx  # Revokes stored calendar access
    RefreshTasksButton.tsx              # Manual refresh for /tasks
    RefreshPlansButton.tsx              # Manual refresh for /plans
    ShowArchivedPlansToggle.tsx        # Toggle show completed/abandoned plans on /plans
    ExportTasksButton.tsx               # Export tasks list to JSON (tasks page)
    ExportPlansButton.tsx               # Export plans list to JSON (plans page)
    ExportPlanButton.tsx                # Export single plan to JSON (plan detail page)
    ExportTaskButton.tsx                # Export single task to JSON (edit task dialog)
    SignOutButton.tsx
    TaskActionButton.tsx                # Mark done / restore actions
    TaskContent.tsx                     # Sanitized rich text renderer
    TaskContentEditor.tsx               # Tiptap-based editor; stores HTML in hidden input
  lib/
    actions/tasks.ts                    # Shared task server actions
    actions/settings.ts                 # Google Calendar disconnect action
    export.ts                           # JSON export types and helpers for plans/tasks (debugging, AI ingestion)
    prisma.ts                           # Prisma singleton
    rate-limit.ts                       # In-memory rate limiter for task API routes
    sanitize.ts                         # sanitize-html rules for task content
    validations/task.ts                 # Zod schemas + length limits + CUID taskId + urgency bounds
    validations/plan.ts                 # Zod schemas for plan (name, dates, status, priority, percentCompleted, taskIds, newTaskTitles, etc.)
  types/next-auth.d.ts                  # Augments session user with `id`
prisma/
  schema.prisma
  migrations/
README.md
DEPLOY.md
AI_PROJECT_CONTEXT.md
```

**Route protection:** `src/proxy.ts` checks only for the presence of a NextAuth session cookie to reduce redirect flicker on `/tasks`, `/settings`, and `/plans`. Full session validation (including rejection of invalid or expired cookies) happens in the app layout via `getServerAuthSession()`; all API and server actions use `getCurrentUserId()` or equivalent.

**CSRF:** Forms and API endpoints expect same-origin requests. NextAuth session cookies use SameSite (Lax by default). CSRF protection relies on this same-origin + SameSite behavior; state-changing requests should come from the app origin. If you add endpoints callable from other origins, protect them (e.g. custom header or token).

---

## 3. Data Model (Prisma)

### Auth tables

- **User:** standard app user record; related to `Account`, `Session`, and `Task`
- **Account / Session / VerificationToken:** standard NextAuth schema

### Task

`Task` has these fields:

- `id`: `String` cuid primary key
- `userId`: owner
- `title`: required string
- `content`: optional sanitized rich text HTML
- `dueAt`: optional `DateTime`
- `urgency`: integer from `1` to `7`, default `4`
- `googleCalendarEventId`: optional linked event id
- `googleCalendarEventUrl`: optional linked event URL
- `completedAt`: nullable `DateTime`; `null` means remaining
- `createdAt`, `updatedAt`

Indexes:

- `Task.userId`
- `Task(userId, completedAt)`

All task queries and mutations are scoped by the authenticated `userId`.

### TaskAttachment

- `id`, `taskId`, `userId`, `url` (blob URL), `filename`, `size`, `contentType`, `createdAt`
- Files are uploaded via POST to `/api/tasks/[id]/attachments` and stored in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.

---

## 4. Implemented Behavior

### Authentication

- Google OAuth only
- Sign-in button is disabled if `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing
- Session strategy is `database`
- Session callback injects `user.id` onto `session.user`
- Requested Google scopes include Calendar event creation:
  - `openid`
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/calendar.events`

### Tasks (`/tasks`)

- This is the canonical authenticated app route
- The root route `/` redirects here
- Always shows remaining tasks (`completedAt = null`)
- Optionally shows completed tasks when `showCompleted=1` is present in search params
- Uses one page instead of separate `/dashboard` and `/completed` routes
- Remaining tasks are ordered by `urgency desc`, then `createdAt desc`
- Completed tasks are ordered by `urgency desc`, then `completedAt desc`
- Displays a header toggle for hiding or showing completed tasks
- Uses `AddTaskDialog` for creation and `EditTaskDialog` for editing/deletion
- Each task row can show:
  - title
  - urgency pill
  - sanitized rich text content when present
  - created time or completed time
  - due time when present
  - “Plan: &lt;name&gt;” link when the task has a `planId`
- Actions:
  - `Add to Calendar`
  - `Mark done` or `Restore`
  - `Edit`
  - `Delete`

### Settings (`/settings`)

- Shows whether Google Calendar access is currently connected
- Lets the user disconnect Calendar access
- Shows a reconnect action when Calendar access has been disconnected
- On disconnect, the app revokes the Google token when possible and clears stored account tokens

### Rich text content

- Edited with Tiptap in `TaskContentEditor`
- Stored as HTML in a hidden form input
- Sanitized both before persistence and before rendering
- Allowed tags are limited to a safe subset such as paragraphs, emphasis, lists, and links

### Google Calendar

- `POST /api/tasks/:id/calendar` creates an event in the signed-in user's primary Google Calendar
- If `task.dueAt` exists, the event uses that timestamp as the start and one hour later as the end
- If `task.dueAt` is absent, the route creates an all-day event for the current date
- Task rich text is converted to plain text for the calendar event description
- If the stored Google account token is expired, the route attempts a refresh and persists the new access token
- If the stored Google account scope is missing `calendar.events`, the route returns a reconnect-required error instead of forwarding Google's raw insufficient-scope response
- The task can store the linked Google event id and URL for UI state

---

## 5. API Surface

### `GET /api/tasks`

- Returns all tasks for the current user
- Ordered by `completedAt desc`, then `createdAt desc`
- Response shape: `{ tasks }`

### `POST /api/tasks`

Expected body:

```json
{
  "title": "string",
  "content": "<p>optional html</p>",
  "dueAt": "optional date string",
  "urgency": 4
}
```

Validation behavior:

- `title` is required, trimmed, and max length = `500`
- `content` is optional, sanitized, and max length = `20000`
- `dueAt` is optional; invalid values become `undefined`
- `urgency` is optional in forms, coerced to a number, and must be between `1` and `7`

### `PATCH /api/tasks/:id`

Expected body:

```json
{
  "completed": true
}
```

- `true` sets `completedAt` to `new Date()`
- `false` restores the task by setting `completedAt` to `null`

### `DELETE /api/tasks/:id`

- Deletes the task if owned by the current user

### `POST /api/tasks/:id/calendar`

- Creates a Google Calendar event for the task
- Returns `{ ok: true, eventId, htmlLink }` on success

Error conventions across task APIs:

- `401` for unauthenticated access
- `404` when the task is not found or not owned by the current user
- `400` for invalid request bodies
- `403` for missing linked Google account token needed for calendar access
- `502` for upstream Google Calendar failures
- `503` when calendar env vars are missing

---

## 6. Conventions and Constraints

- **Canonical user identity:** prefer `getCurrentUserId()` for task/settings server actions and pages; `getServerAuthSession()` is still used in the authenticated app layout
- **Protected app routes:** `/tasks`, `/settings`, `/plans`
- **Canonical task UI route:** `/tasks`; **Plans UI routes:** `/plans`, `/plans/new`, `/plans/[id]`
- **Prisma runtime:** task APIs explicitly use `runtime = "nodejs"`
- **Database provider:** Prisma datasource is `postgresql`; there is no SQLite path anymore
- **Form/UI mutations:** the tasks UI primarily uses shared server actions from `src/lib/actions/tasks.ts`
- **API/UI parity:** create, update, complete, restore, and delete logic exists across UI actions and API routes; keep them behaviorally aligned
- **Sanitization:** any user-provided task HTML must go through `sanitizeTaskContent()`
- **Env vars:** important ones are `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Calendar prerequisites:** Google Calendar API must be enabled and the user must sign in with the calendar scope

---

## 7. File Reference Quick Map

| Concern | Primary file(s) |
|--------|------------------|
| Auth config and Google scopes | `src/auth.ts` |
| Authenticated app shell | `src/app/(app)/layout.tsx` |
| Cookie-based route guard | `src/proxy.ts` |
| Prisma access | `src/lib/prisma.ts` |
| Shared task actions | `src/lib/actions/tasks.ts` |
| Settings action | `src/lib/actions/settings.ts` |
| Task validation | `src/lib/validations/task.ts` |
| Task HTML sanitization | `src/lib/sanitize.ts` |
| Unified tasks UI | `src/app/(app)/tasks/page.tsx` |
| Plans list UI | `src/app/(app)/plans/page.tsx` |
| Plan create UI | `src/app/(app)/plans/new/page.tsx` (templates: `src/data/planTemplates.ts`) |
| Plan detail/edit UI | `src/app/(app)/plans/[id]/page.tsx` |
| Settings UI | `src/app/(app)/settings/page.tsx` |
| Plan form (full-page) | `src/components/PlanForm.tsx` |
| Plan actions | `src/lib/actions/plans.ts` |
| Plan validation | `src/lib/validations/plan.ts` |
| Add-task dialog | `src/components/AddTaskDialog.tsx` |
| Edit-task dialog | `src/components/EditTaskDialog.tsx` |
| Shared task form | `src/components/TaskForm.tsx` |
| Rich text editor | `src/components/TaskContentEditor.tsx` |
| Rich text renderer | `src/components/TaskContent.tsx` |
| Per-task actions | `src/components/TaskActionButton.tsx` |
| Calendar button | `src/components/AddToCalendarButton.tsx` |
| Calendar disconnect button | `src/components/DisconnectGoogleCalendarButton.tsx` |
| Task collection API | `src/app/api/tasks/route.ts` |
| Task detail API | `src/app/api/tasks/[id]/route.ts` |
| Calendar event API | `src/app/api/tasks/[id]/calendar/route.ts` |
| Task attachments upload | `src/app/api/tasks/[id]/attachments/route.ts` (POST) |
| Task attachment delete | `src/app/api/tasks/[id]/attachments/[attachmentId]/route.ts` (DELETE) |

---

## 8. Scripts and quality gates

- **`npm run lint`** – ESLint (catches rules such as `react-hooks/set-state-in-effect`).
- **`npm run build`** – Prisma generate + Next.js production build (catches TypeScript and build errors).
- **`npm run prepush`** – lint + typecheck + next build (no `prisma generate`); run manually or via the **pre-push** Git hook. Skipping Prisma generate avoids engine lock on Windows when the dev server is running. Full **`npm run build`** (with Prisma generate) runs in CI.

---

## 9. Notable Risks / Future Notes

- **NextAuth v4:** still functional, but Auth.js v5 would be the eventual modernization path
- **Calendar token lifecycle:** refresh handling currently updates the access token and expiry, but broader account/token edge cases are still dependent on Google provider behavior
- **HTML storage:** task content is stored as sanitized HTML, so any future editor/schema changes should preserve sanitizer compatibility
- **Task API ordering vs UI ordering:** the API currently returns tasks by completion/creation timestamps, while the page UI groups and sorts remaining/completed items differently for display
- **Deferred work (documented for later):** Implementation notes for custom domain (TECH-0026) and mobile app (TECH-0029) are in `docs/TECH-0026-permanent-website.md` and `docs/TECH-0029-mobile-app.md`; these are not implemented yet.

End of document.
