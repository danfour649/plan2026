# Future work (deferred / large-scope items)

This document describes planned or deferred features that are too large for a single small PR. Each section summarizes the goal and what is needed so that future work can pick them up.

---

## Supply list (“List” tab)

**Goal:** Allow users to create a list of necessary supplies for a plan or a task — like a shopping list. A new tab “List” would show items that can have optional price, description, and link (e.g. Amazon).

**What is needed:**

- **Data model:** New entity (e.g. `SupplyItem` or `ListItem`) with fields such as: `planId` and/or `taskId`, `label`, `price` (optional), `description` (optional), `link` (optional), `order`, `createdAt`. Decide whether items belong to a plan, a task, or both (e.g. plan-level “List” tab vs task-level “Supplies”).
- **API and actions:** CRUD actions and, if needed, API routes for list items; revalidation of plan/task pages when list items change.
- **UI:** New “List” tab (or similarly named) in the plan detail view (and optionally in task edit); list view with add/edit/delete and optional columns for price, description, link; all user-facing strings translated (en, fr, pidgin).
- **Navigation:** Add the tab to plan (and possibly task) navigation so it’s discoverable.

---

## AI advice on plans

**Goal:** Integrate an AI “advice bot” that can review a plan, its associated tasks, and suggest next steps or improvements.

**What is needed:**

- **Provider and API:** Choose an AI provider (e.g. OpenAI, Anthropic, or a self-hosted model); define a server-side API or action that accepts plan + tasks context and returns structured advice; handle rate limits, errors, and timeouts.
- **Safety and privacy:** Ensure plan/task content is only sent to the provider in line with user expectations and privacy policy; consider opt-in or feature flag.
- **UI:** A section or modal on the plan page (e.g. “Get AI advice”) that triggers the request, shows loading state, and displays the advice in a readable way; all copy translated.
- **Cost and limits:** Consider usage limits or caps to control cost; optional “Advice” history or one-off only.

---

## Schedule / calendar tab and page

**Goal:** A “Schedule” (or “Calendar”) tab and page that shows tasks and plans on a calendar (e.g. by due date and plan dates).

**What is needed:**

- **Scope:** Decide whether to use a plugin (e.g. FullCalendar, react-big-calendar) or build a minimal calendar from scratch; compare maintenance and UX tradeoffs.
- **Data:** Reuse existing tasks (e.g. `dueAt`) and plans (e.g. `startAt`, `endAt`); possibly an API or server component that returns events in a format the calendar expects.
- **Navigation:** New top-level “Schedule” (or “Calendar”) tab and route (e.g. `/schedule`); update nav and any docs.
- **UI:** Calendar view (month/week/day as appropriate), event display for tasks and plans, links to task/plan detail; responsive and translated.

See also: existing Google Calendar integration for adding tasks to the user’s calendar; the Schedule tab would be an in-app view of the same kind of data.

---

## Permanent website (custom domain)

**Goal:** Switch from the default Vercel URL to a permanent custom domain.

**What is needed:** See **[TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md)** for domain, DNS, Vercel configuration, `NEXTAUTH_URL`, Google OAuth, and documentation checklist.

---

## Mobile app (Android and iOS)

**Goal:** Provide an Android and iOS app that uses the existing Plan 2026 site (PWA or WebView wrapper).

**What is needed:** See **[TECH-0029-mobile-app.md](./TECH-0029-mobile-app.md)** for approach (PWA vs Capacitor), auth, deep linking, and store distribution.

---

## How this doc is used

- When a bulk task list (e.g. from an exported plan) includes items that are too large to implement in one PR, add or update a section here and, if applicable, link to a dedicated doc (e.g. TECH-0026, TECH-0029).
- When starting work on one of these items, consider opening a dedicated design/tech doc and linking it from here, then implementing in smaller PRs.
