# Bulk plan (2026-03) – remaining tasks

**Completed and merged:** TECH-0033 (logo/header), TECH-0034 (plan edit mobile), TECH-0035 (urgency/percent/slider), TECH-0036 (Pidgin Work), TECH-0037 (new task date blank), TECH-0038 (add task button mobile), TECH-0039 (X of Y completed graphic), TECH-0040 (task date and plan display mobile), TECH-0041 (color attribute to flags), TECH-0046 (print checklist from plan). Analysis docs for finished tasks have been removed.

**Blocked / on hold (do not implement until directed):**

| ID | Title | Reason |
|----|--------|--------|
| TECH-0026 | Get permanent website | Not ready yet — need to determine domain name and provider. |
| TECH-0029 | Mobile app | Scope too large. |
| TECH-0031 | AI advice on plans | Cost/misuse risk — API key theft or misuse could incur charges on payment-required account. |
| TECH-0043 | Google OAuth live | Not ready — need privacy disclosures and Google checklist completed before leaving testing mode. |

---

Remaining **active** items from the “Plan 2026 - App creation and testing” export. Each has a **dedicated analysis doc** for implementation notes and checklists.

**Next 5 (easiest):** See [BULK-PROMPT-5-SMALL-TASKS.md](./BULK-PROMPT-5-SMALL-TASKS.md) for the current bulk prompt (TECH-0042, TECH-0045, TECH-0047, plus two others).

| ID | Title | Analysis doc |
|----|--------|--------------|
| TECH-0042 | Help pages | [TECH-0042-help-pages.md](./TECH-0042-help-pages.md) |
| TECH-0045 | Onboarding / login screen | [TECH-0045-onboarding-login-screen.md](./TECH-0045-onboarding-login-screen.md) |
| TECH-0047 | Start with a prebuilt plan | [TECH-0047-prebuilt-plan-templates.md](./TECH-0047-prebuilt-plan-templates.md) |
| — | Allow mark as done in plan edit page | Already available via TaskActionButton on plan detail. |
| — | Add supply list | [TECH-0030-supply-list.md](./TECH-0030-supply-list.md) |
| — | Add calendar tab | [TECH-0032-schedule-calendar.md](./TECH-0032-schedule-calendar.md) |
| TECH-0044 | Facebook login | [TECH-0044-facebook-login.md](./TECH-0044-facebook-login.md) |
| TECH-0048 | Share to social / external plans | [TECH-0048-share-to-social-external-plans.md](./TECH-0048-share-to-social-external-plans.md) |

---

When implementing, use branch `tech/<ID>-<kebab-description>`, add a changeset, and open a PR per task.
