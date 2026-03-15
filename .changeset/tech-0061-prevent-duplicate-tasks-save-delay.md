---
"plan2026": patch
---

Disable save and delete buttons while the form action is in progress to prevent duplicate tasks or records when there is a delay (e.g. on mobile). Uses useFormStatus for in-form buttons and onSubmit/onStateChange for the edit-task external Save button.
