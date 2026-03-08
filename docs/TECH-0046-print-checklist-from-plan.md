# TECH-0046: Print checklist from plan

**Status:** Not implemented — implementation notes for future work.

**Goal:** Allow the user to print a checklist from an open plan that lists unfinished tasks, sorted by priority (and optionally by due date), in a print-friendly format.

**Why deferred:** Deferred in bulk run due to run scope. **Estimated effort:** small — reuse plan + tasks data; add “Print checklist” button and print view or @media print styles; no schema.

---

## What is needed

### 1. Scope

- **Source:** The current plan detail page (or a dedicated “Print view” derived from it). Only **unfinished** tasks (`completedAt == null`).
- **Sort:** By priority (e.g. descending), then optionally by due date (soonest first) or by task order.
- **Output:** A view that prints well: minimal chrome (no nav, no buttons), clear headings (plan name, date printed), and a list of tasks with checkboxes or numbers.

### 2. Implementation options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Print stylesheet on plan page** | On plan detail, add a “Print checklist” button that opens a print dialog; use CSS `@media print` to hide nav/sidebar and show only the task list (and plan name). | No new route; reuses existing data. | Page may include more than you want; need to hide form and other UI. |
| **Dedicated print route** | e.g. `/plans/[id]/print`: server-rendered page that shows plan name + unfinished tasks only; minimal layout; user navigates here and uses browser Print. | Clean, print-optimised. | Extra route and data fetch. |
| **Client-only print view** | Modal or new window that renders the checklist and triggers `window.print()`. | Flexible. | More client logic; must pass or refetch data. |

**Recommendation:** **Print stylesheet on plan page** for v1: add a “Print checklist” button on the plan detail page that, when clicked, applies a print-specific class or triggers a print-focused view (e.g. show a minimal div with plan name + unfinished tasks), then call `window.print()`. Use `@media print` to hide header, footer, buttons, and show only the checklist content. Alternatively, a **dedicated route** `/plans/[id]/print` that renders a minimal layout and unfinished tasks is cleaner for print and bookmarkable.

### 3. Data and sort

- Reuse existing plan + tasks query; filter `tasks.filter(t => !t.completedAt)` and sort by `urgency` desc, then `dueAt` asc (nulls last). Same data as plan detail; no new API if using same page or same server component.

### 4. UI details

- **Button:** “Print checklist” (or “Print tasks”) on plan detail, next to Export or in the actions row. i18n: e.g. `plans.printChecklist`.
- **Print layout:** Plan name as title; optional “Printed on &lt;date&gt;”; list of tasks with checkbox (□) or number. No need for interactive checkboxes in print; they’re for manual checking on paper.

### 5. Accessibility and i18n

- Button should have an accessible label. All labels and the printed title must be translated (en, fr, pidgin).

### 6. Documentation

- Update **AI_PROJECT_CONTEXT.md** or README if you document plan actions. Add a changeset when implemented.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add “Print checklist” button on plan detail (i18n) |
| 2 | Implement print view: plan name + unfinished tasks sorted by priority (and due date) |
| 3 | Use @media print or dedicated /plans/[id]/print route; minimal layout for print |
| 4 | Ensure printed output is readable and includes plan name and date |
| 5 | Add changeset and update docs if needed |
