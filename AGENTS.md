# Agent Instructions

## PR branches and commits

- **All changes to this project should be done in a PR branch**, not directly on `main`. When the user asks for a feature, fix, or refactor, create a branch first, then make changes and commit there. **By default, open a new Pull Request** for that branch once changes are pushed (see “Raising the PR on GitHub” below).
- **Every PR branch should have an appropriate changeset** (see Changesets below) when the work is release-note-worthy. Create the changeset as part of the same work, before or in the first commit.
- **Shortcut for branch + commit message:** If the user gives a ticket or tech ID (e.g. `TECH-014`) and a short description, use them consistently:
  - **Branch:** `tech/<ID>-<kebab-case-description>` (e.g. `tech/TECH-014-export-plans-tasks-json`). Use a different prefix than `tech/` if the user specifies one (e.g. `fix/`, `feat/`).
  - **Commit message:** `<ID> <description>` (e.g. `TECH-014 add ability to export plans and tasks to json`). Omit the ID if the user didn’t provide one; then use a short imperative message (e.g. `Add export to JSON for plans and tasks`).
  - **PR title:** Use `<ID> <Title Case description>` so the PR shows a clear name, not the branch or raw commit (e.g. **TECH-014 Export plans task to json**). When creating the PR, pass the title explicitly: `gh pr create --title "TECH-014 Export plans task to json" --base main`. If you used `npm run pr` first, fix the title with `gh pr edit --title "TECH-014 Export plans task to json"`.
- If the user doesn’t specify an ID, infer a short kebab-case branch name and commit message from the task (e.g. `feat/export-plans-tasks-json` and `Add export to JSON for plans and tasks`). Use a Title Case PR title derived from the description (e.g. **Export plans task to json**).

