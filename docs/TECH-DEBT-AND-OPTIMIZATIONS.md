# TECH-1001: Tech Debt and Optimizations Report

This document captures potential tech debt and optimizations for the plan2026 app, with emphasis on **data handling** and issues that may surface as features are added or data volume grows. It is intended as a living reference for prioritization and refactors.

---

## 1. Cache and Revalidation

### 1.1 Stale plan data after task delete

**Issue:** When a task that belongs to a plan is deleted, the server action `deleteTask` only calls `revalidatePath("/tasks")`. It does not revalidate `/plans` or `/plans/[id]`. The delete form in `EditTaskDialog` does not submit `planId`, so the action has no way to invalidate the specific plan detail page.

**Impact:** After deleting a task from a plan’s detail page, the plan detail can show the deleted task until the user refreshes or navigates away and back. The plans list may also show stale task counts.

**Recommendation:**

- Add an optional hidden `planId` input to the delete form when `task.planId` is set (same pattern as complete/restore).
- In `deleteTask`, read `planId` from formData when present and call `revalidatePath("/plans")` and `revalidatePath(\`/plans/${planId}\`)` so the list and detail stay in sync.

### 1.2 Path-based revalidation only

**Issue:** The app uses only `revalidatePath()`. There is no use of `revalidateTag()` or cache tags. All invalidation is by route path.

**Impact:** For more complex UIs (e.g. dashboards that aggregate tasks and plans, or multiple segments that depend on the same data), you may need to revalidate many paths or risk stale data. Tag-based invalidation would allow “invalidate everything that depends on this user’s tasks” in one place.

**Recommendation:** As the app grows, consider introducing cache tags (e.g. `tasks-${userId}`, `plans-${userId}`, `plan-${planId}`) and calling `revalidateTag()` from server actions so one mutation can invalidate all dependent segments without hard-coding every path.

---

## 2. Data Loading and Scale

### 2.1 No pagination on tasks page

**Issue:** The tasks page loads **all** remaining tasks and, when “show completed” is on, **all** completed tasks in two separate `findMany` calls. Plans are also loaded in full for the add-task dropdown.

**Impact:** Users with hundreds or thousands of tasks will see slow page loads and large payloads. Memory and render cost grow linearly with task count.

**Recommendation:**

- Introduce cursor- or offset-based pagination for the task list (and optionally for completed tasks), with a sensible default page size (e.g. 50).
- Consider virtualized or windowed rendering for the list if you keep “load more” or infinite scroll.
- Keep the existing “show completed” toggle; it can control a second paginated query or a separate fetch.

### 2.2 No pagination on plans list

**Issue:** The plans page loads all plans (owned + shared) with `include: { tasks: { select: { id, completedAt } } }` in a single query. “Show archived” is implemented by in-memory filtering after loading everything.

**Impact:** With many plans, the initial load and the in-memory filter will get heavier. The task count and completed-count per plan also increase payload size.

**Recommendation:**

- Add pagination (or “load more”) for the plans list.
- If you need task counts without loading all task rows, consider a separate aggregation (e.g. raw query or `_count`) instead of including full task lists for count-only display.
- Optionally move “archived” filtering to the database (`where: { status: { notIn: ['completed','abandoned'] } }`) when not showing archived, so only active plans are loaded.

### 2.3 Plan detail: multiple round-trips and full task set

**Issue:** The plan detail page does three queries: (1) plan with all its tasks (full task fields + attachments), (2) all user plans (for dropdowns), (3) all user tasks (for “link existing task” dropdown). All tasks in the plan are loaded in one go.

**Impact:** For plans with many tasks, the first query becomes large. The second and third queries also scale with the user’s total plans and tasks. No pagination on the in-plan task list.

**Recommendation:**

- Paginate or virtualize the task list **within** the plan (e.g. first 50 tasks, “load more”).
- Consider loading “my plans” and “my tasks” (for dropdowns) in parallel and only the minimal fields needed for labels/IDs.
- If “link existing task” is used rarely, consider lazy-loading that list (e.g. when the user opens the “add to plan” or “link task” UI).

### 2.4 Duplicate task queries when showing completed

**Issue:** On the tasks page, when `showCompleted` is true, the page runs two separate `findMany` calls (remaining and completed). Both include `plan` and `attachments`.

