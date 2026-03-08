# Future work (deferred / large-scope items)

Outstanding tasks that are too large for a single small PR are documented in **separate files** in this folder. Each doc follows the same format: status, goal, what is needed, and a summary checklist.

| Doc | Goal |
|-----|------|
| [TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md) | Switch to a permanent custom domain (Vercel, DNS, OAuth). |
| [TECH-0029-mobile-app.md](./TECH-0029-mobile-app.md) | Android and iOS app using the existing site (PWA or Capacitor). |
| [TECH-0030-supply-list.md](./TECH-0030-supply-list.md) | Supply list (“List” tab) for plans/tasks with optional price, description, link. |
| [TECH-0031-ai-advice-on-plans.md](./TECH-0031-ai-advice-on-plans.md) | AI advice bot that reviews a plan and tasks and suggests next steps. |
| [TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md) | Schedule/Calendar tab and page showing tasks and plans on a calendar. |
| [TECH-0038-add-task-button-mobile.md](./TECH-0038-add-task-button-mobile.md) | Keep “Add task” in view when scrolling task list on mobile (plan page). |
| [TECH-0039-x-of-y-completed-graphic.md](./TECH-0039-x-of-y-completed-graphic.md) | Plans list: show completed vs incomplete tasks as graphic (e.g. green/red boxes). |
| [TECH-0040-task-date-plan-display-mobile.md](./TECH-0040-task-date-plan-display-mobile.md) | Simplify dates/times on mobile; move status button left of edit. |
| [TECH-0041-color-attribute-to-flags.md](./TECH-0041-color-attribute-to-flags.md) | Change plan color to flags; show flag on plans list. |
| [TECH-0042-help-pages.md](./TECH-0042-help-pages.md) | Help for tasks/plans, version history from changelog, about/contributors. |
| [TECH-0043-google-oauth-live.md](./TECH-0043-google-oauth-live.md) | Production Google OAuth (config/deploy). |
| [TECH-0044-facebook-login.md](./TECH-0044-facebook-login.md) | Facebook or other IdPs; email/password signup. |
| [TECH-0045-onboarding-login-screen.md](./TECH-0045-onboarding-login-screen.md) | Improve onboarding and login screen. |
| [TECH-0046-print-checklist-from-plan.md](./TECH-0046-print-checklist-from-plan.md) | Print unfinished tasks from a plan sorted by priority. |
| [TECH-0047-prebuilt-plan-templates.md](./TECH-0047-prebuilt-plan-templates.md) | Choose a prebuilt plan from a template. |
| [TECH-0048-share-to-social-external-plans.md](./TECH-0048-share-to-social-external-plans.md) | Public view link, unauthenticated status-only update, secure endpoint. |
| [BULK-PLAN-2026-03-REMAINING.md](./BULK-PLAN-2026-03-REMAINING.md) | Index of remaining bulk plan tasks and links to analysis docs above. |

---

## How this is used

- When a **bulk task list** (e.g. from an exported plan) includes items that are too large to implement in one PR, add or update a **dedicated doc** in `docs/` (like the above) and link it from here if helpful.
- When **starting work** on one of these items, open the relevant doc, then implement in smaller PRs and update the doc as needed.
