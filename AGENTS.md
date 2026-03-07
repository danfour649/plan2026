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

## Type checking

- **New and changed code must pass TypeScript.** Run `npm run typecheck` before finishing a task. The pre-push hook runs `lint` then `typecheck` then `build:next` (Next.js build only, no `prisma generate`) so you can push while the dev server is running without a Prisma engine lock on Windows; CI runs the full `build`.
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

## Documentation Maintenance

- When changing routes, navigation, auth flow, task behavior, settings behavior, data model fields, or major UI structure, update the relevant documentation in the same task.
- Treat `README.md` and `AI_PROJECT_CONTEXT.md` as the primary sources to keep in sync with the current app structure and behavior.
- If a documented file path, package name, route, or component is renamed or removed, update or remove the stale reference instead of leaving historical wording in place.
- Do a quick search for outdated route names, file names, and package references after structural app changes.
- Do not create a changeset for documentation-only updates unless the user explicitly asks for one or the documentation change accompanies a qualifying product change.
