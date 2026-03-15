# TECH-0062: Expand help section and task/plan wizard

**Status:** Not implemented — implementation notes for future work.

**Goal:** The help pages are too short and out of date / incomplete. Enhance them and add a basic 3-step wizard for adding tasks or plans.

**Why deferred:** Deferred in bulk run; scope is medium (content update + new wizard UI). **Estimated effort:** medium — update help copy and structure; add a simple 3-step wizard (e.g. on help page or as a modal) for “add task” / “add plan” with i18n.

---

## What is needed

### 1. Current behaviour

- Help page exists at `/help` with basic sections (tasks, plans, versioning, about). Content may be brief or outdated.

### 2. Expand help section

| Area | Notes |
|------|--------|
| **Content** | Review existing help; add/update sections so they match current app behaviour (e.g. supplies, sharing, dark mode, urgency, flags). |
| **Structure** | Clear headings; optional anchor links or sidebar for long pages. |
| **i18n** | All help copy in en, fr, pidgin (reuse or add keys under e.g. `help.*`). |

**Recommendation:** Audit current help page and app behaviour; update copy; add any missing sections; ensure i18n for all three locales.

### 3. Task/plan wizard (3 steps)

| Area | Notes |
|------|--------|
| **Placement** | Option A: Dedicated section on help page with “Try adding a task” / “Try adding a plan” that opens a 3-step flow. Option B: Modal or inline stepper that can be opened from help or from a “First time?” CTA. |
| **Steps** | e.g. Step 1: “Choose plan (optional)” or “Enter task name”; Step 2: “Set due date / urgency”; Step 3: “Save” with summary. For plan: name → dates/priority → save. |
| **Implementation** | Can reuse existing TaskForm / PlanForm in a stepped layout, or a simplified subset of fields. |

**Recommendation:** Add a “Quick start” or “Try it” section on the help page with a 3-step wizard (client component). Steps can be minimal (e.g. name → optional due/plan → submit). i18n for all wizard strings (en, fr, pidgin).

### 4. Summary checklist

| Step | Description |
|------|-------------|
| 1 | Audit and expand help page content; align with current app (supplies, sharing, etc.) |
| 2 | Add/update i18n for help section (en, fr, pidgin) |
| 3 | Design 3-step “add task” wizard (e.g. on help page or modal); implement steps and submit |
| 4 | Add 3-step “add plan” wizard (optional or same PR) |
| 5 | i18n for all wizard strings; update README/AI_PROJECT_CONTEXT if needed |
