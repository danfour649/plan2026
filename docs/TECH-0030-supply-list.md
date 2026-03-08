# TECH-0030: Supply list (“List” tab)

**Status:** Not implemented — implementation notes for future work.

**Goal:** Allow users to create a list of necessary supplies for a plan or a task — like a shopping list. A new tab “List” would show items that can have optional price, description, and link (e.g. Amazon).

---

## What is needed

### 1. Data model

- New entity (e.g. `SupplyItem` or `ListItem`) with fields such as: `planId` and/or `taskId`, `label`, `price` (optional), `description` (optional), `link` (optional), `order`, `createdAt`.
- Decide whether items belong to a plan, a task, or both (e.g. plan-level “List” tab vs task-level “Supplies”).
- Prisma schema update and migration.

### 2. API and actions

- CRUD actions (and, if needed, API routes) for list items.
- Revalidation of plan/task pages when list items change.

### 3. UI

- New “List” tab (or similarly named) in the plan detail view (and optionally in task edit).
- List view with add/edit/delete and optional columns for price, description, link.
- All user-facing strings translated (en, fr, pidgin).

### 4. Navigation

- Add the tab to plan (and possibly task) navigation so it’s discoverable.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Define SupplyItem/ListItem schema and run migration |
| 2 | Implement CRUD actions and revalidation |
| 3 | Add “List” tab and list UI to plan detail (and optionally task) |
| 4 | Add i18n for all new copy (en, fr, pidgin) |
| 5 | Update README / AI_PROJECT_CONTEXT if routes or structure change |
