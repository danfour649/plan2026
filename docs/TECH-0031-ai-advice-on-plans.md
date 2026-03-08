# TECH-0031: AI advice on plans

**Status:** Not implemented — implementation notes for future work.

**Goal:** Integrate an AI “advice bot” that can review a plan, its associated tasks, and suggest next steps or improvements.

---

## What is needed

### 1. Provider and API

- Choose an AI provider (e.g. OpenAI, Anthropic, or a self-hosted model).
- Define a server-side API or action that accepts plan + tasks context and returns structured advice.
- Handle rate limits, errors, and timeouts.

### 2. Safety and privacy

- Ensure plan/task content is only sent to the provider in line with user expectations and privacy policy.
- Consider opt-in or feature flag so users explicitly request advice.

### 3. UI

- A section or modal on the plan page (e.g. “Get AI advice”) that triggers the request.
- Loading state and display of the advice in a readable way.
- All copy translated (en, fr, pidgin).

### 4. Cost and limits

- Consider usage limits or caps to control cost.
- Optional “Advice” history or one-off only.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Choose AI provider and define server action/API contract |
| 2 | Implement server-side call with plan/tasks context and error handling |
| 3 | Add opt-in or feature flag; document privacy implications |
| 4 | Add “Get AI advice” UI on plan page with loading and result display |
| 5 | Add i18n and usage/cost limits as needed |
| 6 | Update README / AI_PROJECT_CONTEXT and any env vars for API keys |
