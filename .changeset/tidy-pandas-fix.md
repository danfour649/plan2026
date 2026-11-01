---
"plan2026": patch
---

Fix standalone API plan updates wiping a plan's task links when `taskIds` is omitted from the PATCH body: an omitted `taskIds` now means "leave plan membership unchanged", while an explicitly provided list (including an empty one) still resets membership. Also fix the CLI crashing with an unhandled `write EPIPE` error when its output is piped into a closed pipe such as `head`.
