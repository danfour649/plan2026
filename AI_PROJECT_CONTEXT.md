# Project Context for AI Assistants

**Document purpose:** Brief, machine-readable summary of the `plan2026` codebase so other AI systems can reason about the app without reading the whole repository.

---

## 1. Project Overview

| Field | Value |
|-------|--------|
| **Name** | `plan2026` |
| **Type** | Next.js 16 App Router web application |
| **Role** | Authenticated task dashboard with Google sign-in, rich task notes, optional due dates, and Google Calendar export |

**Tech stack:**
- **Runtime/UI:** Node.js, Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Prisma ORM with PostgreSQL only
- **Auth:** NextAuth v4 with Google provider and Prisma adapter; database sessions; session includes `user.id`
- **Validation:** Zod in `src/lib/validations/task.ts`
- **Rich text:** Tiptap editor for optional task content
- **Sanitization:** `isomorphic-dompurify` in `src/lib/sanitize.ts`
- **Calendar integration:** Google Calendar API via `googleapis`
- **UX:** Sonner toasts, loading skeletons, and empty states on both task lists

---

## 2. Repository Layout (Relevant Paths)

```text
src/
  middleware.ts                         # Cookie-based guard for /dashboard and /completed
  auth.ts                               # NextAuth config, Google scopes, getServerAuthSession
  app/
    (app)/
      layout.tsx                        # Authenticated shell; nav + SignOutButton
      dashboard/page.tsx                # Remaining tasks list + AddTaskForm
      dashboard/loading.tsx             # Dashboard skeleton
      completed/page.tsx                # Completed tasks list
      completed/loading.tsx             # Completed skeleton
    login/
      page.tsx                          # Login page; disables sign-in when Google creds missing
      GoogleSignInButton.tsx
    api/
      auth/[...nextauth]/route.ts
      tasks/route.ts                    # GET and POST tasks
      tasks/[id]/route.ts               # PATCH completed state; DELETE task
      tasks/[id]/calendar/route.ts      # POST Google Calendar event for a task
    layout.tsx                          # Root layout with Sonner Toaster
    page.tsx                            # Redirects to /dashboard
  components/
    AddTaskForm.tsx                     # Title + dueAt + rich content editor
    AddToCalendarButton.tsx             # Calls calendar route, opens created event link
    SignOutButton.tsx
    TaskActionButton.tsx                # Mark done / restore / delete
    TaskContent.tsx                     # Sanitized rich text renderer
    TaskContentEditor.tsx               # Tiptap-based editor; stores HTML in hidden input
  lib/
    actions/tasks.ts                    # Shared server actions
    prisma.ts                           # Prisma singleton
    sanitize.ts                         # DOMPurify sanitization for task content
    validations/task.ts                 # Zod schemas + length limits
  types/next-auth.d.ts                  # Augments session user with `id`
prisma/
  schema.prisma
  migrations/
README.md
DEPLOY.md
AI_PROJECT_CONTEXT.md
```

**Middleware:** `src/middleware.ts` only checks for the presence of a NextAuth session cookie to reduce redirect flicker. Real auth enforcement still happens in server code with `getServerAuthSession()`.

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
- `completedAt`: nullable `DateTime`; `null` means remaining
- `createdAt`, `updatedAt`

Indexes:

- `Task.userId`
- `Task(userId, completedAt)`

All task queries and mutations are scoped by the authenticated `userId`.

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

### Dashboard (`/dashboard`)

- Shows remaining tasks (`completedAt = null`)
- Displays remaining/completed counts
- Uses `AddTaskForm` to create tasks with:
  - title
  - optional due date/time
  - optional rich content
- Each task row shows:
  - title
  - sanitized rich text content when present
  - created time
  - due time when present
- Actions:
  - `Add to Calendar`
  - `Mark done`
  - `Delete`

### Completed (`/completed`)

- Shows tasks with `completedAt != null`
- Orders by most recently completed
- Renders title plus optional rich content
- Actions:
  - `Add to Calendar`
  - `Restore`
  - `Delete`

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
  "dueAt": "optional date string"
}
```

Validation behavior:

- `title` is required and trimmed
- `title` max length = `500`
- `content` is optional, sanitized, and max length = `20000`
- `dueAt` is optional; invalid values become `undefined`

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

- **Canonical user identity:** use `(await getServerAuthSession())?.user?.id`
- **Prisma runtime:** task APIs explicitly use `runtime = "nodejs"`
- **Database provider:** Prisma datasource is `postgresql`; there is no SQLite path anymore
- **Form/UI mutations:** the dashboard UI primarily uses shared server actions from `src/lib/actions/tasks.ts`
- **API/UI parity:** create, complete, restore, and delete logic exists in both API routes and server actions; keep them behaviorally aligned
- **Sanitization:** any user-provided task HTML must go through `sanitizeTaskContent()`
- **Env vars:** important ones are `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Calendar prerequisites:** Google Calendar API must be enabled and the user must sign in with the calendar scope

---

## 7. File Reference Quick Map

| Concern | Primary file(s) |
|--------|------------------|
| Auth config and Google scopes | `src/auth.ts` |
| Session helper | `getServerAuthSession()` from `@/auth` |
| Middleware redirect optimization | `src/middleware.ts` |
| Prisma access | `src/lib/prisma.ts` |
| Shared task actions | `src/lib/actions/tasks.ts` |
| Task validation | `src/lib/validations/task.ts` |
| Task HTML sanitization | `src/lib/sanitize.ts` |
| Remaining tasks UI | `src/app/(app)/dashboard/page.tsx` |
| Completed tasks UI | `src/app/(app)/completed/page.tsx` |
| Add-task form | `src/components/AddTaskForm.tsx` |
| Rich text editor | `src/components/TaskContentEditor.tsx` |
| Rich text renderer | `src/components/TaskContent.tsx` |
| Per-task actions | `src/components/TaskActionButton.tsx` |
| Calendar button | `src/components/AddToCalendarButton.tsx` |
| Task collection API | `src/app/api/tasks/route.ts` |
| Task detail API | `src/app/api/tasks/[id]/route.ts` |
| Calendar event API | `src/app/api/tasks/[id]/calendar/route.ts` |

---

## 8. Notable Risks / Future Notes

- **NextAuth v4:** still functional, but Auth.js v5 would be the eventual modernization path
- **Calendar token lifecycle:** refresh handling currently updates the access token and expiry, but broader account/token edge cases are still dependent on Google provider behavior
- **HTML storage:** task content is stored as sanitized HTML, so any future editor/schema changes should preserve sanitizer compatibility

End of document.
