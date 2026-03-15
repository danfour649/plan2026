# TECH-0064: New urgent and upcoming tasks page

**Status:** Implemented. Route added at `/actions`; logo links to it.

**Goal:** Clicking the logo should go to a new “actionable” page that shows tasks with urgency 6+ or due within the next three days. Overdue tasks get an alarm symbol. User can edit the task from this page and see relevant task info.

**Why deferred:** Deferred in bulk run; scope is medium (new route, query, UI). **Estimated effort:** medium — new page, server data load (urgency ≥ 6 or due in 3 days), alarm icon for overdue, link to edit and task detail.

---

## What is needed

### 1. Current behaviour

- Logo links to `/plans`. Tasks are listed on `/tasks` and within plan detail pages.

### 2. Logo destination

| Area | Notes |
|------|--------|
| **Route** | New route, e.g. `/` (home) or `/action` or `/upcoming`, that shows the “urgent and upcoming” list. |
| **Logo link** | Change Plan2026Logo default href (or app layout) so logo points to this new page instead of `/plans`. |

**Recommendation:** Add a dedicated route (e.g. `/` as home/dashboard or `/action`). Logo links to this route. Nav “Plans” still goes to `/plans`.

### 3. Data and query

| Area | Notes |
|------|--------|
| **Filter** | Tasks where: `urgency >= 6` OR `dueAt` is within the next 3 days (from start of today). Include completed? Typically no — only incomplete tasks, or show completed with visual distinction. |
| **Sort** | e.g. overdue first, then by due date, then by urgency. |
| **Overdue** | If `dueAt < now` (and task not completed), show an alarm symbol (e.g. Bell or AlertTriangle from lucide-react). |

**Recommendation:** Server component or API that fetches current user’s tasks with the above filter; sort overdue first, then by due date ascending, then by urgency descending. Pass to client for list and edit links.

### 4. UI

| Area | Notes |
|------|--------|
| **List** | Show task title, due date, urgency, plan name (if any), overdue indicator. |
| **Edit** | Link or button to open EditTaskDialog or navigate to task in context (e.g. plan page or tasks page with task expanded). |
| **Empty state** | “No urgent or upcoming tasks” with link to add task or view plans. |

**Recommendation:** Reuse existing task list patterns (e.g. from tasks page) with a simpler card or row; add alarm icon for overdue; all strings in i18n (en, fr, pidgin).

### 5. Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add new route (e.g. `/` or `/action`); data loader for tasks (urgency ≥ 6 or due in 3 days, incomplete) |
| 2 | Sort: overdue first, then by due date, then urgency; show alarm icon for overdue |
| 3 | Build list UI with edit link and task info; empty state |
| 4 | Wire logo to this page; update nav if needed |
| 5 | i18n for page title, empty state, labels (en, fr, pidgin); update README/AI_PROJECT_CONTEXT |
