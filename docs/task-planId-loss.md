# Why some completed tasks lost their plan link (planId)

## Migrations did not clear planId

All Prisma migrations that touch the `Task` table have been checked:

- **No migration** runs any `UPDATE` that sets `Task.planId` to null. The only `UPDATE "Task"` is in `20260315000000_add_task_status_enum`, and it only sets `status = 'completed'` (for the status backfill).
- **`20260307033245_add_plans_and_task_plan_id`** adds the `planId` column and the foreign key with **`ON DELETE SET NULL`**. So `planId` can become null when a **Plan** is deleted (the DB sets it automatically). That is by design, not a migration bug.

The loss of plan links was caused by application logic (see below), not by migrations.

## What happened

Completed tasks sometimes had their **planId set to null** after an edit. That was caused by how task updates handled the optional plan field.

1. **Edit Task** uses a form that includes a plan dropdown only when the user has at least one plan (`plans.length > 0`). When the dropdown is not rendered, the form does **not** send a `planId` field.

2. **updateTask** (and the task service) were building the update payload with  
   `planId: data.planId ?? null`.  
   So whenever `planId` was missing from the form (e.g. no dropdown), the code treated it as “no plan” and **wrote `planId = null`** to the database, wiping the existing link.

3. So any time a user edited a task (e.g. changed title or due date) in a context where the plan field was not sent, the task’s plan link was cleared. That could happen if:
   - The edit was done from a context where the plan dropdown wasn’t rendered, or
   - The form submission didn’t include the plan field for another reason.

## Fix (code)

- **Task service**  
  `planId` is now only updated when it is **explicitly provided** in the update payload. If the form doesn’t send `planId`, the service does not include it in the update, so the existing `planId` is left unchanged.

- **updateTask action**  
  It now distinguishes:
  - **Field missing** (e.g. no plan dropdown) → do not pass `planId` → no change to `planId`.
  - **User chose “None”** (empty string) → pass `planId: null` → unlink from plan.
  - **User chose a plan** → pass the plan id → link to that plan.

So from now on, editing a task will not clear its plan link unless the user explicitly chooses “None” in the plan dropdown.

## Recovering existing data

**We cannot automatically restore which plan a task belonged to** once `planId` has been set to null; that information is gone unless you have a backup or audit log.

You can:

1. **List affected tasks**  
   Run:
   ```bash
   npm run db:list-orphaned-completed-tasks
   ```
   This prints task ids and titles for tasks that are completed but have no plan (so you can reassign them in the app or in Prisma Studio).

2. **Reassign in the UI**  
   Open each task in Edit Task, choose the correct plan in the dropdown, and save. The fix above ensures that future edits will not clear the plan again.

3. **Reassign in bulk (if you know the plan)**  
   If you know that a set of task ids should all go back to one plan, you can run a one-off update in Prisma Studio or a script, e.g.:
   ```js
   await prisma.task.updateMany({
     where: { id: { in: ['taskId1', 'taskId2', ...] } },
     data: { planId: 'thePlanId' },
   });
   ```
