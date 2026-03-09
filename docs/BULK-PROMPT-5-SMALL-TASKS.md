# Bulk prompt: 5 small outstanding tasks

Use this prompt with a **new agent** to implement the following five tasks in **bulk task → PR pipeline** mode (see AGENTS.md). One branch and one PR per task; add a changeset per implemented task; push and open the PR for each before moving to the next.

**Next 5 (easiest):** Help pages, onboarding/login, permanent website (config), prebuilt plan templates, Google OAuth production config.

---

## Copy-paste prompt for the agent

**Task: Bulk implement 5 tasks from the plan 2026 remaining list. Follow AGENTS.md “Bulk task → PR pipeline” and “Translations (i18n)” (all user-facing text in en, fr, pidgin).**

Implement the following five tasks. For each task:

1. Create branch `tech/<ID>-<kebab-description>` (e.g. `tech/TECH-0042-help-pages`).
2. Read the **analysis doc** in `docs/` for that ID (see table below); implement according to the doc’s “What is needed” and “Summary checklist”.
3. Add a **changeset** in `.changeset/` (short kebab-case filename, standard format).
4. Commit, push, and **open a PR** with title `<ID> <Title Case description>` (e.g. `TECH-0042 Help pages`).
5. Then move to the next task (new branch from latest `main`).

**The 5 tasks:**

| ID | Title | Analysis doc |
|----|--------|--------------|
| TECH-0042 | Help pages | [TECH-0042-help-pages.md](./TECH-0042-help-pages.md) |
| TECH-0045 | Onboarding / login screen | [TECH-0045-onboarding-login-screen.md](./TECH-0045-onboarding-login-screen.md) |
| TECH-0026 | Get permanent website | [TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md) |
| TECH-0047 | Start with a prebuilt plan | [TECH-0047-prebuilt-plan-templates.md](./TECH-0047-prebuilt-plan-templates.md) |
| TECH-0043 | Google OAuth live | [TECH-0043-google-oauth-live.md](./TECH-0043-google-oauth-live.md) |

**Rules:**

- Run `npm run typecheck` (and fix any errors) before considering each task done, unless the user has asked to skip for speed.
- All new UI strings must be added to `src/lib/i18n.ts` for **en**, **fr**, and **pidgin** (see AGENTS.md “Translations (i18n)” and “Term-level fixes”).
- Do not create or update analysis docs for these five; the existing docs are the source of truth. When a task is implemented, you can leave the doc in place for reference or note “Implemented” at the top.
- After all 5 PRs are open, tell the user they can test and merge in order using the “Testing bulk-task PRs one at a time” steps in AGENTS.md if they want.

Start with TECH-0042, then 0045, 0026, 0047, 0043.
