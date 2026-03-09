# TECH-1005: Data robustness and optimization

**Status:** Not implemented — future work. Run a fresh analysis of the app’s data handling, then implement improvements for robustness and scalability.

**Goal:** After prior tech-debt work (pagination, task-service, revalidation, blob cleanup, etc.) is in place, run a new analysis of the app’s data layer and make it robust and scalable for production and growth.

**Why this doc:** The earlier tech-debt report (TECH-DEBT-AND-OPTIMIZATIONS.md) is stale; many items are already implemented. This doc defines the scope for a **fresh pass**: re-audit current behavior, then address cache, scale, API, rate limiting, DB, and consistency in one coordinated effort.

---

## 1. Scope of the analysis

**Run a new analysis** of the codebase (don’t assume the old report is up to date). Focus on:

| Area | What to audit |
|------|----------------|
| **Cache and revalidation** | How `revalidatePath` is used; whether tag-based invalidation would help; any stale-data paths. |
| **Data loading and scale** | List/detail queries, pagination limits, duplicate queries, N+1, `include` breadth. |
| **Mutations and transactions** | Server actions and API routes that write; use of `prisma.$transaction`; ordering of revalidation vs commit. |
| **API and server-action parity** | GET/POST contract for tasks and plans; ordering, shape, and filters; documentation. |
| **Rate limiting** | Current implementation (in-memory vs distributed); suitability for production (e.g. Vercel multi-instance). |
| **Database** | Connection pooling in serverless; indexes vs current `where`/`orderBy`; Prisma client usage. |
| **Error handling and validation** | How mutations handle DB/network errors; Zod (or other) validation at boundaries; user-facing messages. |
| **Permissions and shared data** | Plan/task access for owners vs shared users; any gaps before adding “shared user can edit.” |

**Deliverable:** Update this doc (or an “Findings” subsection) with the audit results and a prioritized list of actions before implementing.

---

## 2. Cache and revalidation

- **Current:** App uses `revalidatePath()` only. No `revalidateTag()` or cache tags.
- **Risk:** As UI and routes grow, one mutation may require revalidating many paths; easy to miss a path and show stale data.
- **Recommendation:** Re-audit all server actions and API mutations: list every path they revalidate. If the list is long or will grow, consider introducing cache tags (e.g. `tasks-${userId}`, `plans-${userId}`, `plan-${planId}`) and `revalidateTag()` so one mutation can invalidate all dependent segments. Document the chosen strategy (path-only vs tags) in this doc or README.

---

## 3. Data loading and scale

- **Current:** Pagination is in place for tasks list, plans list, and plan-detail task list (per TECH-DEBT report). Verify in code: `skip`/`take` and default limits.
- **Re-audit:** (1) Any list or detail page that loads tasks, plans, or supplies without pagination. (2) Duplicate queries on the same page (e.g. remaining vs completed tasks in two calls). (3) Over-broad `include` or `select` that pulls more than the list/card needs.
- **Recommendation:** Keep list queries narrow (only fields needed for list/card). Use a single query with in-memory split when two queries differ only by filter; otherwise two queries are acceptable if paginated. Add composite indexes for any new filter/sort columns used in hot queries.

---

## 4. API contract and documentation

- **Current:** GET `/api/tasks` and GET `/api/plans` exist; task API uses shared task-service. Ordering and shape may differ from UI (e.g. API vs tasks page sort).
- **Re-audit:** Document actual order, `include`/shape, and query params (e.g. `showCompleted`, pagination) for GET `/api/tasks` and GET `/api/plans`. Note any discrepancies with server-action–driven UI.
- **Recommendation:** Add a short “API” section to README or a dedicated API doc: method, path, query params, response shape, and ordering. If API and UI should align, either change the API to match UI sort or document the difference and the reason. Ensure any new filters/pagination are documented.

---

## 5. Rate limiting (production)

