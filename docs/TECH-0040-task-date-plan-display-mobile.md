# TECH-0040: Task date and plan display on mobile

**Status:** Not implemented — implementation notes for future work.

**Goal:** On mobile view, simplify how task deadline, start date, and associated plan are displayed (e.g. one per line or shortened), and move the status button (Mark done / Restore) to the left of the Edit button for better thumb reach and clarity.

---

## What is needed

### 1. Current behaviour

- Task rows (e.g. on plan detail and tasks page) show due date, “added” date, and plan name. On mobile these can wrap awkwardly or use too much vertical space. The status (Mark done / Restore) and Edit are in a row; order may not be optimal for mobile.

### 2. Display simplification

| Element | Current | Option for mobile |
|--------|---------|--------------------|
| **Due date** | Full `formatShortDateTime` (e.g. “Mar 8, 2026 9:00 AM”) | Short date only (e.g. “Mar 8”) or relative (“Tomorrow”, “Mar 8”). |
| **Added date** | “Added Mar 7, 2026” | Same or shorten to “Mar 7”. |
| **Plan** | Plan name inline or after dates | One per line on small screens; or icon + truncated name. |

**Recommendation:** Use responsive classes: on `max-sm`, show dates in a shorter form (e.g. `toLocaleDateString(..., { month: "short", day: "numeric" })` without time unless due today); keep “Added” and “Due” and plan on separate lines or in a compact stack. Ensure text doesn’t overflow (e.g. `truncate` or `break-words` with max width).

### 3. Button order

- **Current:** Edit (and possibly Delete) and Mark done / Restore are in a flex row. Task requested: **status button (Mark done / Restore) to the left of the Edit button** on mobile so the primary action (mark done) is first.
- **Implementation:** In the task row component (e.g. plan detail page and tasks page), reorder the buttons so `TaskActionButton` (Mark done / Restore) comes before `EditTaskDialog` in the DOM on mobile, or use flex with `order` so visually status is left of edit on small screens.

### 4. Where to change

- **Plan detail:** `src/app/(app)/plans/[id]/page.tsx` — task list item: date/plan display div and the button group (`TaskActionButton` + `EditTaskDialog`).
- **Tasks page:** If the same task row layout exists on the main tasks page, apply the same date simplification and button order there.
- **Shared component:** If `TaskContent` or a shared task-row component is used, centralize the layout and responsive rules there.

### 5. i18n and accessibility

- Keep existing labels (e.g. “Due”, “Added”, “Mark done”, “Restore”). No new user-facing strings unless you add tooltips. Ensure button order in DOM matches visual order for keyboard and screen readers.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Shorten date/time display on mobile (e.g. date only or relative) |
| 2 | Ensure due, added, and plan are one per line or compact stack on mobile |
| 3 | Move status button (Mark done / Restore) to the left of Edit on mobile |
| 4 | Apply same layout on plan detail and tasks page if both show this row |
| 5 | Verify truncation and overflow; add aria-labels if needed |
