# TECH-0038: Add task button on task list (mobile)

**Status:** Not implemented — implementation notes for future work.

**Goal:** On the plan detail page, keep the “Add task” button in view when the user scrolls the task list on mobile, so they don’t have to scroll back up to add a task.

**Why deferred:** Deferred in bulk run due to run scope (not because the task is large). **Estimated effort:** small — layout/CSS only (sticky header or similar), single component, no schema or i18n.

---

## What is needed

### 1. Current behaviour

- The plan detail page has a tasks section with a header that includes “Add task” (via `AddTaskDialog`) and the task list below. On mobile, when the list is long, the header (and thus the Add task control) scrolls out of view.

### 2. Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Sticky header** | Make the tasks section header (with “Add task”) `position: sticky` so it stays at the top of the viewport while scrolling the list. | Simple; no extra UI. | Header can cover content; may need a background so content doesn’t show through. |
| **Floating action button (FAB)** | A fixed “Add task” button (e.g. bottom-right) that is always visible on mobile when viewing the plan’s task list. | Always visible; common mobile pattern. | Extra element; may overlap list or need safe-area handling. |
| **Duplicate button at bottom** | Add a second “Add task” control at the bottom of the task list (mobile only). | User can add after scrolling. | Duplicate controls; slightly more layout logic. |

**Recommendation:** **Sticky header** for the tasks block: apply `sticky top-0 z-10` (or similar) to the header row that contains the “Add task” button, with a solid background (e.g. `bg-white/90 backdrop-blur`) so list content doesn’t show through. Limit to mobile viewport (e.g. `sm:static` so desktop keeps current layout) if desired.

### 3. Implementation notes

- **Component:** `src/app/(app)/plans/[id]/page.tsx` — the tasks section has a `<div className="border-b border-blue-100 px-3 py-3 sm:px-6 sm:py-4">` wrapping the title and `AddTaskDialog`. Add `sticky top-0 z-10 bg-white/90 backdrop-blur` (and optionally `sm:static` to disable on larger screens).
- **Accessibility:** Ensure the sticky header doesn’t trap focus; the Add task dialog trigger remains a single control.
- **i18n:** No new strings if reusing existing “Add task” label.

### 4. Documentation

- Update **AI_PROJECT_CONTEXT.md** or **README.md** if you document plan-page behaviour. No changeset needed for docs-only.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add sticky positioning and background to the tasks section header on plan detail page |
| 2 | Restrict to mobile (e.g. `max-sm:sticky`) or keep for all viewports |
| 3 | Verify scrolling and dialog open/close; check safe area on notched devices |
| 4 | Optionally update docs if plan-page UX is documented |