- **Current:** In-memory rate limiting (e.g. `src/lib/rate-limit.ts`) is not shared across serverless instances.
- **Risk:** On Vercel (or multi-instance deploy), limits are per-instance; a user can exceed the intended limit by hitting different instances.
- **Recommendation:** For production, replace with a distributed limiter (e.g. Upstash Redis) keeping the same interface. Document backend and env vars (e.g. `UPSTASH_REDIS_REST_URL`) in README and deployment docs. No changeset for doc-only updates; use a changeset when adding the new implementation.

---

## 6. Database: connection pooling and indexes

- **Connection pooling:** In serverless, many short-lived connections can exhaust the DB limit. Re-audit: how Prisma is instantiated (singleton, edge, etc.) and whether production uses a pooler (Prisma Data Proxy, PgBouncer, or provider pooling). Document the production `DATABASE_URL` and pooling setup.
- **Indexes:** From schema, confirm indexes match hot paths: e.g. `Task` by `userId`, `(userId, completedAt)`, `planId`; `Plan` by `userId`, `(userId, priority)`. For any new filters or sorts added since the last audit, add composite indexes that match the actual `where` and `orderBy`.

---

## 7. Error handling and validation

- **Re-audit:** How server actions and API routes respond to Prisma errors, validation failures, and auth failures. Are errors logged? Do users see a safe message (no stack trace)? Is there a consistent pattern (e.g. return `{ success: false, error: string }` or throw with a known code)?
- **Recommendation:** Ensure all mutation boundaries validate input (e.g. Zod) and handle DB/network errors without exposing internals. Optionally add a small error-handling helper used by both actions and API routes. Document the pattern in this doc or in code comments.

---

## 8. Permissions and shared plans (future-proofing)

- **Current:** Plan list/detail restrict to “owned or shared with me”; task mutations are scoped by task owner. Shared users can view but not edit tasks.
- **Re-audit:** Every place that checks “can this user see/edit this plan or task.” Ensure no path allows a shared user to mutate a task unless the product explicitly adds that feature.
- **Recommendation:** Before adding “shared user can edit tasks,” document the permission matrix (owner vs shared: view / add task / edit task / delete task / edit plan / delete plan / share / invite). Prefer a small “can user do X on plan/task?” helper used by both UI and API so permissions stay consistent.

---

## 9. Invites, blob storage, and calendar sync (known areas)

- **Invites:** `PlanInvite` has `expiresAt`. Confirm `/api/plans/cleanup-invites` (or equivalent) exists and is called by cron or manually; document the choice. Ensure invite listing/lookup filters by `expiresAt`.
- **Blob storage:** Confirm task delete and attachment delete still call blob `del()` (or equivalent) so storage is not orphaned. Re-verify in current code.
- **Google Calendar:** Document as a known limitation if there is no reverse sync (calendar → app) and no update of the calendar event when the task changes. No implementation required unless product decides to add sync.

---

## 10. Summary checklist and order of work

| Step | Description |
|------|-------------|
| 1 | Run a fresh audit of the codebase for the areas in §1 (cache, data loading, mutations, API, rate limit, DB, errors, permissions). Record findings in this doc (e.g. “Findings” subsection) or a short appendix. |
| 2 | Prioritize actions (e.g. rate limiting for production, API docs, cache tags, connection pooling). Decide what to do in this initiative vs later. |
| 3 | Implement high-priority items: e.g. distributed rate limiter, connection pooling config, API documentation. |
| 4 | Implement medium/low-priority items as time allows: cache tags, query consolidation, permission helper, error-handling consistency. |
| 5 | Update README and deployment docs with any new env vars, API contract, and caching/invalidation strategy. |
| 6 | Add a changeset for user- or deployer-visible changes (e.g. new env for Redis); no changeset for doc-only or internal refactors. |

**Order:** Do step 1 (audit) first so the rest of the doc and checklist reflect the current codebase. Then steps 2–6.
