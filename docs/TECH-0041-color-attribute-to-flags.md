# TECH-0041: Color attribute to flags

**Status:** Not implemented — implementation notes for future work.

**Goal:** Change the plan “color” attribute from a simple color (e.g. blue, green, amber) to a “flag” concept, and display a flag graphic (e.g. emoji or icon) on the plans list and in the plan form instead of (or in addition to) a colour pill.

**Why deferred:** Deferred in bulk run due to run scope. **Estimated effort:** small — no schema change; UI rename and display mapping (e.g. color → emoji) in form and plans list; i18n for “Flag”.

---

## What is needed

### 1. Current behaviour

- Plans have a `color` field (e.g. `blue`, `green`, `amber`, `red`, `violet` or empty). It is used in the plan form as a select and may be used for styling (e.g. priority-style pills). The plans list does not currently show the plan colour prominently as a “flag”.

### 2. Scope options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Rename only** | Keep the same DB field and values but call it “Flag” in the UI and show a flag emoji or icon per value. | Minimal schema change. | “Flag” might imply country flags; need a mapping (e.g. blue → 🇺🇳 or a generic flag icon). |
| **Extend to real flags** | Allow storing a flag identifier (e.g. country code or named flag) and show that on the list. | More expressive. | Requires new or extended schema; asset set or emoji subset. |
| **Flag = colour + icon** | Keep colour, add an optional “flag” display (emoji or icon) per colour; show both on list. | Backward compatible; clear visual. | Slightly redundant if flag is just “coloured flag”. |

**Recommendation:** **Rename in UI to “Flag” and map existing colours to a flag representation** for v1: no schema change. Define a fixed set of “flags” (e.g. 🚩 for red, 🏴 for blue, or use Unicode/emoji flags if you restrict to a small set). Display this next to (or instead of) the plan name on the plans list and in the plan form selector. If the product later wants real country flags, add a new field (e.g. `flagCode`) and migrate.

### 3. Implementation notes

- **Schema:** No change if reusing `color`. If you later add `flagCode` (e.g. ISO 3166-1 alpha-2), add a migration and optional relation or enum.
- **UI – plan form:** In `PlanForm`, change the label from “Color (optional)” to “Flag (optional)” (add i18n key e.g. `planForm.flagOptional`). Options can show emoji + label (e.g. “🚩 High focus”, “🏴 Default”).
- **UI – plans list:** In `src/app/(app)/plans/page.tsx`, in each plan card, show the selected flag (emoji or icon) next to the plan name or in the same row as status/percent. Use the same mapping as the form (e.g. `color` → flag emoji).
- **i18n:** Add `planForm.flagOptional`, `form.flag*` or reuse `form.blue` etc. with “Flag” as section name. Provide en, fr, pidgin.

### 4. Asset options

- **Emoji:** Use Unicode flag or symbol emoji (e.g. 🚩, 🏳️, or coloured squares). No assets.
- **Icons:** If using an icon set (e.g. Heroicons), pick one “flag” icon and tint by colour, or use multiple icons. Simpler than many flag images.
- **Images:** Only if you later add real country flags; then need a small set of SVGs or sprite.

### 5. Documentation

- Update **AI_PROJECT_CONTEXT.md** and **README.md** if you document plan attributes. Add a short note in the changelog when implemented.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Define mapping: existing `color` values → flag display (emoji or icon) |
| 2 | Add i18n keys for “Flag” (optional) and any new option labels |
| 3 | Update plan form: label and options show flag representation |
| 4 | Update plans list: show flag next to plan name or in card header |
| 5 | (Optional) Add `flagCode` and migration later if moving to real flags |
