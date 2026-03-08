# TECH-0034: Plan edit form mobile friendly

**Status:** In progress — redoing for thorough mobile pass.

**Goal:** The plan edit form (and plan detail page when editing) must be fully usable on small screens: no horizontal scroll, readable and tappable controls, vertical stacking where appropriate, and no cramped or overflowing content.

**Target viewports:** Primary **412px** (Google Pixel 8 portrait); also ensure 320px–375px for smaller phones.

---

## How you can help (before implementation)

1. **List specific issues** you see on your device, e.g.:
   - “Priority pills wrap off the right edge”
   - “Date inputs force horizontal scroll”
   - “Save button is cut off”
   - “Task list section overflows”
2. **Share the width** you test at (e.g. Chrome DevTools device “iPhone SE” = 375px, or your actual phone width).
3. **Optional:** Which fields feel worst (priority, dates, “Add new task” row, tasks checklist, etc.)?

---

## Acceptance checklist (use after implementation)

Test at **412px** (Pixel 8) or your phone width. For the **plan edit page** (`/plans/[id]` as owner):

| # | Check | Pass? |
|---|--------|-------|
| 1 | No horizontal scroll on the whole page | |
| 2 | Plan form section: no horizontal scroll; all inputs stay within width | |
| 3 | Back link and plan title are readable and not cut off | |
| 4 | Action buttons (Export, Share, Invite, Delete) don’t overflow; they wrap or scroll within the row | |
| 5 | Form: Name, Description, Goal inputs are full width and don’t overflow | |
| 6 | Start/End date and Actual start/end: stacked vertically on mobile (one per line) | |
| 7 | Priority: all 7 pills visible without horizontal scroll; wrap to multiple lines if needed | |
| 8 | Percent complete and Color: full width on mobile; easy to tap | |
| 9 | Notes and Image URL: full width; no overflow | |
| 10 | “Tasks in this plan” / “Add new task” row: input and Remove button stack vertically on mobile; no overflow | |
| 11 | Save plan button: full width on mobile; always visible and tappable | |
| 12 | Tasks list (right column / below form on mobile): task rows don’t overflow; Mark done / Edit are tappable | |

---

## Implementation requirements (for a thorough pass)

### Page layout (`plans/[id]/page.tsx`)

- On mobile, form and tasks sections must stack vertically (already `grid` without second column on small screens).
- Section padding: minimal on mobile (e.g. `px-3` or `px-4`), no large horizontal padding that wastes space.
- Top block (title + actions): actions must wrap or scroll horizontally without breaking layout; no overflow-x on body.

### PlanForm.tsx

- **Form container:** `max-w-full`, `overflow-x-hidden` to guarantee no horizontal scroll.
- **All inputs/selects/textareas:** `w-full min-w-0` so they shrink inside flex/grid; no fixed min-width that causes overflow.
- **Date fields:** Always single column on mobile (already `singleColumn` on edit page); ensure the grid is `flex flex-col` for `singleColumn` on small screens.
- **Priority pills:** Container must wrap (`flex-wrap`); pills can wrap to multiple lines; ensure no `whitespace-nowrap` or min-width that forces overflow.
- **Percent and Color:** Full width on mobile (`w-full max-w-full`), no `max-w-xs` or `max-w-[8rem]` that constrains on small screens.
- **Add new task row:** On mobile, stack input above Remove button (`flex-col`); full width for input; button full width or left-aligned.
- **Submit button:** Full width on mobile (`w-full sm:w-auto` already); ensure it’s not cut off by viewport or sticky elements.
- **Details/summary (Tasks in plan):** Summary text truncates or wraps; no overflow. Inner list and search input full width.

### Task list section (same page)

- Task rows: content wraps or truncates; Mark done and Edit buttons remain tappable (min touch target ~44px); no horizontal scroll on the row.

### Global

- No element with a fixed pixel width larger than viewport (e.g. no `min-w-[400px]` on the form).
- Touch targets: buttons and links at least 44×44px where possible.

---

## Summary checklist (implementation)

| Step | Description |
|------|-------------|
| 1 | Add `overflow-x-hidden` and `max-w-full` to form and page sections where needed |
| 2 | Ensure all form controls use `w-full min-w-0` and no overflow-causing constraints on mobile |
| 3 | Priority pills: confirm flex-wrap; reduce padding or font size on mobile if they still overflow |
| 4 | Date fields: single column on mobile; no side-by-side grid below sm |
| 5 | Add new task: vertical stack on mobile; full-width input and button |
| 6 | Submit button: full width on mobile; visible without scrolling past fold if possible |
| 7 | Plan detail page: action buttons row wraps or scrolls; no page-level horizontal scroll |
| 8 | Run through acceptance checklist at 375px and fix any failures |
