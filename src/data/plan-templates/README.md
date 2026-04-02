# Plan templates

JSON definitions for **Start from template** on the new-plan flow. Each file is a `PlanTemplateDefinition`: metadata plus a list of tasks with optional due dates and urgency (1–7).

Templates may ship as **literal copy** (`name`, `goal`, `title`, `content`) or **i18n keys** (`nameKey`, `goalKey`, `titleKey`) resolved via `resolvePlanTemplates` in `src/data/planTemplates.ts`.

## Adding or editing a template

1. Add or change a `*.json` file in this folder. Dates must be `YYYY-MM-DD`. Each task needs `title` or `titleKey`. The template needs `name` or `nameKey`.
2. Register the template `id` in `types.ts` (`PLAN_TEMPLATE_IDS`). The `id` inside the JSON must match exactly.
3. Import the JSON and append `parsePlanTemplate(<import>)` to `_PLAN_TEMPLATE_DEFINITIONS` in `index.ts`. **Order in that array is the order shown in the UI.**

Validation runs through Zod in `validate.ts` at build/runtime when the module loads.

## Starter templates (JSON files)

| File | Focus |
|------|--------|
| `empty.json` | Blank plan |
| `project-launch.json` | Four-week launch arc |
| `trip-planning.json` | Travel logistics |
| `gemini-ai-plan-generic.json` | Longer AI/automation playbook |
| `job-search.json` | Materials, network, pipeline, interviews |
| `product-discovery.json` | Problem framing through delivery handoff |
| `home-move.json` | Move timeline, utilities, packing |

## Ideas for additional templates

- **Incident response** — detection, comms, mitigation, customer updates, post-incident review.
- **Conference talk** — CFP, outline, slides, rehearsal, travel, follow-up.
- **Renovation / contractor project** — scope, bids, permits, milestones, punch list.

## Related files

- `src/data/planTemplates.ts` — resolves i18n and re-exports definitions
- `src/app/(app)/plans/new/page.tsx` — template picker
