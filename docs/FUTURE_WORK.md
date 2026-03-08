# Future work (deferred / large-scope items)

Outstanding tasks that are too large for a single small PR are documented in **separate files** in this folder. Each doc follows the same format: status, goal, what is needed, and a summary checklist.

| Doc | Goal |
|-----|------|
| [TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md) | Switch to a permanent custom domain (Vercel, DNS, OAuth). |
| [TECH-0029-mobile-app.md](./TECH-0029-mobile-app.md) | Android and iOS app using the existing site (PWA or Capacitor). |
| [TECH-0030-supply-list.md](./TECH-0030-supply-list.md) | Supply list (“List” tab) for plans/tasks with optional price, description, link. |
| [TECH-0031-ai-advice-on-plans.md](./TECH-0031-ai-advice-on-plans.md) | AI advice bot that reviews a plan and tasks and suggests next steps. |
| [TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md) | Schedule/Calendar tab and page showing tasks and plans on a calendar. |
| [BULK-PLAN-2026-03-REMAINING.md](./BULK-PLAN-2026-03-REMAINING.md) | Remaining tasks from bulk plan export (TECH-0038+ and references to above). |

---

## How this is used

- When a **bulk task list** (e.g. from an exported plan) includes items that are too large to implement in one PR, add or update a **dedicated doc** in `docs/` (like the above) and link it from here if helpful.
- When **starting work** on one of these items, open the relevant doc, then implement in smaller PRs and update the doc as needed.
