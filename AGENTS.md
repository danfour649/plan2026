# Agent Instructions

**Windows PowerShell:** chain commands with `;`, not `&&` (e.g. `git checkout main; git pull`).

## PR branches and commits

- Work on a **PR branch**, not `main`. **Open a PR** after push unless the user opts out. Task is not done until the PR exists.
- **Changeset:** Add one when the change is release-note-worthy (see Changesets). Include it in the same work / first commit.

**Naming (user gave ID, e.g. `TECH-014`):**

| Artifact | Pattern | Example |
|----------|---------|---------|
| Branch | `tech/<ID>-<kebab-desc>` (or `fix/`, `feat/` if user says so) | `tech/TECH-014-export-plans-tasks-json` |
| Commit | `<ID> <lowercase description>` | `TECH-014 add export plans and tasks to json` |
| PR title | `<ID> <Title Case>` | `TECH-014 Export plans and tasks to JSON` |

**No ID:** infer kebab branch + imperative commit; PR title = Title Case from the task.

**GitHub (`gh`):** Install/auth if needed (`gh auth login` or `GH_TOKEN`). Push: `git push -u origin <branch>`. Create PR in the same task:

`gh pr create --title "<ID> <Title Case>" --base main --fill`

Non-interactive `gh` needs `--fill` or `--body`. **`npm run pr`** uses `--fill` (title from commit)—fix title with `gh pr edit --title "..."` if needed. **Never leave a pushed branch without a PR** unless the user asked not to.

**After merge:** `git checkout main; git pull`.

## Type checking

- Run **`npm run typecheck`** (or `npm run prepush`) before finishing; fix all errors. Pre-push runs `lint` + `typecheck` only; **CI runs full `build`**.
- **ESLint ≠ TypeScript:** `npm run lint` does not run `tsc`. Type errors only show when `typecheck` or build compiles.

## Next.js build / Cache Components

- With **`cacheComponents: true`**, `next build` may fail: **“Uncached data was accessed outside of `<Suspense>`”**. The error names one route, but the cause is often **shared layouts** (`src/app/layout.tsx`, `src/app/(app)/layout.tsx`) that **`await` cookies, session, `connection()`, etc.** without `<Suspense>`. If many routes fail the same way, fix layouts before individual pages.
- Debug: **`npx next build --debug-prerender`** (debug-only; not a normal build). Routine check: **`npm run build:next`** or full `build` after App Router / caching changes.

## Changesets

- **Include** for user-visible UI/behavior, auth, data model, deploy-affecting config. **Skip** for format-only, tests-only, deps-only, CI-only, or internal refactors with no user impact.
- **Bump:** `patch` = fixes/small UX; `minor` = features/workflow; `major` = breaking / migration.
- **Do not** use interactive `changeset add` / `npm run changeset` from the agent (prompts hang). **Create `.changeset/<kebab>.md` manually:**

  ```md
  ---
  "plan2026": patch
  ---

  Brief user-facing summary.
  ```

- **Do not** run `npm run changeset:version` in feature work—automation does that on `main` after merge.
- Branch with **pre-existing uncommitted release-worthy changes:** add the changeset before/with the first commit.

## Translations (i18n)

- **No hardcoded user-facing strings.** Locales: **en**, **fr**, **pidgin** — add keys to **`src/lib/i18n.ts`** (`messages.en` / `.fr` / `.pidgin`, same shape). After edits, spot-check or grep for stray literals in JSX/labels/placeholders.
- **Server:** `await getLocaleForRequest()` from `@/lib/account-preferences` (account + cookie); `parseLocale(string)` from `@/lib/i18n` for raw values; `getTranslations(locale)` → `t.section.key`.
- **Client (inside provider):** `useTranslations()` from `@/components/TranslationsProvider` → `t.section.key`.
- **Outside provider** (e.g. login): pass strings from a server parent or cookie + props (`label` / `ariaLabel`).
- Placeholders: `{{name}}` in copy; `string.replace("{{name}}", value)` in code.
- **Term swap in one locale:** grep that locale’s block in `i18n.ts` and update **every** occurrence (`nav`, `tasksPage`, `plans`, `toasts`, etc.)—not just one key.

## Documentation

- When routes, auth, tasks, settings, data model, or major UI change: update **`README.md`** and **`AI_PROJECT_CONTEXT.md`** and remove stale paths/names. No changeset for docs-only unless user asks or it ships with a product change.

## Bulk task → PR pipeline

Triggered when the user supplies tasks as **JSON** (e.g. exported plan/tasks).

1. **One PR per task** when feasible: branch, implement or defer, changeset, commit, push, PR. IDs e.g. `TECH-0041`, `TECH-0042`; branches e.g. `tech/TECH-0041-short-desc`.
2. **Implement vs defer:** Prefer small fixes (layout, one file, one component). Defer only for large/unclear work (multi-area, schema, integrations). **Roadmap doc is source of truth:** read fully; complete Summary checklist; follow Recommendations and “Recommended next steps”; i18n for new strings; update README/AI_PROJECT_CONTEXT if the doc says so.
3. **Deferred task:** New `roadmap/TECH-<ID>-<kebab>.md` matching existing analysis docs: **Status**, **Goal**, **Why deferred** (+ estimated effort when obvious), **What is needed**, **Summary checklist**. Register in `roadmap/ROADMAP-AND-FUTURE-WORK.md` (Active + Index), link from task row.
4. **Changeset per implemented task** — enough detail for a good CHANGELOG line.
5. **User may skip local build/typecheck** for speed → don’t run them; rely on CI.
6. **Quality gate** before push/PR on implemented work: `npm run lint` and `npm run typecheck` (or `prepush`), unless user asked to skip. Optional: `npm run build:next`.
7. **PR title:** `<ID> <Title Case>` via `gh pr create --title "..." --base main --fill`.

**PostgreSQL null sort:** `ASC` → `NULLS LAST`, `DESC` → `NULLS FIRST`. For “incomplete (null) first, completed last” use `orderBy: [{ completedAt: "desc" }]`, not `asc`.

### Testing bulk-task PRs one at a time

1. Checkout PR branch; merge latest `main`; resolve conflicts; push.
2. Tell the user what to verify locally.
3. On merge confirmation: merge to `main`, push, delete branch locally and remote.
4. Next PR: repeat. **`npm run bulk:next -- <PR_NUMBER>`** automates merge → next branch → merge main → push; on conflict, resolve manually.
5. **`git push --no-verify`** if user asked to skip hooks.
