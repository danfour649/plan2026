# TECH-0032: Schedule / calendar tab and page

**Status:** Not implemented — implementation notes for future work.

**Goal:** A “Schedule” (or “Calendar”) tab and page that shows tasks and plans on a calendar (e.g. by due date and plan dates).

---

## 1. Scope and approach — plugin vs custom

**Why it matters:** A calendar has many edge cases (time zones, all-day vs timed, overlapping events, mobile). Building from scratch is a large commitment; a maintained library gets you most of the way but adds dependency and API constraints.

**Options:**

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **react-big-calendar** | React-focused; month/week/day views; widely used; MIT. | Styling and defaults may need tuning; some mobile quirks. | **Best first choice:** good balance of features and control; works with existing task/plan data. |
| **FullCalendar** | Very full-featured; good docs. | License: core free, some plugins paid; heavier. | Consider if you need advanced features (e.g. drag-drop between days) and are okay with license. |
| **Custom (CSS Grid / table)** | No dependency; full control. | Time-consuming; time zones, navigation, and mobile are easy to get wrong. | Only if you need a very minimal “month grid with dots” and no time slots. |
| **@fullcalendar/react** (free core) | React integration; month view and basic list. | Same license note; need to stay within free set. | Viable if you evaluate the free tier and it fits. |

**Recommendation:** Start with **react-big-calendar**. Use the existing `Task` (e.g. `dueAt`) and `Plan` (`startAt`, `endAt`) models; map them to “events” with a shared shape (e.g. `{ id, title, start, end, allDay?, resource: { type: 'task' \| 'plan', id } }`). Implement a single view first (e.g. month); add week/day if needed. Styling can be overridden via CSS or the library’s props so it fits the app.

**Recommended next steps:** (1) Add `react-big-calendar` (and types if needed); (2) create a server component or data loader that fetches the current user’s tasks (with `dueAt`) and plans (with `startAt`/`endAt`) and normalizes them to the event shape; (3) build a client component that receives events and renders the calendar; (4) wire links from events to `/tasks` or `/plans/[id]` as appropriate.

---

## 2. Data shape and loading

**Why it matters:** The calendar expects a list of events with at least `start` and `end` (and usually `title`). Tasks have optional `dueAt`; plans have `startAt` and `endAt`. You need a consistent shape and a place to load it.

**Options:**

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Server component** | Page fetches tasks + plans, maps to events, passes to client calendar. | No extra API; good for SSR and auth. | Client component gets props; refetch on navigation or use router refresh. |
| **API route + client fetch** | e.g. `GET /api/schedule?from=&to=` returning events. | Client can refetch by date range (e.g. when user changes month). | Extra route; need to secure and revalidate. |
| **Server action** | Client calls action with date range; action returns events. | Same auth as rest of app; no new route. | Slightly different mental model than “REST calendar feed.” |

**Recommendation:** **Server component for the page** that fetches the current user’s tasks (where `dueAt` is set) and plans for a reasonable window (e.g. current month ± 1). Map to events: for tasks use `dueAt` as both start and end (or end = dueAt + 1h) and `allDay: false` or treat as all-day; for plans use `startAt`/`endAt`. Pass the event array into a client component that renders react-big-calendar. If you later need “load more when changing month,” add a server action that accepts a range and returns events, and call it from the client when the view changes.

**Event shape (example):**

```ts
type ScheduleEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: { type: 'task' | 'plan'; id: string };
};
```

**Recommended next steps:** (1) Define this (or similar) type; (2) in the schedule page server component, load tasks and plans and map to `ScheduleEvent[]`; (3) pass events and a small config (e.g. default date) to the client calendar component.

---

## 3. Navigation and relation to Google Calendar

**Why it matters:** The app already has “Add to Google Calendar” for tasks; the Schedule tab is an in-app view of the same kind of data (tasks and plans over time), not a replacement for Google Calendar.

**Recommendation:** Add a top-level **“Schedule”** (or “Calendar”) nav item that goes to `/schedule`. Keep the existing Google Calendar integration as “export this task to your calendar”; the Schedule page is “view my tasks and plans on a calendar here.” In docs (e.g. README or in-app help), briefly state that Schedule shows tasks and plans in-app, while Google Calendar integration pushes events to the user’s external calendar.

**Recommended next steps:** (1) Add `/schedule` route and a page that uses the server component + client calendar; (2) add “Schedule” to the main nav (and i18n for en, fr, pidgin); (3) ensure event titles or tooltips link to the task or plan detail.

---

## 4. UI details and i18n

- **Views:** Start with **month**; add week and day if users ask. react-big-calendar supports switching views.
- **Event display:** Show title; optional tooltip or click → navigate to task/plan. Color or icon by type (task vs plan) if you want.
- **Empty state:** If no events in range, show a short message (e.g. “No tasks or plans in this period”) and ensure i18n is in place.
- **Mobile:** react-big-calendar can be responsive; test on small screens and adjust (e.g. simplify toolbar or default to month list).

**Recommended next steps:** (1) Implement month view with events and links; (2) add all new strings to i18n (en, fr, pidgin); (3) update README / AI_PROJECT_CONTEXT with the new route and nav.

---

## 5. Summary checklist and order of work

| Step | Description |
|------|-------------|
| 1 | Add react-big-calendar (and types); define `ScheduleEvent` and mapping from Task/Plan. |
| 2 | Build schedule page: server component loads tasks + plans for a window, maps to events, passes to client. |
| 3 | Client component: render calendar (month first), link events to task/plan detail. |
| 4 | Add “Schedule” to main nav and `/schedule` route; add i18n. |
| 5 | Test on mobile; adjust styling and toolbar as needed. |
| 6 | Update README / AI_PROJECT_CONTEXT. |

Do steps 1–3 for a minimal working schedule; then nav and i18n (4–5) and docs (6).
