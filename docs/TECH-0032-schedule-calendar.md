# TECH-0032: Schedule / calendar tab and page

**Status:** Not implemented — implementation notes for future work.

**Goal:** A “Schedule” (or “Calendar”) tab and page that shows tasks and plans on a calendar (e.g. by due date and plan dates).

---

## What is needed

### 1. Scope and approach

- Decide whether to use a plugin (e.g. FullCalendar, react-big-calendar) or build a minimal calendar from scratch; compare maintenance and UX tradeoffs.

### 2. Data

- Reuse existing tasks (e.g. `dueAt`) and plans (e.g. `startAt`, `endAt`).
- Possibly an API or server component that returns events in a format the calendar expects.

### 3. Navigation

- New top-level “Schedule” (or “Calendar”) tab and route (e.g. `/schedule`).
- Update nav and any docs (README, AI_PROJECT_CONTEXT).

### 4. UI

- Calendar view (month/week/day as appropriate).
- Event display for tasks and plans, with links to task/plan detail.
- Responsive and translated (en, fr, pidgin).

### 5. Relation to existing features

- Existing Google Calendar integration adds tasks to the user’s external calendar; the Schedule tab would be an in-app view of the same kind of data.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Choose calendar approach (plugin vs custom) |
| 2 | Define event shape and server/API for tasks and plan dates |
| 3 | Add `/schedule` route and top-level nav tab |
| 4 | Implement calendar view with events and links to detail |
| 5 | Add i18n and update project docs |
