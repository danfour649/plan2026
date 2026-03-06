# Agent Instructions

## Changesets

- This repo uses Changesets to track release-note-worthy changes.
- Create a changeset for user-visible UI changes, behavior changes, auth flow updates, data model changes, and config or environment changes that affect how the app is used or deployed.
- Do not create a changeset for formatting-only edits, test-only changes, dependency-only maintenance, CI-only changes, or internal refactors with no user-visible impact.
- Use `patch` for fixes, styling tweaks, and small UX improvements.
- Use `minor` for new user-facing features or notable workflow additions.
- Use `major` for breaking changes, incompatible API or schema changes, or required manual migration steps.
- Run `npm run changeset` when a qualifying change is made and write a short summary focused on user impact.
- Run `npm run changeset:version` only when intentionally preparing a changelog/version update.