- **Raising the PR on GitHub:** After pushing the branch, **open the Pull Request in the same task** so the work is ready for review. Do not consider the task done until the PR exists. Use **GitHub CLI** (`gh`). Requirements:
  1. **Install** [GitHub CLI](https://cli.github.com/manual/installation) if needed.
  2. **Authenticate:** Run `gh auth login` (or set `GH_TOKEN` for CI/automation).
  3. **Push:** `git push -u origin <branch>`.
  4. **Create PR (required):** Right after the first push for a new branch, create the PR in the same task. Use a **Title Case** PR title (e.g. `TECH-014 Export plans task to json`). Run `gh pr create --title "TECH-014 Export plans task to json" --base main --fill` (or add `--body "..."`; non-interactive `gh` needs `--fill` or `--body`). If you only committed and pushed without creating the PR, run `gh pr create` before finishing—**never leave a pushed branch without a PR** unless the user asks not to. The script `npm run pr` uses `--fill` (title from commit); if you use it, run `gh pr edit --title "TECH-014 Export plans task to json"` afterward to set the proper PR title.
  5. **After merging a PR:** Right after merging (e.g. when the user asks to push and merge the active PR), run `git checkout main` and `git pull` so the working copy is on `main` with the latest changes. Use `;` in PowerShell instead of `&&` (e.g. `git checkout main; git pull`).

## Type checking

- **New and changed code must pass TypeScript.** Run `npm run typecheck` before finishing a task. The pre-push hook runs `lint` then `typecheck` only (no Next.js build) so pushes stay fast; CI runs the full `build` and will catch build failures.
- **Why type errors get missed:** Lint is ESLint only and does not run the TypeScript compiler. Type errors are only reported when `tsc` or the Next.js build runs. If you only run `npm run lint` or if `npm run build` fails before the compile step, TypeScript never runs and type errors go unreported.
- After adding or changing code, run `npm run typecheck` (or `npm run prepush`) and fix any type errors before considering the task done.

## Changesets

- This repo uses Changesets to track release-note-worthy changes.
- Create a changeset for user-visible UI changes, behavior changes, auth flow updates, data model changes, and config or environment changes that affect how the app is used or deployed.
- Do not create a changeset for formatting-only edits, test-only changes, dependency-only maintenance, CI-only changes, or internal refactors with no user-visible impact.
- Use `patch` for fixes, styling tweaks, and small UX improvements.
- Use `minor` for new user-facing features or notable workflow additions.
- Use `major` for breaking changes, incompatible API or schema changes, or required manual migration steps.
- Do not use the interactive `npm run changeset` / `changeset add` flow from the agent unless the user explicitly asks for it. It waits on prompts and is slow or can hang in the tool environment.
- When a qualifying change needs a changeset, create the markdown file directly in `.changeset/` instead. Use a short kebab-case filename and this format:

  ```md
  ---
  "plan2026": patch
  ---

  Brief summary focused on user impact.
  ```

- Replace `patch` with `minor` or `major` when appropriate.
- Do not run `npm run changeset:version` during normal feature work. GitHub automation runs it after PRs are merged into `main` and commits the resulting changelog, version bump, and consumed changeset cleanup automatically.
- **When starting a new branch that will commit existing (already changed) files:** Before or as part of that first commit, ensure there is a changeset that describes the user-visible impact of those changes. If the work is release-note-worthy and no changeset exists yet, create one in `.changeset/` (do not use the interactive `changeset add` flow). This keeps the branch’s scope documented for release notes when the branch is merged.

## Translations (i18n)

- **All user-facing text must be translated.** The app supports **English**, **French**, and **Nigerian Pidgin**. Any new UI copy (labels, buttons, placeholders, toasts, aria-labels, page headings, messages) must not be hardcoded.
- **Where translations live:** `src/lib/i18n.ts` defines a single `messages` object with keys `en`, `fr`, and `pidgin`. Each locale has the same structure (e.g. `nav`, `settings`, `common`, `tasks`, `plans`, `planForm`, `planStatus`, `toasts`, etc.). Add new keys under the appropriate section and provide strings for **all three locales**.
- **How to use translations:**
  - **Server components (pages, server layout):** Call `getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value)` and `getTranslations(locale)` from `@/lib/i18n`, then use `t.section.key` for every user-visible string.
  - **Client components:** Use `useTranslations()` from `@/components/TranslationsProvider` (only available inside the app layout that wraps with `TranslationsProvider`). Use `t.section.key` for every user-visible string.
  - **Components used outside the provider** (e.g. login/invite pages): Either pass translated strings as props from a server parent that has `t`, or have the page read the locale cookie and pass a `label`/`ariaLabel` prop.
- **Checklist when adding or changing UI text:** (1) Add the key to `messages.en`, `messages.fr`, and `messages.pidgin` in `src/lib/i18n.ts`. (2) Use `t.*` (or a prop fed by `t`) in the component; no raw English (or other) strings in JSX or button/label/placeholder attributes. (3) Run the app and/or grep for obvious hardcoded phrases to avoid regressions.
- **Template placeholders** in messages use `{{name}}` (e.g. `{{planName}}`, `{{count}}`). Replace them in code with `string.replace("{{name}}", value)`.
- **Term-level fixes (e.g. “use X instead of Y in locale Z”):** When the task is to change how a **concept or term** is translated in one locale (e.g. “Pidgin: use ‘Work’ instead of ‘Tasks’”), you must update **every** user-facing string in that locale that contains the old term. The same concept often appears in many sections: `nav`, `tasksPage`, `plans`, `planForm`, `tasks`, `toasts`, `toggle`, `calendar`, `settings`, etc. **Do not** change only the most obvious key (e.g. `nav.tasks` or `tasksPage.title`) and leave the rest. Before finishing: **grep the locale block** in `src/lib/i18n.ts` for the old term (e.g. `tasks`, `task`, `Tasks`) and for the new term if it might appear in other contexts; update every occurrence in that locale so the wording is consistent across the whole app for that language.

## Documentation Maintenance

- When changing routes, navigation, auth flow, task behavior, settings behavior, data model fields, or major UI structure, update the relevant documentation in the same task.
- Treat `README.md` and `AI_PROJECT_CONTEXT.md` as the primary sources to keep in sync with the current app structure and behavior.
- If a documented file path, package name, route, or component is renamed or removed, update or remove the stale reference instead of leaving historical wording in place.
- Do a quick search for outdated route names, file names, and package references after structural app changes.
- Do not create a changeset for documentation-only updates unless the user explicitly asks for one or the documentation change accompanies a qualifying product change.

## Bulk task → PR pipeline

- When the user provides a set of tasks in JSON form (e.g. exported plan/task list), treat this as a **bulk task → PR pipeline**:
  1. **One PR per task** when feasible: create a branch, implement the task (or document future work if scope is too large), add a changeset, commit, push, and open a PR. Use incrementing tech IDs (e.g. TECH-0041, TECH-0042, …) and descriptive branch names (e.g. `tech/TECH-0041-bulk-task-pr-pipeline`).
  2. **Implement or document:** For each task, either implement it in code or add/update existing future-work documentation when the scope is too large for a single PR. **Prefer implementing small/quick tasks** (e.g. layout-only, single-file CSS, one component change, no schema or new APIs) rather than deferring them. Only defer and write an analysis doc when the task is genuinely large (multi-area, schema change, external integration, or unclear scope). When in doubt, attempt implementation first; document only if the work clearly exceeds one PR or requires design/exploration. **When implementing from a roadmap analysis doc:** read the full doc first; work through the Summary checklist in order (complete every step); follow every Recommendation and “Recommended next steps” in the doc; add i18n for all new UI strings (en, fr, pidgin) and update README/AI_PROJECT_CONTEXT if the doc says so. Do not skip checklist items or recommended steps—the doc is the source of truth.
  3. **Analysis docs for deferred tasks:** For any task that is **documented for later** (not implemented in the bulk run), create a **dedicated analysis doc** in `roadmap/` in the same format as existing ones (e.g. `roadmap/TECH-0026-permanent-website.md`). Each doc must include: **Status** (e.g. “Not implemented — implementation notes for future work”), **Goal** (one sentence), **Why deferred** (one line: e.g. “Deferred in bulk run due to run scope” or “Scope too large for one PR”; include **Estimated effort** when obvious — e.g. “Estimated effort: small (layout only)” or “Estimated effort: large (schema + API)” so future runs can triage), **What is needed** (numbered sections with options/tables where useful), and a **Summary checklist**. Use the filename pattern `roadmap/TECH-<ID>-<kebab-description>.md`. Add the new doc to `roadmap/ROADMAP-AND-FUTURE-WORK.md` (Section 2 Active items and Section 5 Index) and link the task row to the analysis doc. This ensures every deferred task has a single place for implementation notes and makes it clear why it was deferred and whether it is a quick win.
  4. **Changesets:** For each implemented task, add a changeset in `.changeset/` with enough detail that the resulting CHANGELOG entry captures the full gist of the change. Use a short kebab-case filename and the standard changeset format.
  5. **Speed vs. checks:** The user may ask to **skip local build and typecheck** to get PRs out faster; in that case do not run `npm run typecheck` or `npm run build` before pushing. Rely on CI or the user to report build failures.
  6. **Bulk-run quality gate:** Before considering a bulk-task implementation done (and before pushing or opening the PR), run **`npm run lint`** and **`npm run typecheck`** (or `npm run prepush`) and fix any failures—unless the user explicitly asked to skip checks for speed. Optionally run **`npm run build:next`** to catch Next.js build failures before push; CI runs the full build in any case. If the user has asked to skip checks, omit this step.
  7. **PR title:** Use the pattern `<ID> <Title Case description>` (e.g. `TECH-0041 Bulk task PR pipeline in AGENTS.md`) when creating PRs via `gh pr create --title "..." --base main --fill`.
- **Sort order and nulls:** When implementing “incomplete first, completed last” (or any sort by a nullable column), check the DB’s null ordering. In PostgreSQL, `ASC` implies `NULLS LAST` and `DESC` implies `NULLS FIRST`; so for “incomplete (null) first, completed last” use `orderBy: [{ completedAt: "desc" }]`, not `asc`.

### Testing bulk-task PRs one at a time

- When the user wants to **interactively test** each bulk-task PR before merging:
  1. **Checkout the branch** for the PR (e.g. `git checkout tech/TECH-0042-add-task-dialogue-from-plans-page`).
  2. **Merge latest main** into the branch (`git pull origin main` or `git merge main`). Resolve any merge conflicts, then push the branch.
  3. **Remind the user** what the task was and what to verify in the browser (or in docs); they run the app locally and confirm.
  4. When the user confirms and asks to **merge**: merge the branch into `main`, push `main`, then **delete the branch** locally and on the remote (`git branch -d <branch>`, `git push origin --delete <branch>`).
  5. **Move to the next PR**: checkout the next branch, merge latest main, fix conflicts if any, push; repeat from step 3. You can use **`npm run bulk:next -- <PR_NUMBER>`** to automate this: it merges the given PR, updates `main`, checks out the next open PR’s branch, merges `main` into it, pushes, and prints what to test. If there are merge conflicts, the script exits and you must resolve them manually, then push.
- Use `--no-verify` on push when the user has asked to skip hooks (e.g. for speed during bulk testing).
