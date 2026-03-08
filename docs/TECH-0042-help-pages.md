# TECH-0042: Help pages

**Status:** Not implemented — implementation notes for future work.

**Goal:** Add a help section that explains how to use the app (tasks and plans), includes app version history based on the changelog, and an “About” section with app version and contributor information.

---

## What is needed

### 1. Structure

| Section | Content | Source |
|---------|---------|--------|
| **How to use** | Basic instructions for tasks (create, edit, complete, plan link) and plans (create, edit, add tasks, share, status). | Written copy; optionally with screenshots or short clips. |
| **Version history** | User-facing summary of releases/features, derived from CHANGELOG.md. | Parse or manually sync from CHANGELOG; or embed a “releases” excerpt. |
| **About** | App name, version (from package.json or env), and contributor/credit info. | package.json `version`; CONTRIBUTORS or similar file; optional link to repo. |

### 2. Where to host

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **New route(s)** | e.g. `/help`, `/help/version`, `/about` under the app layout. | Full control; same auth/layout as app. | You maintain content in code or MD. |
| **Static markdown** | Store help as Markdown in repo (e.g. `content/help.md`), render with a MD parser. | Easy to edit; versioned. | Need parser and safe rendering. |
| **External** | Link to Notion, GitHub Wiki, or external docs. | No in-app maintenance. | Leaves the app; branding/consistency. |

**Recommendation:** **New in-app routes** for v1: `/help` (how to use + subsections if needed) and `/about` (version + contributors). Content can be static React/JSX or Markdown in repo rendered at build time. Pull version from `process.env.npm_package_version` or a generated `version.json` from build.

### 3. Version history

- **Option A:** Manually maintain a “Highlights” section on the help or about page that lists major features (e.g. “Export plans”, “Pidgin translation”) with dates; update when releasing.
- **Option B:** Parse CHANGELOG.md (e.g. in a server component or at build) and show the last N entries or a “Recent changes” block. Keep CHANGELOG format consistent (e.g. Keep a Changelog).
- **Option C:** Link to GitHub Releases or CHANGELOG in repo and show “View full changelog” link.

**Recommendation:** **Option A or C** for v1: simple “Recent updates” list or link to CHANGELOG/Releases. Option B if you want automation and a stable CHANGELOG format.

### 4. Navigation and i18n

- Add a “Help” link in the app nav (e.g. header or settings). Use existing i18n: add `nav.help`, `help.title`, `about.title`, etc., for en, fr, pidgin.
- All user-facing help and about text must be translated per project i18n rules.

### 5. Implementation notes

- **Routes:** `src/app/(app)/help/page.tsx` and `src/app/(app)/about/page.tsx` (or a single `/help` with tabs/sections). Protect with same auth as rest of app.
- **Version:** Read from `package.json` via env or import (e.g. `import packageJson from "../package.json"` if allowed) or build-time script that writes `public/version.json`.
- **Contributors:** Maintain a `CONTRIBUTORS.md` or list in about page; or link to GitHub contributors URL.

### 6. Documentation

- Update **README.md** and **AI_PROJECT_CONTEXT.md** with help and about routes. Add a changeset when the feature is implemented.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add `/help` (and optionally `/about`) route(s) under app layout |
| 2 | Write “How to use” copy for tasks and plans; add i18n for en, fr, pidgin |
| 3 | Add version display (from package.json or build) and contributor info |
| 4 | Add version history block or link to CHANGELOG/Releases |
| 5 | Add Help (and About) to nav; ensure all strings translated |
| 6 | Update README and AI_PROJECT_CONTEXT with new routes |
