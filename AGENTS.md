# Agent Instructions

## Type checking

- **New and changed code must pass TypeScript.** Run `npm run typecheck` before finishing a task. The pre-push hook runs `lint` then `typecheck` then `build`; if typecheck is skipped or build fails earlier (e.g. Prisma generate), type errors can slip through.
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

## Documentation Maintenance

- When changing routes, navigation, auth flow, task behavior, settings behavior, data model fields, or major UI structure, update the relevant documentation in the same task.
- Treat `README.md` and `AI_PROJECT_CONTEXT.md` as the primary sources to keep in sync with the current app structure and behavior.
- If a documented file path, package name, route, or component is renamed or removed, update or remove the stale reference instead of leaving historical wording in place.
- Do a quick search for outdated route names, file names, and package references after structural app changes.
- Do not create a changeset for documentation-only updates unless the user explicitly asks for one or the documentation change accompanies a qualifying product change.
