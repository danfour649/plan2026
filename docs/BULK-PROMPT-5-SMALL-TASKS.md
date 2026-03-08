# Bulk prompt: 5 small outstanding tasks

Use this prompt with a **new agent** to implement the following five tasks in **bulk task → PR pipeline** mode (see AGENTS.md). Each task is small (layout/CSS, UI only, or print styles; no schema changes). One branch and one PR per task; add a changeset per implemented task; push and open the PR for each before moving to the next.

**Verified:** None of the merged tasks (TECH-0033–0037) duplicate these. 0035 added a *percent* bar on the plans list; TECH-0039 is the *per-task segment* graphic (e.g. green/grey boxes). 0034 was plan-edit-form mobile; TECH-0038 is sticky “Add task” on the plan *tasks* section.

---

## Copy-paste prompt for the agent

**Task: Bulk implement 5 small tasks from the plan 2026 remaining list. Follow AGENTS.md “Bulk task → PR pipeline” and “Translations (i18n)” (all user-facing text in en, fr, pidgin).**

Implement the following five tasks. For each task:

1. Create branch `tech/<ID>-<kebab-description>` (e.g. `tech/TECH-0038-add-task-button-mobile`).
2. Read the **analysis doc** in `docs/` for that ID (see table below); implement according to the doc’s “What is needed” and “Summary checklist”.
3. Add a **changeset** in `.changeset/` (short kebab-case filename, standard format).
4. Commit, push, and **open a PR** with title `<ID> <Title Case description>` (e.g. `TECH-0038 Add task button on task list (mobile)`).
5. Then move to the next task (new branch from latest `main`).

**The 5 tasks:**

| ID | Title | Analysis doc |
|----|--------|--------------|
| TECH-0038 | Add task button on task list (mobile) | [TECH-0038-add-task-button-mobile.md](./TECH-0038-add-task-button-mobile.md) |
| TECH-0039 | X of Y completed as graphic | [TECH-0039-x-of-y-completed-graphic.md](./TECH-0039-x-of-y-completed-graphic.md) |
| TECH-0040 | Task date and plan display on mobile | [TECH-0040-task-date-plan-display-mobile.md](./TECH-0040-task-date-plan-display-mobile.md) |
| TECH-0041 | Color attribute to flags | [TECH-0041-color-attribute-to-flags.md](./TECH-0041-color-attribute-to-flags.md) |
| TECH-0046 | Print checklist from plan | [TECH-0046-print-checklist-from-plan.md](./TECH-0046-print-checklist-from-plan.md) |

**Rules:**

- Run `npm run typecheck` (and fix any errors) before considering each task done, unless the user has asked to skip for speed.
- All new UI strings must be added to `src/lib/i18n.ts` for **en**, **fr**, and **pidgin** (see AGENTS.md “Translations (i18n)” and “Term-level fixes”).
- Do not create or update analysis docs for these five; the existing docs are the source of truth. When a task is implemented, you can leave the doc in place for reference or note “Implemented” at the top.
- After all 5 PRs are open, tell the user they can test and merge in order (e.g. merge TECH-0038, then 0039, etc.) using the “Testing bulk-task PRs one at a time” steps in AGENTS.md if they want.

Start with TECH-0038, then 0039, 0040, 0041, 0046.
