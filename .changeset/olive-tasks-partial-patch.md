---
"plan2026": patch
---

Two standalone API correctness fixes. (1) `PATCH /tasks/{id}` is now a true partial update: title is optional in the request body, and omitted fields keep the task's current values via the new `mergeTaskUpdate` helper — previously a partial PATCH reset urgency to 4, flipped on-hold tasks to active, and cleared the due date, content, and recurrence. An explicit empty string still clears content/due date. (2) `POST /plans` now honors a provided `status` (create schema gains the field with a "draft" default and the service threads it through) instead of silently creating every plan as draft. Regression tests included.