**Impact:** Two round-trips and some duplicated select logic. For very large task sets, this doubles the cost before any pagination is added.

**Recommendation:** Once pagination is in place, this may be acceptable. Alternatively, a single query with `orderBy` that places completed last, plus a limit and cursor, could reduce to one round-trip if the UI can split “remaining” vs “completed” in memory from one stream.

---

## 3. Mutations and N+1 Patterns

### 3.1 Plan create: one insert per new task

**Issue:** In `createPlan`, new tasks from `newTaskTitles` are created in a `for` loop with one `prisma.task.create()` per title. Then a single `updateMany` links existing task IDs to the plan.

**Impact:** For a plan created with many “new” tasks, this causes N+1 writes. Latency and connection usage grow with the number of new tasks.

**Recommendation:** Use `prisma.task.createMany()` for the new tasks (with `planId` and `userId`), then run a single `updateMany` for existing task IDs. If you need the created task IDs for the same request, `createMany` with `skipDuplicates: false` returns `{ count }` only in Prisma; you can either create in a transaction with `createMany` plus one query to fetch IDs by `planId` and `createdAt` in a window, or keep a small loop for the few-cases and batch in larger chunks (e.g. `createMany` in batches of 10).

### 3.2 Plan update: unlink all, link desired, then N creates

**Issue:** In `updatePlan`, the code (1) updates the plan row, (2) sets `planId` to `null` for all tasks currently in the plan, (3) sets `planId` for all desired task IDs in one `updateMany`, (4) creates each “new” task in a loop again.

**Impact:** Steps 2 and 3 are efficient. Step 4 repeats the N+1 create pattern. Same recommendation as create: batch creates with `createMany` where possible.

**Recommendation:** Same as §3.1: use `createMany` (or batched creates) for new tasks and a single `updateMany` for linking. Ensure any follow-up logic that needs the new task IDs (e.g. for redirect or response) is adjusted.

### 3.3 Transaction boundaries

**Issue:** Plan create/update perform several writes (plan row, task creates, task updates). They are not wrapped in an explicit `prisma.$transaction()`.

**Impact:** If a later step fails, earlier steps are already committed. You can end up with a plan that has no tasks, or tasks created but not linked.

**Recommendation:** Wrap the full create and update flows in `prisma.$transaction([...])` so either all changes commit or none do. This becomes more important once you add more steps (e.g. notifications, audit log).

---

## 4. API vs Server Actions Parity

### 4.1 Task API missing planId and urgency

**Issue:** `POST /api/tasks` builds the request from `body` with only `title`, `content`, and `dueAt`. The shared `addTaskSchema` supports `urgency` and `planId`, but the route does not pass them. So the API creates tasks with default urgency and no plan link.

**Impact:** Programmatic or external consumers cannot set urgency or attach a task to a plan via the API. Behavior diverges from the UI.

**Recommendation:** Extend the API handler to pass `urgency` and `planId` from the JSON body into the schema (with the same validation and plan-ownership check used in server actions). Document the fields in README/API docs.

### 4.2 GET /api/tasks order and shape

**Issue:** The API returns tasks ordered by `completedAt: "desc"`, then `createdAt: "desc"`. The tasks page orders remaining by `urgency: "desc"`, then `createdAt: "desc"`, and completed by `urgency: "desc"`, then `completedAt: "desc"`. The API does not include `plan` or `attachments`.

**Impact:** API consumers get a different order and less related data than the UI. Any client that mimics the UI (e.g. a mobile app) would have to re-sort and might need a second request for plan/attachments.

**Recommendation:** Either document the current API contract as “generic list” or align it with the UI: e.g. support optional `showCompleted` and return order and includes consistent with the tasks page. If the API is for integrations only, document the shape and ordering clearly so future features (e.g. filters, pagination) are consistent.

### 4.3 No plans API

**Issue:** There are no REST endpoints for plans (create/read/update/delete). All plan mutations and reads go through server components and server actions.

**Impact:** External or headless clients (e.g. scripts, mobile app, future public API) cannot manage plans without using the web UI.

**Recommendation:** If you add programmatic access for plans, introduce `/api/plans` (and optionally `/api/plans/[id]`) with the same auth and validation patterns as tasks, and keep parity with server actions (e.g. shared validation, revalidation after mutations).

