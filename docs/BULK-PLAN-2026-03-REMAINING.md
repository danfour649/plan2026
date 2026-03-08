# Bulk plan (2026-03) – remaining tasks

Remaining items from the “Plan 2026 - App creation and testing” export that are not yet implemented or covered by existing future-work docs.

| ID | Title | Notes |
|----|--------|------|
| — | Add supply list | See [TECH-0030-supply-list.md](./TECH-0030-supply-list.md). |
| — | AI advice on plans | See [TECH-0031-ai-advice-on-plans.md](./TECH-0031-ai-advice-on-plans.md). |
| — | Add calendar tab | See [TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md). |
| — | Get permanent website | See [TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md). |
| — | Mobile app | See [TECH-0029-mobile-app.md](./TECH-0029-mobile-app.md). |
| TECH-0038 | Add task button on task list (mobile) | Keep “Add task” in view when scrolling on mobile on plan page. |
| TECH-0039 | X of Y completed as graphic | Plans list: show completed vs incomplete tasks as graphic (e.g. green/red boxes). |
| TECH-0040 | Task date and plan display on mobile | Simplify dates/times on mobile; move status button left of edit. |
| TECH-0041 | Color attribute to flags | Change plan color to flags; show flag on plans list. |
| TECH-0042 | Help pages | Basic help for tasks/plans, app version history from changelog, about/contributors. |
| — | Allow mark as done in plan edit page | Already available via TaskActionButton on plan detail. |
| TECH-0043 | Google OAuth live | Production Google OAuth (config/deploy). |
| TECH-0044 | Facebook login | Explore Facebook or other IdPs; email/password signup. |
| TECH-0045 | Onboarding / login screen | Improve onboarding using referenced inspiration. |
| TECH-0046 | Print checklist from plan | Print unfinished tasks from a plan sorted by priority. |
| TECH-0047 | Start with a prebuilt plan | Choose from plan templates. |
| TECH-0048 | Share to social / external plans | Public view link, unauthenticated status-only update, secure endpoint. |

---

When implementing, use branch `tech/<ID>-<kebab-description>`, add a changeset, and open a PR per task.
