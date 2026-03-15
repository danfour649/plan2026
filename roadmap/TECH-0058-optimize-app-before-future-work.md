# TECH-0058: Optimize app code before future work

**Status:** Not implemented — analysis for future work.

**Goal:** Plan and apply optimizations that make sense to do now, before the app expands with new features.

**Why deferred in bulk run:** Task is planning and scoping; implementation is a set of follow-up items rather than a single feature. This doc captures options and a checklist for when prioritised.

**Estimated effort:** Mixed — some quick wins (small), some items align with TECH-1005 (medium/large).

---

## 1. What is needed

| Area | Options / notes |
|------|------------------|
| **Data and API** | See [TECH-1005-data-robustness-optimization.md](./TECH-1005-data-robustness-optimization.md): rate limiting (distributed), GET /api/tasks pagination, cache tags, connection pooling. Tackle as part of TECH-1005 or as standalone PRs. |
| **Bundle and build** | Review client bundle size (e.g. `next build` and analyze); lazy-load heavy components (e.g. editor, modals) if beneficial; ensure tree-shaking where possible. |
| **Code quality** | Remove dead code and unused dependencies; tighten TypeScript strictness if gaps remain; add or extend tests for critical paths (e.g. task/plan mutations, auth). |
| **Performance** | Optimize list rendering (virtualization) only if lists grow large; ensure images/assets use Next.js optimization; avoid unnecessary re-renders in forms/lists. |
| **Security and ops** | Harden env and secrets usage; ensure rate limiting and CORS are production-ready (see TECH-1005). |

---

## 2. Summary checklist

When implementing (in a later run or when prioritised):

1. [ ] Decide which items to do “now” vs as part of TECH-1005.
2. [ ] Run bundle analysis and address obvious bloat (lazy load, remove unused deps).
3. [ ] Implement high-priority TECH-1005 items (e.g. distributed rate limiter, API pagination) if not already done.
4. [ ] Clean dead code and unused exports; run typecheck and tests.
5. [ ] Update this doc or ROADMAP with “Implemented” notes for completed items.