---

## 5. Rate Limiting

**Issue:** Rate limiting in `src/lib/rate-limit.ts` is in-memory (a `Map` keyed by identifier). The file comments that for production with multiple instances you should use something like `@upstash/ratelimit` with Redis.

**Impact:** On Vercel (or any multi-instance/serverless setup), each instance has its own map. A user can exceed the intended per-user limit by hitting different instances. The limit is not globally enforced.

**Recommendation:** For production, replace the in-memory limiter with a distributed store (e.g. Upstash Redis) and keep the same interface (`checkRateLimit(identifier)`). Document the chosen backend and any env vars (e.g. `UPSTASH_REDIS_REST_URL`) in DEPLOY.md and README.

---

## 6. Database and Prisma

### 6.1 Connection pooling and serverless

**Issue:** The app uses a single Prisma client singleton. In serverless environments, many short-lived connections can exhaust the database connection limit if each invocation opens a new connection.

**Impact:** Under high concurrency you may see connection timeouts or “too many connections” from Postgres.

**Recommendation:** Use Prisma’s connection pooling (e.g. Prisma Data Proxy or PgBouncer in front of Postgres). Configure `DATABASE_URL` for the pooler in production and document it. Ensure `prisma generate` and migrations use the same compatibility (e.g. serverless driver if required).

### 6.2 Indexes

**Current indexes** (from schema) are appropriate for the main access patterns:

- `Task`: `userId`, `(userId, completedAt)`, `planId`
- `Plan`: `userId`, `(userId, priority)`
- `PlanShare`, `TaskAttachment`, etc. have relevant indexes

**Recommendation:** As you add filters (e.g. by date range, by status, or by plan), add composite indexes that match the actual `where` and `orderBy` used in hot queries. Avoid indexing every column; focus on columns used in `where`/`orderBy` and in joins.

### 6.3 Prisma logging

**Issue:** The client is created with `log: ["error"]` only. Queries are not logged in development.

**Recommendation:** In development, you can set `log: ["query", "error"]` (or use `DEBUG=prisma:query`) to spot N+1s and slow queries. Keep production logging to errors only to avoid noise and PII.

---

## 7. Shared Plans and Permissions

**Current behavior:** Plan list and plan detail correctly restrict to “owned or shared with me” via `OR: [ { userId }, { shares: { some: { sharedWithUserId: userId } } } ]`. Task mutations (create/update/complete/delete) always scope by `userId`; tasks are owned by the user. So only the task owner can mutate a task; shared users can only view the plan and its tasks.

**Future risk:** If you later allow “editing tasks that belong to a plan shared with me,” you must:

- Update task server actions and any task API to allow mutation when the task’s `planId` is in a plan that has a `PlanShare` for the current user (and define whether shared users can delete tasks or only complete/edit).
- Ensure plan owner vs shared-user permissions are consistent everywhere (e.g. who can add/remove tasks, change plan status, manage invites).

**Recommendation:** Before adding shared editing, document the permission matrix (owner vs shared: view / add task / edit task / delete task / edit plan / delete plan / share / invite) and centralize “can current user do X on this plan/task?” in a small helper used by both UI and API.

---

## 8. Duplication and Consistency

### 8.1 Task create/update logic in two places

**Issue:** Task creation and update logic lives in both `src/lib/actions/tasks.ts` (server actions) and `src/app/api/tasks/route.ts` (and PATCH/DELETE under `[id]`). Validation is shared (Zod), but the actual Prisma calls and error handling are duplicated.

**Impact:** Bug fixes or behavior changes (e.g. default urgency, handling of planId) must be applied in both places. It’s easy for API and UI to drift.

**Recommendation:** Extract a small internal “service” or set of functions (e.g. `createTaskForUser(userId, data)`, `updateTaskForUser(userId, taskId, data)`) that both the server actions and the API routes call. Keep validation and auth at the boundary; keep a single implementation of “how we write to the DB.”

### 8.2 UI formatting and styling duplication

**Issue:** Urgency/priority pill classes and date-formatting helpers are repeated between the tasks page and the plan detail page (and possibly elsewhere).

**Impact:** Inconsistent styling or formatting if one place is updated and the other is not.

