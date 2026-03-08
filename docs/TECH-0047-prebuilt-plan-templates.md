# TECH-0047: Start with a prebuilt plan (templates)

**Status:** Not implemented — implementation notes for future work.

**Goal:** Let users choose a prebuilt plan from a set of templates when creating a new plan, so they can start from a suggested structure (e.g. “Project launch”, “Trip planning”) instead of a blank plan.

---

## What is needed

### 1. Scope

- **Templates:** A small set of predefined plans (name, optional description/goal, optional list of task titles or full tasks). Can be static (in code or JSON) or stored in DB.
- **Flow:** From “New plan” or “Create plan”, offer “Start from template” vs “Start from scratch”. If template chosen, pre-fill the plan form (and optionally create placeholder tasks) with the template data.

### 2. Template storage options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Static in repo** | JSON or TS file in repo (e.g. `src/data/planTemplates.json`) with name, description, goal, and array of task titles. | No DB change; versioned; easy to edit. | Requires deploy to add templates. |
| **Database** | “Template” model; admin or seed script creates template plans (and tasks). Users “clone” a template into their plan. | Flexible; can add templates without deploy. | Schema and seeding; who creates templates? |
| **Hybrid** | Static default templates in code; optional DB templates later. | Simple v1; extensible later. | Two code paths if you add DB later. |

**Recommendation:** **Static in repo** for v1: e.g. `planTemplates.json` with `{ id, name, description?, goal?, tasks: [{ title, urgency? }] }`. On “New plan”, show a template picker (or a dropdown “Start from: Empty | Project launch | …”); on select, navigate to new plan form with initial values (and optional task titles) filled from the template. No new DB tables.

### 3. Implementation notes

- **Data shape:** Each template: `id`, `name`, optional `description`, `goal`, and `tasks` (array of `{ title, urgency? }`). Optionally add i18n keys for names/descriptions so templates can be translated.
- **New plan flow:** Current flow may be “New plan” → form. Add a step before or on the form: “Use template” dropdown or modal. When user picks a template, set `initialValues` (and any “default task titles”) from the template; user can edit before saving.
- **Where:** Plan creation might live at `/plans/new` or in a modal. Template picker can be on that page or in the same form as a “Template” select. Creating the plan still uses the same `createPlan` action; you just pass name, goal, tasks, etc. from the template as defaults.

### 4. i18n

- Template names and descriptions should be translated. Options: (1) store i18n keys in the JSON (e.g. `nameKey: "templates.projectLaunch"`) and look up in `t.templates.*`; or (2) store localized strings per locale in the JSON. Prefer keys so one JSON file works for all locales.

### 5. Documentation

- Document where templates live (file path or DB) and how to add a new template. Update **AI_PROJECT_CONTEXT.md** with the “new plan from template” flow. Add a changeset when implemented.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add static template data (e.g. planTemplates.json) with at least 2–3 templates |
| 2 | Add template picker to new-plan flow (dropdown or modal); pre-fill form from template |
| 3 | Add i18n for template names (and descriptions); support en, fr, pidgin |
| 4 | Ensure created plan and tasks use same validation and actions as manual create |
| 5 | Document template format and how to add templates; add changeset |
