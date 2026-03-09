# Future work (deferred / large-scope items)

Outstanding tasks that are too large for a single small PR are documented in **separate files** in this folder. Each doc follows the same format: status, goal, what is needed, and a summary checklist.

**On hold (do not implement until directed):** TECH-0026 (permanent website), TECH-0029 (mobile app), TECH-0031 (AI advice), TECH-0043 (Google OAuth live). See each doc for reason.

| Doc | Goal | Status |
|-----|------|--------|
| [TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md) | Switch to a permanent custom domain (Vercel, DNS, OAuth). | On hold — name/provider TBD |
| [TECH-0029-mobile-app.md](./TECH-0029-mobile-app.md) | Android and iOS app using the existing site (PWA or Capacitor). | On hold — scope too large |
| [TECH-0030-supply-list.md](./TECH-0030-supply-list.md) | Supply list ("List" tab) for plans/tasks with optional price, description, link. | Active |
| [TECH-0031-ai-advice-on-plans.md](./TECH-0031-ai-advice-on-plans.md) | AI advice bot that reviews a plan and tasks and suggests next steps. | On hold — cost/misuse risk |
| [TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md) | Schedule/Calendar tab and page showing tasks and plans on a calendar. | Active |
| [TECH-0042-help-pages.md](./TECH-0042-help-pages.md) | Help for tasks/plans, version history from changelog, about/contributors. | Active |
| [TECH-0043-google-oauth-live.md](./TECH-0043-google-oauth-live.md) | Production Google OAuth (config/deploy). | On hold — privacy/checklist |
| [TECH-0044-facebook-login.md](./TECH-0044-facebook-login.md) | Facebook or other IdPs; email/password signup. | Active |
| [TECH-0045-onboarding-login-screen.md](./TECH-0045-onboarding-login-screen.md) | Improve onboarding and login screen. | Active |
| [TECH-0047-prebuilt-plan-templates.md](./TECH-0047-prebuilt-plan-templates.md) | Choose a prebuilt plan from a template. | Active |
| [TECH-0048-share-to-social-external-plans.md](./TECH-0048-share-to-social-external-plans.md) | Public view link, unauthenticated status-only update, secure endpoint. | Active |
| [BULK-PLAN-2026-03-REMAINING.md](./BULK-PLAN-2026-03-REMAINING.md) | Index of remaining bulk plan tasks and links to analysis docs above. | — |
| [TECH-DEBT-AND-OPTIMIZATIONS.md](./TECH-DEBT-AND-OPTIMIZATIONS.md) (TECH-1001) | Tech debt and optimizations (data handling, cache, scale, API parity, rate limiting). | — |

---

## How this is used

- When a **bulk task list** (e.g. from an exported plan) includes items that are too large to implement in one PR, add or update a **dedicated doc** in `docs/` (like the above) and link it from here if helpful.
- When **starting work** on one of these items, open the relevant doc, then implement in smaller PRs and update the doc as needed.
- Do **not** implement items marked **On hold** until directed.
