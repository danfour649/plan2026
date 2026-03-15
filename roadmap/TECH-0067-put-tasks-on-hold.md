# TECH-0067: Put tasks on hold

**Status:** Implemented (option 2B: enum `status`).

**Goal:** Ability to set a task’s status to “on hold”. These tasks should be sorted to the bottom of all lists.

**Why deferred:** Deferred in bulk run; requires schema and query changes. **Estimated effort:** medium — add `status` or `onHold` field, update forms and lists, sort on-hold last.

---

## What is needed

### 1. Current behaviour

- Tasks have no “on hold” state. They are either incomplete (no `completedAt`) or completed (`completedAt` set). Lists sort by due date, urgency, etc.

### 2. Data model

| Option | Description | Recommendation |
|--------|-------------|----------------|
| **A. Boolean `onHold`** | Add `onHold Boolean @default(false)` to Task. When true, task is “on hold”. | **Recommended:** simple, clear. |
| **B. Enum `status`** | Add `status Enum ('active','on_hold','completed')` and migrate completed to status. | More flexible for future statuses but larger change. |

**Recommendation:** Add `onHold Boolean @default(false)` to the Task model. Migration: `prisma migrate dev --name add-task-on-hold`. In list queries, order by `onHold ASC` (false first) so on-hold tasks appear last; then apply existing sort (e.g. due date, urgency).

### 3. UI

| Area | Notes |
|------|--------|
| **Task form / edit** | Checkbox or toggle “On hold”. When checked, set `onHold: true` on create/update. |
| **Lists** | All task lists (tasks page, plan detail, any “urgent/upcoming” list): sort so `onHold === true` tasks are at the bottom. |
| **Display** | Optional badge or label “On hold” on task rows so users can see the state. |

**Recommendation:** Add “On hold” toggle to task create/edit form (TaskForm and EditTaskDialog). In Prisma queries, use `orderBy: [{ onHold: 'asc' }, ...existingOrderBy]` so on-hold tasks are last. Add i18n for “On hold” (en, fr, pidgin).

### 4. Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add `onHold Boolean @default(false)` to Task; run migration |
| 2 | Update create/update task actions and API to accept and persist `onHold` |
| 3 | Add “On hold” control to TaskForm and EditTaskDialog; i18n |
| 4 | Update all task list queries to order by `onHold asc` then existing sort; optional “On hold” badge in list UI |
| 5 | Update README/AI_PROJECT_CONTEXT if needed; add changeset |
