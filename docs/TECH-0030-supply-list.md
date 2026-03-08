# TECH-0030: Supply list (“List” tab)

**Status:** Not implemented — implementation notes for future work.

**Goal:** Allow users to create a list of necessary supplies for a plan or a task — like a shopping list. A new tab “List” would show items that can have optional price, description, and link (e.g. Amazon).

---

## 1. Data model — scope and options

**Why it matters:** Where supplies live (plan vs task vs both) drives the rest of the feature: URL shape, sharing, and how users discover the list.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Plan-only** | One supply list per plan; items have `planId`. | Simple; matches “list for this project”; easy to share with plan. | No per-task breakdown; if a task has its own supplies you’d still tag them at plan level or in task content. |
| **Task-only** | One list per task; items have `taskId`. | Fine-grained (supplies tied to a specific task). | Many small lists; no single “project shopping list” unless you aggregate. |
| **Plan + task** | Items can have `planId` and optionally `taskId`. Plan list = all items for plan; task list = items for that task. | Flexible: plan-level list and optional per-task breakdown. | Slightly more complex schema and UI (e.g. “Move to task” or filter by task). |

**Recommendation:** **Plan-only** for v1: one `SupplyItem` model with `planId`, `userId` (for auth), `label`, optional `price` (Decimal or Int cents), optional `description`, optional `link` (URL), `order` (Int for drag-order), `createdAt`. Add `taskId` later if you need per-task supplies. Keeps schema and UI simple and matches “supplies for this plan.”

**Schema sketch (Prisma):**

```prisma
model SupplyItem {
  id          String   @id @default(cuid())
  planId      String
  plan        Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  label       String
  price       Decimal? @db.Decimal(10, 2)  // or store cents as Int
  description String?
  link        String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  @@index([planId])
  @@index([userId])
}
```

**Recommended next steps:** (1) Add `SupplyItem` and `Plan` relation (and `User` if not already); (2) run migration; (3) add server actions for create/update/delete/reorder that revalidate the plan page.

---

## 2. API and actions

**Why it matters:** Plan 2026 already uses server actions + revalidation; staying consistent avoids extra API surface and keeps auth in one place.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Server actions only** | Actions like `createSupplyItem`, `updateSupplyItem`, `deleteSupplyItem`, `reorderSupplyItems` (formData or typed args). | Same pattern as tasks/plans; no new routes; automatic revalidation. | Slightly more boilerplate for reorder (e.g. pass ordered ids). |
| **REST/API routes** | e.g. `POST/GET/PATCH/DELETE /api/plans/[id]/supplies`. | Familiar if you add a mobile or external client later. | Duplicates auth and validation; need to revalidate from route handlers. |

**Recommendation:** **Server actions only** for v1. Create `lib/actions/supplies.ts` (or under `plans`) with actions that accept `planId` and current user from session; call `revalidatePath(\`/plans/${planId}\`)` after mutations. If you later add a public API, you can add routes that call the same logic.

**Recommended next steps:** (1) Implement create/update/delete in a new actions file; (2) add a simple reorder (e.g. update `order` field for a set of ids); (3) ensure plan page reads `plan.supplyItems` (or equivalent) and passes them to the List tab.

---

## 3. UI and navigation

**Why it matters:** Users need to find the list and use it without leaving the plan context.

**Options:**

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Where the tab lives** | Plan detail only vs also in task edit. | Plan detail only for v1: one “List” tab next to (or after) the main plan/tasks content. |
| **List UX** | Inline add (e.g. new row at bottom) vs modal/drawer for add/edit. | Inline add + inline edit (e.g. click row or edit icon) to keep flow fast; optional simple modal for “add with link/price” if you want. |
| **Columns** | Always show price/link vs hide until filled. | Show label always; show price and link as optional columns (or in expand/edit) so the list doesn’t look empty. |

**Recommended next steps:** (1) Add a “List” (or “Supplies”) tab/section on the plan detail page, with a list of items and an “Add item” control; (2) add inline or single-field edit for label, optional price, optional link; (3) add delete and, if needed, drag-handle reorder; (4) add all new strings to i18n (en, fr, pidgin).

---

## 4. Summary checklist and order of work

| Step | Description |
|------|-------------|
| 1 | Decide plan-only vs plan+task; add `SupplyItem` (and relations) to Prisma; run migration. |
| 2 | Implement server actions (create, update, delete, optional reorder) and revalidate plan page. |
| 3 | Add “List” tab/section on plan detail; list + add/edit/delete (and optional reorder). |
| 4 | Add i18n for all new copy (en, fr, pidgin). |
| 5 | Update README / AI_PROJECT_CONTEXT if you add new routes or notable structure. |

Start with steps 1–2 so the data and actions exist; then implement the List tab (step 3) and wire translations (step 4).
