# TECH-0039: X of Y completed as graphic

**Status:** Not implemented — implementation notes for future work.

**Goal:** On the main plans list page, replace (or supplement) the plain “X of Y completed” text with a graphic — e.g. a row of boxes or segments that are green for completed tasks and red (or grey) for incomplete, so progress is visible at a glance.

---

## What is needed

### 1. Current behaviour

- Plans list shows task counts via `formatTasksCount(...)` producing text like “0 of 3”, “1 of 5”, etc. This is displayed next to the plan dates in the plan card.

### 2. Design options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Horizontal segment bar** | A single row of small blocks (one per task): filled/green for completed, outline/grey or red for incomplete. | Compact; clear at a glance. | Can be wide for plans with many tasks; may need max count or “show first N + overflow”. |
| **Progress bar + count** | A horizontal bar with fill percentage (like TECH-0035 percent bar) plus “X / Y” text. | Reuses percent-style UI; works for large N. | Less “task-by-task” than discrete boxes. |
| **Thermometer / gauge** | A vertical or horizontal “thermometer” from 0 to Y with X filled. | Visually distinct. | More custom UI; may need SVG or careful CSS. |

**Recommendation:** **Horizontal segment bar** for v1: render a flex row of small squares (e.g. 8–10px), one per task, capped at a max (e.g. 20) with “+N more” if needed. Green (e.g. `bg-emerald-500`) for completed, grey or red (e.g. `bg-zinc-200` or `bg-red-200`) for incomplete. Keep the “X of Y” text next to or below for accessibility and exact count.

### 3. Data

- Plan cards already receive `plan.tasks` with `{ id, completedAt }`. Compute `completed = tasks.filter(t => t.completedAt)`, `total = tasks.length`, and use these to render the segments.

### 4. Implementation notes

- **Where:** `src/app/(app)/plans/page.tsx` — in the plan card, replace or augment the `formatTasksCount(...)` line with a small component or inline segment bar.
- **i18n:** Optional aria-label like “3 of 5 tasks completed” for the graphic. Reuse or add a key in `plans.tasksCount*` if needed.
- **Performance:** Trivial (already have task list per plan).

### 5. Documentation

- Update **AI_PROJECT_CONTEXT.md** if you describe the plans list UI.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Implement segment bar (one box per task, green/grey or red, max N with “+N more”) |
| 2 | Keep or add “X of Y” text for accessibility and clarity |
| 3 | Add aria-label for screen readers |
| 4 | Optionally cap segment count and show “+N more” for large plans |