**Recommendation:** Move shared helpers (e.g. `getUrgencyPillClasses`, `formatShortDate`, `formatShortDateTime`) into a common module (e.g. `src/lib/format.ts` or `src/components/ui/...`) and reuse. Same for any “priority oval” or status pill logic used in multiple pages.

---

## 9. Future Data and Feature Risks

### 9.1 Task and plan schema growth

**Issue:** As you add fields (e.g. tags, custom fields, recurring rules), list queries may start selecting more columns and relations. Without pagination and with broad `include`s, response sizes and query cost will grow.

**Recommendation:** Keep list endpoints and page queries narrow: select only fields needed for the list/card. Load full details (e.g. for edit dialog or plan detail) in a separate query or route. Add DB indexes for any new filter/sort columns.

### 9.2 Google Calendar sync

**Issue:** The app creates calendar events from tasks and stores `googleCalendarEventId` / `googleCalendarEventUrl`. There is no reverse sync: if the user deletes or changes the event in Google Calendar, the app is not updated. The app does not update the event when the task’s title or due date changes.

**Impact:** Task and calendar can diverge. Users may see “linked” in the app while the event is gone or different in Google.

**Recommendation:** Document this as a known limitation. If you later want sync, you’ll need webhooks or polling for the Calendar API and clear rules for conflict resolution (app vs calendar as source of truth).

### 9.3 Attachments and blob storage

**Issue:** Task attachments are stored in Vercel Blob. When a task (or its attachments) is deleted, Prisma cascades delete the `TaskAttachment` rows, but the blob objects may remain unless you explicitly delete them via the Blob API.

**Impact:** Orphaned blobs consume storage and may incur cost. No automatic cleanup today.

**Recommendation:** On task delete (or attachment delete), call the Vercel Blob API to delete the object by URL if you have a stable way to map `url` to blob key. Consider a periodic job to find and remove blobs that no longer have a corresponding `TaskAttachment` row, if the Blob API supports listing.

### 9.4 Plan invites and expiry

**Issue:** `PlanInvite` has `expiresAt`. Invites are validated at use time (e.g. on the invite acceptance page). There is no background job that deletes expired invites.

**Impact:** Expired invite rows accumulate. Queries that filter by `expiresAt > now()` remain correct, but the table grows. If you ever list “all invites” without filtering, you’ll see stale data.

**Recommendation:** Optional: add a small cron or scheduled function that deletes rows where `expiresAt < now()`. Otherwise, ensure every invite listing or lookup filters by `expiresAt`. Document the choice.

### 9.5 Plan status and enums

**Issue:** Plan `status` is stored as a string. Validation uses a constant array (`PLAN_STATUS_VALUES`). The database does not enforce an enum type.

**Impact:** Typos or legacy values could introduce invalid statuses. Queries or UI that assume a fixed set of statuses could break.

**Recommendation:** Keep validation strict in Zod and in any status dropdown. If you add more statuses, update the validation and i18n in one place. Optionally add a DB check constraint or use Postgres enum for stronger consistency.

---

## 10. Summary Checklist

Use this as a quick reference when planning refactors or new features:

| Area | Priority | Action |
|------|----------|--------|
| Cache | High | Revalidate plan list and plan detail when deleting a task that had `planId` (pass `planId` from delete form, call `revalidatePath` in `deleteTask`). |
| Scale | Medium | Add pagination (or at least limits) for tasks list and plans list; consider for in-plan task list. |
| Mutations | Medium | Use `createMany` or batched creates for new tasks in plan create/update; wrap in `$transaction`. |
| API | Medium | Align POST /api/tasks with schema (planId, urgency); document GET order and shape; add plans API if needed. |
| Rate limit | Medium | Replace in-memory rate limiter with distributed (e.g. Upstash Redis) for production. |
| DB | Low–Medium | Use connection pooling in production; add indexes for new filters/sorts; optional query logging in dev. |
| Permissions | Low until shared edit | Document owner vs shared permission matrix before allowing shared users to edit tasks. |
| Duplication | Low | Extract shared task mutation logic and shared UI helpers (urgency/date formatting) into single modules. |
| Blob / invites | Low | Optional: delete blob on attachment/task delete; optional: cron to delete expired invites. |

---

**Document status:** Living document. Update as you address items or discover new tech debt. No changeset required for documentation-only updates per project conventions.
