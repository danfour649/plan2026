# TECH-0068: Upgrade to Prisma 7 and Zod 4

**Status:** Active (not started).

**Goal:** Move `@prisma/client` / `prisma` to **7.x** and `zod` to **4.x** so the stack stays current, after addressing breaking changes and verifying typecheck and runtime behaviour.

**Why deferred:** Both majors introduce breaking changes that blocked a straight `npm update` (see below). **Estimated effort:** small–medium — dependency bumps plus targeted code and typing fixes; follow official migration guides.

---

## What is needed

### 1. Prisma 7

- **Official migration:** Use [Prisma upgrade guide](https://www.prisma.io/docs/orm/more/upgrade-guides) for 6 → 7 (schema, client import, config, and any datasource/runtime changes).
- **Interactive transactions:** With **TypeScript 5.9**, the inferred type for the `$transaction` callback parameter (`Omit<PrismaClient, ITXClientDenyList>`) can **omit model delegates** (e.g. `tx.plan`, `tx.task`) in strict checking, so `tsc` fails in files such as `src/lib/actions/plans.ts`. Mitigations to evaluate:
  - Prefer patterns recommended in Prisma 7 docs / release notes for interactive transactions.
  - If needed, a **narrow, documented** type assertion or helper type for the transaction client (only where Prisma’s types are wrong or incomplete).
- **After upgrade:** `npx prisma generate`, run migrations if the guide requires schema changes, then `npm run typecheck` and exercise plan/task flows.

### 2. Zod 4

- **Enum and error APIs:** Zod 4 changes options for `z.enum` (for example, `errorMap` on enums no longer matches Zod 3 usage). Update validators such as `src/lib/validations/plan.ts` (`updatePlanSchema` / `status`) to the Zod 4 API (e.g. `message` or the documented replacement for custom invalid-enum messaging).
- **Broader pass:** Search the repo for `z.` usage and cross-check [Zod migration notes](https://github.com/colinhacks/zod) for any other breaking patterns.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Read Prisma 6 → 7 and Zod 3 → 4 migration guides; note required schema/config changes |
| 2 | Bump `prisma` and `@prisma/client` to 7.x; run `prisma generate` and fix any schema or client API breakages |
| 3 | Fix interactive `$transaction` typing or code in server actions (e.g. `plans.ts`) until `npm run typecheck` passes |
| 4 | Bump `zod` to 4.x; fix all validation modules (start with `src/lib/validations/plan.ts` and repo-wide search) |
| 5 | Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; manually smoke-test plans and tasks |
| 6 | Add changeset; update this doc to **Implemented** (or note partial) when done |
