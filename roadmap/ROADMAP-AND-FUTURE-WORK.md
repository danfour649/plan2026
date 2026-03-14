# Future work & roadmap

Single entry point for deferred work, active items, bulk-run workflow, and session handoff. **Update the “Next steps” section when closing a session** so the next run knows where to continue.

---

## 1. On hold (do not implement until directed)

| ID | Title | Reason |
|----|--------|--------|
| TECH-0026 | Get permanent website | Not ready — need to determine domain name and provider. |
| TECH-0029 | Mobile app | Scope too large. |
| TECH-0031 | AI advice on plans | Cost/misuse risk — API key theft or misuse could incur charges. |
| TECH-0043 | Google OAuth live | Not ready — need privacy disclosures and Google checklist before leaving testing mode. |

See each analysis doc in this folder for details.

---

## 2. Active items

Ready to implement. Each has a **dedicated analysis doc** in this folder for implementation notes and checklists.

| ID | Title | Analysis doc |
|----|--------|--------------|
| — | Allow mark as done in plan edit page | Already available via TaskActionButton on plan detail. |
| — | Add calendar tab | [TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md) |
| TECH-1005 | Data robustness and optimization | [TECH-1005-data-robustness-optimization.md](./TECH-1005-data-robustness-optimization.md) |

When implementing: use branch `tech/<ID>-<kebab-description>`, add a changeset, and open a PR per task (see AGENTS.md).

---

## 3. Bulk-run workflow

Use this for **future bulk runs** (e.g. new tasks from an exported plan).

- Follow **AGENTS.md** “Bulk task → PR pipeline” and “Translations (i18n)” (all user-facing text in en, fr, pidgin).
- **Before implementing,** do not implement any task listed under **On hold** (Section 1).

**For each task in your batch:**

1. Create branch `tech/<ID>-<kebab-description>` (e.g. `tech/TECH-0042-help-pages`).
2. **Read the full analysis doc** in `roadmap/` for that ID from top to bottom. The doc is the **source of truth**.
3. **Implement everything the doc requires:**
   - Work through the **Summary checklist** (usually at the end) in order; complete every step unless the doc explicitly says otherwise. Do not skip steps.
   - Follow the doc’s **Recommendation** and **Recommended next steps** in each section where they appear (they specify approach, data shape, and order of work).
   - If the doc presents options/tables, implement according to the **recommended** option unless there is a stated reason to do otherwise.
   - Add all new user-facing strings to `src/lib/i18n.ts` for **en**, **fr**, and **pidgin** (see AGENTS.md “Translations (i18n)”). This is mandatory unless the doc says otherwise.
   - If the doc says to update README or AI_PROJECT_CONTEXT, do it in the same PR.
4. **Before considering the task done:** Confirm every checklist item is done, every “Recommended next steps” in the doc is addressed, and typecheck passes (`npm run typecheck` unless the user asked to skip).
5. Add a **changeset** in `.changeset/` (short kebab-case filename, standard format).
6. Commit, push, and **open a PR** with title `<ID> <Title Case description>` (e.g. `TECH-0042 Help pages`).
7. Move to the next task (new branch from latest `main`).

**Rules:**

- Run `npm run typecheck` (and fix any errors) before considering each task done, unless the user asks to skip for speed.
- When a task is implemented, leave the analysis doc in place and note “Implemented” at the top, or remove the doc if no longer needed.
- After PRs are open, the user can test and merge using “Testing bulk-task PRs one at a time” in AGENTS.md if desired.

**Copy-paste prompt for an agent:**  
*“Bulk implement the tasks listed in the Active items (or the batch I’m providing). Follow AGENTS.md ‘Bulk task → PR pipeline’ and ‘Translations (i18n)’. Do not implement tasks marked On hold in roadmap/ROADMAP-AND-FUTURE-WORK.md. For each task: create a branch, read the full analysis doc in roadmap/ from top to bottom, then implement everything it requires—work through the Summary checklist in order, follow every Recommendation and Recommended next steps, add i18n for en/fr/pidgin for all new UI strings, and update README/AI_PROJECT_CONTEXT if the doc says so. Before marking done, confirm every checklist item and recommended step is addressed and typecheck passes. Then add a changeset, push, and open a PR.”*

---

## 4. Next steps (session handoff)

**Update this section when closing a session** so the next run knows where to continue.

- **Last completed:** The five tasks TECH-0042, TECH-0045, TECH-0047, TECH-0030, TECH-0044 have been implemented and merged.
- **Bulk run (this session):** Implemented TECH-0048 (task complete toast), TECH-0049 (remove delete-task text), TECH-0050 (save button bottom), TECH-0051 (header margin mobile), TECH-0052 (urgency label), TECH-0053 (task form dark text + name→description), TECH-0054 (plan flags + black/pink/silver). Deferred with analysis docs: TECH-0056 (Facebook/email-password login).
- **Next:** Push branches, open PRs; then remaining active items: **Schedule/Calendar tab** ([TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md)) and **Data robustness and optimization** ([TECH-1005-data-robustness-optimization.md](./TECH-1005-data-robustness-optimization.md)).

---

## 5. Index of analysis docs (this folder)

| Doc | Goal | Status |
|-----|------|--------|
| [TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md) | Switch to a permanent custom domain (Vercel, DNS, OAuth). | On hold — name/provider TBD |
| [TECH-0029-mobile-app.md](./TECH-0029-mobile-app.md) | Android and iOS app using the existing site (PWA or Capacitor). | On hold — scope too large |
| [TECH-0031-ai-advice-on-plans.md](./TECH-0031-ai-advice-on-plans.md) | AI advice bot that reviews a plan and tasks and suggests next steps. | On hold — cost/misuse risk |
| [TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md) | Schedule/Calendar tab and page showing tasks and plans on a calendar. | Active |
| [TECH-0043-google-oauth-live.md](./TECH-0043-google-oauth-live.md) | Production Google OAuth (config/deploy). | On hold — privacy/checklist |
| [TECH-DEBT-AND-OPTIMIZATIONS.md](./TECH-DEBT-AND-OPTIMIZATIONS.md) (TECH-1001) | Tech debt and optimizations (stale; many items implemented). | Superseded by TECH-1005 for new analysis |
| [TECH-1005-data-robustness-optimization.md](./TECH-1005-data-robustness-optimization.md) | Fresh analysis of data handling for robustness and scalability; audit then implement. | Active (future work) |
| [TECH-0056-facebook-email-password-login.md](./TECH-0056-facebook-email-password-login.md) | Facebook login and email/password sign-up (analysis). | Deferred — bulk run |

---

## 6. How this is used

- When a **bulk task list** (e.g. from an exported plan) includes items that are too large for one PR, add or update a **dedicated analysis doc** in `roadmap/` (same format as existing ones) and add a row to **Active items** (Section 2) and **Index** (Section 5).
- When **starting work** on an item, open the relevant analysis doc, then implement in smaller PRs and update the doc as needed.
- Do **not** implement items marked **On hold** until directed.
