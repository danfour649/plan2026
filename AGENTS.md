# Agent Instructions

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
