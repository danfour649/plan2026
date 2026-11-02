---
"plan2026": patch
---

Make the standalone API's `PATCH /plans/{id}` a true partial update: the request body no longer requires name/startAt/endAt, omitted fields keep the plan's current values instead of being rejected or reset to defaults (priority 4, percentCompleted 0, status draft), and the merged result is still validated against the full update schema. Adds `mergePlanUpdate` with regression tests.
