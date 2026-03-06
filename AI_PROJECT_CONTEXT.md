# Project Context for AI Assistants

**Document purpose:** Brief, machine-readable summary of the plan2026 codebase so other AI systems can reason about structure, behavior, and conventions without reading the full repo.

---

## 1. Project Overview

| Field | Value |
|-------|--------|
| **Name** | plan2026 |
| **Type** | Next.js (App Router) web application |
| **Role** | Task dashboard: authenticated users manage tasks (remaining vs completed), with Google sign-in and optional cloud deployment. |

**Tech stack:**
- **Runtime:** Node.js; Next.js 16 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4.
- **Database:** Prisma ORM; local default is SQLite (`file:./dev.db`); production target is PostgreSQL (e.g. Neon/Supabase) on Vercel.
- **Auth:** NextAuth v4 with Google provider; database sessions via `@next-auth/prisma-adapter`; session includes `user.id` (see `src/types/next-auth.d.ts`).
- **Validation:** Zod in `src/lib/validations/task.ts` for task title and taskId; used in server actions and API.
- **UX:** Sonner toasts for add/complete/restore/delete; `loading.tsx` skeletons for `/dashboard` and `/completed`; empty states with “All clear!” / “No completed tasks yet” messaging.

---

## 2. Repository Layout (Relevant Paths)

```
src/
  middleware.ts               # Protects /dashboard, /completed: redirect if no session cookie (reduces flicker)
  app/
    (app)/
      layout.tsx              # Redirects to /login if no session; nav + SignOutButton
      dashboard/page.tsx      # Remaining tasks; shared actions + AddTaskForm, TaskActionButton
      dashboard/loading.tsx   # Skeleton while dashboard loads
      completed/page.tsx      # Completed tasks; shared actions + TaskActionButton
      completed/loading.tsx   # Skeleton while completed loads
    login/
      page.tsx                # Sign-in; redirects to /dashboard if already signed in
      GoogleSignInButton.tsx
    api/
      auth/[...nextauth]/route.ts
      tasks/route.ts          # GET, POST (Zod-validated); runtime = "nodejs"
      tasks/[id]/route.ts
    layout.tsx                # Root layout (fonts, globals, Toaster from sonner)
    page.tsx                  # Redirects to /dashboard
  auth.ts
  lib/
    prisma.ts
    validations/task.ts       # Zod: addTaskSchema, taskIdSchema; TASK_TITLE_MAX_LENGTH
    actions/tasks.ts         # Shared server actions; return ActionResult
  components/
    SignOutButton.tsx
    AddTaskForm.tsx           # useActionState + toast for addTask
    TaskActionButton.tsx      # useActionState + toast for complete/restore/delete
  types/next-auth.d.ts
prisma/
  schema.prisma, migrations/
.env
```

**Middleware:** `src/middleware.ts` checks for NextAuth session cookie on `/dashboard` and `/completed`; if missing, redirects to `/login` before the layout runs. Full session validation remains in `(app)/layout.tsx` via `getServerAuthSession()`.

---

## 3. Data Model (Prisma)

- **User:** id (cuid), name, email, emailVerified, image; relations: accounts, sessions, tasks.
- **Account / Session / VerificationToken:** Standard NextAuth schema (provider account linking, session token, expiry).
- **Task:** id (cuid), userId, title, completedAt (nullable), createdAt, updatedAt. `completedAt` set when “done”; null = remaining. All task mutations are scoped by `userId` from the current session.

Indexes: `Task.userId`, `Task(userId, completedAt)`; foreign keys with `onDelete: Cascade` where appropriate.

---

## 4. Implemented Behavior

- **Authentication:** Google OAuth only. Login page shows “Continue with Google”; if `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are missing, button is disabled and a short message is shown. Session strategy is `database`; `getServerAuthSession()` is used in server components and API routes to obtain the current user and enforce redirects or 401s.
- **Dashboard (`/dashboard`):** Displays remaining tasks (completedAt = null), counts (remaining and completed), “Add task” via `AddTaskForm` (shared action + toast), and per-task “Mark done” / “Delete” via `TaskActionButton` (shared actions + toasts). Empty state: “All clear!” with short message. Loading: skeleton via `loading.tsx`.
- **Completed (`/completed`):** Lists tasks with non-null completedAt; per-task “Restore” and “Delete” via `TaskActionButton`. Empty state: “No completed tasks yet” with short message. Loading: skeleton via `loading.tsx`.
- **API:** `GET /api/tasks` returns all tasks for the user; `POST /api/tasks` expects `{ "title": string }` (Zod-validated, max length from `TASK_TITLE_MAX_LENGTH`); `PATCH /api/tasks/:id` expects `{ "completed": boolean }`; `DELETE /api/tasks/:id` deletes if owned by user. All return JSON; 401 when unauthenticated, 404 when resource not found or not owned.

---

## 5. Conventions and Constraints

- **Session identity:** Use `(await getServerAuthSession())?.user?.id` as the canonical user id in server code; type is extended so `session.user.id` exists.
- **Env:** Next.js loads `.env`; Prisma (CLI) uses `DATABASE_URL` from env for migrations and generate. For production (e.g. Vercel), set `DATABASE_URL` (Postgres), `AUTH_SECRET`, `NEXTAUTH_URL`, and Google OAuth vars.
- **Database:** Current schema uses `provider = "sqlite"`. For production Postgres, switch provider to `postgresql` and run migrations against the Postgres URL; see README for deployment steps.
- **Build:** `npm run build` and `npm run lint` are passing. Prisma client is generated with `prisma generate` (also via postinstall). No Edge usage for Prisma (all Prisma usage is in Node runtime; API routes that use Prisma set `runtime = "nodejs"`).

---

## 6. File Reference Quick Map

| Concern | Primary file(s) |
|--------|------------------|
| Auth config | `src/auth.ts` |
| Session in server code | `getServerAuthSession()` from `@/auth` |
| DB access | `src/lib/prisma.ts` (singleton); `prisma.task`, `prisma.user`, etc. |
| Task mutations (shared) | `src/lib/actions/tasks.ts` (addTask, completeTask, restoreTask, deleteTask) |
| Task validation | `src/lib/validations/task.ts` (Zod); used by actions and `POST /api/tasks` |
| Task list UI | `src/app/(app)/dashboard/page.tsx`, `completed/page.tsx` (use shared actions + client components for toasts) |
| Toasts | `sonner`; `Toaster` in `src/app/layout.tsx`; `AddTaskForm`, `TaskActionButton` show success/error toasts |
| Loading states | `src/app/(app)/dashboard/loading.tsx`, `completed/loading.tsx` |
| Sign-in UI | `src/app/login/page.tsx`, `GoogleSignInButton.tsx` |
| Sign-out UI | `src/components/SignOutButton.tsx` |
| Protected routes (edge) | `src/middleware.ts` (session cookie check for /dashboard, /completed) |
| Protected layout | `src/app/(app)/layout.tsx` (redirect if !session) |

---

## 7. Future / Notes

- **Auth.js v5:** NextAuth v4 is in use. For Next.js 15/16 and App Router–first design, Auth.js (v5) is the recommended successor; migration would simplify auth and reduce module augmentation. Deferred until needed.
- **Postgres:** Before production deploy, run a test migration against a Postgres URL (e.g. Neon). SQLite and Postgres differ slightly (e.g. DateTime, case-sensitivity); validating early avoids surprises.

End of document.
