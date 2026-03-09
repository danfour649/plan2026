import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "About",
};

/** In-app changelog for Recent updates (no external link). Synced from CHANGELOG.md. */
const RECENT_UPDATES: { version: string; entries: string[] }[] = [
  {
    version: "0.12.0",
    entries: [
      "Data handling optimizations: cache revalidation on task delete, shared format/task service layer, plan create/update transactions and createMany, task API parity (planId/urgency, GET includes), pagination for tasks/plans/plan-detail tasks, Prisma dev logging, blob cleanup on attachment/task delete, GET /api/plans.",
    ],
  },
  {
    version: "0.11.1",
    entries: [
      "Added \"Print checklist\" on plan detail: links to a print view that shows plan name, printed date, and unfinished tasks (sorted by priority then due date). Print view has a Print button and @media print hides chrome so only the checklist is printed.",
    ],
  },
  {
    version: "0.11.0",
    entries: [
      "Discard-changes confirmation for new and edit plan forms (custom dialog when leaving with unsaved data).",
      "Plan \"color\" is now shown as \"Flag\" in the UI: form label is \"Flag (optional)\" with emoji per option; plans list shows a flag emoji next to the plan name when set.",
    ],
  },
  {
    version: "0.10.5",
    entries: [
      "On mobile, task rows now show shorter dates (e.g. \"Mar 8\") and plan names truncate; status button (Mark done / Restore) is explicitly ordered first before Edit on both plan detail and tasks page.",
    ],
  },
  {
    version: "0.10.4",
    entries: [
      "Plans list now shows task completion as a segment bar (green for completed, grey for incomplete), with \"X of Y\" text and an accessible aria-label.",
    ],
  },
  {
    version: "0.10.3",
    entries: [
      "On the plan detail page, the tasks section header (with \"Add task\") is now sticky on mobile so it stays in view when scrolling the task list.",
    ],
  },
  {
    version: "0.10.2",
    entries: ["New task form: due date is blank by default instead of tomorrow 9am."],
  },
  {
    version: "0.10.1",
    entries: ["Pidgin: rename \"Waka\" to \"Work\" for tasks label to avoid offensive term."],
  },
  {
    version: "0.10.0",
    entries: [
      "Plan form: urgency and percent complete moved to top; percent complete is a slider. Plans list shows progress bar graphic for percent complete.",
    ],
  },
  {
    version: "0.9.x",
    entries: [
      "Plan edit page and form more mobile friendly; logo fix; plans page task list shows incomplete first, completed at bottom.",
      "After creating an invite link, \"Email invite\" button opens mail client with pre-filled subject and body. All copy translated (en, fr, pidgin).",
    ],
  },
  {
    version: "0.8.x",
    entries: [
      "Plan images centered, no longer cropped. Mobile task date and plan display improved. Add/edit task dialog scrolls into view. Add task dialogue from plans page.",
    ],
  },
  {
    version: "0.7.x",
    entries: [
      "Bulk task → PR pipeline in AGENTS.md. Task edit dialog and modals at top of viewport and scrollable. French and Pidgin translations for all app text. Invite-by-link for plans.",
    ],
  },
  {
    version: "0.6.0",
    entries: ["Share plans with another user by email; read-only view for shared users."],
  },
  {
    version: "0.5.0",
    entries: [
      "File upload for tasks (Vercel Blob). Language preference: English, French, Nigerian Pidgin in Settings. Add-task dialog and list layout improvements on mobile. SEO improvements.",
    ],
  },
  {
    version: "0.4.0 – 0.1.x",
    entries: [
      "Export to JSON for plans and tasks. Plans: On hold status, plan page matches tasks. Security hardening. Plans at /plans. Google Calendar reconnect, Settings gear icon, logo. Tasks rename, completed toggle, modal create. Styling and add-task form improvements.",
    ],
  },
];

export default async function AboutPage() {
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="border-b border-blue-100 px-6 py-4">
          <h1 className="text-lg font-semibold text-blue-950">{t.about.title}</h1>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="text-lg font-medium text-blue-950">{t.about.appName}</p>
          <p className="text-sm text-zinc-600">
            {t.about.versionLabel}: {APP_VERSION}
          </p>
          <p className="text-sm text-zinc-700">{t.about.contributorsIntro}</p>
          <p className="text-sm">
            <Link
              href="https://github.com/danfour649/plan2026"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline hover:text-blue-800"
            >
              GitHub
            </Link>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="border-b border-blue-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-950">{t.about.recentUpdatesTitle}</h2>
        </div>
        <div className="max-h-[28rem] overflow-y-auto px-6 py-4">
          <ul className="space-y-4">
            {RECENT_UPDATES.map(({ version, entries }) => (
              <li key={version}>
                <span className="text-sm font-semibold text-blue-800">{version}</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-zinc-700">
                  {entries.map((entry, i) => (
                    <li key={i}>{entry}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
